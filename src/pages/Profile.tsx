"use client";

import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RequestCard from '@/components/RequestCard';
import TransactionHistory from '@/components/TransactionHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ArrowLeft, Calendar, MessageSquare, Quote, Wallet, Loader2, ShieldCheck, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Profile = () => {
  const { userAddress: routeAddress } = useParams();
  const { address: myAddress, isConnected, isConnecting, membershipExpiry: myExpiry, payMembership, connect } = useWallet();
  const { requests } = useRequests();

  const targetAddress = routeAddress || myAddress;
  const isOwnProfile = !routeAddress || routeAddress === myAddress;

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
    req.contributions.some(c => c.user === targetAddress)
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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-[40px] p-10 text-center space-y-8 border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="w-20 h-20 rounded-[28px] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_30px_rgba(244,201,93,0.2)]">
              <Wallet className="text-primary" size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">Connect Your Wallet</h1>
              <p className="text-muted-foreground text-base leading-relaxed font-medium">
                Connect your wallet to see your impact or search for other community members.
              </p>
            </div>
            <Button onClick={connect} disabled={isConnecting} className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-2xl gold-glow btn-premium text-base gap-3">
              {isConnecting ? <Loader2 size={20} className="animate-spin" /> : <><Wallet size={20} /> Connect WebAuth</>}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="relative border-b border-white/5 bg-white/[0.02] py-16 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <Button variant="ghost" asChild className="mb-12 -ml-2 text-muted-foreground hover:text-primary transition-all hover:translate-x-[-4px]">
            <Link to="/" className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row gap-10 items-start md:items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-primary/40 to-emerald-400/40 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <Avatar className="h-28 w-28 border-4 border-white/20 shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105 group-hover:border-primary/50 p-1.5 bg-black/20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${targetAddress}`} />
                  <AvatarFallback className="bg-primary text-black font-black text-2xl">
                    {targetAddress?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-primary text-black p-2 rounded-2xl border-4 border-[#0A1428] shadow-xl z-20 shadow-primary/20">
                  <ShieldCheck size={20} />
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-5xl font-black tracking-tight flex items-center gap-4 text-white">
                  {targetAddress}
                  {isOwnProfile && <Badge className="bg-white/10 text-white border-white/10 text-[10px] uppercase font-black px-3 h-6">You</Badge>}
                </h1>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">
                    Verified Holder
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    Community Member
                  </Badge>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="p-8 glass-card rounded-[32px] border-primary/20 flex items-center gap-10 bg-primary/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Calendar size={100} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Membership Status</p>
                  <p className="text-xl font-black flex items-center gap-2.5">
                    <Calendar size={22} className="text-primary" />
                    {myExpiry > 0 ? (
                      <span>Expires {new Date(myExpiry).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-muted-foreground">Inactive</span>
                    )}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary" className="h-12 px-8 font-black border-white/10 bg-white/10 hover:bg-white/20 transition-all uppercase tracking-widest text-[11px] gap-2.5 rounded-2xl shadow-lg relative z-10 hover:scale-105 active:scale-95">
                      <Sparkles size={16} className="text-primary" />
                      {myExpiry > 0 ? 'Renew' : 'Join'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-white/10 shadow-2xl rounded-[32px] p-8">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-3xl font-black tracking-tight mb-2">Yearly Membership</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground text-base leading-relaxed font-medium">
                        Joining AskGuy as an active member allows you to post up to 3 requests at a time. The membership fee is <span className="text-white font-black underline decoration-primary underline-offset-4">1 XPR</span> and lasts for 365 days.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-8 space-y-4">
                      <div className="p-6 rounded-[24px] bg-primary/5 border border-primary/10 space-y-3 shadow-inner">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span>Annual Cost</span>
                          <span>Duration</span>
                        </div>
                        <div className="flex justify-between items-center text-2xl font-black">
                          <span className="text-primary drop-shadow-[0_0_10px_rgba(244,201,93,0.3)]">1.00 XPR</span>
                          <span>365 Days</span>
                        </div>
                      </div>
                    </div>
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase tracking-widest text-xs px-8">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={payMembership} className="bg-primary text-black font-black rounded-2xl h-14 px-10 gold-glow uppercase tracking-widest text-xs">
                        Pay & Activate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card border-white/5 bg-white/[0.02] group rounded-[32px] overflow-hidden">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <Heart className="text-emerald-400 fill-emerald-400/20" size={32} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest mb-1">Total Given</p>
                    <p className="text-3xl font-black">{stats.given.toLocaleString()} <span className="text-xs text-muted-foreground font-medium">XPR</span></p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-white/5 bg-white/[0.02] group rounded-[32px] overflow-hidden">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                    <Heart className="text-blue-400 fill-blue-400/20" size={32} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest mb-1">Total Received</p>
                    <p className="text-3xl font-black">{stats.received.toLocaleString()} <span className="text-xs text-muted-foreground font-medium">XPR</span></p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="requests" className="space-y-10">
              <TabsList className="bg-white/5 border border-white/10 p-1.5 h-14 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar justify-start">
                <TabsTrigger value="requests" className="rounded-xl px-8 font-black text-xs uppercase tracking-widest h-full data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                  Requests ({profileRequests.length})
                </TabsTrigger>
                <TabsTrigger value="contributions" className="rounded-xl px-8 font-black text-xs uppercase tracking-widest h-full data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                  Impact ({profileContributions.length})
                </TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger value="messages" className="rounded-xl px-8 font-black text-xs uppercase tracking-widest h-full data-[state=active]:bg-primary data-[state=active]:text-black flex gap-2.5 transition-all">
                    <MessageSquare size={16} /> Messages ({receivedMessages.length})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="requests" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {profileRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {profileRequests.map(req => <RequestCard key={req.id} {...req} />)}
                  </div>
                ) : (
                  <div className="text-center py-32 glass-card border-dashed border-white/10 rounded-[40px] flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/30">
                      <LayoutGrid size={32} />
                    </div>
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No requests found for this member.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contributions" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {profileContributions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {profileContributions.map(req => <RequestCard key={req.id} {...req} />)}
                  </div>
                ) : (
                  <div className="text-center py-32 glass-card border-dashed border-white/10 rounded-[40px] flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/30">
                      <Heart size={32} />
                    </div>
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No contributions recorded yet.</p>
                  </div>
                )}
              </TabsContent>

              {isOwnProfile && (
                <TabsContent value="messages" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {receivedMessages.length > 0 ? (
                    receivedMessages.map((m, i) => (
                      <Card key={i} className="glass-card border-blue-500/10 bg-blue-500/5 p-8 rounded-[32px] transition-all hover:border-blue-500/30 group">
                        <div className="flex gap-8">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Quote className="text-blue-400" size={24} />
                          </div>
                          <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <Link to={`/profile/${m.user}`} className="text-lg font-black text-blue-400 hover:underline flex items-center gap-2 group/link">
                                  <Avatar className="w-5 h-5 border border-white/20 group-hover/link:border-blue-400 transition-colors p-0.5 bg-black/20">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.user}`} />
                                  </Avatar>
                                  @{m.user}
                                </Link>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">on request: <span className="text-foreground">"{m.requestTitle}"</span></p>
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">{new Date(m.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className="relative">
                              <Quote className="absolute -top-1 -left-1 text-white/5 w-10 h-10 pointer-events-none" />
                              <p className="text-base italic text-white/90 leading-relaxed font-medium pl-6 py-2 relative z-10">"{m.message}"</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-32 glass-card border-dashed border-white/10 rounded-[40px] flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/30">
                        <MessageSquare size={32} />
                      </div>
                      <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No messages received yet.</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <TransactionHistory />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;