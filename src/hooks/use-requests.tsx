"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  contribute: (requestId: string, contributor: string, amount: number, token: TokenSymbol, message?: string) => Promise<boolean>;
  markCompleted: (id: string) => Promise<any>;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

// Helper to map DB snake_case to CamelCase
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
        .select(`
          *,
          contributions (*)
        `)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      setRequests((data || []).map(mapRequestFromDB));
    } catch (err) {
      console.error('[use-requests] Fetch requests failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRequest = async (req: any) => {
    try {
      // Map camelCase to snake_case for DB
      const dbRequest = {
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
      };

      const { data, error } = await supabase
        .from('aid_requests')
        .insert(dbRequest)
        .select();
      
      if (error) throw error;
      await fetchRequests();
      return data;
    } catch (err) {
      console.error('[use-requests] Add request failed:', err);
      return null;
    }
  };

  const updateRequest = async (id: string, updates: any) => {
    try {
      // Map updates if needed (e.g. proofUrl -> proof_url)
      const dbUpdates = { ...updates };
      if (updates.proofUrl) {
        dbUpdates.proof_url = updates.proofUrl;
        delete dbUpdates.proofUrl;
      }

      const { data, error } = await supabase
        .from('aid_requests')
        .update(dbUpdates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      await fetchRequests();
      return data;
    } catch (err) {
      console.error('[use-requests] Update request failed:', err);
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
      console.error('[use-requests] Delete request failed:', err);
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

      // Update the total raised amount on the request
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
      console.error('[use-requests] Contribute failed:', err);
      return false;
    }
  };

  const markCompleted = async (id: string) => {
    return updateRequest(id, { status: 'Completed' });
  };

  useEffect(() => {
    fetchRequests();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('requests_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aid_requests' }, fetchRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, fetchRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchRequests]);

  return (
    <RequestsContext.Provider value={{
      requests,
      loading,
      fetchRequests,
      addRequest,
      updateRequest,
      deleteRequest,
      contribute,
      markCompleted,
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