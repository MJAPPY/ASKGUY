"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useWallet, OWNER_ADDRESS } from './use-wallet';

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
  amount: Number(data.amount || 0),
  raised: Number(data.raised || 0),
  timestamp: Number(data.timestamp || 0),
  proofUrl: data.proof_url,
  contributions: (data.contributions || []).map((c: any) => ({
    ...c,
    id: c.id,
    user: c.user,
    amount: Number(c.amount || 0),
    token: c.token,
    message: c.message,
    timestamp: Number(c.timestamp || 0)
  }))
});

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useWallet();
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

  const verifyAdminAuth = () => {
    if (!address || address.toLowerCase().trim() !== OWNER_ADDRESS.toLowerCase().trim()) {
      throw new Error("Unauthorized: Only the platform administrator @askguy can perform this action.");
    }
    return true;
  };

  const addRequest = async (req: any) => {
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .insert({
          title: req.title,
          category: req.category,
          amount: req.amount,
          token: req.token,
          description: req.description,
          proof_url: req.proofUrl,
          requestor: address.toLowerCase().trim(),
          timestamp: Date.now(),
          status: 'Open',
          raised: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      await fetchRequests();
      return data;
    } catch (err: any) {
      showError(err.message || "Failed to create request");
      return null;
    }
  };

  const updateRequest = async (id: string, updates: any) => {
    try {
      const dbUpdates = { ...updates };
      if (updates.hasOwnProperty('proofUrl')) {
        dbUpdates.proof_url = updates.proofUrl;
        delete dbUpdates.proofUrl;
      }

      const requestToUpdate = requests.find(r => r.id === id);
      const isOwner = requestToUpdate?.requestor.toLowerCase() === address.toLowerCase();

      if (!isOwner) {
        verifyAdminAuth();
      }

      const { data, error } = await supabase
        .from('aid_requests')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchRequests();
      return data;
    } catch (err: any) {
      showError(err.message || "Failed to update request");
      throw err;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      verifyAdminAuth();

      // Delete child contributions first (referential integrity)
      await supabase.from('contributions').delete().eq('request_id', id);
      
      const { error } = await supabase
        .from('aid_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchRequests();
      showSuccess("Content removed successfully.");
    } catch (err: any) {
      showError(err.message || "Unauthorized delete request");
      throw err;
    }
  };

  const batchDeleteRequests = async (ids: string[]) => {
    try {
      verifyAdminAuth();
      
      for (const id of ids) {
        await supabase.from('contributions').delete().eq('request_id', id);
        await supabase.from('aid_requests').delete().eq('id', id);
      }
      
      await fetchRequests();
      showSuccess(`Successfully processed ${ids.length} items.`);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const contribute = async (requestId: string, contributor: string, amount: number, token: TokenSymbol, message?: string) => {
    try {
      const { error } = await supabase
        .from('contributions')
        .insert({
          request_id: requestId,
          user: contributor.toLowerCase().trim(),
          amount,
          token,
          message,
          timestamp: Date.now()
        });
      
      if (error) throw error;

      const request = requests.find(r => r.id === requestId);
      if (request && token === request.token) {
        const newRaised = (request.raised || 0) + amount;
        const isFunded = newRaised >= request.amount;
        
        await updateRequest(requestId, { 
          raised: newRaised,
          status: isFunded ? 'Funded' : 'Open',
          proofUrl: isFunded ? null : request.proofUrl 
        });
      }

      await fetchRequests();
      return true;
    } catch (err) {
      return false;
    }
  };

  const markCompleted = async (id: string, thanksMessage?: string) => {
    try {
      if (thanksMessage) {
        const req = requests.find(r => r.id === id);
        if (req) {
          await supabase
            .from('contributions')
            .insert({
              request_id: id,
              user: address.toLowerCase().trim(),
              amount: 0,
              token: req.token,
              message: thanksMessage,
              timestamp: Date.now()
            });
        }
      }
      return await updateRequest(id, { status: 'Completed', proofUrl: null });
    } catch (err: any) {
      throw err;
    }
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