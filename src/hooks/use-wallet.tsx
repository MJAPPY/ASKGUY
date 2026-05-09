"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import ProtonWebSDK from '@proton/web-sdk';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  guyBalance: number;
  xprBalance: number;
  isMember: boolean;
  membershipExpiry: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  payMembership: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);

  const connect = async () => {
    try {
      const { session: newSession } = await ProtonWebSDK({
        linkOptions: {
          endpoints: ['https://proton.greymass.com'],
          chainId: '73647602408292359010322569958595935', // Proton Mainnet
        },
        transportOptions: {
          requestAccount: 'askguy',
          backButton: true,
        },
        selectorOptions: {
          appName: 'AskGuy',
          appLogo: 'https://askguy.io/logo.jpg',
        }
      });

      if (newSession) {
        setSession(newSession);
        setAddress(newSession.auth.actor);
        setIsConnected(true);
        
        // Mocking balances for demo purposes as real chain calls require more setup
        setGuyBalance(30000);
        setXprBalance(10000);
        
        showSuccess(`Connected as ${newSession.auth.actor}`);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to connect wallet");
    }
  };

  const disconnect = async () => {
    if (session) {
      await session.link.removeSession('askguy', session.auth, 'proton');
    }
    setIsConnected(false);
    setAddress(null);
    setGuyBalance(0);
    setXprBalance(0);
    setSession(null);
    showSuccess("Disconnected");
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