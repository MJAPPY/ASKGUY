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

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    setIsFetchingBalances(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('guy_balance, xpr_balance, membership_expiry')
        .eq('address', walletAddress)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      setGuyBalance(data?.guy_balance ?? 0);
      setXprBalance(data?.xpr_balance ?? 0);
      setMembershipExpiry(data?.membership_expiry ?? 0);
    } catch (err) {
      console.error('[use-wallet] Load balances failed:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

  const initWallet = useCallback(async (restore = true) => {
    try {
      const { link, session: protonSession } = await Connect({
        linkOptions: {
          endpoints: ['https://proton.greymass.com'],
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
        const actor = protonSession.auth.actor;
        setSession(protonSession);
        setAddress(actor);
        setIsConnected(true);
        await loadBalances(actor);
      }
      return protonSession;
    } catch (err) {
      console.error('[use-wallet] Initialization failed:', err);
      return null;
    }
  }, [loadBalances]);

  // Auto-restore on mount
  useEffect(() => {
    initWallet(true);
  }, [initWallet]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const protonSession = await initWallet(false);
      if (!protonSession) {
        console.warn('[use-wallet] No session returned from Connect');
      }
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
      await refreshBalances();
      return true;
    } catch (err) {
      console.error('[use-wallet] Transfer failed:', err);
      return false;
    }
  }, [session, refreshBalances]);

  const payMembership = useCallback(async () => {
    const success = await transferTokens('askguy', 1, 'XPR', 'AskGuy Membership Fee');
    if (success) {
      await refreshBalances();
    }
  }, [transferTokens, refreshBalances]);

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