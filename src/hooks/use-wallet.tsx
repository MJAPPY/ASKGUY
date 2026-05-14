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
const CHAIN_URL = 'https://proton.greymass.com';

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
    try {
      console.log(`[use-wallet] Fetching ${symbol} for ${account} from ${code}`);
      const response = await fetch(`${CHAIN_URL}/v1/chain/get_currency_balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, account, symbol })
      });
      
      if (!response.ok) return 0;

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const val = parseFloat(data[0].split(' ')[0]);
        return isNaN(val) ? 0 : val;
      }
      return 0;
    } catch (err) {
      console.error(`[use-wallet] Chain fetch error for ${symbol}:`, err);
      return 0;
    }
  };

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    const cleanAddress = String(walletAddress).toLowerCase().trim();
    
    setIsFetchingBalances(true);
    try {
      const [realXpr, realGuy] = await Promise.all([
        fetchChainBalance(cleanAddress, 'eosio.token', 'XPR'),
        fetchChainBalance(cleanAddress, 'token.guy', 'GUY')
      ]);

      setXprBalance(realXpr);
      setGuyBalance(realGuy);
      console.log(`[use-wallet] Balances updated: ${realGuy} GUY, ${realXpr} XPR`);

      const { data } = await supabase
        .from('profiles')
        .select('membership_expiry')
        .eq('address', cleanAddress)
        .single();
      
      if (data) {
        setMembershipExpiry(data.membership_expiry ?? 0);
      }

      await supabase.from('profiles').upsert({
        address: cleanAddress,
        xpr_balance: realXpr,
        guy_balance: realGuy,
        updated_at: new Date().toISOString()
      }, { onConflict: 'address' });

    } catch (err) {
      console.error('[use-wallet] loadBalances error:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

  const initWallet = useCallback(async (restore = true) => {
    try {
      const { link, session: protonSession } = await Connect({
        linkOptions: {
          endpoints: [CHAIN_URL],
          restoreSession: restore
        },
        transportOptions: {
          requestAccount: 'askguy',
          backButton: true
        },
        selectorOptions: {
          appName: APP_NAME,
          customStyleOptions: {
            modalBackgroundColor: '#0A1428',
            logoBackgroundColor: '#0A1428',
            isDark: true
          }
        }
      });

      linkRef.current = link;

      if (protonSession) {
        const actor = String(protonSession.auth.actor);
        setSession(protonSession);
        setAddress(actor);
        setIsConnected(true);
        // Ensure loading state is active before returning to UI
        setIsFetchingBalances(true);
        await loadBalances(actor);
      }
      return protonSession;
    } catch (err) {
      console.error('[use-wallet] Initialization failed:', err);
      return null;
    }
  }, [loadBalances]);

  useEffect(() => {
    initWallet(true);
  }, [initWallet]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await initWallet(false);
    } catch (err) {
      console.error('[use-wallet] Connect failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [initWallet]);

  const disconnect = useCallback(async () => {
    if (session) {
      try {
        await linkRef.current.removeSession(APP_NAME, session.auth);
      } catch (err) {
        console.error('[use-wallet] Remove session failed:', err);
      }
    }
    setAddress('');
    setSession(null);
    setIsConnected(false);
    setGuyBalance(0);
    setXprBalance(0);
  }, [session]);

  const refreshBalances = useCallback(async () => {
    if (address) await loadBalances(address);
  }, [address, loadBalances]);

  const transferTokens = useCallback(async (to: string, amount: number, token: 'XPR' | 'GUY', memo?: string) => {
    if (!session) return false;
    try {
      const action = {
        account: token === 'XPR' ? 'eosio.token' : 'token.guy',
        name: 'transfer',
        authorization: [session.auth],
        data: {
          from: session.auth.actor,
          to,
          quantity: `${amount.toFixed(token === 'XPR' ? 4 : 0)} ${token}`,
          memo: memo || ''
        }
      };
      
      await session.transact({ actions: [action] }, { broadcast: true });
      setTimeout(() => refreshBalances(), 1500);
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
      await supabase.from('profiles').update({
        membership_expiry: nextYear
      }).eq('address', address);
    }
  }, [transferTokens, address]);

  const isMember = guyBalance >= 7770;
  const isBanned = false;

  return (
    <WalletContext.Provider value={{
      address,
      isConnected,
      isConnecting,
      isFetchingBalances,
      guyBalance,
      xprBalance,
      membershipExpiry,
      isMember,
      isBanned,
      payMembership,
      connect,
      disconnect,
      refreshBalances,
      transferTokens,
      requestor: address,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};