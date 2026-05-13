"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { showSuccess, showError } from "@/utils/toast";
import ProtonWebSDK from "@proton/web-sdk";
import { supabase } from "@/lib/supabase";

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

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  
  const linkRef = useRef<any>(null);

  const checkMembership = async (account: string) => {
    try {
      const { data } = await supabase
        .from("memberships")
        .select("expiry")
        .eq("address", account.toLowerCase())
        .single();
      
      if (data && data.expiry > Date.now()) {
        setIsMember(true);
        setMembershipExpiry(data.expiry);
      } else {
        setIsMember(false);
        setMembershipExpiry(null);
      }
    } catch (err) {
      // Silently fail if table doesn't exist yet
    }
  };

  const checkBanStatus = async (account: string) => {
    try {
      const { data } = await supabase
        .from("banned_users")
        .select("address")
        .eq("address", account.toLowerCase())
        .single();
      setIsBanned(!!data);
    } catch (err) {
      // Silently fail
    }
  };

  const fetchBalances = useCallback(async (account: string) => {
    if (!account) return;
    setIsFetchingBalances(true);
    
    // Run these in background, don't block
    checkBanStatus(account);
    checkMembership(account);

    try {
      const endpoint = ENDPOINTS[0];
      const [xprRes, guyRes] = await Promise.all([
        fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: "POST",
          body: JSON.stringify({ code: "eosio.token", account, symbol: "XPR" }),
        }),
        fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: "POST",
          body: JSON.stringify({ code: "vtoken", account, symbol: "GUY" }),
        })
      ]);

      const xprData = await xprRes.json();
      const guyData = await guyRes.json();

      setXprBalance(Array.isArray(xprData) && xprData.length > 0 ? parseFloat(xprData[0].split(" ")[0]) : 0);
      setGuyBalance(Array.isArray(guyData) && guyData.length > 0 ? parseFloat(guyData[0].split(" ")[0]) : 0);
    } catch (err) {
      console.error("Balance fetch error:", err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

  const handleLogin = useCallback((newSession: any) => {
    const actor = newSession.auth?.actor?.toString() ?? null;
    if (actor) {
      setSession(newSession);
      setAddress(actor);
      setIsConnected(true);
      fetchBalances(actor);
    }
  }, [fetchBalances]);

  useEffect(() => {
    const init = async () => {
      try {
        const { link, session: restoredSession } = await ProtonWebSDK({
          linkOptions: { chainId: PROTON_CHAIN_ID, endpoints: ENDPOINTS, restoreSession: true },
          transportOptions: { requestPermission: "active", backButton: true },
          selectorOptions: { appName: APP_NAME, appLogo: APP_LOGO },
        });

        linkRef.current = link;
        if (restoredSession) {
          handleLogin(restoredSession);
        }
      } catch (err) {
        console.error("SDK Init error:", err);
      }
    };
    init();
  }, [handleLogin]);

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const { session: newSession } = await ProtonWebSDK({
        linkOptions: { chainId: PROTON_CHAIN_ID, endpoints: ENDPOINTS, restoreSession: false },
        transportOptions: { requestPermission: "active", backButton: true },
        selectorOptions: { appName: APP_NAME, appLogo: APP_LOGO },
      });

      if (newSession) {
        handleLogin(newSession);
        showSuccess("Connected!");
      }
    } catch (err) {
      console.error("Connection error:", err);
      showError("Connection failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (linkRef.current && session) {
      try {
        await linkRef.current.removeSession(APP_NAME, session.auth);
      } catch (e) {}
    }
    setIsConnected(false);
    setAddress(null);
    setSession(null);
    setGuyBalance(0);
    setXprBalance(0);
    setIsBanned(false);
    setIsMember(false);
    setMembershipExpiry(null);
    showSuccess("Disconnected");
  };

  const payMembership = async () => {
    if (!session) return showError("Connect wallet first.");
    try {
      const action = {
        account: "eosio.token",
        name: "transfer",
        authorization: [session.auth],
        data: {
          from: session.auth.actor,
          to: "askguy",
          quantity: "1.0000 XPR",
          memo: "AskGuy Membership",
        },
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        const expiry = Date.now() + 365 * 24 * 60 * 60 * 1000;
        
        // Persist to Supabase in background
        supabase
          .from("memberships")
          .upsert({ 
            address: address?.toLowerCase(), 
            expiry: expiry,
            updated_at: new Date().toISOString()
          }).then(() => {
            setIsMember(true);
            setMembershipExpiry(expiry);
          });

        if (address) fetchBalances(address);
        showSuccess("Membership unlocked!");
      }
    } catch (err: any) {
      showError(err.message || "Transaction failed.");
    }
  };

  const transferTokens = async (to: string, amount: number, symbol: "XPR" | "GUY", memo: string) => {
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
        if (address) fetchBalances(address);
        return true;
      }
      return false;
    } catch (err: any) {
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
        refreshBalances: () => address ? fetchBalances(address) : Promise.resolve(),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};