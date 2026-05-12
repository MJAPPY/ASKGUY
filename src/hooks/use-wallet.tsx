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

const APP_NAME = 'ASK GUY';
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
  const [isFetchingBalances, setIsFetchingBalances] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [membershipExpiry, setMembershipExpiry] = useState<number | null>(null);
  const [link, setLink] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  
  const initializingRef = useRef(false);

  const checkBanStatus = async (account: string) => {
    try {
      const { data } = await supabase
        .from('banned_users')
        .select('address')
        .eq('address', account)
        .single();
      
      if (data) {
        setIsBanned(true);
        showError("This account has been restricted from the platform.");
      } else {
        setIsBanned(false);
      }
    } catch (err) {
      setIsBanned(false);
    }
  };

  const fetchBalances = useCallback(async (account: string) => {
    if (!account) {
      setIsFetchingBalances(false);
      return;
    }
    
    setIsFetchingBalances(true);
    await checkBanStatus(account);
    
    let finalXpr = 0;
    let finalGuy = 0;
    let success = false;

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
          success = true;
        }

        if (success) break;
      } catch (err) {
        console.warn(`Endpoint ${endpoint} failed`, err);
      }
    }

    setXprBalance(finalXpr);
    setGuyBalance(finalGuy);
    setTimeout(() => setIsFetchingBalances(false), 800);
  }, []);

  const refreshBalances = useCallback(async () => {
    if (address) {
      await fetchBalances(address);
      showSuccess("Balances updated");
    }
  }, [address, fetchBalances]);

  const initSDK = useCallback(async (restore = true) => {
    if (initializingRef.current && restore) return null;
    initializingRef.current = true;

    try {
      const result = await ProtonWebSDK({
        linkOptions: { chainId: PROTON_CHAIN_ID, endpoints: ENDPOINTS, restoreSession: restore },
        // Use an empty string for requestAccount if 'askguy' is not verified in the app directory,
        // otherwise it can cause transaction errors in some wallet versions.
        transportOptions: { requestAccount: '', backButton: true },
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
        await fetchBalances(actor);
      } else {
        setIsFetchingBalances(false);
      }
      
      initializingRef.current = false;
      return result;
    } catch (err) {
      initializingRef.current = false;
      setIsFetchingBalances(false);
      return null;
    }
  }, [fetchBalances]);

  useEffect(() => {
    initSDK(true);
  }, [initSDK]);

  const connect = async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setIsFetchingBalances(true);
    try {
      let currentResult = await initSDK(false);
      if (!currentResult) throw new Error("SDK_INIT_FAILED");
      const { session: newSession } = currentResult;
      setSession(newSession);
      const actor = newSession.auth.actor.toString();
      setAddress(actor);
      setIsConnected(true);
      await fetchBalances(actor);
      showSuccess(`Connected as ${actor}`);
      setIsConnecting(false);
    } catch (err) {
      setIsConnecting(false);
      setIsFetchingBalances(false);
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
    showSuccess("Wallet Disconnected");
  };

  const payMembership = async () => {
    const FEE = 1;
    if (!session || !address) {
      showError("Please connect your wallet first.");
      return;
    }
    
    // Refresh balances one last time before checking
    await fetchBalances(address);
    
    if (xprBalance < FEE) {
      showError(`Insufficient XPR balance. Need ${FEE} XPR.`);
      return;
    }

    try {
      const actor = session.auth.actor.toString();
      const permission = session.auth.permission.toString();

      const action = {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: actor,
          permission: permission
        }],
        data: {
          from: actor,
          to: OWNER_ACCOUNT,
          quantity: `${FEE.toFixed(4)} XPR`,
          memo: 'AskGuy Membership Fee'
        }
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        setIsMember(true);
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        const currentExpiry = membershipExpiry || Date.now();
        const newExpiry = (currentExpiry > Date.now() ? currentExpiry : Date.now()) + oneYearInMs;
        setMembershipExpiry(newExpiry);
        await fetchBalances(address);
        showSuccess(`Membership Activated!`);
      }
    } catch (err: any) {
      console.error("Membership payment error:", err);
      const msg = err.message || "Transaction failed. Please check your wallet.";
      showError(msg);
    }
  };

  const transferTokens = async (to: string, amount: number, symbol: 'XPR' | 'GUY', memo: string) => {
    if (!session || !address) {
      showError("Please connect your wallet first.");
      return false;
    }

    const contract = symbol === 'XPR' ? 'eosio.token' : 'vtoken';
    const precision = symbol === 'XPR' ? 4 : 6;

    try {
      const actor = session.auth.actor.toString();
      const permission = session.auth.permission.toString();

      const action = {
        account: contract,
        name: 'transfer',
        authorization: [{
          actor: actor,
          permission: permission
        }],
        data: {
          from: actor,
          to: to,
          quantity: `${amount.toFixed(precision)} ${symbol}`,
          memo: memo || `Contribution via AskGuy`
        }
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        await fetchBalances(address);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Token transfer error:", err);
      const msg = err.message || "Transaction failed. Please check your wallet.";
      showError(msg);
      return false;
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