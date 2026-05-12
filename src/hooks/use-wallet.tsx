"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [session, setSession] = useState<any>(null);
  
  const linkRef = useRef<any>(null);

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

  // Initialize SDK
  useEffect(() => {
    const init = async () => {
      try {
        const { link, session } = await ProtonWebSDK({
          linkOptions: { 
            chainId: PROTON_CHAIN_ID, 
            endpoints: ENDPOINTS, 
            restoreSession: true 
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
        
        linkRef.current = link;
        
        if (session) {
          setSession(session);
          const actor = session.auth.actor.toString();
          setAddress(actor);
          setIsConnected(true);
          fetchBalances(actor);
        }
      } catch (err) {
        console.error("SDK Init error:", err);
      }
    };
    
    init();
  }, [fetchBalances]);

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const { link, session } = await ProtonWebSDK({
        linkOptions: { 
          chainId: PROTON_CHAIN_ID, 
          endpoints: ENDPOINTS, 
          restoreSession: false 
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

      linkRef.current = link;

      if (session) {
        setSession(session);
        const actor = session.auth.actor.toString();
        setAddress(actor);
        setIsConnected(true);
        fetchBalances(actor);
        showSuccess(`Connected as ${actor}`);
      }
    } catch (err) {
      console.error("Connection error:", err);
      showError("Connection failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (linkRef.current && session) {
      try { 
        await linkRef.current.removeSession(APP_NAME, session.auth); 
      } catch (e) {}
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
      showError("Please connect your wallet first.");
      return;
    }
    
    await fetchBalances(address);
    if (xprBalance < FEE) {
      showError(`Insufficient balance. You need at least ${FEE.toFixed(4)} XPR.`);
      return;
    }

    try {
      const actor = session.auth.actor.toString();
      const permission = session.auth.permission.toString();

      const action = {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{ actor, permission }],
        data: {
          from: actor,
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
        showSuccess(`Membership Unlocked! Welcome to AskGuy.`);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      showError(err.message || "The transaction was canceled or failed.");
    }
  };

  const transferTokens = async (to: string, amount: number, symbol: 'XPR' | 'GUY', memo: string) => {
    if (!session || !address) return false;
    const contract = symbol === 'XPR' ? 'eosio.token' : 'vtoken';
    const precision = symbol === 'XPR' ? 4 : 6;

    try {
      const actor = session.auth.actor.toString();
      const permission = session.auth.permission.toString();

      const action = {
        account: contract,
        name: 'transfer',
        authorization: [{ actor, permission }],
        data: {
          from: actor,
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
      console.error("Transfer error:", err);
      showError(err.message || "Transaction failed.");
      return false;
    }
  };

  const refreshBalances = async () => {
    if (address) {
      await fetchBalances(address);
      showSuccess("Balances updated.");
    }
  };

  return (
    <WalletContext.Provider value={{ 
      isConnected, isConnecting, isFetchingBalances, isBanned, address, guyBalance, xprBalance, isMember, membershipExpiry,
      connect, disconnect, payMembership, transferTokens, refreshBalances
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