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

// Prioritized list of Proton RPC endpoints
const ENDPOINTS = [
  'https://proton.greymass.com',
  'https://api.protonnz.com',
  'https://proton.protonuk.io',
  'https://api.protonchain.com',
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

  const fetchChainBalance = async (account: string, code: string, symbol: string): Promise<number> => {
    const cleanAccount = String(account).toLowerCase().trim();
    const cleanCode = String(code).toLowerCase().trim();
    
    // Try each endpoint until one succeeds
    for (const endpoint of ENDPOINTS) {
      try {
        const balanceRes = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode, account: cleanAccount, symbol }),
          signal: AbortSignal.timeout(4000) // 4 second timeout per request
        });

        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (Array.isArray(data)) {
            if (data.length === 0) return 0;
            // Response format example: ["1234.567890 GUY"]
            const rawValue = data[0].toString().split(' ')[0];
            const parsed = parseFloat(rawValue);
            return isNaN(parsed) ? 0 : parsed;
          }
        }
      } catch (err) {
        continue; // Try next endpoint
      }
    }
    return 0;
  };

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    setIsFetchingBalances(true);
    const cleanAddress = walletAddress.toLowerCase();
    
    try {
      // 1. Check ban status and profile in Supabase
      const [banCheck, profileCheck] = await Promise.all([
        supabase.from('banned_users').select('address').eq('address', cleanAddress).maybeSingle(),
        supabase.from('profiles').select('membership_expiry').eq('address', cleanAddress).maybeSingle(),
      ]);

      setIsBanned(!!banCheck.data);
      if (profileCheck.data?.membership_expiry) {
        setMembershipExpiry(profileCheck.data.membership_expiry);
      }

      // 2. Fetch On-Chain Balances
      // We check XPR and the three known contracts for GUY (prioritizing proton-vtoken)
      const xprVal = await fetchChainBalance(cleanAddress, 'eosio.token', 'XPR');
      setXprBalance(xprVal);

      // Aggregating GUY from multiple potential contracts as a safety measure
      const guyBalances = await Promise.all([
        fetchChainBalance(cleanAddress, 'proton-vtoken', 'GUY'),
        fetchChainBalance(cleanAddress, 'xtokens', 'GUY'),
        fetchChainBalance(cleanAddress, 'token.777', 'GUY')
      ]);
      
      const highestGuyBalance = Math.max(...guyBalances);
      setGuyBalance(highestGuyBalance);
      
    } catch (err) {
      console.error('[use-wallet] Balance sync failed:', err);
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
        loadBalances(actor);
      }
    } catch (err) {
      console.error('[use-wallet] Wallet initialization failed:', err);
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
      try { 
        await linkRef.current.removeSession(APP_NAME, session.auth); 
      } catch (e) {
        console.warn('[use-wallet] Session removal error:', e);
      }
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
      let account = token === 'XPR' ? 'eosio.token' : 'proton-vtoken';
      
      // Dynamic contract selection for GUY based on current holdings
      if (token === 'GUY') {
        const vtokenVal = await fetchChainBalance(address, 'proton-vtoken', 'GUY');
        if (vtokenVal < amount) {
          const xtokensVal = await fetchChainBalance(address, 'xtokens', 'GUY');
          if (xtokensVal >= amount) {
            account = 'xtokens';
          } else {
            const t777Val = await fetchChainBalance(address, 'token.777', 'GUY');
            if (t777Val >= amount) account = 'token.777';
          }
        }
      }
      
      const action = {
        account: account,
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
      
      // Refresh balances after a short delay to allow for block propagation
      setTimeout(refreshBalances, 3000);
      return true;
    } catch (err) {
      console.error('[use-wallet] Transaction processing error:', err);
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
      address, 
      isConnected, 
      isConnecting, 
      isFetchingBalances,
      guyBalance, 
      xprBalance, 
      membershipExpiry,
      isMember: isConnected, 
      hasGuyThreshold: true, 
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
  if (context === undefined) throw new Error('useWallet must be used within WalletProvider');
  return context;
};