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

const APP_NAME = 'AskGuy XPR';
const OWNER_ACCOUNT = 'askguy'; 
const APP_LOGO = 'https://askguy.sh/logo.png'; 

const PROTON_CHAIN_ID = '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0';
const ENDPOINTS = [
  'https://proton.greymass.com',
  'https://mainnet.protonchain.com',
  'https://rpc.protonchain.com'
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
  const [link, setLink] = useState<any>(null);

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
    
    try {
      const endpoint = ENDPOINTS[0];
      
      const xprResponse = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
        method: 'POST',
        body: JSON.stringify({ code: 'eosio.token', account, symbol: 'XPR' })
      });
      const xprData = await xprResponse.json();
      const xprVal = Array.isArray(xprData) && xprData.length > 0 ? parseFloat(xprData[0].split(' ')[0]) : 0;

      const guyResponse = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
        method: 'POST',
        body: JSON.stringify({ code: 'vtoken', account, symbol: 'GUY' })
      });
      const guyData = await guyResponse.json();
      const guyVal = Array.isArray(guyData) && guyData.length > 0 ? parseFloat(guyData[0].split(' ')[0]) : 0;

      setXprBalance(xprVal);
      setGuyBalance(guyVal);
    } catch (err) {
      console.error("Balance fetch error:", err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

  const handleLogin = (session: any, link: any) => {
    setSession(session);
    setLink(link);
    console.log('Chain ID:', session.chainId);
    console.log('Actor:', session.auth?.actor);
    console.log('Permission:', session.auth?.permission);
    console.log('Public Key:', session.publicKey);
    
    const actor = session.auth.actor.toString();
    setAddress(actor);
    setIsConnected(true);
    fetchBalances(actor);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const result = await ProtonWebSDK({
          linkOptions: { chainId: PROTON_CHAIN_ID, endpoints: ENDPOINTS, restoreSession: true },
          transportOptions: { requestAccount: APP_NAME, backButton: true },
          selectorOptions: { appName: APP_NAME, appLogo: APP_LOGO, showContextualError: true }
        });
        
        if (result.session) {
          handleLogin(result.session, result.link);
        } else {
          setLink(result.link);
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
      const result = await ProtonWebSDK({
        linkOptions: { chainId: PROTON_CHAIN_ID, endpoints: ENDPOINTS, restoreSession: false },
        transportOptions: { requestAccount: APP_NAME, backButton: true },
        selectorOptions: { appName: APP_NAME, appLogo: APP_LOGO, showContextualError: true }
      });

      if (result.session) {
        handleLogin(result.session, result.link);
        showSuccess(`Connected!`);
      }
    } catch (err) {
      console.error("Connection error:", err);
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
    if (!session) return showError("Connect wallet first.");
    
    try {
      console.log('Chain ID:', session.chainId);
      console.log('Actor:', session.auth?.actor);
      console.log('Permission:', session.auth?.permission);
      console.log('Public Key:', session.publicKey);

      const action = {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [session.auth],
        data: {
          from: session.auth.actor,
          to: OWNER_ACCOUNT,
          quantity: '1.0000 XPR',
          memo: 'AskGuy Membership'
        }
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        setIsMember(true);
        setMembershipExpiry(Date.now() + (365 * 24 * 60 * 60 * 1000));
        await fetchBalances(address!);
        showSuccess(`Membership Unlocked!`);
      }
    } catch (err: any) {
      console.error('Membership Transaction Error:', err);
      showError(err.message || "Transaction failed.");
    }
  };

  const transferTokens = async (to: string, amount: number, symbol: 'XPR' | 'GUY', memo: string) => {
    if (!session) return false;
    const contract = symbol === 'XPR' ? 'eosio.token' : 'vtoken';
    const precision = symbol === 'XPR' ? 4 : 6;

    try {
      console.log('Chain ID:', session.chainId);
      console.log('Actor:', session.auth?.actor);
      console.log('Permission:', session.auth?.permission);
      console.log('Public Key:', session.publicKey);

      const action = {
        account: contract,
        name: 'transfer',
        authorization: [session.auth],
        data: {
          from: session.auth.actor,
          to: to,
          quantity: `${amount.toFixed(precision)} ${symbol}`,
          memo: memo || `AskGuy Contribution`
        }
      };

      const result = await session.transact({ actions: [action] }, { broadcast: true });
      if (result) {
        await fetchBalances(address!);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Transfer Transaction Error:', err);
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