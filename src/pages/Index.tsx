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
import LiveTicker from '@/components/LiveTicker';
import AccessDenied from '@/components/AccessDenied';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ShieldAlert, Search, User, ExternalLink, Heart, ArrowRight, ShieldCheck, Calendar, LayoutGrid, Zap, CheckCircle2, ArrowUpDown, List, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import heroGuy from '@/assets/hero-guy.jpg';

type FilterType = 'all' | 'active' | 'funded' | 'my-requests';
type SortType = 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

const Index = () => {
  const { isConnected, guyBalance, isMember, membershipExpiry, payMembership, address, connect, isFetchingBalances } = useWallet();
  const { requests } = useRequests();
  const [filter, setFilter] = useState<FilterType>('active');
  const [sortBy, setSortBy] = useState<SortType>('oldest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    
    if (searchQuery) {
      result = result.filter(req => 
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filter === 'my-requests' && address) {
      result = result.filter(req => req.user === address);
    } else if (filter === 'active') {
      result = result.filter(req => req.status === 'Open');
    } else if (filter === 'funded') {
      result = result.filter(req => req.status === 'Funded' || req.status === 'Completed');
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      return a.timestamp - b.timestamp;
    });

    return result;
  }, [requests, filter, searchQuery, address, sortBy]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none animate-pulse duration-[10s]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <Navbar />
        <div className="flex-1 relative z-10 flex flex-col justify-center">
          <div className="container mx-auto px-4 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/5 text-emerald-400 text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Built on XPR Network
                </div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
                  Real Help, <br />
                  <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Real People</span>
                </h1>

                <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl leading-relaxed font-medium">
                  AskGuy is a mutual assistance platform where XPR Network members help each other with real-life expenses. Post a need, send tokens, lift each other up.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={connect} 
                    size="lg" 
                    className="h-14 px-8 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex gap-2 group transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] btn-premium"
                  >
                    <Heart size={20} className="fill-white" />
                    Connect & Join
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button 
                    size="lg" 
                    asChild 
                    className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-black rounded-xl flex gap-2 gold-glow shimmer-effect"
                  >
                    <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                      Buy GUY Tokens
                      <ExternalLink size={20} className="text-black" />
                    </a>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground font-medium opacity-60">
                  Requires 7,770 GUY tokens · Powered by Proton WebAuth
                </p>
              </div>

              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full scale-110 pointer-events-none animate-pulse" />
                <div className="relative max-w-[500px] mx-auto">
                  <div className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.1)] glass-card aspect-square group">
                    <img 
                      src={heroGuy} 
                      alt="AskGuy" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{
                        objectPosition: 'center 15%',
                        maskImage: 'radial-gradient(circle at 50% 30%, black 75%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 75%, transparent 100%)'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none opacity-60" />
                  </div>
                  
                  <div className="absolute -bottom-4 -left-4 bg-background/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl hidden md:block z-20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <ShieldCheck className="text-emerald-400" size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Community has Given</p>
                        <p className="text-sm font-bold">142,500 XPR Distributed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

  const hasGuyBalance = guyBalance >= 7770;

  if (!isFetchingBalances && !hasGuyBalance) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-in fade-in duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0 opacity-[0.02] lg:opacity-[0.04]">
         <img src={heroGuy} alt="Hero Guy Background" className="w-full h-full object-cover rounded-full blur-xl" />
      </div>

      <Navbar />
      <LiveTicker />
      
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <CommunityStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {isFetchingBalances ? (
              <Card className="glass-card flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Verifying Balance...</p>
                </div>
              </Card>
            ) : !isMember ? (
              <Card className="border-primary/50 bg-primary/5 overflow-hidden relative glass-card">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Lock size={48} className="text-primary" />
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <ShieldAlert className="text-primary shrink-0" />
                    <div className="space-y-2">
                      <p className="font-bold text-primary text-lg">Unlock Posting Rights</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        To post a request and receive help, a yearly membership fee of <span className="text-primary font-bold">1 XPR</span> is required. This supports platform hosting and moderation.
                      </p>
                    </div>
                  </div>
                  <Button onClick={payMembership} className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-12 shadow-primary/20 text-base btn-premium gold-glow">
                    Pay 1 XPR to Post
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground italic">
                    You can still browse and contribute to others without a membership.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="glass-card border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="text-emerald-400" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Active Member</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar size={10} />
                          Expires: {new Date(membershipExpiry!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={payMembership} className="text-[10px] h-8 font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10 btn-premium">
                      Renew
                    </Button>
                  </CardContent>
                </Card>
                <RequestForm />
              </div>
            )}
            
            <ActivityFeed />
            <Leaderboard />
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div id="browse-requests" className="flex flex-col md:flex-row md:items-center justify-between gap-4 scroll-mt-24">
              <h2 className="text-2xl font-bold">Browse Requests</h2>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input 
                    placeholder="Search..." 
                    className="pl-9 h-9 bg-white/5 border-white/10 focus:ring-emerald-500/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                  <Button 
                    variant="ghost" size="icon" 
                    className={`h-7 w-7 ${viewMode === 'grid' ? 'bg-white/10 text-primary' : 'text-muted-foreground'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid size={14} />
                  </Button>
                  <Button 
                    variant="ghost" size="icon" 
                    className={`h-7 w-7 ${viewMode === 'list' ? 'bg-white/10 text-primary' : 'text-muted-foreground'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List size={14} />
                  </Button>
                </div>

                <Select value={sortBy} onValueChange={(v: SortType) => setSortBy(v)}>
                  <SelectTrigger className="w-full sm:w-32 h-9 bg-white/5 border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown size={12} />
                      <SelectValue placeholder="Sort" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>

                <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full sm:w-auto">
                  <TabsList className="bg-white/5 border border-white/10 h-9">
                    <TabsTrigger value="all" className="text-xs h-7 flex gap-1"><LayoutGrid size={12} /> All</TabsTrigger>
                    <TabsTrigger value="active" className="text-xs h-7 flex gap-1"><Zap size={12} /> Active</TabsTrigger>
                    <TabsTrigger value="funded" className="text-xs h-7 flex gap-1"><CheckCircle2 size={12} /> Funded</TabsTrigger>
                    <TabsTrigger value="my-requests" className="text-xs h-7 flex gap-1"><User size={12} /> Mine</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
              {filteredRequests.map((req) => (
                <RequestCard key={req.id} {...req} variant={viewMode} />
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