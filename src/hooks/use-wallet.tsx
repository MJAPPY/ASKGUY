"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Connect, { LinkSession } from '@proton/web-sdk';
import { supabase } from '@/integrations/supabase/client';

export const OWNER_ADDRESS = 'tripseven'; // Your master wallet address

export interface WalletState {
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
  isAdmin: boolean;
  isFetchingBalances: boolean;
  guyBalance: number;
  xprBalance: number;
  membershipExpiry: number;
  isMember: boolean; 
  hasGuyThreshold: boolean; 
  isBanned: boolean;
  payMembership: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  transferTokens: (to: string, amount: number, token: 'XPR' | 'GUY', memo?: string) => Promise<boolean>;
  requestor: string;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

const APP_NAME = 'AskGuy';

const ENDPOINTS = [
  'https://proton.greymass.com',
  'https://api.protonchain.com',
  'https://proton.protonuk.io',
  'https://api.protonnz.com',
  'https://proton.eosusa.io',
];

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [membershipExpiry, setMembershipExpiry] = useState(0);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [session, setSession] = useState<LinkSession | null>(null);
  const linkRef = useRef<any>(null);

  const isAdmin = address.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const fetchTokenBalance = async (account: string, contract: string, symbol: string): Promise<number> => {
    const cleanAccount = String(account).toLowerCase().trim();
    const cleanContract = String(contract).toLowerCase().trim();
    
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: cleanContract,
            account: cleanAccount,
            symbol: symbol
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const val = parseFloat(data[0].split(' ')[0]);
            return isNaN(val) ? 0 : val;
          }
          return 0;
        }
      } catch (err) {
        // Silently fail and try next endpoint
        continue;
      }
    }
    return 0;
  };

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    setIsFetchingBalances(true);
    const cleanAddress = walletAddress.toLowerCase();
    
    try {
      // Parallelize blockchain and database calls for performance
      const [
        xprVal, 
        guyVtoken, 
        guyXtokens, 
        guy777, 
        guyTokenVtoken,
        banResult,
        profileResult
      ] = await Promise.all([
        fetchTokenBalance(cleanAddress, 'eosio.token', 'XPR'),
        fetchTokenBalance(cleanAddress, 'proton-vtoken', 'GUY'),
        fetchTokenBalance(cleanAddress, 'xtokens', 'GUY'),
        fetchTokenBalance(cleanAddress, 'token.777', 'GUY'),
        fetchTokenBalance(cleanAddress, 'token.vtoken', 'GUY'),
        supabase.from('banned_users').select('address').eq('address', cleanAddress).maybeSingle(),
        supabase.from('profiles').select('membership_expiry').eq('address', cleanAddress).maybeSingle()
      ]);

      setXprBalance(xprVal || 0);
      setIsBanned(!!banResult.data);
      if (profileResult.data?.membership_expiry) {
        setMembershipExpiry(profileResult.data.membership_expiry);
      }
      
      const totalGuy = (guyVtoken || 0) + (guyXtokens || 0) + (guy777 || 0) + (guyTokenVtoken || 0);
      setGuyBalance(totalGuy);
      
      console.log(`[use-wallet] Sync complete for ${cleanAddress}: XPR=${xprVal}, GUY=${totalGuy}`);
    } catch (err) {
      console.error('[use-wallet] Global sync error:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

  const initWallet = useCallback(async (restore = true) => {
    try {
      const result = await Connect({
        linkOptions: { endpoints: ENDPOINTS, restoreSession: restore },
        transportOptions: { requestAccount: 'askguy', backButton: true },
        selectorOptions: {
          appName: APP_NAME,
          customStyleOptions: { 
            modalBackgroundColor: '#0A1428', 
            logoBackgroundColor: '#0A1428', 
            isDark: true,
            accentColor: '#1565C0'
          }
        }
      });
      
      linkRef.current = result.link;
      
      if (result.session) {
        const actor = String(result.session.auth.actor);
        setSession(result.session);
        setAddress(actor);
        setIsConnected(true);
        loadBalances(actor);
      }
    } catch (err) {
      console.error('[use-wallet] Wallet init error:', err);
    }
  }, [loadBalances]);

  useEffect(() => {
    initWallet(true);
  }, [initWallet]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try { await initWallet(false); } finally { setIsConnecting(false); }
  }, [initWallet]);

  const disconnect = useCallback(async () => {
    if (session && linkRef.current) {
      try { await linkRef.current.removeSession(APP_NAME, session.auth); } catch {}
    }
    setAddress(''); setSession(null); setIsConnected(false);
    setGuyBalance(0); setXprBalance(0); setIsBanned(false);
  }, [session]);

  const refreshBalances = useCallback(async () => {
    if (address) await loadBalances(address);
  }, [address, loadBalances]);

  const transferTokens = useCallback(async (to: string, amount: number, token: 'XPR' | 'GUY', memo?: string) => {
    if (!session) return false;
    try {
      const precision = token === 'XPR' ? 4 : 6;
      let account = token === 'XPR' ? 'eosio.token' : 'proton-vtoken';
      
      if (token === 'GUY') {
        const contracts = ['proton-vtoken', 'xtokens', 'token.777', 'token.vtoken'];
        for (const contract of contracts) {
          const balance = await fetchTokenBalance(address, contract, 'GUY');
          if (balance >= amount) {
            account = contract;
            break;
          }
        }
      }
      
      const action = {
        account: account,
        name: 'transfer',
        authorization: [session.auth],
        data: { from: session.auth.actor, to, quantity: `${amount.toFixed(precision)} ${token}`, memo: memo || '' }
      };
      
      await session.transact({ actions: [action] }, { broadcast: true });
      setTimeout(refreshBalances, 3000);
      return true;
    } catch (err) {
      console.error('[use-wallet] Transfer failed:', err);
      return false;
    }
  }, [session, refreshBalances, address]);

  const payMembership = useCallback(async () => {
    const success = await transferTokens('askguy', 1, 'XPR', 'AskGuy Membership Fee');
    if (success) {
      const nextYear = Date.now() + (365 * 24 * 60 * 60 * 1000);
      setMembershipExpiry(nextYear);
      await supabase.from('profiles').upsert({ address, membership_expiry: nextYear }, { onConflict: 'address' });
    }
  }, [transferTokens, address]);

  return (
    <WalletContext.Provider value={{
      address, isConnected, isConnecting, isAdmin, isFetchingBalances,
      guyBalance, xprBalance, membershipExpiry,
      isMember: isConnected, hasGuyThreshold: true, isBanned, 
      payMembership, connect, disconnect,
      refreshBalances, transferTokens, requestor: address,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error('useWallet must be used within WalletProvider');
  return context;
};