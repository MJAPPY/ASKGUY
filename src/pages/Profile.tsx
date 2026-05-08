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
import { Heart, Send, Receipt, Award, ArrowLeft, Calendar, MessageSquare, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Profile = () => {
  const { address, isConnected, guyBalance, isMember, membershipExpiry, payMembership } = useWallet();
  const { requests } = useRequests();

  const stats = useMemo(() => {
    if (!address) return { given: 0, received: 0, count: 0 };
    
    let given = 0;
    let received = 0;
    let count = 0;

    requests.forEach(req => {
      if (req.user === address) {
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

  const myRequests = requests.filter(req => req.user === address);
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
      <div className="min-h-screen flex items-center justify-center">
        <p>Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-primary">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Award className="text-primary" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{address}</h1>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="border-primary text-primary">
                    {guyBalance.toLocaleString()} GUY
                  </Badge>
                  {isMember && (
                    <Badge className="bg-primary text-background">Verified Member</Badge>
                  )}
                </div>
              </div>
            </div>

            {isMember && (
              <div className="p-4 glass-card rounded-xl border-primary/20 flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Membership Expiry</p>
                  <p className="text-sm font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {new Date(membershipExpiry!).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={payMembership} className="h-9 px-4 font-bold border-white/10">
                  Renew
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-card border-white/5">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Given</p>
                    <p className="text-xl font-bold">{stats.given.toLocaleString()} XPR</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-white/5">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Receipt className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Received</p>
                    <p className="text-xl font-bold">{stats.received.toLocaleString()} XPR</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/5">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Send className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Donations</p>
                    <p className="text-xl font-bold">{stats.count}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="my-requests" className="space-y-6">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="my-requests">My Requests ({myRequests.length})</TabsTrigger>
                <TabsTrigger value="my-contributions">My Contributions ({myContributions.length})</TabsTrigger>
                <TabsTrigger value="messages" className="flex gap-2">
                  <MessageSquare size={14} /> Messages ({receivedMessages.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-requests">
                {myRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myRequests.map(req => (
                      <RequestCard key={req.id} {...req} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 glass-card rounded-2xl border-dashed border-white/10">
                    <p className="text-muted-foreground">You haven't posted any requests yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-contributions">
                {myContributions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myContributions.map(req => (
                      <RequestCard key={req.id} {...req} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 glass-card rounded-2xl border-dashed border-white/10">
                    <p className="text-muted-foreground">You haven't made any contributions yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="messages">
                {receivedMessages.length > 0 ? (
                  <div className="space-y-4">
                    {receivedMessages.map((m, i) => (
                      <Card key={i} className="glass-card border-blue-500/10 bg-blue-500/5">
                        <CardContent className="p-6 flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Quote className="text-blue-400" size={18} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-bold text-blue-400">{m.user}</p>
                                <p className="text-[10px] text-muted-foreground">on "{m.requestTitle}"</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                {new Date(m.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm italic text-foreground/90 leading-relaxed">"{m.message}"</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 glass-card rounded-2xl border-dashed border-white/10">
                    <p className="text-muted-foreground">No messages received yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <TransactionHistory />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;