"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RequestCard from '@/components/RequestCard';
import TransactionHistory from '@/components/TransactionHistory';
import AvatarPicker from '@/components/AvatarPicker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ArrowLeft, 
  Calendar, 
  MessageSquare, 
  Quote, 
  Wallet, 
  Loader2, 
  ShieldCheck, 
  User, 
  Sparkles,
  LayoutGrid,
  Coins,
  ExternalLink,
  History,
  Medal,
  Activity,
  AlertCircle,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { userAddress: routeAddress } = useParams();
  const { address: myAddress, isConnected, isConnecting, membershipExpiry: myExpiry, avatarUrl: myAvatarUrl, xprBalance, guyBalance, payMembership, connect, membershipFee } = useWallet();
  const { requests } = useRequests();

  const targetAddress = routeAddress || myAddress;
  const isOwnProfile = !routeAddress || routeAddress === myAddress;
  
  const [targetMembershipExpiry, setTargetMembershipExpiry] = useState<number | null>(null);
  const [targetAvatarUrl, setTargetAvatarUrl] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  useEffect(() => {
    const fetchTargetProfile = async () => {
      if (!targetAddress) return;
      
      if (isOwnProfile) {
        setTargetMembershipExpiry(myExpiry);
        setTargetAvatarUrl(myAvatarUrl);
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('membership_expiry, avatar_url')
          .eq('address', targetAddress.toLowerCase().trim())
          .maybeSingle();
        
        if (data) {
          setTargetMembershipExpiry(data.membership_expiry);
          setTargetAvatarUrl(data.avatar_url);
        } else {
          setTargetMembershipExpiry(0);
          setTargetAvatarUrl(null);
        }
      } catch (err) {
        console.error("Failed to fetch target profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchTargetProfile();
  }, [targetAddress, isOwnProfile, myExpiry, myAvatarUrl]);

  const isVerified = targetMembershipExpiry ? targetMembershipExpiry > Date.now() : false;
  const currentAvatarSeed = targetAvatarUrl || targetAddress;

  const stats = useMemo(() => {
    if (!targetAddress) return { given: 0, received: 0, count: 0 };
    
    let given = 0;
    let received = 0;
    let count = 0;

    requests.forEach(req => {
      if (req.requestor === targetAddress) {
        received += req.raised;
      }
      req.contributions.forEach(c => {
        if (c.user === targetAddress) {
          given += c.amount;
          count++;
        }
      });
    });

    return { given, received, count };
  }, [requests, targetAddress]);

  const profileRequests = requests.filter(req => req.requestor === targetAddress);
  const profileContributions = requests.filter(req => 
    req.contributions.some(c => {
      const actor = typeof c.user === 'string' ? c.user : '';
      return actor.toLowerCase() === targetAddress.toLowerCase();
    })
  );

  const receivedMessages = useMemo(() => {
    const messages: { user: string, message: string, timestamp: number, requestTitle: string }[] = [];
    profileRequests.forEach(req => {
      req.contributions.forEach(c => {
        if (c.message) {
          messages.push({
            user: c.user,
            message: c.message,
            timestamp: c.timestamp,
            requestTitle: req.title
          });
        }
      });
    });
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  }, [profileRequests]);

  if (!targetAddress && !isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1565C0]/5 blur-[120px] rounded-full pointer-events-none" />
        <main className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="max-w-md w-full glass-card rounded-[40px] p-10 text-center space-y-8 border-white/5 shadow-2xl">
            <div className="w-24 h-24 rounded-[32px] bg-[#1565C0]/10 flex items-center justify-center mx-auto border border-[#1565C0]/20 shadow-[0_0_30px_rgba(21,101,192,0.2)]">
              <Wallet className="text-[#1565C0]" size={48} />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight">Access Your Profile</h1>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                Connect your XPR Network wallet to view your activity, manage your membership, and see your community impact.
              </p>
            </div>
            <Button onClick={connect} disabled={isConnecting} className="w-full h-14 bg-[#1565C0] hover:bg-[#1565C0]/90 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(21,101,192,0.3)] btn-premium text-base gap-3 border-none uppercase tracking-wider">
              {isConnecting ? <Loader2 size={20} className="animate-spin" /> : <><Wallet size={20} /> Connect Wallet</>}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060912] text-foreground flex flex-col relative overflow-hidden">
      <Navbar />
      
      <div className="relative border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent py-12 md:py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#1565C0]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative group">
                  <div className={cn(
                    "absolute -inset-1.5 rounded-[36px] blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-700",
                    isVerified ? "bg-gradient-to-tr from-[#1565C0] to-emerald-400" : "bg-white/10"
                  )} />
                  <Avatar className="h-28 w-28 md:h-32 md:w-32 rounded-[32px] border-4 border-[#0A1428] shadow-2xl relative z-10 transition-all duration-500 group-hover:scale-105 group-hover:border-white/20 p-1.5 bg-[#0A1428]">
                    <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentAvatarSeed}`} />
                    <AvatarFallback className="bg-[#1565C0] text-white font-black text-3xl rounded-[28px]">
                      {targetAddress?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black p-2 rounded-2xl border-4 border-[#0A1428] shadow-xl z-20 shadow-emerald-500/20">
                      <ShieldCheck size={20} />
                    </div>
                  )}
                  {isOwnProfile && (
                    <Dialog open={isAvatarPickerOpen} onOpenChange={setIsAvatarPickerOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="icon" 
                          className="absolute top-0 right-0 w-10 h-10 rounded-2xl bg-primary text-black border-4 border-[#0A1428] shadow-xl z-20 hover:scale-110 transition-transform"
                        >
                          <Camera size={18} />
                        </Button>
                      </DialogTrigger>
                      <AvatarPicker onSuccess={() => setIsAvatarPickerOpen(false)} />
                    </Dialog>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase italic">
                        {targetAddress}
                      </h1>
                      {isOwnProfile && <Badge className="bg-[#1565C0]/20 text-[#1565C0] border-[#1565C0]/30 text-[10px] uppercase font-black px-3 h-6 tracking-widest">You</Badge>}
                    </div>
                    {isVerified ? (
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] flex items-center gap-2">
                        <Activity size={12} className="text-emerald-400" />
                        XPR Network User
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] flex items-center gap-2">
                        XPR Network Explorer
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[9px]">
                      Community Member
                    </Badge>
                    {isVerified && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[9px]">
                        Verified Supporter
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:max-w-xs w-full glass-card rounded-[32px] p-6 border-white/5 bg-white/[0.02] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#1565C0]/10 blur-[40px] rounded-full" />
                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Membership Status</p>
                    <div className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                      isVerified ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {isVerified ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-[#1565C0] transition-colors">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <p className="text-lg font-black leading-none">
                        {isVerified ? new Date(targetMembershipExpiry!).toLocaleDateString() : (isOwnProfile ? 'Join Today' : 'Not Verified')}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold mt-1">
                        {isVerified ? 'Membership Active' : (isOwnProfile ? 'Unlock platform features' : 'Requires verification')}
                      </p>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all gap-2.5">
                          <Sparkles size={14} className="text-primary" />
                          {isVerified ? 'Renew Membership' : 'Join AskGuy'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-white/10 shadow-2xl rounded-[32px] p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-3xl font-black tracking-tight mb-2">Yearly Membership</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground text-base leading-relaxed font-medium">
                            Become a verified member to post community requests. Membership costs <span className="text-white font-black underline decoration-primary underline-offset-4">{membershipFee.toLocaleString()} XPR</span> per year.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-8 space-y-4">
                          <div className="p-6 rounded-[24px] bg-primary/5 border border-primary/10 space-y-3 shadow-inner">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <span>Annual Fee</span>
                              <span>Duration</span>
                            </div>
                            <div className="flex justify-between items-center text-2xl font-black">
                              <span className="text-primary">{membershipFee.toLocaleString(undefined, { minimumFractionDigits: 2 })} XPR</span>
                              <span>365 Days</span>
                            </div>
                          </div>
                        </div>
                        <AlertDialogFooter className="gap-3">
                          <AlertDialogCancel className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase tracking-widest text-xs px-8">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={payMembership} className="bg-primary text-black font-black rounded-2xl h-14 px-10 gold-glow uppercase tracking-widest text-xs">
                            Confirm Payment
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <div className="lg:col-span-8 space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {isOwnProfile && (
                <Card className="glass-card border-[#1565C0]/20 bg-[#1565C0]/5 group rounded-[32px] transition-all duration-300 hover:translate-y-[-4px] will-change-transform transform-gpu">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#1565C0]/10 flex items-center justify-center border border-[#1565C0]/20 group-hover:scale-110 transition-transform">
                        <Coins className="text-[#1565C0]" size={24} />
                      </div>
                      <Link to="https://vibrr.ai/dex/token/20" target="_blank" className="text-muted-foreground hover:text-white transition-colors">
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-[#1565C0] uppercase font-black tracking-widest mb-1.5 truncate">Your GUY Assets</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-none tabular-nums break-words">
                        {guyBalance.toLocaleString()}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="glass-card border-emerald-500/10 bg-emerald-500/[0.02] group rounded-[32px] transition-all duration-300 hover:translate-y-[-4px] will-change-transform transform-gpu">
                <CardContent className="p-8 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Heart className="text-emerald-400" size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-1.5 truncate">Total Contributions</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-none tabular-nums break-words">
                      {stats.given.toLocaleString()} <span className="text-xs text-muted-foreground font-medium uppercase">XPR</span>
                    </h3>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-blue-500/10 bg-blue-500/[0.02] group rounded-[32px] transition-all duration-300 hover:translate-y-[-4px] will-change-transform transform-gpu">
                <CardContent className="p-8 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <History className="text-blue-400" size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest mb-1.5 truncate">Community Support Received</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-none tabular-nums break-words">
                      {stats.received.toLocaleString()} <span className="text-xs text-muted-foreground font-medium uppercase">XPR</span>
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="requests" className="w-full">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <TabsList className="bg-white/5 border border-white/10 p-1.5 h-12 rounded-2xl">
                  <TabsTrigger value="requests" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest h-full data-[state=active]:bg-[#1565C0] data-[state=active]:text-white">
                    Requests ({profileRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="contributions" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest h-full data-[state=active]:bg-[#1565C0] data-[state=active]:text-white">
                    Impact ({profileContributions.length})
                  </TabsTrigger>
                  {isOwnProfile && (
                    <TabsTrigger value="messages" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest h-full data-[state=active]:bg-[#1565C0] data-[state=active]:text-white flex gap-2">
                      <MessageSquare size={14} /> Messages
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Activity size={12} className="text-emerald-400" />
                  Active Profile
                </div>
              </div>

              <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {profileRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileRequests.map(req => <RequestCard key={req.id} {...req} />)}
                  </div>
                ) : (
                  <div className="py-24 text-center glass-card border-dashed border-white/10 rounded-[40px] flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
                      <LayoutGrid size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-black uppercase tracking-widest text-xs">No active requests</p>
                      <p className="text-[10px] text-muted-foreground font-medium">When life gets tough, the community is here to help.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contributions" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {profileContributions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileContributions.map(req => <RequestCard key={req.id} {...req} />)}
                  </div>
                ) : (
                  <div className="py-24 text-center glass-card border-dashed border-white/10 rounded-[40px] flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
                      <Heart size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-black uppercase tracking-widest text-xs">No impact history yet</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Start contributing to community requests to build your legacy.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {isOwnProfile && (
                <TabsContent value="messages" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {receivedMessages.length > 0 ? (
                    receivedMessages.map((m, i) => (
                      <Card key={i} className="glass-card border-[#1565C0]/10 bg-[#1565C0]/5 p-8 rounded-[32px] transition-all hover:border-[#1565C0]/30 group">
                        <div className="flex gap-8">
                          <div className="w-14 h-14 rounded-2xl bg-[#1565C0]/20 flex items-center justify-center shrink-0 border border-[#1565C0]/20 group-hover:scale-110 transition-transform">
                            <Quote className="text-[#1565C0]" size={24} />
                          </div>
                          <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <Link to={`/profile/${m.user}`} className="text-lg font-black text-[#1565C0] hover:underline flex items-center gap-2 group/link">
                                  <Avatar className="w-5 h-5 border border-white/20 p-0.5 bg-black/20">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.user}`} />
                                  </Avatar>
                                  @{m.user}
                                </Link>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">on: <span className="text-white">"{m.requestTitle}"</span></p>
                              </div>
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{new Date(m.timestamp).toLocaleDateString()}</p>
                            </div>
                            <p className="text-base italic text-white/90 leading-relaxed font-medium pl-6 border-l-2 border-[#1565C0]/30">"{m.message}"</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="py-24 text-center glass-card border-dashed border-white/10 rounded-[40px] flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
                        <MessageSquare size={32} />
                      </div>
                      <p className="text-white font-black uppercase tracking-widest text-xs">No community messages yet</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <TransactionHistory userAddress={targetAddress} />
            
            <Card className="glass-card border-white/5 bg-white/[0.01] rounded-[32px] overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Medal size={20} />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest">Hall of Fame Status</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Total Given</span>
                      <span className="text-primary">{stats.given.toLocaleString()} XPR</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${Math.min((stats.given / 1000) * 100, 100)}%` }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground/60 italic font-medium">Reach 1,000 XPR to earn the 'Generous Heart' badge.</p>
                  </div>

                  <Button variant="ghost" asChild className="w-full h-12 border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all gap-2">
                    <Link to="/leaderboard">
                      View Global Rankings
                      <ArrowLeft className="rotate-180" size={14} />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;