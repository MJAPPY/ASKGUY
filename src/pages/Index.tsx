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
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ShieldAlert, Info, Search, User, ExternalLink, Heart, ArrowRight, ShieldCheck, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { isConnected, guyBalance, isMember, membershipExpiry, payMembership, address, connect } = useWallet();
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
        <div className="flex-1 space-y-0">
          <div className="flex flex-col items-center justify-center py-32 p-4 text-center animate-in fade-in duration-700">
            <div className="max-w-4xl space-y-10 px-4">
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/5 text-primary text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Built on XPR Network
                </div>
              </div>

              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
                Real Help, <span className="text-primary">Real People</span>
              </h1>

              <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium opacity-90">
                AskGuy is a mutual assistance platform where XPR Network members help each other with real-life expenses. Post a need, send XPR, lift each other up.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  onClick={connect} 
                  size="lg" 
                  className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-black rounded-xl flex gap-2 group transition-all gold-glow"
                >
                  <Heart size={20} className="fill-black" />
                  Connect & Join
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild 
                  className="h-14 px-8 text-lg font-bold border-white/10 hover:bg-white/5 rounded-xl flex gap-2"
                >
                  <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                    Buy GUY Tokens
                    <ExternalLink size={20} className="text-muted-foreground" />
                  </a>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground font-medium opacity-60">
                Requires 25,000 GUY tokens · Powered by Proton WebAuth
              </p>
            </div>
          </div>
          
          <div className="container mx-auto px-4">
            <HowItWorks />
            <SuccessStories />
            <CTASection />
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
          <div className="lg:col-span-4 space-y-6">
            {!hasGuyBalance ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <AlertCircle className="text-destructive shrink-0" />
                    <div className="space-y-1">
                      <p className="font-bold text-destructive">Insufficient GUY Balance</p>
                      <p className="text-sm text-muted-foreground">You need at least 25,000 GUY tokens to participate. Current: {guyBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  <Button variant="secondary" asChild className="w-full gap-2 border-white/10">
                    <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                      Buy $GUY on Vibrr <ExternalLink size={14} />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : !isMember ? (
              <Card className="border-primary/50 bg-primary/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck size={48} className="text-primary" />
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <ShieldAlert className="text-primary shrink-0" />
                    <div className="space-y-2">
                      <p className="font-bold text-primary text-lg">Yearly Membership Required</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        To keep AskGuy running smoothly (hosting, development, moderation & updates), we charge a yearly admin fee of 2,500 XPR.
                      </p>
                    </div>
                  </div>
                  <Button onClick={payMembership} className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-12 gold-glow text-base">
                    Pay 2,500 XPR & Join
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="glass-card border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Active Member</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar size={10} />
                          Expires: {new Date(membershipExpiry!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={payMembership} className="text-[10px] h-8 font-bold uppercase tracking-wider text-primary hover:bg-primary/10">
                      Renew
                    </Button>
                  </CardContent>
                </Card>
                <RequestForm />
              </div>
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

        <HowItWorks />
      </main>
      <Footer />
      <MadeWithDyad />
    </div>
  );
};

export default Index;