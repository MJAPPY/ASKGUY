"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Connect, { LinkSession } from '@proton/web-sdk';
import { supabase } from '@/integrations/supabase/client';

export const OWNER_ADDRESS = 'askguy';
export const MEMBERSHIP_RECIPIENT = 'tripseven';

export interface WalletState {
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
  isAdmin: boolean;
  isFetchingBalances: boolean;
  guyBalance: number;
  xprBalance: number;
  avatarUrl: string;
  avatarSet: string;
  membershipExpiry: number;
  membershipFee: number;
  postingFeeGuy: number;
  isMembershipEnabled: boolean;
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  isMember: boolean; 
  hasGuyThreshold: boolean; 
  isBanned: boolean;
  payMembership: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  transferTokens: (to: string, amount: number, token: 'XPR' | 'GUY', memo?: string) => Promise<boolean>;
  requestor: string;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

const APP_NAME = 'AskGuy';

const PROTON_ENDPOINTS = [
  'https://api.protonnz.com',
  'https://proton.eosusa.io',
  'https://proton.cryptolions.io',
  'https://api.protonchain.com'
];

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarSet, setAvatarSet] = useState('pixel-art');
  const [membershipExpiry, setMembershipExpiry] = useState(0);
  const [membershipFee, setMembershipFee] = useState(7777);
  const [postingFeeGuy, setPostingFeeGuy] = useState(25);
  const [isMembershipEnabled, setIsMembershipEnabled] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [session, setSession] = useState<LinkSession | null>(null);
  const linkRef = useRef<any>(null);

  const isAdmin = address.toLowerCase() === OWNER_ADDRESS.toLowerCase();
  const isMember = !isMembershipEnabled || membershipExpiry > Date.now();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();
      
      if (data) {
        setMembershipFee(Number(data.membership_fee));
        setIsMembershipEnabled(data.membership_active);
        setPostingFeeGuy(Number(data.posting_fee_guy ?? 25));
        setAvatarSet(data.avatar_set || 'pixel-art');
        setIsMaintenanceMode(Boolean(data.maintenance_mode));
        setMaintenanceMessage(data.maintenance_message || 'We are currently fine-tuning the platform to better serve the community. Hang tight!');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const getTokenBalance = useCallback(async (accountName: string, contract: string, symbol: string) => {
    for (const rpc of PROTON_ENDPOINTS) {
      try {
        const res = await fetch(`${rpc}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: contract,
            account: accountName,
            symbol: symbol
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data[0];
          }
          if (Array.isArray(data) && data.length === 0) {
            return `0.0000 ${symbol}`;
          }
        }
      } catch (err) {
        // Silent fail
      }
    }
    return `0.0000 ${symbol}`;
  }, []);

  const fetchAllBalances = useCallback(async (accountName: string) => {
    if (!accountName) return;
    setIsFetchingBalances(true);
    const cleanAddress = accountName.toLowerCase().trim();
    
    try {
      const xprStr = await getTokenBalance(cleanAddress, 'eosio.token', 'XPR');
      const xprVal = parseFloat(xprStr.split(' ')[0]);

      const guyContracts = ['vtoken', 'token.vtoken', 'guy', 'proton'];
      let guyVal = 0;

      for (const contract of guyContracts) {
        const guyStr = await getTokenBalance(cleanAddress, contract, 'GUY');
        const currentGuyVal = parseFloat(guyStr.split(' ')[0]);
        if (currentGuyVal > 0) {
          guyVal = currentGuyVal;
          break; 
        }
      }

      const [banResult, profileResult] = await Promise.all([
        supabase.from('banned_users').select('address').eq('address', cleanAddress).maybeSingle(),
        supabase.from('profiles').select('membership_expiry, avatar_url').eq('address', cleanAddress).maybeSingle()
      ]);

      setXprBalance(xprVal);
      setGuyBalance(guyVal);
      setIsBanned(!!banResult.data);
      if (profileResult.data) {
        if (profileResult.data.membership_expiry) {
          setMembershipExpiry(profileResult.data.membership_expiry);
        }
        if (profileResult.data.avatar_url) {
          setAvatarUrl(profileResult.data.avatar_url);
        }
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, [getTokenBalance]);

  useEffect(() => {
    fetchSettings();
    const accountName = session?.auth?.actor;
    if (accountName) {
      fetchAllBalances(String(accountName));
    }
  }, [session, fetchAllBalances, fetchSettings]);

  const initWallet = useCallback(async (restore = true) => {
    try {
      const result = await Connect({
        linkOptions: { endpoints: PROTON_ENDPOINTS, restoreSession: restore },
        transportOptions: { requestAccount: 'askguy', backButton: true } as any,
        selectorOptions: {
          appName: APP_NAME,
          customStyleOptions: { 
            modalBackgroundColor: '#0A1428', 
            logoBackgroundColor: '#0A1428', 
            isDark: true,
            accentColor: '#1565C0'
          }
        } as any
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
    setGuyBalance(0); setXprBalance(0); setIsBanned(false); setAvatarUrl('');
  }, [session]);

  const refreshBalances = useCallback(async () => {
    if (address) await fetchAllBalances(address);
  }, [address, fetchAllBalances]);

  const transferTokens = useCallback(async (to: string, amount: number, token: 'XPR' | 'GUY', memo?: string) => {
    if (!session) return false;
    try {
      const precision = 4;
      let account = token === 'XPR' ? 'eosio.token' : 'vtoken';
      
      if (token === 'GUY') {
        const guyContracts = ['vtoken', 'token.vtoken', 'guy', 'proton'];
        for (const contract of guyContracts) {
          const checkStr = await getTokenBalance(address, contract, 'GUY');
          if (parseFloat(checkStr.split(' ')[0]) > 0) {
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
      console.error('[transferTokens] Transaction failed:', err);
      return false;
    }
  }, [session, refreshBalances, address, getTokenBalance]);

  const payMembership = useCallback(async () => {
    const success = await transferTokens(MEMBERSHIP_RECIPIENT, membershipFee, 'XPR', 'AskGuy Membership Fee');
    if (success) {
      const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
      const baseDate = membershipExpiry > Date.now() ? membershipExpiry : Date.now();
      const nextExpiry = baseDate + ONE_YEAR;
      
      setMembershipExpiry(nextExpiry);
      await supabase.from('profiles').upsert({ address, membership_expiry: nextExpiry }, { onConflict: 'address' });
    }
  }, [transferTokens, address, membershipFee, membershipExpiry]);

  return (
    <WalletContext.Provider value={{
      address, isConnected, isConnecting, isAdmin, isFetchingBalances,
      guyBalance, xprBalance, avatarUrl, avatarSet, membershipExpiry,
      membershipFee, postingFeeGuy, isMembershipEnabled,
      isMaintenanceMode, maintenanceMessage,
      isMember, hasGuyThreshold: true, isBanned, 
      payMembership, connect, disconnect,
      refreshBalances, fetchSettings, transferTokens, requestor: address,
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