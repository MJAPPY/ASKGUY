"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import ProtonWebSDK from '@proton/web-sdk';
import { supabase } from '@/lib/supabase';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isFetchingBalances: boolean;
  isBanned: boolean;
  address: string | null;
  guyBalance: number;
  xprBalance: number;
  isMember: boolean;
  membershipExpiry: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  payMembership: () => Promise<void>;
  transferTokens: (to: string, amount: number, symbol: 'XPR' | 'GUY', memo: string) => Promise<boolean>;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const APP_NAME = 'AskGuy';
const OWNER_ACCOUNT = 'askguy'; 
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
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);
  const [link, setLink] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  const checkBanStatus = async (account: string) => {
    try {
      const { data } = await supabase
        .from('banned_users')
        .select('address')
        .eq('address', account)
        .single();
      setIsBanned(!!data);
    } catch (err) {
      setIsBanned(false);
    }
  };

  const fetchBalances = useCallback(async (account: string) => {
    if (!account) return;
    setIsFetchingBalances(true);
    await checkBanStatus(account);
    
    let finalXpr = 0;
    let finalGuy = 0;

    for (const endpoint of ENDPOINTS) {
      try {
        const xprResponse = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          body: JSON.stringify({ code: 'eosio.token', account, symbol: 'XPR' })
        });
        const xprData = await xprResponse.json();
        if (Array.isArray(xprData) && xprData.length > 0) {
          finalXpr = parseFloat(xprData[0].split(' ')[0]);
        }

        const guyResponse = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          body: JSON.stringify({ code: 'vtoken', account, symbol: 'GUY' })
        });
        const guyData = await guyResponse.json();
        if (Array.isArray(guyData) && guyData.length > 0) {
          finalGuy = parseFloat(guyData[0].split(' ')[0]);
        }
        break;
      } catch (err) {
        continue;
      }
    }

    setXprBalance(finalXpr);
    setGuyBalance(finalGuy);
    setIsFetchingBalances(false);
  }, []);

  const initSDK = useCallback(async (restore = true) => {
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
        fetchBalances(actor);
      }
      return result;
    } catch (err) {
      console.error("SDK Init error:", err);
      return null;
    }
  }, [fetchBalances]);

  useEffect(() => {
    initSDK(true);
  }, [initSDK]);

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const result = await initSDK(false);
      if (result?.session) {
        showSuccess(`Connected as ${result.session.auth.actor.toString()}`);
      }
    } catch (err) {
      showError("Connection failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (link && session) {
      try { await link.removeSession(APP_NAME, session.auth); } catch (e) {}
    }
    setIsConnected(false);
    setAddress(null);
    setSession(null);
    setGuyBalance(0);
    setXprBalance(0);
    setIsBanned(false);
    showSuccess("Disconnected");
  };

  const payMembership = async () => {
    const FEE = 1.0000;
    if (!session || !address) {
      showError("Connect wallet first.");
      return;
    }
    
    // Always fetch latest balance before payment
    await fetchBalances(address);
    if (xprBalance < FEE) {
      showError(`Need at least ${FEE} XPR.`);
      return;
    }

    try {
      const action = {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: session.auth.actor.toString(),
          permission: session.auth.permission.toString(),
        }],
        data: {
          from: session.auth.actor.toString(),
          to: OWNER_ACCOUNT,
          quantity: `${FEE.toFixed(4)} XPR`,
          memo: 'AskGuy Membership'
        }
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        setIsMember(true);
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        setMembershipExpiry(Date.now() + oneYearInMs);
        await fetchBalances(address);
        showSuccess(`Membership Unlocked!`);
      }
    } catch (err: any) {
      // Improved error reporting for transaction issues
      const msg = err.message || "Transaction failed or was canceled.";
      console.error("Payment error:", err);
      showError(msg);
    }
  };

  const transferTokens = async (to: string, amount: number, symbol: 'XPR' | 'GUY', memo: string) => {
    if (!session || !address) return false;
    const contract = symbol === 'XPR' ? 'eosio.token' : 'vtoken';
    const precision = symbol === 'XPR' ? 4 : 6;

    try {
      const action = {
        account: contract,
        name: 'transfer',
        authorization: [{
          actor: session.auth.actor.toString(),
          permission: session.auth.permission.toString(),
        }],
        data: {
          from: session.auth.actor.toString(),
          to: to,
          quantity: `${amount.toFixed(precision)} ${symbol}`,
          memo: memo || `Contribution`
        }
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        await fetchBalances(address);
        return true;
      }
      return false;
    } catch (err: any) {
      showError(err.message || "Transaction failed.");
      return false;
    }
  };

  return (
    <WalletContext.Provider value={{ 
      isConnected, isConnecting, isFetchingBalances, isBanned, address, guyBalance, xprBalance, isMember, membershipExpiry,
      connect, disconnect, payMembership, transferTokens, refreshBalances: () => fetchBalances(address!)
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