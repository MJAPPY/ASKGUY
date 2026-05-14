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
  'https://api.protonnz.com',
  'https://api.protonchain.com',
  'https://proton.eosusa.io',
  'https://proton.protonuk.io',
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

  const fetchChainBalance = async (account: string, code: string, symbol: string): Promise<number> => {
    const cleanAccount = String(account).toLowerCase().trim();
    console.log(`[use-wallet] 🔍 Fetching ${symbol} from ${code} for ${cleanAccount}`);

    for (const endpoint of ENDPOINTS) {
      try {
        // Strategy 1: get_currency_balance (Fastest, standard for XPR)
        const balanceRes = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, account: cleanAccount, symbol }),
        });

        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (Array.isArray(data) && data.length > 0) {
            const val = parseFloat(data[0].split(' ')[0] || '0');
            console.log(`✅ Strategy 1 (Currency API) Success: ${val} ${symbol}`);
            return val;
          }
        }

        // Strategy 2: User-Scoped Table (Common for EOSIO tokens)
        const userScopeRes = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: true,
            code: code,
            scope: cleanAccount,
            table: 'accounts',
            limit: 10
          }),
        });

        if (userScopeRes.ok) {
          const { rows } = await userScopeRes.json();
          const row = rows?.find((r: any) => String(r.balance || '').includes(symbol));
          if (row) {
            const val = parseFloat(String(row.balance).split(' ')[0] || '0');
            console.log(`✅ Strategy 2 (User Scope) Success: ${val} ${symbol}`);
            return val;
          }
        }

        // Strategy 3: Contract-Scoped Table (Required for many Proton community tokens like GUY)
        const contractScopeRes = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: true,
            code: code,
            scope: code,
            table: 'accounts',
            lower_bound: cleanAccount,
            upper_bound: cleanAccount,
            limit: 1
          }),
        });

        if (contractScopeRes.ok) {
          const { rows } = await contractScopeRes.json();
          if (rows && rows.length > 0) {
            const row = rows[0];
            // Look for any field that contains the balance string
            const balanceField = row.balance || row[symbol] || row[symbol.toLowerCase()] || Object.values(row).find(v => typeof v === 'string' && v.includes(symbol));
            if (balanceField) {
              const val = parseFloat(String(balanceField).split(' ')[0] || '0');
              console.log(`✅ Strategy 3 (Contract Scope) Success: ${val} ${symbol}`);
              return val;
            }
          }
        }

      } catch (err) {
        console.warn(`[use-wallet] ${endpoint} attempt failed for ${symbol}`);
      }
    }
    return 0;
  };

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    setIsFetchingBalances(true);
    const cleanAddress = walletAddress.toLowerCase();
    
    try {
      // 1. Check blacklist status first
      const { data: banData } = await supabase
        .from('banned_users')
        .select('*')
        .eq('address', cleanAddress)
        .maybeSingle();
      
      setIsBanned(!!banData);

      // 2. Fetch both XPR and GUY balances in parallel
      const [realXpr, realGuy] = await Promise.all([
        fetchChainBalance(cleanAddress, 'eosio.token', 'XPR'),
        fetchChainBalance(cleanAddress, 'proton-vtoken', 'GUY')
      ]);

      setXprBalance(realXpr);
      setGuyBalance(realGuy);

      // 3. Sync membership data from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('membership_expiry')
        .eq('address', cleanAddress)
        .maybeSingle();
      
      if (profileData?.membership_expiry) {
        setMembershipExpiry(profileData.membership_expiry);
      }
    } catch (err) {
      console.error('[use-wallet] Balance/Profile load failed:', err);
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
        loadBalances(actor);
      }
    } catch (err) {
      console.error('[use-wallet] WebAuth init error:', err);
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
    setAddress(''); 
    setSession(null); 
    setIsConnected(false);
    setGuyBalance(0); 
    setXprBalance(0);
    setIsBanned(false);
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
      // Give the blockchain a moment to index before refreshing
      setTimeout(refreshBalances, 2500);
      return true;
    } catch (err) {
      console.error('[use-wallet] Token transfer failed:', err);
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