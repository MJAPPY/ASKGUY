"use client";

import React, { createContext, useContext, useState } from 'react';
import { showSuccess } from '@/utils/toast';

export type RequestStatus = 'Open' | 'Funded' | 'Completed';

export interface AidRequest {
  id: string;
  user: string;
  category: string;
  amount: number;
  raised: number;
  description: string;
  status: RequestStatus;
  timestamp: number;
}

interface RequestsContextType {
  requests: AidRequest[];
  addRequest: (request: Omit<AidRequest, 'id' | 'raised' | 'status' | 'timestamp'>) => void;
  contribute: (id: string, amount: number) => void;
  markCompleted: (id: string) => void;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<AidRequest[]>([
    { 
      id: '1', 
      user: 'alice.xpr', 
      category: 'Medical', 
      amount: 1200, 
      raised: 850, 
      description: 'Need help with unexpected dental surgery costs. Any contribution helps!', 
      status: 'Open',
      timestamp: Date.now() - 86400000 
    },
    { 
      id: '2', 
      user: 'bob.xpr', 
      category: 'Utilities', 
      amount: 450, 
      raised: 450, 
      description: 'Electricity bill is overdue due to job loss. Thank you community!', 
      status: 'Funded',
      timestamp: Date.now() - 172800000 
    },
    { 
      id: '3', 
      user: 'charlie.xpr', 
      category: 'Education', 
      amount: 2500, 
      raised: 2500, 
      description: 'Textbooks for the upcoming semester. Truly grateful for the support.', 
      status: 'Completed',
      timestamp: Date.now() - 259200000 
    },
  ]);

  const addRequest = (newReq: Omit<AidRequest, 'id' | 'raised' | 'status' | 'timestamp'>) => {
    const request: AidRequest = {
      ...newReq,
      id: Math.random().toString(36).substr(2, 9),
      raised: 0,
      status: 'Open',
      timestamp: Date.now(),
    };
    setRequests(prev => [request, ...prev]);
  };

  const contribute = (id: string, amount: number) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        const newRaised = req.raised + amount;
        const newStatus = newRaised >= req.amount ? 'Funded' : 'Open';
        return { ...req, raised: newRaised, status: newStatus };
      }
      return req;
    }));
  };

  const markCompleted = (id: string) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'Completed' } : req
    ));
    showSuccess("Request marked as completed. Thank you for your honesty!");
  };

  return (
    <RequestsContext.Provider value={{ requests, addRequest, contribute, markCompleted }}>
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(RequestsContext);
  if (!context) throw new Error("useRequests must be used within RequestsProvider");
  return context;
};