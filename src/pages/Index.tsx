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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Heart, ArrowRight, Search, Loader2, LayoutGrid, List, Sparkles, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import heroGuy from '@/assets/hero-guy.png';

type FilterType = 'all' | 'active' | 'funded' | 'my-requests';
type SortType = 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

const Index = () => {
  const { isConnected, address, connect, isBanned } = useWallet();
  const { requests, loading: requestsLoading } = useRequests();
  const [filter, setFilter] = useState<FilterType>('active');
  const [sortBy, setSortBy] = useState<SortType>('oldest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (searchQuery) {
      result = result.filter(req => 
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filter === 'my-requests' && address) {
      result = result.filter(req => req.requestor === address);
    } else if (filter === 'active') {
      result = result.filter(req => req.status === 'Open');
    } else if (filter === 'funded') {
      result = result.filter(req => req.status === 'Funded' || req.status === 'Completed');
    }
    result.sort((a, b) => sortBy === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return result;
  }, [requests, filter, searchQuery, address, sortBy]);

  if (isBanned) return <BannedOverlay />;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-brand-offWhite flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-gold/40 bg-brand-gold/5 text-brand-gold text-sm font-black uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full success-green-bg" />
                  XPR Network Mutual Aid
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-white">
                  Mutual Aid <br />
                  <span className="text-brand-goldBright drop-shadow-xl">Simplified.</span>
                </h1>
                <p className="text-brand-offWhite/80 text-xl max-w-xl leading-relaxed font-medium">
                  Support the community through transparent, feeless XPR gifting. Real help, directly to those who need it most.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={connect} size="lg" className="h-16 px-10 text-lg btn-gold-high rounded-2xl flex gap-3 group">
                    <Heart size={20} className="fill-brand-dark" />
                    CONNECT WALLET
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-16 px-10 text-lg font-black border-brand-blue/30 bg-brand-blue/5 text-brand-blue rounded-2xl">
                    <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">BUY $GUY</a>
                  </Button>
                </div>
              </div>
              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="relative z-10 w-full max-w-[500px] mx-auto group">
                   <div className="absolute -inset-10 bg-brand-gold/10 rounded-full blur-[100px]" />
                   <img src={heroGuy} alt="Hero" className="w-full h-auto drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
            </div>
            <HowItWorks />
            <SuccessStories />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-brand-offWhite flex flex-col">
      <Navbar />
      <LiveTicker />
      <main className="flex-1 container mx-auto px-4 py-12">
        <CommunityStats />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-24 btn-gold-high rounded-[24px] gold-glow flex flex-col gap-1 group">
                  <div className="flex items-center gap-2">
                    <PlusCircle size={28} className="transition-transform group-hover:rotate-90 duration-500" />
                    <span className="text-xl uppercase tracking-widest">POST REQUEST</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/10 max-w-xl p-8 rounded-[32px]">
                <RequestForm onSuccess={() => setIsRequestModalOpen(false)} />
              </DialogContent>
            </Dialog>
            <ActivityFeed />
          </div>
          
          <div className="lg:col-span-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-4xl font-black tracking-tight text-white">Community Needs</h2>
                <p className="text-[11px] text-brand-gold font-black uppercase tracking-widest">Support your fellow members</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-offWhite/40" size={16} />
                  <Input 
                    placeholder="Search..." 
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-2xl text-brand-offWhite w-full md:w-64" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                </div>
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} className="bg-white/5 border border-white/10 p-1 rounded-2xl">
                  <ToggleGroupItem value="grid" className="h-10 px-4 rounded-xl data-[state=on]:bg-brand-gold data-[state=on]:text-brand-dark"><LayoutGrid size={18} /></ToggleGroupItem>
                  <ToggleGroupItem value="list" className="h-10 px-4 rounded-xl data-[state=on]:bg-brand-gold data-[state=on]:text-brand-dark"><List size={18} /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className={cn("grid gap-6", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
              {requestsLoading ? (
                <div className="col-span-full text-center py-24"><Loader2 className="animate-spin mx-auto text-brand-gold" size={32} /></div>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => <RequestCard key={req.id} {...req} variant={viewMode} />)
              ) : (
                <div className="col-span-full py-24 text-center glass-card rounded-[32px]">
                  <p className="text-brand-offWhite/40 font-black uppercase tracking-widest">No active requests found.</p>
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