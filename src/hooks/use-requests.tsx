"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

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
  contributions: {
    id: string;
    user: string;
    amount: number;
    token: 'XPR' | 'GUY';
    message?: string;
    timestamp: number;
  }[];
}

export type TokenSymbol = 'XPR' | 'GUY';

interface RequestsContextType {
  requests: AidRequest[];
  loading: boolean;
  fetchRequests: () => Promise<void>;
  addRequest: (req: any) => Promise<any>;
  updateRequest: (id: string, updates: any) => Promise<any>;
  deleteRequest: (id: string) => Promise<void>;
  batchDeleteRequests: (ids: string[]) => Promise<void>;
  contribute: (requestId: string, contributor: string, amount: number, token: TokenSymbol, message?: string) => Promise<boolean>;
  markCompleted: (id: string, thanksMessage?: string) => Promise<any>;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

const mapRequestFromDB = (data: any): AidRequest => ({
  ...data,
  proofUrl: data.proof_url,
  contributions: (data.contributions || []).map((c: any) => ({
    ...c,
    id: c.id,
    user: c.user,
    amount: c.amount,
    token: c.token,
    message: c.message,
    timestamp: c.timestamp
  }))
});

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .select(`*, contributions (*)`)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      setRequests((data || []).map(mapRequestFromDB));
    } catch (err) {
      console.error('[use-requests] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRequest = async (req: any) => {
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .insert({
          requestor: req.requestor,
          title: req.title,
          category: req.category,
          amount: req.amount,
          token: req.token,
          description: req.description,
          proof_url: req.proofUrl,
          timestamp: Date.now(),
          status: 'Open',
          raised: 0
        })
        .select();
      
      if (error) throw error;
      await fetchRequests();
      return data?.[0] || null;
    } catch (err: any) {
      showError(err.message);
      return null;
    }
  };

  const updateRequest = async (id: string, updates: any) => {
    try {
      const dbUpdates = { ...updates };
      if (updates.proofUrl) {
        dbUpdates.proof_url = updates.proofUrl;
        delete dbUpdates.proofUrl;
      }
      const { data, error } = await supabase.from('aid_requests').update(dbUpdates).eq('id', id).select();
      if (error) throw error;
      await fetchRequests();
      return data;
    } catch (err) {
      return null;
    }
  };

  const deleteRequest = async (id: string) => {
    console.log(`[Moderation] Requesting deletion for ID: ${id}`);
    try {
      // Step 1: Clean up contributions
      const { error: cError } = await supabase.from('contributions').delete().eq('request_id', id);
      if (cError) {
        console.error('[Moderation] Contribution cleanup failed:', cError);
        throw new Error("Could not clean up contributions. Check RLS policies.");
      }

      // Step 2: Delete the request
      const { error: rError } = await supabase.from('aid_requests').delete().eq('id', id);
      if (rError) {
        console.error('[Moderation] Request deletion failed:', rError);
        throw new Error("Request deletion failed. Ensure your wallet address is authorized in Supabase RLS.");
      }

      await fetchRequests();
      showSuccess("Content removed successfully.");
    } catch (err: any) {
      showError(err.message);
      throw err;
    }
  };

  const batchDeleteRequests = async (ids: string[]) => {
    console.log(`[Moderation] Requesting batch deletion for: ${ids.length} items`);
    try {
      await supabase.from('contributions').delete().in('request_id', ids);
      const { error } = await supabase.from('aid_requests').delete().in('id', ids);
      
      if (error) {
        console.error('[Moderation] Batch delete failed:', error);
        throw new Error("Batch delete failed. Check RLS permissions.");
      }

      await fetchRequests();
      showSuccess(`Successfully removed ${ids.length} items.`);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const contribute = async (requestId: string, contributor: string, amount: number, token: TokenSymbol, message?: string) => {
    try {
      const { error: contribError } = await supabase.from('contributions').insert({
        request_id: requestId,
        user: contributor,
        amount,
        token,
        message,
        timestamp: Date.now(),
      });
      
      if (contribError) throw contribError;

      const request = requests.find(r => r.id === requestId);
      if (request && token === request.token) {
        const newRaised = (request.raised || 0) + amount;
        await updateRequest(requestId, { 
          raised: newRaised,
          status: newRaised >= request.amount ? 'Funded' : 'Open'
        });
      }

      await fetchRequests();
      return true;
    } catch (err) {
      return false;
    }
  };

  const markCompleted = async (id: string, thanksMessage?: string) => {
    if (thanksMessage) {
      const req = requests.find(r => r.id === id);
      if (req) {
        await supabase.from('contributions').insert({
          request_id: id,
          user: req.requestor,
          amount: 0,
          token: req.token,
          message: thanksMessage,
          timestamp: Date.now(),
        });
      }
    }
    return updateRequest(id, { status: 'Completed' });
  };

  useEffect(() => {
    fetchRequests();
    const subscription = supabase.channel('realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aid_requests' }, fetchRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchRequests)
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [fetchRequests]);

  return (
    <RequestsContext.Provider value={{
      requests, loading, fetchRequests, addRequest, updateRequest, 
      deleteRequest, batchDeleteRequests, contribute, markCompleted,
    }}>
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(RequestsContext);
  if (context === undefined) throw new Error('useRequests must be used within RequestsProvider');
  return context;
};