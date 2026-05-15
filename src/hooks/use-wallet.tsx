"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Connect, { LinkSession } from '@proton/web-sdk';
import { supabase } from '@/integrations/supabase/client';

export const OWNER_ADDRESS = 'tripseven';

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

const PROTON_ENDPOINTS = [
  'https://proton.greymass.com',
  'https://api.protonchain.com',
  'https://proton.protonuk.io',
  'https://api.protonnz.com',
  'https://proton.eosusa.io'
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

  const getTokenBalance = useCallback(async (accountName: string, contract: string, symbol: string) => {
    for (const rpc of PROTON_ENDPOINTS) {
      try {
        // Try get_currency_balance first as it's often more stable than table rows
        const res = await fetch(`${rpc}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: contract,
            account: accountName,
            symbol: symbol
          }),
          signal: AbortSignal.timeout(3000)
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            console.log(`✅ ${symbol} (${contract}) from ${rpc}:`, data[0]);
            return data[0];
          }
        }
        
        // Fallback to get_table_rows if get_currency_balance returns nothing
        const resTable = await fetch(`${rpc}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: true,
            code: contract,
            scope: accountName,
            table: "accounts",
            lower_bound: symbol,
            upper_bound: symbol,
            limit: 1
          }),
          signal: AbortSignal.timeout(3000)
        });

        if (resTable.ok) {
          const tableData = await resTable.json();
          const balance = tableData.rows[0]?.balance;
          if (balance) {
            console.log(`✅ ${symbol} (Table) from ${rpc}:`, balance);
            return balance;
          }
        }
      } catch (err) {
        console.warn(`⚠️ Node ${rpc} failed for ${symbol}`);
      }
    }
    return `0.0000 ${symbol}`;
  }, []);

  const fetchAllBalances = useCallback(async (accountName: string) => {
    if (!accountName) return;
    setIsFetchingBalances(true);
    const cleanAddress = accountName.toLowerCase().trim();
    
    console.log(`🔄 Syncing balances for: ${cleanAddress}`);

    try {
      // 1. Fetch XPR (eosio.token)
      const xprStr = await getTokenBalance(cleanAddress, 'eosio.token', 'XPR');
      const xprVal = parseFloat(xprStr.split(' ')[0]);

      // 2. Fetch GUY (tried on common contracts: 'token.vtoken' and 'proton')
      let guyStr = await getTokenBalance(cleanAddress, 'token.vtoken', 'GUY');
      let guyVal = parseFloat(guyStr.split(' ')[0]);

      if (guyVal === 0) {
        guyStr = await getTokenBalance(cleanAddress, 'proton', 'GUY');
        guyVal = parseFloat(guyStr.split(' ')[0]);
      }

      // 3. Metadata sync (Supabase)
      const [banResult, profileResult] = await Promise.all([
        supabase.from('banned_users').select('address').eq('address', cleanAddress).maybeSingle(),
        supabase.from('profiles').select('membership_expiry').eq('address', cleanAddress).maybeSingle()
      ]);

      setXprBalance(xprVal);
      setGuyBalance(guyVal);
      setIsBanned(!!banResult.data);
      if (profileResult.data?.membership_expiry) {
        setMembershipExpiry(profileResult.data.membership_expiry);
      }
      
      console.log(`✨ Sync Finished: XPR: ${xprVal} | GUY: ${guyVal}`);
    } catch (err) {
      console.error('❌ Sync failed:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, [getTokenBalance]);

  // Handle session detection and auto-sync
  useEffect(() => {
    const accountName = session?.auth?.actor;
    if (accountName) {
      console.log("=== ACCOUNT DETECTED ===", accountName);
      fetchAllBalances(String(accountName));
    }
  }, [session, fetchAllBalances]);

  const initWallet = useCallback(async (restore = true) => {
    try {
      const result = await Connect({
        linkOptions: { endpoints: PROTON_ENDPOINTS, restoreSession: restore },
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
      }
    } catch (err) {
      console.error('[initWallet] Connection error:', err);
    }
  }, []);

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
    if (address) await fetchAllBalances(address);
  }, [address, fetchAllBalances]);

  const transferTokens = useCallback(async (to: string, amount: number, token: 'XPR' | 'GUY', memo?: string) => {
    if (!session) return false;
    try {
      const precision = token === 'XPR' ? 4 : 6;
      let account = token === 'XPR' ? 'eosio.token' : 'token.vtoken';
      
      // GUY can be on different contracts, let's try to verify via transfer failure if needed, 
      // but usually it's token.vtoken for the bridge or proton for native.
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
      console.error('[transferTokens] Transaction failed:', err);
      return false;
    }
  }, [session, refreshBalances]);

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