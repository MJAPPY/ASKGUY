"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Connect from '@proton/web-sdk';
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

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [membershipExpiry, setMembershipExpiry] = useState(0);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [session, setSession] = useState<any>(null);

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    setIsFetchingBalances(true);
    try {
      // In a real app, you would fetch actual on-chain balances here
      // For this demo, we use the profiles table in Supabase
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
      console.error('Load balances failed:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { link, session: protonSession } = await Connect({
        linkOptions: {
          endpoints: ['https://proton.greymass.com'],
          restoreSession: true
        },
        transportOptions: {
          requestAccount: 'askguy', // Resolves "Unknown Requestor"
          backButton: true
        },
        selectorOptions: {
          appName: 'AskGuy', // Resolves "Unknown Requestor"
          customStyleOptions: {
            modalBackgroundColor: '#0A1428',
            logoBackgroundColor: '#0A1428',
            isDark: true
          }
        }
      });

      if (protonSession) {
        const actor = protonSession.auth.actor;
        setSession(protonSession);
        setAddress(actor);
        setIsConnected(true);
        await loadBalances(actor);
      }
    } catch (err) {
      console.error('Connect failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [loadBalances]);

  const disconnect = useCallback(async () => {
    if (session && session.link) {
      await session.link.removeSession('AskGuy', session.auth);
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
      console.error('Transfer failed:', err);
      return false;
    }
  }, [session, refreshBalances]);

  const payMembership = useCallback(async () => {
    const success = await transferTokens('askguy', 1, 'XPR', 'AskGuy Membership Fee');
    if (success) {
      // In a real app, a webhook or oracle would update the Supabase profile
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