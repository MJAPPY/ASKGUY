"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const APP_NAME = 'AskGuy';
const PROTON_CHAIN_ID = '3848101010101010101010101010101010101010101010101010101010101010';

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

  // Initialize SDK on mount - SILENTLY
  useEffect(() => {
    const init = async () => {
      try {
        const { link: protonLink, session: protonSession } = await ProtonWebSDK({
          linkOptions: { 
            chainId: PROTON_CHAIN_ID, 
            endpoints: ['https://proton.greymass.com'],
            restoreSession: true // Try to restore without UI
          },
          transportOptions: { requestAccount: 'askguy', backButton: true },
          // We pass selectorOptions but we won't trigger login() here
          selectorOptions: { 
            appName: APP_NAME, 
            appLogo: 'https://askguy.io/logo.png',
            customStyleOptions: {
              modalBackgroundColor: '#0a0a0c',
              logoBackgroundColor: '#0a0a0c',
              isDark: true
            }
          }
        });
        
        setLink(protonLink);
        
        if (protonSession) {
          setSession(protonSession);
          setAddress(protonSession.auth.actor);
          setIsConnected(true);
          setGuyBalance(30000);
          setXprBalance(10000);
        }
      } catch (err) {
        console.error("Proton SDK Init Error:", err);
      }
    };
    init();
  }, []);

  const connect = async (method?: 'passkey' | 'qr') => {
    if (!link) return;
    setIsConnecting(true);
    try {
      // This triggers the selector UI only when the user clicks Connect
      const { session: newSession } = await link.login(APP_NAME);
      setSession(newSession);
      setAddress(newSession.auth.actor);
      setIsConnected(true);
      setGuyBalance(30000);
      setXprBalance(10000);
      showSuccess(`Connected as ${newSession.auth.actor}`);
    } catch (err) {
      console.error(err);
      // Don't show error if user just closed the modal
      if (err !== 'Closed Modal') {
        showError("Failed to connect wallet");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (link && session) {
      await link.removeSession(APP_NAME, session.auth);
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
      payMembership
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