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
  payMembership: () => void;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const APP_NAME = 'AskGuy XPR';
const PROTON_CHAIN_ID = '3848101010101010101010101010101010101010101010101010101010101010';
const ENDPOINTS = [
  'https://proton.greymass.com',
  'https://mainnet.protonchain.com',
  'https://rpc.protonchain.com'
];

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);
  const [link, setLink] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  
  const initializingRef = useRef(false);

  const getBalanceFromTable = async (rpc: any, code: string, account: string, symbol: string) => {
    try {
      const result = await rpc.get_table_rows({
        json: true,
        code: code,
        scope: account,
        table: 'accounts',
        limit: 10
      });

      if (result && result.rows) {
        const row = result.rows.find((r: any) => r.balance.includes(symbol));
        if (row) {
          return parseFloat(row.balance.split(' ')[0]);
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  const fetchBalances = useCallback(async (account: string, rpc: any) => {
    if (!account || !rpc) return;
    setIsFetchingBalances(true);
    
    try {
      const xprVal = await getBalanceFromTable(rpc, 'eosio.token', account, 'XPR');
      setXprBalance(xprVal);

      const guyVal = await getBalanceFromTable(rpc, 'guytokenxpr1', account, 'GUY');
      setGuyBalance(guyVal);
    } catch (err) {
      console.error("Balance fetch failed:", err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

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
          backButton: true 
        },
        selectorOptions: { 
          appName: APP_NAME, 
          appLogo: 'https://askguy.io/logo.png', // Ideally a verified public URL
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
        fetchBalances(actor, result.link.rpc);
      }
      
      initializingRef.current = false;
      return result;
    } catch (err) {
      initializingRef.current = false;
      return null;
    }
  }, [fetchBalances]);

  useEffect(() => {
    initSDK(true);
  }, [initSDK]);

  const connect = async () => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
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

  const payMembership = () => {
    const FEE = 2500;
    if (xprBalance < FEE) {
      showError(`Insufficient XPR balance. Need ${FEE} XPR.`);
      return;
    }
    setXprBalance(prev => prev - FEE);
    setIsMember(true);
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const currentExpiry = membershipExpiry || Date.now();
    const newExpiry = (currentExpiry > Date.now() ? currentExpiry : Date.now()) + oneYearInMs;
    setMembershipExpiry(newExpiry);
    showSuccess(`Membership Activated!`);
  };

  const refreshBalances = async () => {
    if (address && link?.rpc) {
      await fetchBalances(address, link.rpc);
      showSuccess("Balances refreshed");
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