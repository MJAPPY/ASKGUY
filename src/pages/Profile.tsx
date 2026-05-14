"use client";

import React, { useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RequestCard from '@/components/<dyad-problem-report summary="2 problems">
<problem file="src/pages/Profile.tsx" line="31" column="15" code="2339">Property 'user' does not exist on type 'AidRequest'.</problem>
<problem file="src/pages/Profile.tsx" line="45" column="49" code="2339">Property 'user' does not exist on type 'AidRequest'.</problem>
</dyad-problem-report><think>

The user wants me to fix 2 TypeScript errors in Profile.tsx where `req.user` should be `req.requestor`.</think><tool_call>write path="src/pages/Profile.tsx" description="Fix req.user to req.requestor in Profile">
"use client";

import React, { useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RequestCard from '@/components/RequestCard';
import TransactionHistory from '@/components/TransactionHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Send, Receipt, Award, ArrowLeft, Calendar, MessageSquare, Quote, Wallet, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Profile = () => {
  const { address, isConnected, isConnecting, guyBalance, isMember, membershipExpiry, payMembership, connect } = useWallet();
  const { requests } = useRequests();

  const stats = useMemo(() => {
    if (!address) return { given: 0, received: 0, count: 0 };
    
    let given = 0;
    let received = 0;
    let count = 0;

    requests.forEach(req => {
      if (req.requestor === address) {
        received += req.raised;
      }
      req.contributions.forEach(c => {
        if (c.user === address) {
          given += c.amount;
          count++;
        }
      });
    });

    return { given, received, count };
  }, [requests, address]);

  const myRequests = requests.filter(req => req.requestor === address);
  const myContributions = requests.filter(req => 
    req.contributions.some(c => c.user === address)
  );

  const receivedMessages = useMemo(() => {
    const messages: { user: string, message: string, timestamp: number, requestTitle: string }[] = [];
    myRequests.forEach(req => {
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
  }, [myRequests]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-10 text-center space-y-8 border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Wallet className="text-primary" size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">Connect Your Wallet</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Please connect your XPR Network wallet to view your profile, track your contributions, and manage your requests.
              </p>
            </div>
            <Button 
              onClick={connect} 
              disabled={isConnecting}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow btn-premium text-base gap-3"
            >
              {isConnecting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet size={20} />
                  Connect WebAuth
                </>
              )}
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-white">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Home
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayAddress = typeof address === 'string' ? address : '';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      {/* Profile Header */}
      <div className="relative border-b border-white/5 bg-white/[0.02] py-12 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <Button variant="ghost" asChild className="mb-8 -ml-2 text-muted-foreground hover:text-primary">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-primary/30 shadow-2xl">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayAddress}`} />
                  <AvatarFallback className="bg-primary text-black font-black text-xl">
                    {displayAddress.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isMember && (
                  <div className="absolute -bottom-2 -right-2 bg-primary text-black p-1.5 rounded-xl border-4 border-background shadow-lg">
                    <ShieldCheck size={18} />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight">{displayAddress}</h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-bold px-3 py-1">
                    {guyBalance.toLocaleString()} GUY
                  </Badge>
                  {isMember ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1">
                      Verified Member
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-400 font-bold px-3 py-1">
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {isMember && (
              <div className="p-6 glass-card rounded-2xl border-primary/20 flex items-center gap-8 bg-primary/5">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Membership Expiry</p>
                  <p className="text-lg font-black flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    {new Date(membershipExpiry!).toLocaleDateString()}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary" className="h-11 px-6 font-black border-white/10 bg-white/10 hover:bg-white/20 transition-all uppercase tracking-widest text-[11px]">
                      Renew
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Renew Membership</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Extend your membership for another year for <span className="text-white font-bold">1 XPR</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={payMembership} className="bg-primary hover:bg-primary/90 text-black font-bold">
                        Confirm & Renew
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-card border-white/5 bg-white/[0.02] overflow-hidden group">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                    <Heart className="text-primary fill-primary/20" size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Total Given</p>
                    <p className="text-2xl font-black">{stats.given.toLocaleString()} <span className="text-xs text-muted-foreground">XPR</span></p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-white/5 bg-white/[0.02] overflow-hidden group">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Receipt className="text-blue-400" size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Total Received</p>
                    <p className="text-2xl font-black">{stats.received.toLocaleString()} <span className="text-xs text-muted-foreground">XPR</span></p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/5 bg-white/[0.02] overflow-hidden group">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <Send className="text-purple-400" size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Donations Made</p>
                    <p className="text-2xl font-black">{stats.count}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="my-requests" className="space-y-8">
              <TabsList className="bg-white/5 border border-white/10 p-1 h-12 rounded-xl">
                <TabsTrigger value="my-requests" className="rounded-lg px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-black">
                  My Requests ({myRequests.length})
                </TabsTrigger>
                <TabsTrigger value="my-contributions" className="rounded-lg px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-black">
                  Contributions ({myContributions.length})
                </TabsTrigger>
                <TabsTrigger value="messages" className="rounded-lg px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-black flex gap-2">
                  <MessageSquare size={16} /> Messages ({receivedMessages.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {myRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myRequests.map(req => (
                      <RequestCard key={req.id} {...req} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 glass-card rounded-[32px] border-dashed border-white/10 bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Receipt className="text-muted-foreground" size={32} />
                    </div>
                    <p className="text-muted-foreground font-medium">You haven't posted any requests yet.</p>
                    <Button asChild variant="link" className="text-primary mt-2">
                      <Link to="/">Post your first request</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-contributions" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {myContributions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myContributions.map(req => (
                      <RequestCard key={req.id} {...req} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 glass-card rounded-[32px] border-dashed border-white/10 bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Heart className="text-muted-foreground" size={32} />
                    </div>
                    <p className="text-muted-foreground font-medium">You haven't made any contributions yet.</p>
                    <Button asChild variant="link" className="text-primary mt-2">
                      <Link to="/">Browse requests to help</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="messages" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {receivedMessages.length > 0 ? (
                  <div className="space-y-4">
                    {receivedMessages.map((m, i) => (
                      <Card key={i} className="glass-card border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 transition-colors rounded-2xl">
                        <CardContent className="p-6 flex gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Quote className="text-blue-400" size={20} />
                          </div>
                          <div className="space-y-3 flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-base font-black text-blue-400">{m.user}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">on "{m.requestTitle}"</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                {new Date(m.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm italic text-foreground/90 leading-relaxed font-medium">"{m.message}"</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 glass-card rounded-[32px] border-dashed border-white/10 bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="text-muted-foreground" size={32} />
                    </div>
                    <p className="text-muted-foreground font-medium">No messages received yet.</p>
                  </div>
                )}
              </TabsContent>
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