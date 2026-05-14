"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Connect, { LinkSession } from '@proton/web-sdk';
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
const ENDPOINTS = [
  'https://proton.greymass.com',
  'https://proton.eoscafeblock.com',
  'https://api.protonchain.com'
];

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

  // Advanced balance fetcher with table fallback
  const fetchChainBalance = async (account: string, code: string, symbol: string): Promise<number> => {
    console.log(`[use-wallet] 🔄 Checking ${symbol} for ${account} on ${code}...`);

    for (const endpoint of ENDPOINTS) {
      try {
        // Method 1: Standard get_currency_balance
        const res = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, account, symbol }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const val = parseFloat(data[0].split(' ')[0] || '0');
            console.log(`[use-wallet] ✅ Found via currency_balance: ${val} ${symbol}`);
            return val;
          }
        }

        // Method 2: Fallback to direct table query (more reliable for some community tokens)
        const tableRes = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: true,
            code: code,
            scope: account,
            table: 'accounts',
            limit: 1
          }),
        });

        if (tableRes.ok) {
          const tableData = await tableRes.json();
          if (tableData.rows && tableData.rows.length > 0) {
            // Find the row matching the symbol
            const row = tableData.rows.find((r: any) => r.balance.includes(symbol));
            if (row) {
              const val = parseFloat(row.balance.split(' ')[0] || '0');
              console.log(`[use-wallet] ✅ Found via table_rows: ${val} ${symbol}`);
              return val;
            }
          }
        }
      } catch (e) {
        console.warn(`[use-wallet] ${endpoint} attempt failed:`, e);
      }
    }

    console.log(`[use-wallet] ⚠️ Could not find ${symbol} balance after all attempts.`);
    return 0;
  };

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    const cleanAddress = String(walletAddress).toLowerCase().trim();

    setIsFetchingBalances(true);
    try {
      // Fetching XPR and GUY in parallel
      const [realXpr, realGuy] = await Promise.all([
        fetchChainBalance(cleanAddress, 'eosio.token', 'XPR'),
        fetchChainBalance(cleanAddress, 'proton-vtoken', 'GUY')
      ]);

      console.log(`[use-wallet] 🎯 Balances updated: XPR: ${realXpr} | GUY: ${realGuy}`);

      setXprBalance(realXpr);
      setGuyBalance(realGuy);

      try {
        const { data } = await supabase.from('profiles').select('membership_expiry').eq('address', cleanAddress).maybeSingle();
        if (data?.membership_expiry) setMembershipExpiry(data.membership_expiry);
      } catch (err) {
        console.warn('[use-wallet] Profile sync failed, using default state');
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

        // Allow some time for the chain to settle after potential logins/switches
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