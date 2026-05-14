import { supabase } from '@/integrations/supabase/client';
import { createContext, useContext, useEffect, useState } from 'react';

/** Context for wallet state */
const WalletContext = createContext({
  address: '',
  isConnected: false,
  isConnecting: false,
  guyBalance: 0,
  xprBalance: 0,
  membershipExpiry: 0,
  payMembership: () => {},
  connect: () => {},
  disconnect: () => {},
  refreshBalances: () => {},
});

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guyBalance, setGuyBalance] = useState(0);
  const [xprBalance, setXprBalance] = useState(0);
  const [membershipExpiry, setMembershipExpiry] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadBalances = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('guy_balance, xpr_balance, membership_expiry')
        .eq('address', address)
        .single();
      if (error) throw error;
      setGuyBalance(data.guy_balance ?? 0);
      setXprBalance(data.xpr_balance ?? 0);
      setMembershipExpiry(data.membership_expiry ?? 0);
    } finally {
      setLoading(false);
    }
  };

  // Load balances when address changes
  useEffect(() => {
    if (address) loadBalances();
  }, [address]);

  const connect = async () => {
    setIsConnecting(true);
    try {
      // Example: using Proton WebAuth or any auth method
      // Replace with your actual authentication flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'proton',
      });
      if (error) throw error;
      setAddress(data.user?.id ?? '');
      await loadBalances();
    } catch (err) {
      console.error('Connect failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await supabase.auth.signOut();
      setAddress('');
      setGuyBalance(0);
      setXprBalance(0);
      setMembershipExpiry(0);
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const refreshBalances = async () => {
    if (address) await loadBalances();
  };

  const value = {
    address,
    isConnected,
    isConnecting,
    guyBalance,
    xprBalance,
    membershipExpiry,
    payMembership: () => {}, // placeholder – implement as needed
    connect,
    disconnect,
    refreshBalances,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

/** Hook to access wallet context */
export const useWallet = () => {
  return useContext(WalletContext);
};

export const RequestsProvider = ({ children }) => {
  const { fetchRequests, addRequest, updateRequest, deleteRequest } = useRequests();
  // expose these via context if needed elsewhere
  return (
    <RequestsContext.Provider value={{ fetchRequests, addRequest, updateRequest, deleteRequest }}>
      {children}
    </RequestsContext.Provider>
  );
};

const RequestsContext = createContext({
  fetchRequests: () => {},
  addRequest: () => {},
  updateRequest: () => {},
  deleteRequest: () => {},
});