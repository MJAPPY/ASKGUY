"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { showSuccess, showError } from "@/utils/toast";
import ProtonWebSDK from "@proton/web-sdk";
import { supabase } from "@/lib/supabase";

/* -------------------------------------------------------------   👉 1️⃣  REPLACE THIS WITH THE REAL PUBLIC KEY FROM THE EXPLORER
   ------------------------------------------------------------- */
const OWNER_ACCOUNT = "xpr1...YOUR_ACTUAL_PUBLIC_KEY_HERE"; // <-- INSERT HERE

const APP_NAME = "AskGuy";
const APP_LOGO = "https://askguy.sh/logo.png";

const PROTON_CHAIN_ID = "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0";
const ENDPOINTS = [
  "https://proton.greymass.com",
  "https://mainnet.protonchain.com",
  "https://rpc.protonchain.com",
];

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isFetchingBalances: boolean;
  isBanned: boolean;
  address: string | null;
  guyBalance: number;
  xprBalance: number;
  isMember: boolean;
  membershipExpiry: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  payMembership: () => Promise<void>;
  transferTokens: (
    to: string,
    amount: number,
    symbol: "XPR" | "GUY",
    memo: string,
  ) => Promise<boolean>;
  refreshBalances: () => Promise<void>;
}

/* Export the context so it can be imported elsewhere if needed */
export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);
  const [link, setLink] = useState<any>(null);

  /* -------------------------------------------------------------
     Helper: check if the current address is on the banned list
     ------------------------------------------------------------- */
  const checkBanStatus = async (account: string) => {
    try {
      const { data } = await supabase
        .from("banned_users")
        .select("address")
        .eq("address", account)
        .single();
      setIsBanned(!!data);
    } catch (err) {
      setIsBanned(false);
    }
  };

  /* -------------------------------------------------------------
     Fetch XPR and GUY balances for a given account
     ------------------------------------------------------------- */
  const fetchBalances = useCallback(
    async (account: string) => {
      if (!account) return;
      setIsFetchingBalances(true);
      await checkBanStatus(account);

      try {
        const endpoint = ENDPOINTS[0];

        // XPR balance
        const xprRes = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: "POST",
          body: JSON.stringify({
            code: "eosio.token",
            account,
            symbol: "XPR",
          }),
        });
        const xprData = await xprRes.json();
        const xprVal =
          Array.isArray(xprData) && xprData.length > 0
            ? parseFloat(xprData[0].split(" ")[0])
            : 0;

        // GUY balance
        const guyRes = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: "POST",
          body: JSON.stringify({
            code: "vtoken",
            account,
            symbol: "GUY",
          }),
        });
        const guyData = await guyRes.json();
        const guyVal =
          Array.isArray(guyData) && guyData.length > 0
            ? parseFloat(guyData[0].split(" ")[0])
            : 0;

        setXprBalance(xprVal);
        setGuyBalance(guyVal);
      } catch (err) {
        console.error("Balance fetch error:", err);
      } finally {
        setIsFetchingBalances(false);
      }
    },
    [],
  );

  /* -------------------------------------------------------------
     Handle a successful login – store session, address, and balances
     ------------------------------------------------------------- */
  const handleLogin = (session: any, link: any) => {
    setSession(session);
    setLink(link);
    const actor = session.auth?.actor?.toString() ?? null;
    setAddress(actor);
    setIsConnected(true);
    if (actor) fetchBalances(actor);
  };

  /* -------------------------------------------------------------
     Initialise Proton SDK on component mount – restore any saved session
     ------------------------------------------------------------- */
  useEffect(() => {
    const init = async () => {
      try {
        const result = await ProtonWebSDK({
          linkOptions: {
            chainId: PROTON_CHAIN_ID,
            endpoints: ENDPOINTS,
            restoreSession: true,
          },
          transportOptions: {
            requestAccount: OWNER_ACCOUNT,
            requestPermission: "active",
            backButton: true,
          },
          selectorOptions: {
            appName: APP_NAME,
            appLogo: APP_LOGO,
            showContextualError: true,
          },
        });

        console.log("Proton init – requestAccount:", OWNER_ACCOUNT);
        if (result.session) {
          handleLogin(result.session, result.link);
        } else {
          setLink(result.link);
        }
      } catch (err) {
        console.error("SDK Init error:", err);
      }
    };
    init();
  }, [fetchBalances]);

  /* -------------------------------------------------------------
     Manual wallet connect (user clicks “Connect”)
     ------------------------------------------------------------- */
  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const result = await ProtonWebSDK({
        linkOptions: {
          chainId: PROTON_CHAIN_ID,
          endpoints: ENDPOINTS,
          restoreSession: false,
        },
        transportOptions: {
          requestAccount: OWNER_ACCOUNT,
          requestPermission: "active",
          backButton: true,
        },
        selectorOptions: {
          appName: APP_NAME,
          appLogo: APP_LOGO,
          showContextualError: true,
        },
      });

      console.log("Proton connect – requestAccount:", OWNER_ACCOUNT);
      if (result.session) {
        handleLogin(result.session, result.link);
        showSuccess("Connected!");
      }
    } catch (err) {
      console.error("Connection error:", err);
      showError("Connection failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  /* -------------------------------------------------------------
     Disconnect wallet
     ------------------------------------------------------------- */
  const disconnect = async () => {
    if (link && session) {
      try {
        await link.removeSession(APP_NAME, session.auth);
      } catch (e) {
        // ignore errors on removal
      }
    }
    setIsConnected(false);
    setAddress(null);
    setSession(null);
    setGuyBalance(0);
    setXprBalance(0);
    setIsBanned(false);
    showSuccess("Disconnected");
  };

  /* -------------------------------------------------------------
     Pay the 1 XPR membership fee
     ------------------------------------------------------------- */
  const payMembership = async () => {
    if (!session) return showError("Connect wallet first.");

    try {
      const action = {
        account: "eosio.token",
        name: "transfer",
        authorization: [session.auth],
        data: {
          from: session.auth.actor,
          to: OWNER_ACCOUNT,
          quantity: "1.0000 XPR",
          memo: "AskGuy Membership",
        },
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        setIsMember(true);
        setMembershipExpiry(Date.now() + 365 * 24 * 60 * 60 * 1000);
        await fetchBalances(address!);
        showSuccess("Membership unlocked!");
      }
    } catch (err: any) {
      console.error("Membership Transaction Error:", err);
      showError(err.message || "Transaction failed.");
    }
  };

  /* -------------------------------------------------------------
     Transfer XPR or GUY tokens to another user
     ------------------------------------------------------------- */
  const transferTokens = async (
    to: string,
    amount: number,
    symbol: "XPR" | "GUY",
    memo: string,
  ) => {
    if (!session) return false;
    const contract = symbol === "XPR" ? "eosio.token" : "vtoken";
    const precision = symbol === "XPR" ? 4 : 6;

    try {
      const action = {
        account: contract,
        name: "transfer",
        authorization: [session.auth],
        data: {
          from: session.auth.actor,
          to,
          quantity: `${amount.toFixed(precision)} ${symbol}`,
          memo: memo || "AskGuy Contribution",
        },
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        await fetchBalances(address!);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Transfer Transaction Error:", err);
      showError(err.message || "Transaction failed.");
      return false;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        isFetchingBalances,
        isBanned,
        address,
        guyBalance,
        xprBalance,
        isMember,
        membershipExpiry,
        connect,
        disconnect,
        payMembership,
        transferTokens,
        refreshBalances: () => fetchBalances(address!),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

/* -------------------------------------------------------------
   Hook for consuming the wallet context
   ------------------------------------------------------------- */
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};