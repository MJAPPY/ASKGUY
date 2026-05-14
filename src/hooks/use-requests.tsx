import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AidRequest {
  id: string;
  requestor: string;
  title: string;
  category: string;
  amount: number;
  token: 'XPR' | 'GUY';
  description: string;
  status: string;
  timestamp: number;
  proofUrl?: string;
  raised: number;
  contributions?: {
    id: string;
    user: string;
    amount: number;
    token: 'XPR' | 'GUY';
    message?: string;
    timestamp: number;
  }[];
}

export type TokenSymbol = 'XPR' | 'GUY';

export const useRequests = () => {
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Fetch requests failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRequest = async (req: any) => {
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .insert(req)
        .select();
      if (error) throw error;
      await fetchRequests();
      return data;
    } catch (err) {
      console.error('Add request failed:', err);
      return null;
    }
  };

  const updateRequest = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      await fetchRequests();
      return data;
    } catch (err) {
      console.error('Update request failed:', err);
      return null;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('aid_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchRequests();
    } catch (err) {
      console.error('Delete request failed:', err);
    }
  };

  const contribute = async (requestId: string, contributor: string, amount: number, token: TokenSymbol, message?: string) => {
    try {
      const { error } = await supabase.from('contributions').insert({
        request_id: requestId,
        user: contributor,
        amount,
        token,
        message,
        timestamp: Date.now(),
      });
      if (error) throw error;
      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Contribute failed:', err);
      return false;
    }
  };

  const markCompleted = async (id: string) => {
    return updateRequest(id, { status: 'Completed' });
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    fetchRequests,
    addRequest,
    updateRequest,
    deleteRequest,
    contribute,
    markCompleted,
  };
};

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};