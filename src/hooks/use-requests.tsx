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
        .insert({
          ...req,
          timestamp: Date.now(),
          status: 'Open',
          raised: 0
        })
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
        await updateRequest(requestId, { 
          raised: (request.raised || 0) + amount,
          status: (request.raised || 0) + amount >= request.amount ? 'Funded' : 'Open'
        });
      }

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