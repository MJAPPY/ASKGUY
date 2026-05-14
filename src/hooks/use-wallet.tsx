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
    const cleanCode = String(code).toLowerCase().trim();
    
    console.log(`[use-wallet] 🔍 Attempting to fetch ${symbol} from ${cleanCode} for account: ${cleanAccount}`);

    for (const endpoint of ENDPOINTS) {
      try {
        // Strategy 1: Standard Currency Balance API
        const balanceRes = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode, account: cleanAccount, symbol }),
        });

        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (Array.isArray(data) && data.length > 0) {
            const val = parseFloat(data[0].split(' ')[0] || '0');
            if (val > 0) {
              console.log(`✅ [${endpoint}] Strategy 1 Success: ${val} ${symbol}`);
              return val;
            }
          }
        }

        // Strategy 2: User-Scoped Table Lookup (accounts table)
        const userScopeRes = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: true,
            code: cleanCode,
            scope: cleanAccount,
            table: 'accounts',
            limit: 20
          }),
        });

        if (userScopeRes.ok) {
          const { rows } = await userScopeRes.json();
          const row = rows?.find((r: any) => 
            String(r.balance || '').includes(symbol) || 
            String(r.amount || '').includes(symbol)
          );
          if (row) {
            const balanceStr = row.balance || row.amount || Object.values(row).find(v => typeof v === 'string' && v.includes(symbol));
            const val = parseFloat(String(balanceStr).split(' ')[0] || '0');
            if (val > 0) {
              console.log(`✅ [${endpoint}] Strategy 2 Success: ${val} ${symbol}`);
              return val;
            }
          }
        }

        // Strategy 3: Contract-Scoped Table Lookup (rare but used by some community tokens)
        const contractScopeRes = await fetch(`${endpoint}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: true,
            code: cleanCode,
            scope: cleanCode,
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
            const balanceField = row.balance || row[symbol] || row[symbol.toLowerCase()] || Object.values(row).find(v => typeof v === 'string' && v.includes(symbol));
            if (balanceField) {
              const val = parseFloat(String(balanceField).split(' ')[0] || '0');
              if (val > 0) {
                console.log(`✅ [${endpoint}] Strategy 3 Success: ${val} ${symbol}`);
                return val;
              }
            }
          }
        }

      } catch (err) {
        // Silent fail to next endpoint
      }
    }
    
    console.log(`⚠️ [use-wallet] No balance found for ${symbol} on ${cleanCode}`);
    return 0;
  };

  const loadBalances = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    setIsFetchingBalances(true);
    const cleanAddress = walletAddress.toLowerCase();
    
    try {
      // Check blacklist
      const { data: banData } = await supabase
        .from('banned_users')
        .select('*')
        .eq('address', cleanAddress)
        .maybeSingle();
      
      setIsBanned(!!banData);

      // Fetch XPR (standard)
      const xprVal = await fetchChainBalance(cleanAddress, 'eosio.token', 'XPR');
      setXprBalance(xprVal);

      // Fetch GUY with fallbacks (it might be on proton-vtoken OR xtokens)
      let guyVal = await fetchChainBalance(cleanAddress, 'proton-vtoken', 'GUY');
      
      if (guyVal === 0) {
        console.log(`[use-wallet] 🔄 GUY not found on proton-vtoken, trying xtokens fallback...`);
        guyVal = await fetchChainBalance(cleanAddress, 'xtokens', 'GUY');
      }

      setGuyBalance(guyVal);

      // Sync profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('membership_expiry')
        .eq('address', cleanAddress)
        .maybeSingle();
      
      if (profileData?.membership_expiry) {
        setMembershipExpiry(profileData.membership_expiry);
      }
    } catch (err) {
      console.error('[use-wallet] Critical failure in loadBalances:', err);
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
      console.error('[use-wallet] WebAuth initialization error:', err);
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
      const account = token === 'XPR' ? 'eosio.token' : (guyBalance > 0 ? (await getGuyContract(address)) : 'proton-vtoken');
      
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
      setTimeout(refreshBalances, 2500);
      return true;
    } catch (err) {
      console.error('[use-wallet] Token transfer failed:', err);
      return false;
    }
  }, [session, refreshBalances, address, guyBalance]);

  // Helper to determine which contract to use for transfer based on where balance was found
  const getGuyContract = async (user: string) => {
    const vtoken = await fetchChainBalance(user, 'proton-vtoken', 'GUY');
    return vtoken > 0 ? 'proton-vtoken' : 'xtokens';
  };

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