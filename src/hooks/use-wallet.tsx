"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Connect, { LinkSession } from '@proton/web-sdk';
import { ApiClass } from '@proton/api';
import { supabase } from '@/integrations/supabase/client';

export interface WalletState {
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
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

// === 1. Optimized ENDPOINTS ===
const ENDPOINTS = [
  'https://api.protonnz.com',
  'https://api.protonchain.com',
  'https://proton.eosusa.io',
  'https://proton.protonuk.io',
];

const protonApi = new ApiClass('proton');

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [membershipExpiry, setMembershipExpiry] = useState(0);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [session, setSession] = useState<LinkSession | null>(null);
  const linkRef = useRef<any>(null);

  // === 2. Enhanced fetchChainBalance implementation ===
  const fetchChainBalance = async (account: string, code: string, symbol: string): Promise<number> => {
    const cleanAccount = String(account).toLowerCase().trim();
    console.log(`[use-wallet] 🔍 Fetching ${symbol} from ${code} for ${cleanAccount}`);

    for (const endpoint of ENDPOINTS) {
      try {
        console.log(`[use-wallet] → Trying ${endpoint}`);

        // Try 1: get_currency_balance
        let res = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, account: cleanAccount, symbol }),
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`[use-wallet] get_currency_balance raw:`, data);
          if (Array.isArray(data) && data.length > 0) {
            const val = parseFloat(data[0].split(' ')[0] || '0');
            console.log(`✅ SUCCESS (currency_balance): ${val} ${symbol}`);
            return val;
          }
        }

        // Try 2: Table rows with user as scope
        res = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: true,
            code: code,
            scope: cleanAccount,
            table: 'accounts',
            limit: 50
          }),
        });

        if (res.ok) {
          const { rows } = await res.json();
          console.log(`[use-wallet] user-scope rows:`, rows);
          const row = rows?.find((r: any) => 
            r.balance?.toString().includes(symbol) || JSON.stringify(r).includes(symbol)
          );
          if (row) {
            const bal = row.balance || Object.values(row).find((v: any) => String(v).includes(symbol));
            const val = parseFloat(String(bal).split(' ')[0] || '0');
            console.log(`✅ SUCCESS (user scope): ${val} ${symbol}`);
            return val;
          }
        }

        // Try 3: Table rows with CONTRACT as scope (key for tokens like GUY)
        res = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: true,
            code: code,
            scope: code,                    // e.g. proton-vtoken as scope
            table: 'accounts',
            lower_bound: cleanAccount,
            upper_bound: cleanAccount,
            limit: 10
          }),
        });

        if (res.ok) {
          const { rows } = await res.json();
          console.log(`[use-wallet] contract-scope rows:`, rows);
          const row = rows?.find((r: any) => r.balance?.toString().includes(symbol));
          if (row) {
            const val = parseFloat(String(row.balance).split(' ')[0] || '0');
            console.log(`✅ SUCCESS (contract scope): ${val} ${symbol}`);
            return val;
          }
        }

      } catch (err: any) {
        console.warn(`[use-wallet] ${endpoint} failed:`, err.message || err);
      }
    }

    console.error(`❌ FAILED to fetch ${symbol} balance on all endpoints`);
    return 0;
  };

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    const cleanAddress = String(walletAddress).toLowerCase().trim();

    setIsFetchingBalances(true);
    try {
      const [realXpr, realGuy] = await Promise.all([
        fetchChainBalance(cleanAddress, 'eosio.token', 'XPR'),
        fetchChainBalance(cleanAddress, 'proton-vtoken', 'GUY')
      ]);

      setXprBalance(realXpr);
      setGuyBalance(realGuy);

      try {
        const { data } = await supabase.from('profiles').select('membership_expiry').eq('address', cleanAddress).maybeSingle();
        if (data?.membership_expiry) setMembershipExpiry(data.membership_expiry);
      } catch (err) {
        console.warn('[use-wallet] Profile sync failed');
      }

    } catch (err) {
      console.error('[use-wallet] loadBalances crash:', err);
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
          customStyleOptions: { modalBackgroundColor: '#0A1428', logoBackgroundColor: '#0A1428', isDark: true }
        }
      });

      linkRef.current = result.link;

      if (result.session) {
        const actor = String(result.session.auth.actor);
        setSession(result.session);
        setAddress(actor);
        setIsConnected(true);
        setIsConnecting(true);

        await new Promise(r => setTimeout(r, 1500));
        await loadBalances(actor);
        setIsConnecting(false);
      }
    } catch (err) {
      console.error('[use-wallet] Init error:', err);
      setIsConnecting(false);
    }
  }, [loadBalances]);

  useEffect(() => {
    initWallet(true);
  }, [initWallet]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await initWallet(false);
    } finally {
      setIsConnecting(false);
    }
  }, [initWallet]);

  const disconnect = useCallback(async () => {
    if (session && linkRef.current) {
      try { await linkRef.current.removeSession(APP_NAME, session.auth); } catch {}
    }
    setAddress(''); setSession(null); setIsConnected(false);
    setGuyBalance(0); setXprBalance(0); setIsConnecting(false);
  }, [session]);

  const refreshBalances = useCallback(async () => {
    if (address) await loadBalances(address);
  }, [address, loadBalances]);

  const transferTokens = useCallback(async (to: string, amount: number, token: 'XPR' | 'GUY', memo?: string) => {
    if (!session) return false;
    try {
      const precision = token === 'XPR' ? 4 : 6;
      const action = {
        account: token === 'XPR' ? 'eosio.token' : 'proton-vtoken',
        name: 'transfer',
        authorization: [session.auth],
        data: { 
          from: session.auth.actor, 
          to, 
          quantity: `${amount.toFixed(precision)} ${token}`, 
          memo: memo || '' 
        }
      };
      await session.transact({ actions: [action] }, { broadcast: true });
      setTimeout(refreshBalances, 2500);
      return true;
    } catch (err) {
      console.error('[use-wallet] Transfer failed:', err);
      return false;
    }
  }, [session, refreshBalances]);

  const payMembership = useCallback(async () => {
    const success = await transferTokens('askguy', 1, 'XPR', 'AskGuy Membership Fee');
    if (success) {
      const nextYear = Date.now() + (365 * 24 * 60 * 60 * 1000);
      setMembershipExpiry(nextYear);
      await supabase.from('profiles').update({ membership_expiry: nextYear }).eq('address', address);
    }
  }, [transferTokens, address]);

  const hasGuyThreshold = guyBalance >= 7770;
  const isMember = (membershipExpiry > Date.now()) || hasGuyThreshold;
  const isBanned = false;

  return (
    <WalletContext.Provider value={{
      address, isConnected, isConnecting, isFetchingBalances,
      guyBalance, xprBalance, membershipExpiry,
      isMember, hasGuyThreshold, isBanned, payMembership, connect, disconnect,
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