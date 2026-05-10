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

const APP_NAME = 'AskGuy';
const PROTON_CHAIN_ID = '3848101010101010101010101010101010101010101010101010101010101010';
const ENDPOINT = 'https://proton.greymass.com';

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

  const fetchBalances = useCallback(async (account: string) => {
    setIsFetchingBalances(true);
    try {
      const xprRes = await fetch(`${ENDPOINT}/v1/chain/get_currency_balance`, {
        method: 'POST',
        body: JSON.stringify({ code: 'eosio.token', account, symbol: 'XPR' })
      });
      const xprData = await xprRes.json();
      const xprVal = xprData[0] ? parseFloat(xprData[0].split(' ')[0]) : 0;
      setXprBalance(xprVal);

      const guyRes = await fetch(`${ENDPOINT}/v1/chain/get_currency_balance`, {
        method: 'POST',
        body: JSON.stringify({ code: 'guytokenxpr1', account, symbol: 'GUY' })
      });
      const guyData = await guyRes.json();
      const guyVal = guyData[0] ? parseFloat(guyData[0].split(' ')[0]) : 0;
      setGuyBalance(guyVal);
    } catch (err) {
      console.error("Error fetching balances:", err);
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
          endpoints: [ENDPOINT],
          restoreSession: restore 
        },
        transportOptions: { 
          requestAccount: 'askguy', 
          backButton: true 
        },
        selectorOptions: { 
          appName: APP_NAME, 
          appLogo: 'https://askguy.io/logo.png',
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
        fetchBalances(actor);
      }
      
      initializingRef.current = false;
      return result;
    } catch (err) {
      console.debug("Proton SDK initialization error:", err);
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
      let currentLink = link;
      if (!currentLink) {
        const result = await initSDK(false);
        if (result) currentLink = result.link;
      }

      if (!currentLink) {
        throw new Error("SDK_NOT_INIT");
      }
      
      const { session: newSession } = await currentLink.login(APP_NAME);
      
      setTimeout(async () => {
        setSession(newSession);
        const actor = newSession.auth.actor.toString();
        setAddress(actor);
        setIsConnected(true);
        await fetchBalances(actor);
        showSuccess(`Connected as ${actor}`);
        setIsConnecting(false);
      }, 100);
      
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
    if (address) {
      await fetchBalances(address);
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