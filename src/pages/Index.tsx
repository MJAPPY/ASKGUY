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
import { Heart, ArrowRight, Search, Loader2, LayoutGrid, List, Sparkles, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
// Correcting the extension from .png to .jpg to match the assets
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
      <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
        <Navbar />
        {/* Background glow effects */}
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-[#1565C0]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex-1 relative z-10 flex flex-col justify-center">
          <div className="container mx-auto px-4 pt-4 pb-12 lg:pt-8 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1565C0]/40 bg-[#1565C0]/5 text-[#1565C0] text-sm font-black uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-[#1565C0] animate-pulse" />
                  Built on XPR Network
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
                  Diamond Hands. <br />
                  <span className="text-[#1565C0] drop-shadow-[0_0_20px_rgba(21,101,192,0.4)]">Golden Hearts.</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed font-medium">
                  AskGuy is a mutual assistance platform where XPR Network members help each other with real-life expenses. Post a need, send tokens, lift each other up.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button onClick={connect} size="lg" className="h-14 px-6 md:px-8 text-base md:text-lg font-black bg-[#1565C0] hover:bg-[#1565C0]/90 text-white rounded-2xl flex gap-3 group transition-all shadow-[0_0_40px_rgba(21,101,192,0.3)] btn-premium uppercase tracking-wider border-none shrink-0">
                    <Heart size={20} className="fill-white" />
                    Connect & Join
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base md:text-lg font-black border-primary/20 bg-primary/5 text-primary rounded-2xl flex gap-3 hover:bg-primary/10 transition-all gold-glow uppercase tracking-wider">
                    <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                      Buy GUY Tokens
                    </a>
                  </Button>
                </div>
              </div>
              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 lg:-translate-y-6 lg:-translate-x-12">
                <div className="relative z-10 w-full max-w-[480px] mx-auto lg:mr-auto lg:ml-0 group">
                   <div className="absolute -inset-10 bg-[#1565C0]/10 rounded-full blur-[100px] opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                   <img 
                    src={heroGuy} 
                    alt="AskGuy Hero" 
                    className="w-full h-auto drop-shadow-[0_0_60px_rgba(21,101,192,0.2)] transition-transform duration-700 group-hover:scale-105" 
                   />
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
            <div className="space-y-6">
              <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-20 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-[24px] shadow-[0_10px_40px_rgba(16,185,129,0.25)] flex items-center justify-start px-6 gap-5 group transition-all duration-500 border border-emerald-400/20 active:scale-[0.98] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/10 skew-x-[-20deg] translate-x-16 group-hover:translate-x-[-100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                    
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center transition-all group-hover:rotate-12 duration-500 shadow-inner shrink-0">
                      <Plus size={24} className="text-white" strokeWidth={3} />
                    </div>
                    
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-lg uppercase tracking-tight leading-none font-black mb-1.5">Post New Request</p>
                      <p className="text-[10px] text-emerald-50/70 uppercase font-black tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">Request Community Support</p>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                      <ArrowRight size={18} className="text-white" />
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10 max-w-xl p-8 rounded-[32px] shadow-2xl">
                  <RequestForm onSuccess={() => setIsRequestModalOpen(false)} />
                </DialogContent>
              </Dialog>

              <ActivityFeed />
              
              <Card className="glass-card bg-primary/5 border-primary/20 p-6 rounded-[24px] space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles size={18} />
                  <h3 className="font-black text-sm uppercase tracking-widest">Member Tip</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Requests with clear descriptions and photo proof are funded <span className="text-white font-bold">3x faster</span> by the community. Be transparent and honest!
                </p>
              </Card>
            </div>
          </div>
          
          <div className="lg:col-span-8 space-y-6">
            <div id="browse-requests" className="flex flex-col space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tight">Browse Requests</h2>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Supporting the community</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                    <Input 
                      placeholder="Search needs..." 
                      className="pl-10 h-11 bg-white/5 border-white/10 rounded-2xl focus:border-primary/50 transition-all font-medium" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                  </div>
                  
                  <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
                      <ToggleGroupItem value="grid" className="h-8 px-3 rounded-xl data-[state=on]:bg-primary data-[state=on]:text-black transition-all">
                        <LayoutGrid size={16} />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" className="h-8 px-3 rounded-xl data-[state=on]:bg-primary data-[state=on]:text-black transition-all">
                        <List size={16} />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                    <ToggleGroup type="single" value={sortBy} onValueChange={(v) => v && setSortBy(v as SortType)}>
                      <ToggleGroupItem value="oldest" className="h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl data-[state=on]:bg-primary data-[state=on]:text-black transition-all">
                        Oldest
                      </ToggleGroupItem>
                      <ToggleGroupItem value="newest" className="h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl data-[state=on]:bg-primary data-[state=on]:text-black transition-all">
                        Newest
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </div>

              <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full">
                <TabsList className="bg-white/5 border border-white/10 h-12 p-1.5 w-full justify-start overflow-x-auto no-scrollbar rounded-2xl">
                  <TabsTrigger value="active" className="text-[10px] font-black uppercase tracking-widest rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-black transition-all">Active</TabsTrigger>
                  <TabsTrigger value="all" className="text-[10px] font-black uppercase tracking-widest rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-black transition-all">All</TabsTrigger>
                  <TabsTrigger value="funded" className="text-[10px] font-black uppercase tracking-widest rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-black transition-all">Archive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className={cn(
              "animate-in fade-in duration-500",
              viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4"
            )}>
              {requestsLoading ? (
                <div className="col-span-full text-center py-24">
                  <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Blockchain Data...</p>
                </div>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((req) => <RequestCard key={req.id} {...req} variant={viewMode} />)
              ) : (
                <div className="col-span-full py-24 text-center glass-card border-dashed border-white/10 rounded-[32px]">
                  <Heart className="mx-auto text-muted-foreground/20 mb-4" size={48} />
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No needs found matching your filters.</p>
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