"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import ProtonWebSDK from '@proton/web-sdk';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isFetchingBalances: boolean;
  address: string | null;
  guyBalance: number;
  xprBalance: number;
  isMember: boolean;
  membershipExpiry: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  payMembership: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const APP_NAME = 'ASK GUY';
const REQUEST_ACCOUNT = 'askguy'; 
const APP_LOGO = 'https://i.ibb.co/L5kRj6X/logo.png'; 

const PROTON_CHAIN_ID = '3848101010101010101010101010101010101010101010101010101010101010';
const ENDPOINTS = [
  'https://proton.greymass.com',
  'https://mainnet.protonchain.com',
  'https://rpc.protonchain.com',
  'https://proton.public.blastapi.io'
];

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);
  const [link, setLink] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  
  const initializingRef = useRef(false);

  // High-reliability balance fetcher
  const fetchBalances = useCallback(async (account: string) => {
    if (!account) {
      setIsFetchingBalances(false);
      return;
    }
    
    setIsFetchingBalances(true);
    console.log(`[Wallet] Starting deep balance check for: ${account}`);
    
    let finalXpr = 0;
    let finalGuy = 0;
    let success = false;

    // Try multiple endpoints until one succeeds
    for (const endpoint of ENDPOINTS) {
      try {
        console.log(`[Wallet] Trying endpoint: ${endpoint}`);
        
        // 1. Fetch XPR
        const xprResponse = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          body: JSON.stringify({ code: 'eosio.token', account, symbol: 'XPR' })
        });
        const xprData = await xprResponse.json();
        if (Array.isArray(xprData) && xprData.length > 0) {
          finalXpr = parseFloat(xprData[0].split(' ')[0]);
        }

        // 2. Fetch GUY (vtoken)
        const guyResponse = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          body: JSON.stringify({ code: 'vtoken', account, symbol: 'GUY' })
        });
        const guyData = await guyResponse.json();
        
        if (Array.isArray(guyData) && guyData.length > 0) {
          finalGuy = parseFloat(guyData[0].split(' ')[0]);
          console.log(`[Wallet] Found GUY balance: ${finalGuy} via ${endpoint}`);
          success = true;
        } else {
          // If currency balance returns empty, check the table directly as a fallback
          const tableResponse = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
            method: 'POST',
            body: JSON.stringify({
              json: true,
              code: 'vtoken',
              scope: account,
              table: 'accounts',
              limit: 10
            })
          });
          const tableData = await tableResponse.json();
          const guyRow = tableData.rows?.find((r: any) => r.balance.includes('GUY'));
          if (guyRow) {
            finalGuy = parseFloat(guyRow.balance.split(' ')[0]);
            console.log(`[Wallet] Found GUY balance in table: ${finalGuy}`);
            success = true;
          } else {
            console.log(`[Wallet] No GUY found on ${endpoint}, trying next...`);
          }
        }

        if (success) break; // Stop if we got a definitive answer for GUY
      } catch (err) {
        console.warn(`[Wallet] Endpoint ${endpoint} failed, trying next...`, err);
      }
    }

    setXprBalance(finalXpr);
    setGuyBalance(finalGuy);
    
    // Small delay to prevent UI flickering
    setTimeout(() => {
      setIsFetchingBalances(false);
    }, 800);
  }, []);

  const refreshBalances = useCallback(async () => {
    if (address) {
      await fetchBalances(address);
      showSuccess("Balances updated");
    }
  }, [address, fetchBalances]);

  const initSDK = useCallback(async (restore = true) => {
    if (initializingRef.current && restore) return null;
    initializingRef.current = true;

    try {
      const result = await ProtonWebSDK({
        linkOptions: { 
          chainId: PROTON_CHAIN_ID, 
          endpoints: ENDPOINTS,
          restoreSession: restore 
        },
        transportOptions: { 
          requestAccount: REQUEST_ACCOUNT,
          backButton: true 
        },
        selectorOptions: { 
          appName: APP_NAME, 
          appLogo: APP_LOGO,
          customStyleOptions: {
            modalBackgroundColor: '#0A1428',
            logoBackgroundColor: '#0A1428',
            isDark: true
          }
        }
      });
      
      setLink(result.link);
      
      if (result.session) {
        setSession(result.session);
        const actor = result.session.auth.actor.toString();
        setAddress(actor);
        setIsConnected(true);
        await fetchBalances(actor);
      } else {
        setIsFetchingBalances(false);
      }
      
      initializingRef.current = false;
      return result;
    } catch (err) {
      initializingRef.current = false;
      setIsFetchingBalances(false);
      return null;
    }
  }, [fetchBalances]);

  useEffect(() => {
    initSDK(true);
  }, [initSDK]);

  const connect = async () => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    setIsFetchingBalances(true);
    try {
      let currentResult = await initSDK(false);
      if (!currentResult) throw new Error("SDK_INIT_FAILED");
      
      const { session: newSession } = currentResult;
      setSession(newSession);
      const actor = newSession.auth.actor.toString();
      setAddress(actor);
      setIsConnected(true);
      
      await fetchBalances(actor);
      showSuccess(`Connected as ${actor}`);
      setIsConnecting(false);
    } catch (err) {
      const msg = (err as any).message || "";
      if (msg !== 'Closed by user' && msg !== 'User cancelled login') {
        showError("Failed to connect wallet");
      }
      setIsConnecting(false);
      setIsFetchingBalances(false);
    }
  };

  const disconnect = async () => {
    if (link && session) {
      try {
        await link.removeSession(APP_NAME, session.auth);
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
    setIsConnected(false);
    setAddress(null);
    setSession(null);
    setGuyBalance(0);
    setXprBalance(0);
    showSuccess("Wallet Disconnected");
  };

  const payMembership = async () => {
    const FEE = 2500;
    if (!session || !address) {
      showError("Please connect your wallet first.");
      return;
    }
    if (xprBalance < FEE) {
      showError(`Insufficient XPR balance. Need ${FEE} XPR.`);
      return;
    }

    try {
      const action = {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [session.auth],
        data: {
          from: address,
          to: 'askguy',
          quantity: `${FEE.toFixed(4)} XPR`,
          memo: 'ASK GUY Membership Fee'
        }
      };

      const result = await session.transact({ actions: [action] });
      if (result) {
        setIsMember(true);
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        const currentExpiry = membershipExpiry || Date.now();
        const newExpiry = (currentExpiry > Date.now() ? currentExpiry : Date.now()) + oneYearInMs;
        setMembershipExpiry(newExpiry);
        await fetchBalances(address);
        showSuccess(`Membership Activated!`);
      }
    } catch (err) {
      const msg = (err as any).message || "Transaction failed";
      if (msg !== 'Closed by user' && msg !== 'User cancelled login') showError(msg);
    }
  };

  return (
    <WalletContext.Provider value={{ 
      isConnected, 
      isConnecting,
      isFetchingBalances,
      address, 
      guyBalance, 
      xprBalance, 
      isMember, 
      membershipExpiry,
      connect, 
      disconnect,
      payMembership,
      refreshBalances
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};