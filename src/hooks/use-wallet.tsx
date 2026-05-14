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
  'https://mainnet.protonchain.com',
  'https://proton.eoscafeblock.com'
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

  const fetchChainBalance = async (account: string, code: string, symbol: string): Promise<number> => {
    console.log(`[use-wallet] 🔍 Fetching ${symbol} from ${code} for ${account}...`);
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, account, symbol })
        });

        if (!response.ok) {
          console.warn(`[use-wallet] ⚠️ ${endpoint} returned status ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`[use-wallet] 📡 ${symbol} raw response from ${endpoint}:`, data);

        if (Array.isArray(data) && data.length > 0) {
          const parts = data[0].split(' ');
          const val = parseFloat(parts[0]);
          console.log(`[use-wallet] ✅ Success! ${account} has ${val} ${symbol}`);
          return isNaN(val) ? 0 : val;
        } else {
          console.log(`[use-wallet] ℹ️ ${endpoint} reports 0 ${symbol} for ${account}`);
        }
      } catch (err) {
        console.warn(`[use-wallet] ❌ ${endpoint} error for ${symbol}:`, err);
      }
    }
    console.warn(`[use-wallet] ‼️ Failed to get a definitive positive balance for ${symbol}. Returning 0.`);
    return 0;
  };

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    const cleanAddress = String(walletAddress).toLowerCase().trim();
    console.log(`[use-wallet] 🚀 loadBalances initiated for ${cleanAddress}`);

    setIsFetchingBalances(true);
    try {
      // Parallel fetch for speed and reliability
      const [realXpr, realGuy] = await Promise.all([
        fetchChainBalance(cleanAddress, 'eosio.token', 'XPR'),
        fetchChainBalance(cleanAddress, 'proton-vtoken', 'GUY')
      ]);

      console.log(`[use-wallet] 📊 Final sync → XPR: ${realXpr}, GUY: ${realGuy}`);

      // Update state immediately to trigger re-renders
      setXprBalance(realXpr);
      setGuyBalance(realGuy);

      if (realGuy >= 7770) {
        console.log(`[use-wallet] 💎 Verification Success: ${realGuy} GUY meets 7770 threshold.`);
      } else {
        console.log(`[use-wallet] 🔒 Verification Failed: ${realGuy} GUY is below 7770.`);
      }

      // Fetch membership data
      const { data } = await supabase
        .from('profiles')
        .select('membership_expiry')
        .eq('address', cleanAddress)
        .single();
      
      if (data) {
        setMembershipExpiry(data.membership_expiry ?? 0);
      }

      // Update backend profile (non-blocking)
      supabase.from('profiles').upsert({
        address: cleanAddress,
        xpr_balance: realXpr,
        guy_balance: realGuy,
        updated_at: new Date().toISOString()
      }, { onConflict: 'address' }).then(({ error }) => {
        if (error) console.error("[use-wallet] Profile sync error:", error);
      });

    } catch (err) {
      console.error('[use-wallet] 💥 loadBalances fatal error:', err);
    } finally {
      setIsFetchingBalances(false);
      console.log(`[use-wallet] ✅ loadBalances completed`);
    }
  }, []);

  const initWallet = useCallback(async (restore = true) => {
    try {
      console.log(`[use-wallet] InitWallet (restore=${restore})`);
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
        console.log(`[use-wallet] 👤 Wallet Connected: ${actor}`);

        setSession(result.session);
        setAddress(actor);
        setIsConnected(true);
        setIsConnecting(true); // Keep "connecting" status during balance load

        console.log(`[use-wallet] ⏱️ Waiting 1000ms for chain synchronization...`);
        await new Promise(r => setTimeout(r, 1000));
        
        console.log(`[use-wallet] 🔄 Refreshing balances and membership status...`);
        await loadBalances(actor);
        
        setIsConnecting(false);
        console.log(`[use-wallet] ✨ Connection process complete for ${actor}`);
      }
    } catch (err) {
      console.error('[use-wallet] SDK Connect error:', err);
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
    console.log(`[use-wallet] 🔌 Disconnecting...`);
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
      const action = {
        account: token === 'XPR' ? 'eosio.token' : 'proton-vtoken',
        name: 'transfer',
        authorization: [session.auth],
        data: { from: session.auth.actor, to, quantity: `${amount.toFixed(token === 'XPR' ? 4 : 6)} ${token}`, memo: memo || '' }
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

  const isMember = guyBalance >= 7770;
  const isBanned = false;

  return (
    <WalletContext.Provider value={{
      address, isConnected, isConnecting, isFetchingBalances,
      guyBalance, xprBalance, membershipExpiry,
      isMember, isBanned, payMembership, connect, disconnect,
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