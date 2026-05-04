"use client";

import React from 'react';
import { WalletProvider, useWallet } from '@/hooks/use-wallet';
import Navbar from '@/components/Navbar';
import RequestForm from '@/components/RequestForm';
import RequestCard from '@/components/RequestCard';
import Leaderboard from '@/components/Leaderboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { isConnected, guyBalance, isMember, payMembership } = useWallet();

  const mockRequests = [
    { id: '1', user: 'alice.xpr', category: 'Medical', amount: 1200, raised: 850, description: 'Need help with unexpected dental surgery costs. Any contribution helps!', status: 'Open' as const },
    { id: '2', user: 'bob.xpr', category: 'Utilities', amount: 450, raised: 450, description: 'Electricity bill is overdue due to job loss. Thank you community!', status: 'Funded' as const },
    { id: '3', user: 'charlie.xpr', category: 'Education', amount: 2500, raised: 2500, description: 'Textbooks for the upcoming semester. Truly grateful for the support.', status: 'Completed' as const },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-6"
        >
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">AskGuy XPR Mutual Aid</h1>
          <p className="text-muted-foreground text-lg">
            A community-driven platform for XPR Network users to support each other through mutual aid.
          </p>
          <div className="p-4 glass-card rounded-xl text-sm text-left space-y-2">
            <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Hold 25,000 GUY tokens</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Yearly membership: 250 XPR</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Transparent community funding</p>
          </div>
          <p className="text-sm text-muted-foreground italic">Connect your WebAuth wallet to get started.</p>
        </motion.div>
      </div>
    );
  }

  const hasGuyBalance = guyBalance >= 25000;

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Status & Form */}
          <div className="lg:col-span-4 space-y-6">
            {!hasGuyBalance ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-6 flex gap-4">
                  <AlertCircle className="text-destructive shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold text-destructive">Insufficient GUY Balance</p>
                    <p className="text-sm text-muted-foreground">You need at least 25,000 GUY tokens to participate. Current: {guyBalance.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ) : !isMember ? (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <ShieldAlert className="text-primary shrink-0" />
                    <div className="space-y-1">
                      <p className="font-bold text-primary">Membership Required</p>
                      <p className="text-sm text-muted-foreground">Activate your yearly membership to post and contribute to requests.</p>
                    </div>
                  </div>
                  <Button onClick={payMembership} className="w-full cyan-glow">
                    Pay 250 XPR to @tripseven
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <RequestForm />
            )}
            
            <Leaderboard />
          </div>

          {/* Right Column: Feed */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Active Requests</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Recent</Button>
                <Button variant="ghost" size="sm">Trending</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockRequests.map((req) => (
                <RequestCard key={req.id} {...req} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

const Index = () => {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Dashboard />
      </div>
    </WalletProvider>
  );
};

export default Index;