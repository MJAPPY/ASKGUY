"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import ProtonWebSDK from '@proton/web-sdk';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  guyBalance: number;
  xprBalance: number;
  isMember: boolean;
  membershipExpiry: number | null;
  connect: (method?: 'passkey' | 'qr') => Promise<void>;
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
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);
  const [link, setLink] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  const fetchBalances = useCallback(async (account: string) => {
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
    }
  }, []);

  // Initialize SDK silently
  useEffect(() => {
    const init = async () => {
      try {
        const { link: protonLink, session: protonSession } = await ProtonWebSDK({
          linkOptions: { 
            chainId: PROTON_CHAIN_ID, 
            endpoints: [ENDPOINT],
            restoreSession: true // Only restores if a valid session exists in storage
          },
          transportOptions: { 
            requestAccount: 'askguy', 
            backButton: true 
          },
          selectorOptions: { 
            appName: APP_NAME, 
            appLogo: 'https://askguy.io/logo.png',
            showContextFree: false // Helps prevent unnecessary popups
          }
        });
        
        setLink(protonLink);
        
        if (protonSession) {
          setSession(protonSession);
          setAddress(protonSession.auth.actor);
          setIsConnected(true);
          fetchBalances(protonSession.auth.actor);
        }
      } catch (err) {
        // Silently fail on init to avoid disrupting the user experience
        console.debug("Proton SDK Silently skipped restoration:", err);
      }
    };
    init();
  }, [fetchBalances]);

  const connect = async (method?: 'passkey' | 'qr') => {
    if (!link) {
      showError("Wallet system is still initializing. Please try again in a moment.");
      return;
    }
    
    setIsConnecting(true);
    try {
      // link.login is the only manual trigger for the auth modal
      const { session: newSession } = await link.login(APP_NAME);
      setSession(newSession);
      setAddress(newSession.auth.actor);
      setIsConnected(true);
      await fetchBalances(newSession.auth.actor);
      showSuccess(`Connected as ${newSession.auth.actor}`);
    } catch (err) {
      console.error(err);
      const msg = (err as any).message || "";
      if (msg !== 'Closed by user' && msg !== 'User cancelled login') {
        showError("Failed to connect wallet");
      }
    } finally {
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
      showError(`Insufficient XPR balance. Need ${FEE} XPR to unlock posting rights.`);
      return;
    }
    setXprBalance(prev => prev - FEE);
    setIsMember(true);
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const currentExpiry = membershipExpiry || Date.now();
    const newExpiry = (currentExpiry > Date.now() ? currentExpiry : Date.now()) + oneYearInMs;
    setMembershipExpiry(newExpiry);
    showSuccess(`Membership Activated! Sent ${FEE} XPR to @tripseven`);
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