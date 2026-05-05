"use client";

import React, { createContext, useContext, useState } from 'react';
import { showSuccess } from '@/utils/toast';

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
  addRequest: (request: Omit<AidRequest, 'id' | 'raised' | 'status' | 'timestamp' | 'contributions'>) => void;
  contribute: (id: string, user: string, amount: number, token: TokenSymbol, message?: string) => void;
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
      token: 'XPR',
      raised: 850, 
      description: 'Need help with unexpected dental surgery costs. The pain is becoming unbearable and I need to get this sorted before it gets worse. Any contribution helps!', 
      status: 'Open',
      timestamp: Date.now() - 86400000,
      isUrgent: true,
      proofUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
      contributions: [
        { id: 'c1', user: 'tripseven.xpr', amount: 500, token: 'XPR', message: 'Stay strong, Alice!', timestamp: Date.now() - 43200000 },
        { id: 'c2', user: 'guy_whale.xpr', amount: 350, token: 'XPR', message: 'Hope this helps.', timestamp: Date.now() - 21600000 }
      ]
    },
    { 
      id: '2', 
      user: 'bob.xpr', 
      category: 'Utilities', 
      amount: 450, 
      token: 'XPR',
      raised: 450, 
      description: 'Electricity bill is overdue due to job loss. Thank you community for the incredible support!', 
      status: 'Funded',
      timestamp: Date.now() - 172800000,
      proofUrl: 'https://images.unsplash.com/photo-1558489580-faa74691fdc5?auto=format&fit=crop&q=80&w=800',
      contributions: [
        { id: 'c3', user: 'helper.xpr', amount: 450, token: 'XPR', message: 'We got you, Bob.', timestamp: Date.now() - 150000000 }
      ]
    },
  ]);

  const addRequest = (newReq: Omit<AidRequest, 'id' | 'raised' | 'status' | 'timestamp' | 'contributions'>) => {
    const request: AidRequest = {
      ...newReq,
      id: Math.random().toString(36).substr(2, 9),
      raised: 0,
      status: 'Open',
      timestamp: Date.now(),
      contributions: [],
    };
    setRequests(prev => [request, ...prev]);
  };

  const contribute = (id: string, user: string, amount: number, token: TokenSymbol, message?: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        const newContribution: Contribution = {
          id: Math.random().toString(36).substr(2, 9),
          user,
          amount,
          token,
          message,
          timestamp: Date.now()
        };
        // Simple logic: if contributing in the same token as requested, count towards progress
        // If different token, we still track it but don't automatically calculate 'funded' status 
        // to avoid complex conversion logic in a demo.
        const newRaised = token === req.token ? req.raised + amount : req.raised;
        const newStatus = newRaised >= req.amount ? 'Funded' : req.status;
        
        return { 
          ...req, 
          raised: newRaised, 
          status: newStatus,
          contributions: [newContribution, ...req.contributions]
        };
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