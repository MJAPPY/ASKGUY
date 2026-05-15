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

  const rpcCall = async (path: string, body: any) => {
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(`${endpoint}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(4000)
        });
        if (response.ok) return await response.json();
      } catch (e) {
        continue;
      }
    }
    return null;
  };

  const fetchAllBalances = useCallback(async (accountName: string) => {
    if (!accountName) return;
    setIsFetchingBalances(true);
    const cleanAddress = accountName.toLowerCase().trim();
    
    console.log(`🔄 Fetching balances for: ${cleanAddress}`);

    try {
      // 1. Fetch native XPR
      const xprData = await rpcCall('/v1/chain/get_currency_balance', {
        code: 'eosio.token',
        account: cleanAddress,
        symbol: 'XPR'
      });
      const xprVal = xprData && xprData.length > 0 ? parseFloat(xprData[0].split(' ')[0]) : 0;
      console.log(`✅ XPR Balance:`, xprVal);

      // 2. Fetch GUY using table rows
      const fetchTableBalance = async (symbol: string) => {
        const data = await rpcCall('/v1/chain/get_table_rows', {
          json: true,
          code: 'proton',
          scope: cleanAddress,
          table: "accounts",
          lower_bound: symbol,
          upper_bound: symbol,
          limit: 1
        });
        const balanceStr = data?.rows[0]?.balance || `0.000000 ${symbol}`;
        console.log(`📊 Raw Table Row (${symbol}):`, balanceStr);
        return parseFloat(balanceStr.split(' ')[0]);
      };

      // Try "GUY" then fallback to "Guy"
      let guyVal = await fetchTableBalance('GUY');
      if (guyVal === 0) {
        guyVal = await fetchTableBalance('Guy');
      }

      // 3. Fallback: Search all tokens
      if (guyVal === 0) {
        const allTokensData = await rpcCall('/v1/chain/get_account_tokens', { account: cleanAddress });
        const foundGuy = allTokensData?.tokens?.find((t: any) => 
          t.symbol === 'GUY' || t.symbol === 'Guy' || t.symbol === '777 GUY'
        );
        if (foundGuy) {
          guyVal = parseFloat(foundGuy.amount);
          console.log(`💎 Found in AllTokens search:`, guyVal);
        }
      }

      // 4. Metadata sync (Supabase)
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
      
      console.log(`✨ Load Complete: XPR: ${xprVal} | GUY: ${guyVal}`);
    } catch (err) {
      console.error('❌ Error syncing wallet data:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

  // Effect to trigger balance fetch when session changes
  useEffect(() => {
    const accountName = session?.auth?.actor;
    if (accountName) {
      fetchAllBalances(String(accountName));
    }
  }, [session, fetchAllBalances]);

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
      
      if (token === 'GUY') {
        const allTokensData = await rpcCall('/v1/chain/get_account_tokens', { account: address });
        const guyInfo = allTokensData?.tokens?.find((t: any) => t.symbol === 'GUY' || t.symbol === 'Guy');
        if (guyInfo) {
          account = guyInfo.contract;
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
      console.error('[transferTokens] Transaction failed:', err);
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