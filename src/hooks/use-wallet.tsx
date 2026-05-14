import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

const WalletContext = createContext<WalletState>({
  address: '',
  isConnected: false,
  isConnecting: false,
  isFetchingBalances: false,
  guyBalance: 0,
  xprBalance: 0,
  membershipExpiry: 0,
  isMember: false,
  isBanned: false,
  payMembership: async () => {},
  connect: async () => {},
  disconnect: async () => {},
  refreshBalances: async () => {},
  transferTokens: async () => false,
  requestor: '',
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [membershipExpiry, setMembershipExpiry] = useState(0);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);

  const loadBalances = useCallback(async () => {
    if (!address) return;
    setIsFetchingBalances(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('guy_balance, xpr_balance, membership_expiry')
        .eq('address', address)
        .single();
      if (error) throw error;
      setGuyBalance(data?.guy_balance ?? 0);
      setXprBalance(data?.xpr_balance ?? 0);
      setMembershipExpiry(data?.membership_expiry ?? 0);
    } catch (err) {
      console.error('Load balances failed:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) loadBalances();
  }, [address, loadBalances]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'proton' as any,
      });
      if (error) throw error;
      const uid = data?.user?.id ?? '';
      setAddress(uid);
      setIsConnected(true);
      await loadBalances();
    } catch (err) {
      console.error('Connect failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [loadBalances]);

  const disconnect = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
    setAddress('');
    setGuyBalance(0);
    setXprBalance(0);
    setMembershipExpiry(0);
    setIsConnected(false);
  }, []);

  const refreshBalances = useCallback(async () => {
    if (address) await loadBalances();
  }, [address, loadBalances]);

  const payMembership = useCallback(async () => {
    if (!address) return;
    try {
      const { error } = await supabase.rpc('pay_membership', {
        user_address: address,
      });
      if (error) throw error;
      await loadBalances();
    } catch (err) {
      console.error('Pay membership failed:', err);
      throw err;
    }
  }, [address, loadBalances]);

  const transferTokens = useCallback(async (to: string, amount: number, token: 'XPR' | 'GUY', memo?: string) => {
    if (!address) return false;
    try {
      const { error } = await supabase.rpc('transfer_tokens', {
        from_address: address,
        to_address: to,
        amount,
        token_symbol: token,
        memo_text: memo || '',
      });
      if (error) throw error;
      await loadBalances();
      return true;
    } catch (err) {
      console.error('Transfer failed:', err);
      return false;
    }
  }, [address, loadBalances]);

  const isMember = guyBalance >= 7770;
  const isBanned = false;

  const value: WalletState = {
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
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  return useContext(WalletContext);
};