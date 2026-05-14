"use client";

import React, { useState, useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import RequestForm from '@/components/RequestForm';
import RequestCard from '@/components/RequestCard';
import HowItWorks from '@/components/HowItWorks';
import CommunityStats from '@/components/CommunityStats';
import ActivityFeed from '@/components/ActivityFeed';
import SuccessStories from '@/components/SuccessStories';
import CTASection from '@/components/CTASection';
import LiveTicker from '@/components/LiveTicker';
import BannedOverlay from '@/components/BannedOverlay';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ArrowRight, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import heroGuy from '@/assets/hero-guy.jpg';

type FilterType = 'all' | 'active' | 'funded' | 'my-requests';
type SortType = 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

const Index = () => {
  const { isConnected, address, connect, isFetchingBalances, isConnecting, isBanned } = useWallet();
  const { requests, loading: requestsLoading } = useRequests();
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
        req.requestor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filter === 'my-requests' && address) {
      result = result.filter(req => req.requestor === address);
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

  if (isBanned) return <BannedOverlay />;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
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
                  <Button onClick={connect} size="lg" className="h-14 px-8 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex gap-2 group transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] btn-premium">
                    <Heart size={20} className="fill-white" />
                    Connect & Join
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="relative max-w-[500px] mx-auto">
                  <div className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.1)] glass-card aspect-square">
                    <img src={heroGuy} alt="AskGuy" className="w-full h-full object-cover" />
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <Navbar />
      <LiveTicker />
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <CommunityStats />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {isConnecting || isFetchingBalances ? (
              <Card className="glass-card flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </Card>
            ) : (
              <div className="space-y-6">
                <RequestForm />
                <ActivityFeed />
              </div>
            )}
          </div>
          <div className="lg:col-span-8 space-y-6">
            <div id="browse-requests" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Browse Requests</h2>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input placeholder="Search..." className="pl-9 h-9 bg-white/5 border-white/10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
                  <TabsList className="bg-white/5 border border-white/10 h-9">
                    <TabsTrigger value="all" className="text-xs h-7">All</TabsTrigger>
                    <TabsTrigger value="active" className="text-xs h-7">Active</TabsTrigger>
                    <TabsTrigger value="funded" className="text-xs h-7">Funded</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
              {requestsLoading ? (
                <div className="col-span-full text-center py-20">
                  <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                </div>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => <RequestCard key={req.id} {...req} variant={viewMode} />)
              ) : (
                <div className="col-span-full py-20 text-center glass-card border-dashed border-white/10">
                  <p className="text-muted-foreground">No requests found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <MadeWithDyad />
    </div>
  );
};

export default Index;