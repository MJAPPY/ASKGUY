"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/lib/supabase';

export type RequestStatus = 'Open' | 'Funded' | 'Completed';
export type TokenSymbol = 'XPR' | 'GUY';

export interface Contribution {
  id: string;
  user: string;
  amount: number;
  token: TokenSymbol;
  message?: string;
  timestamp: number;
}

export interface AidRequest {
  id: string;
  user: string;
  title: string;
  category: string;
  amount: number;
  token: TokenSymbol;
  raised: number;
  description: string;
  status: RequestStatus;
  timestamp: number;
  proofUrl?: string;
  isUrgent?: boolean;
  contributions: Contribution[];
}

interface RequestsContextType {
  requests: AidRequest[];
  loading: boolean;
  addRequest: (
    request: Omit<AidRequest, 'id' | 'raised' | 'status' | 'timestamp' | 'contributions' | 'user'> & { requestor: string }
  ) => Promise<boolean>;
  contribute: (id: string, user: string, amount: number, token: TokenSymbol, message?: string) => Promise<void>;
  markCompleted: (id: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .select('*, contributions(*)')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((r: any) => ({
        ...r,
        user: r.requestor || r.user || 'unknown',
      }));
      setRequests(mapped);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const addRequest = async (newReq: Omit<AidRequest, 'id' | 'raised' | 'status' | 'timestamp' | 'contributions' | 'user'> & { requestor: string }) => {
    const activeCount = requests.filter(
      (req) => req.user === newReq.requestor && (req.status === 'Open' || req.status === 'Funded')
    ).length;

    if (activeCount >= 3) {
      showError('You can only have 3 active requests at a time.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('aid_requests')
        .insert([{ ...newReq, raised: 0, status: 'Open', timestamp: Date.now() }]);

      if (error) throw error;
      await fetchRequests();
      return true;
    } catch (err) {
      showError('Failed to post request.');
      return false;
    }
  };

  const contribute = async (id: string, user: string, amount: number, token: TokenSymbol, message?: string) => {
    try {
      const { error: contribError } = await supabase
        .from('contributions')
        .insert([{ request_id: id, user, amount, token, message, timestamp: Date.now() }]);

      if (contribError) throw contribError;

      const request = requests.find((r) => r.id === id);
      if (request && token === request.token) {
        const newRaised = request.raised + amount;
        const newStatus = newRaised >= request.amount ? 'Funded' : request.status;

        const { error: updateError } = await supabase
          .from('aid_requests')
          .update({ raised: newRaised, status: newStatus })
          .eq('id', id);

        if (updateError) throw updateError;
      }

      await fetchRequests();
    } catch (err) {
      showError('Failed to save contribution.');
    }
  };

  const markCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from('aid_requests')
        .update({ status: 'Completed' })
        .eq('id', id);

      if (error) throw error;
      await fetchRequests();
      showSuccess('Request marked as completed.');
    } catch (err) {
      showError('Failed to update status.');
    }
  };

  return (
    <RequestsContext.Provider
      value={{
        requests,
        loading,
        addRequest,
        contribute,
        markCompleted,
        refreshRequests: fetchRequests,
      }}
    >
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(RequestsContext);
  if (!context) throw new Error('useRequests must be used within RequestsProvider');
  return context;
};