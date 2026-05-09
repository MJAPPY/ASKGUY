"use client";

import React, { createContext, useContext, useState } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import WalletModal from '@/components/WalletModal';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isModalOpen: boolean;
  address: string | null;
  guyBalance: number;
  xprBalance: number;
  isMember: boolean;
  membershipExpiry: number | null;
  connect: () => void;
  disconnect: () => void;
  payMembership: () => void;
  closeModal: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);

  const connect = () => {
    setIsModalOpen(true);
  };

  const handleActualConnect = () => {
    setIsModalOpen(false);
    setIsConnecting(true);
    // Simulate WebAuth connection delay
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setAddress("guy_user.xpr");
      setGuyBalance(30000); 
      setXprBalance(10000);
      showSuccess("WebAuth Wallet Connected");
    }, 1200);
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
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
    showSuccess(`Membership Activated! You can now post requests. Sent ${FEE} XPR to @tripseven`);
  };

  return (
    <WalletContext.Provider value={{ 
      isConnected, 
      isConnecting,
      isModalOpen,
      address, 
      guyBalance, 
      xprBalance, 
      isMember, 
      membershipExpiry,
      connect, 
      disconnect,
      payMembership,
      closeModal: () => setIsModalOpen(false)
    }}>
      {children}
      <WalletModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConnect={handleActualConnect} 
      />
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};