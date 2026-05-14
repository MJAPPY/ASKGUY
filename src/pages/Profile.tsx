"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RequestCard from '@/components/RequestCard';
import TransactionHistory from '@/components/TransactionHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Send, Receipt, ArrowLeft, Calendar, MessageSquare, Quote, Wallet, Loader2, ShieldCheck, User, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ENDPOINTS = [
  'https://proton.greymass.com',
  'https://api.protonnz.com',
  'https://api.protonchain.com',
  'https://proton.eosusa.io',
  'https://proton.protonuk.io',
];

const Profile = () => {
  const { userAddress: routeAddress } = useParams();
  const { address: myAddress, isConnected, isConnecting, guyBalance: myGuyBalance, xprBalance: myXprBalance, isMember: isMyMembershipActive, membershipExpiry: myExpiry, payMembership, connect } = useWallet();
  const { requests } = useRequests();

  const targetAddress = routeAddress || myAddress;
  const isOwnProfile = !routeAddress || routeAddress === myAddress;

  const [onChainGuy, setOnChainGuy] = useState<number | null>(null);
  const [onChainXpr, setOnChainXpr] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    const fetchBalance = async (account: string, code: string, symbol: string): Promise<number> => {
      for (const endpoint of ENDPOINTS) {
        try {
          const res = await fetch(`${endpoint}/v1/chain/get_currency_balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code.toLowerCase(), account: account.toLowerCase(), symbol }),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) return parseFloat(data[0].split(' ')[0]);
          }
        } catch (e) { continue; }
      }
      return 0;
    };

    const loadTargetBalances = async () => {
      if (!targetAddress) return;
      if (isOwnProfile) {
        setOnChainGuy(myGuyBalance);
        setOnChainXpr(myXprBalance);
        return;
      }

      setLoadingBalances(true);
      try {
        const xpr = await fetchBalance(targetAddress, 'eosio.token', 'XPR');
        setOnChainXpr(xpr);

        const contracts = ['proton-vtoken', 'xtokens', 'token.777'];
        let guy = 0;
        for (const c of contracts) {
          const val = await fetchBalance(targetAddress, c, 'GUY');
          if (val > 0) { guy = val; break; }
        }
        setOnChainGuy(guy);
      } catch (err) {
        console.error("Failed to load profile balances", err);
      } finally {
        setLoadingBalances(false);
      }
    };

    loadTargetBalances();
  }, [targetAddress, isOwnProfile, myGuyBalance, myXprBalance]);

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
          <div className="max-w-md w-full glass-card rounded-3xl p-10 text-center space-y-8 border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Wallet className="text-primary" size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">Connect Your Wallet</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connect your wallet to see your impact or search for other community members.
              </p>
            </div>
            <Button onClick={connect} disabled={isConnecting} className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow btn-premium text-base gap-3">
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
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${targetAddress}`} />
                  <AvatarFallback className="bg-primary text-black font-black text-xl">
                    {targetAddress?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-primary text-black p-1.5 rounded-xl border-4 border-background shadow-lg">
                  <ShieldCheck size={18} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                  {targetAddress}
                  {isOwnProfile && <Badge className="bg-white/10 text-white border-white/10">You</Badge>}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-bold px-3 py-1">
                    Verified Holder
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1">
                    Community Member
                  </Badge>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="p-6 glass-card rounded-2xl border-primary/20 flex items-center gap-8 bg-primary/5">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Membership</p>
                  <p className="text-lg font-black flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    {myExpiry > 0 ? new Date(myExpiry).toLocaleDateString() : 'Active'}
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
                      <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={payMembership} className="bg-primary text-black font-bold">Renew</AlertDialogAction>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Card className="glass-card border-primary/20 bg-primary/5 group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                      <Coins className="text-primary" size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">GUY Balance</p>
                      <p className="text-2xl font-black">
                        {loadingBalances ? <Loader2 size={20} className="animate-spin text-primary" /> : onChainGuy?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">XPR Balance</p>
                    <p className="text-lg font-black">
                      {loadingBalances ? '...' : onChainXpr?.toLocaleString() || '0'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/5 bg-white/[0.02] group">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Heart className="text-emerald-400 fill-emerald-400/20" size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Total Given</p>
                    <p className="text-2xl font-black">{stats.given.toLocaleString()} <span className="text-xs text-muted-foreground">XPR</span></p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="requests" className="space-y-8">
              <TabsList className="bg-white/5 border border-white/10 p-1 h-12 rounded-xl">
                <TabsTrigger value="requests" className="rounded-lg px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-black">
                  Requests ({profileRequests.length})
                </TabsTrigger>
                <TabsTrigger value="contributions" className="rounded-lg px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-black">
                  Contributions ({profileContributions.length})
                </TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger value="messages" className="rounded-lg px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-black flex gap-2">
                    <MessageSquare size={16} /> Messages ({receivedMessages.length})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="requests" className="space-y-6">
                {profileRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileRequests.map(req => <RequestCard key={req.id} {...req} />)}
                  </div>
                ) : (
                  <div className="text-center py-24 glass-card border-dashed border-white/10">
                    <p className="text-muted-foreground font-medium">No requests found for this member.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contributions" className="space-y-6">
                {profileContributions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileContributions.map(req => <RequestCard key={req.id} {...req} />)}
                  </div>
                ) : (
                  <div className="text-center py-24 glass-card border-dashed border-white/10">
                    <p className="text-muted-foreground font-medium">No contributions recorded yet.</p>
                  </div>
                )}
              </TabsContent>

              {isOwnProfile && (
                <TabsContent value="messages" className="space-y-4">
                  {receivedMessages.length > 0 ? (
                    receivedMessages.map((m, i) => (
                      <Card key={i} className="glass-card border-blue-500/10 bg-blue-500/5 p-6">
                        <div className="flex gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Quote className="text-blue-400" size={20} />
                          </div>
                          <div className="space-y-3 flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <Link to={`/profile/${m.user}`} className="text-base font-black text-blue-400 hover:underline">{m.user}</Link>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">on "{m.requestTitle}"</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{new Date(m.timestamp).toLocaleDateString()}</p>
                            </div>
                            <p className="text-sm italic text-foreground/90 leading-relaxed font-medium">"{m.message}"</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-24 glass-card border-dashed border-white/10">
                      <p className="text-muted-foreground font-medium">No messages received yet.</p>
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