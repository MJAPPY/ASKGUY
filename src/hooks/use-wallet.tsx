"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  guyBalance: number;
  xprBalance: number;
  isMember: boolean;
  connect: () => void;
  disconnect: () => void;
  payMembership: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);

  const connect = () => {
    // Mock connection
    setIsConnected(true);
    setAddress("guy_user.xpr");
    setGuyBalance(30000); // Mocking > 25k GUY
    setXprBalance(1250);
    showSuccess("WebAuth Wallet Connected");
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setGuyBalance(0);
    setXprBalance(0);
  };

  const payMembership = () => {
    if (xprBalance < 250) {
      showError("Insufficient XPR balance");
      return;
    }
    setXprBalance(prev => prev - 250);
    setIsMember(true);
    showSuccess("Yearly Membership Activated! Sent 250 XPR to @tripseven");
  };

  return (
    <WalletContext.Provider value={{ 
      isConnected, 
      address, 
      guyBalance, 
      xprBalance, 
      isMember, 
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