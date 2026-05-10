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

// Configuration for ASK GUY
const APP_NAME = 'ASK GUY';
const REQUEST_ACCOUNT = 'askguy'; 
const APP_LOGO = 'https://i.ibb.co/L5kRj6X/logo.png'; 

const PROTON_CHAIN_ID = '3848101010101010101010101010101010101010101010101010101010101010';
const ENDPOINTS = [
  'https://proton.greymass.com',
  'https://mainnet.protonchain.com',
  'https://rpc.protonchain.com'
];

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  // Start as true so we don't flash "Access Denied" while restoring session
  const [isFetchingBalances, setIsFetchingBalances] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);
  const [link, setLink] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  
  const initializingRef = useRef(false);

  const fetchBalances = useCallback(async (account: string, rpc: any) => {
    if (!account || !rpc) {
      setIsFetchingBalances(false);
      return;
    }
    
    setIsFetchingBalances(true);
    
    try {
      // Use standard currency balance RPC calls which are more reliable than table rows
      const xprRes = await rpc.get_currency_balance('eosio.token', account, 'XPR');
      if (xprRes && xprRes.length > 0) {
        setXprBalance(parseFloat(xprRes[0].split(' ')[0]));
      } else {
        setXprBalance(0);
      }

      const guyRes = await rpc.get_currency_balance('guytokenxpr1', account, 'GUY');
      if (guyRes && guyRes.length > 0) {
        setGuyBalance(parseFloat(guyRes[0].split(' ')[0]));
      } else {
        setGuyBalance(0);
      }
    } catch (err) {
      console.error("Balance fetch failed:", err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

  const refreshBalances = useCallback(async () => {
    if (address && link?.rpc) {
      await fetchBalances(address, link.rpc);
      showSuccess("Balances refreshed");
    }
  }, [address, link, fetchBalances]);

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
        await fetchBalances(actor, result.link.rpc);
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
      if (!currentResult) {
        throw new Error("SDK_INIT_FAILED");
      }
      
      const { session: newSession, link: newLink } = currentResult;
      setSession(newSession);
      const actor = newSession.auth.actor.toString();
      setAddress(actor);
      setIsConnected(true);
      
      await fetchBalances(actor, newLink.rpc);
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
        
        await fetchBalances(address, link.rpc);
        showSuccess(`Membership Activated!`);
      }
    } catch (err) {
      const msg = (err as any).message || "Transaction failed";
      if (msg !== 'Closed by user' && msg !== 'User cancelled login') {
        showError(msg);
      }
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