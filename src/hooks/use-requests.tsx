"use client";

import React, { createContext, useContext, useState } from 'react';
import { showSuccess } from '@/utils/toast';

export type RequestStatus = 'Open' | 'Funded' | 'Completed';

export interface Contribution {
  id: string;
  user: string;
  amount: number;
  message?: string;
  timestamp: number;
}

export interface AidRequest {
  id: string;
  user: string;
  category: string;
  amount: number;
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
  contribute: (id: string, user: string, amount: number, message?: string) => void;
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
      description: 'Need help with unexpected dental surgery costs. The pain is becoming unbearable and I need to get this sorted before it gets worse. Any contribution helps!', 
      status: 'Open',
      timestamp: Date.now() - 86400000,
      isUrgent: true,
      proofUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
      contributions: [
        { id: 'c1', user: 'tripseven.xpr', amount: 500, message: 'Stay strong, Alice!', timestamp: Date.now() - 43200000 },
        { id: 'c2', user: 'guy_whale.xpr', amount: 350, message: 'Hope this helps.', timestamp: Date.now() - 21600000 }
      ]
    },
    { 
      id: '2', 
      user: 'bob.xpr', 
      category: 'Utilities', 
      amount: 450, 
      raised: 450, 
      description: 'Electricity bill is overdue due to job loss. Thank you community for the incredible support!', 
      status: 'Funded',
      timestamp: Date.now() - 172800000,
      proofUrl: 'https://images.unsplash.com/photo-1558489580-faa74691fdc5?auto=format&fit=crop&q=80&w=800',
      contributions: [
        { id: 'c3', user: 'helper.xpr', amount: 450, message: 'We got you, Bob.', timestamp: Date.now() - 150000000 }
      ]
    },
    { 
      id: '3', 
      user: 'charlie.xpr', 
      category: 'Education', 
      amount: 2500, 
      raised: 2500, 
      description: 'Textbooks for the upcoming semester. Truly grateful for the support from the GUY community.', 
      status: 'Completed',
      timestamp: Date.now() - 259200000,
      contributions: [
        { id: 'c4', user: 'tripseven.xpr', amount: 2500, message: 'Education is key!', timestamp: Date.now() - 250000000 }
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

  const contribute = (id: string, user: string, amount: number, message?: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        const newContribution: Contribution = {
          id: Math.random().toString(36).substr(2, 9),
          user,
          amount,
          message,
          timestamp: Date.now()
        };
        const newRaised = req.raised + amount;
        const newStatus = newRaised >= req.amount ? 'Funded' : 'Open';
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