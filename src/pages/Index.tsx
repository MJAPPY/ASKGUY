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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Heart, ArrowRight, Search, Loader2, LayoutGrid, List, Sparkles, PlusCircle, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
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
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

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
      <div className="min-h-screen bg-black text-foreground flex flex-col relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[5000px] h-[500px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        
        <Navbar />
        <div className="flex-1 relative z-10 flex flex-col justify-center">
          <div className="container mx-auto px-4 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,255,157,0.1)]">
                  <Zap size={14} className="fill-accent" />
                  XPR Network Ecosystem
                </div>
                
                <div className="space-y-6">
                  <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] hero-text-glow">
                    PEER TO PEER<br />
                    <span className="text-accent">DIRECT AID</span>
                  </h1>
                  <p className="text-muted-foreground text-xl md:text-2xl max-w-xl leading-relaxed font-bold italic border-l-4 border-accent/20 pl-8">
                    Skip the middleman. Empower the community. Help each other with real-life expenses, on-chain, instantly.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <Button onClick={connect} className="green-glow btn-premium text-base shadow-[0_0_30px_rgba(0,255,157,0.2)]">
                    <Heart size={20} className="fill-black" />
                    CONNECT WALLET
                    <ArrowRight size={20} className="ml-auto" />
                  </Button>
                  <Button asChild variant="outline" className="gold-glow btn-premium text-base shadow-[0_0_30px_rgba(255,204,0,0.1)]">
                    <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                      BUY GUY TOKENS
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="relative group animate-float">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-accent/40 via-primary/40 to-accent/40 rounded-[48px] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
                  <div className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl glass-card aspect-square">
                    <img src={heroGuy} alt="AskGuy" className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-10 -right-10 glass-card p-6 rounded-3xl border-accent/30 shadow-[0_0_30px_rgba(0,255,157,0.2)] animate-pulse">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Live Help</p>
                    <p className="text-2xl font-black">142K+ XPR</p>
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
    <div className="min-h-screen bg-black text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />
      
      <Navbar />
      <LiveTicker />
      
      <main className="flex-1 container mx-auto px-4 py-12 relative z-10">
        <div className="mb-16">
          <CommunityStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-8">
              <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-24 green-glow btn-premium text-lg group shadow-[0_0_40px_rgba(0,255,157,0.15)] rounded-[32px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-3">
                        <PlusCircle size={28} className="transition-transform group-hover:rotate-90 duration-500" />
                        <span className="tracking-[0.15em]">POST REQUEST</span>
                      </div>
                      <span className="text-[9px] font-black text-black/60 tracking-widest opacity-70">NEED THE COMMUNITY? ASK HERE.</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10 max-w-xl p-10 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                  <RequestForm onSuccess={() => setIsRequestModalOpen(false)} />
                </DialogContent>
              </Dialog>

              <div className="neon-border rounded-[32px]">
                <ActivityFeed />
              </div>
              
              <Card className="glass-card bg-accent/5 border-accent/20 p-8 rounded-[32px] space-y-4">
                <div className="flex items-center gap-3 text-accent">
                  <Sparkles size={20} />
                  <h3 className="font-black text-xs uppercase tracking-[0.2em]">POWER USER TIP</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-bold italic">
                  Transparency is currency. Members who upload photo proof receive support <span className="text-accent">3x faster</span> than those who don't.
                </p>
              </Card>
            </div>
          </div>
          
          <div className="lg:col-span-8 space-y-10">
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                  <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">The Feed</h2>
                  <p className="text-[11px] text-accent font-black uppercase tracking-[0.3em] opacity-80">Supporting the community on-chain</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                    <Input 
                      placeholder="SEARCH NEEDS..." 
                      className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:border-accent/50 transition-all font-black uppercase text-xs tracking-widest" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </div>
                  
                  <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
                      <ToggleGroupItem value="grid" className="h-9 px-4 rounded-xl data-[state=on]:bg-accent data-[state=on]:text-black transition-all">
                        <LayoutGrid size={18} />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" className="h-9 px-4 rounded-xl data-[state=on]:bg-accent data-[state=on]:text-black transition-all">
                        <List size={18} />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </div>

              <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full">
                <TabsList className="bg-white/5 border border-white/10 h-14 p-1.5 w-full justify-start rounded-[20px]">
                  <TabsTrigger value="active" className="text-[11px] font-black uppercase tracking-[0.2em] rounded-xl px-10 h-full data-[state=active]:bg-accent data-[state=active]:text-black transition-all">ACTIVE</TabsTrigger>
                  <TabsTrigger value="all" className="text-[11px] font-black uppercase tracking-[0.2em] rounded-xl px-10 h-full data-[state=active]:bg-accent data-[state=active]:text-black transition-all">ALL</TabsTrigger>
                  <TabsTrigger value="funded" className="text-[11px] font-black uppercase tracking-[0.2em] rounded-xl px-10 h-full data-[state=active]:bg-accent data-[state=active]:text-black transition-all">ARCHIVE</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className={cn(
              "animate-in fade-in duration-700",
              viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "flex flex-col gap-6"
            )}>
              {requestsLoading ? (
                <div className="col-span-full text-center py-32 space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-accent/20 rounded-full" />
                    <Loader2 className="animate-spin text-accent relative z-10" size={80} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent animate-pulse">Syncing Blockchain Data...</p>
                </div>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => <RequestCard key={req.id} {...req} variant={viewMode} />)
              ) : (
                <div className="col-span-full py-32 text-center glass-card border-dashed border-white/10 rounded-[40px] space-y-6">
                  <Heart className="mx-auto text-white/5" size={80} />
                  <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs">No needs found matching your filters.</p>
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