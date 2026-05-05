"use client";

import React, { useState, useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import RequestForm from '@/components/RequestForm';
import RequestCard from '@/components/RequestCard';
import Leaderboard from '@/components/Leaderboard';
import HowItWorks from '@/components/HowItWorks';
import CommunityStats from '@/components/CommunityStats';
import ActivityFeed from '@/components/ActivityFeed';
import SuccessStories from '@/components/SuccessStories';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, ShieldAlert, Info, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logo from '@/assets/logo.jpg';

const Index = () => {
  const { isConnected, guyBalance, isMember, payMembership, address, connect } = useWallet();
  const { requests } = useRequests();
  const [filter, setFilter] = useState<'recent' | 'trending' | 'my-requests'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    
    if (searchQuery) {
      result = result.filter(req => 
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filter === 'my-requests' && address) {
      result = result.filter(req => req.user === address);
    } else if (filter === 'trending') {
      result.sort((a, b) => (b.raised / b.amount) - (a.raised / a.amount));
    } else {
      result.sort((a, b) => b.timestamp - a.timestamp);
    }

    return result;
  }, [requests, filter, searchQuery, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-700">
          <div className="max-w-md space-y-6">
            <div className="w-32 h-32 rounded-3xl overflow-hidden mx-auto mb-6">
              <img 
                src={logo} 
                alt="GUY Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">AskGuy XPR Mutual Aid</h1>
            <p className="text-muted-foreground text-lg">
              A community-driven platform for XPR Network users to support each other through mutual aid.
            </p>
            <div className="p-4 glass-card rounded-xl text-sm text-left space-y-2">
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Hold 25,000 GUY tokens</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Yearly membership: 1500 XPR</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary" /> Transparent community funding</p>
            </div>
            <Button onClick={connect} size="lg" className="w-full cyan-glow gap-2">
              Connect Wallet to Start
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasGuyBalance = guyBalance >= 25000;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-in fade-in duration-500">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <CommunityStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
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
                    Pay 1500 XPR to @tripseven
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <RequestForm />
            )}
            
            <ActivityFeed />
            <Leaderboard />

            <Card className="glass-card border-white/5">
              <CardContent className="p-4 flex gap-3 items-start">
                <Info className="text-primary shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All contributions are sent directly to the requester's XPR address. AskGuy does not hold any funds.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Active Requests</h2>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input 
                    placeholder="Search requests..." 
                    className="pl-9 h-9 bg-white/5 border-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full sm:w-auto">
                  <TabsList className="bg-white/5 border border-white/10 h-9">
                    <TabsTrigger value="recent" className="text-xs h-7">Recent</TabsTrigger>
                    <TabsTrigger value="trending" className="text-xs h-7">Trending</TabsTrigger>
                    <TabsTrigger value="my-requests" className="text-xs h-7 flex gap-1">
                      <User size={12} /> Mine
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRequests.map((req) => (
                <RequestCard key={req.id} {...req} />
              ))}
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-20 glass-card rounded-2xl border-dashed border-white/10">
                <p className="text-muted-foreground">No requests found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        <SuccessStories />
        <HowItWorks />
      </main>
      <Footer />
      <MadeWithDyad />
    </div>
  );
};

export default Index;