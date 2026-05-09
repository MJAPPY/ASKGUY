"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { ProtonWebSDK } from '@proton/web-sdk';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  guyBalance: number;
  xprBalance: number;
  isMember: boolean;
  membershipExpiry: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  payMembership: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const APP_NAME = 'AskGuy';
const REQUEST_ACCOUNT = 'askguy'; // Your dApp account name if applicable
const GUY_TOKEN_CONTRACT = 'token.guy'; // Standard GUY contract on XPR
const XPR_TOKEN_CONTRACT = 'proton.token';
const MEMBERSHIP_RECEIVER = 'tripseven';
const MEMBERSHIP_FEE = 2500;

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [link, setLink] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);

  const fetchBalances = useCallback(async (accountName: string) => {
    try {
      // Fetch XPR Balance
      const xprRes = await fetch(`https://proton.greymass.com/v1/chain/get_currency_balance`, {
        method: 'POST',
        body: JSON.stringify({ code: XPR_TOKEN_CONTRACT, account: accountName, symbol: 'XPR' })
      });
      const xprData = await xprRes.json();
      const xprVal = xprData.length > 0 ? parseFloat(xprData[0].split(' ')[0]) : 0;
      setXprBalance(xprVal);

      // Fetch GUY Balance
      const guyRes = await fetch(`https://proton.greymass.com/v1/chain/get_currency_balance`, {
        method: 'POST',
        body: JSON.stringify({ code: GUY_TOKEN_CONTRACT, account: accountName, symbol: 'GUY' })
      });
      const guyData = await guyRes.json();
      const guyVal = guyData.length > 0 ? parseFloat(guyData[0].split(' ')[0]) : 0;
      setGuyBalance(guyVal);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }, []);

  const connect = async () => {
    try {
      const { link: protonLink, session: protonSession } = await ProtonWebSDK({
        linkOptions: { 
          chainId: '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd', 
          endpoints: ['https://proton.greymass.com'] 
        },
        transportOptions: { requestAccount: REQUEST_ACCOUNT, backButton: true },
        selectorOptions: { appName: APP_NAME }
      });

      setLink(protonLink);
      setSession(protonSession);
      setAddress(protonSession.auth.actor);
      await fetchBalances(protonSession.auth.actor);
      showSuccess("WebAuth Wallet Connected");
    } catch (e) {
      showError("Failed to connect wallet");
      console.error(e);
    }
  };

  const disconnect = async () => {
    if (link && session) {
      await link.removeSession(REQUEST_ACCOUNT, session.auth);
    }
    setSession(null);
    setLink(null);
    setAddress(null);
    setGuyBalance(0);
    setXprBalance(0);
  };

  const payMembership = async () => {
    if (!session || !address) {
      showError("Please connect your wallet first");
      return;
    }

    if (xprBalance < MEMBERSHIP_FEE) {
      showError(`Insufficient XPR. You need ${MEMBERSHIP_FEE} XPR.`);
      return;
    }

    try {
      const action = {
        account: XPR_TOKEN_CONTRACT,
        name: 'transfer',
        authorization: [session.auth],
        data: {
          from: address,
          to: MEMBERSHIP_RECEIVER,
          quantity: `${MEMBERSHIP_FEE}.0000 XPR`,
          memo: 'AskGuy Yearly Membership'
        }
      };

      await session.transact({ actions: [action] }, { broadcast: true });
      
      setIsMember(true);
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      setMembershipExpiry(Date.now() + oneYearInMs);
      
      await fetchBalances(address);
      showSuccess(`Membership Activated! Sent ${MEMBERSHIP_FEE} XPR to @${MEMBERSHIP_RECEIVER}`);
    } catch (e) {
      showError("Transaction failed or cancelled");
      console.error(e);
    }
  };

  const refreshBalances = async () => {
    if (address) {
      await fetchBalances(address);
      showSuccess("Balances updated");
    }
  };

  // Auto-reconnect logic could go here if session is stored in localStorage
  
  return (
    <WalletContext.Provider value={{ 
      isConnected: !!session, 
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