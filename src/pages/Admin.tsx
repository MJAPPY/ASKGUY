"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  Loader2, 
  ShieldCheck, 
  LayoutDashboard, 
  Search, 
  Trash2, 
  TrendingUp, 
  Coins, 
  Activity,
  AlertTriangle,
  Globe,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { isConnected, isAdmin } = useWallet();
  const { requests, deleteRequest, loading: requestsLoading } = useRequests();
  const [bannedUsers, setBannedUsers] = useState<{ address: string, created_at: string }[]>([]);
  const [newBanAddress, setNewBanAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [modSearch, setModSearch] = useState('');

  // Platform Analytics calculations
  const stats = useMemo(() => {
    const totalRequests = requests.length;
    const activeRequests = requests.filter(r => r.status === 'Open').length;
    const completedRequests = requests.filter(r => r.status === 'Completed').length;
    
    let totalXPRGiven = 0;
    let totalGUYGiven = 0;
    
    requests.forEach(req => {
      req.contributions.forEach(c => {
        if (c.token === 'XPR') totalXPRGiven += c.amount;
        else if (c.token === 'GUY') totalGUYGiven += c.amount;
      });
    });

    return { totalRequests, activeRequests, completedRequests, totalXPRGiven, totalGUYGiven };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
      r.title.toLowerCase().includes(modSearch.toLowerCase()) || 
      r.requestor.toLowerCase().includes(modSearch.toLowerCase())
    );
  }, [requests, modSearch]);

  const fetchBannedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBannedUsers(data || []);
    } catch (err) {
      showError("Failed to fetch blacklist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBannedUsers();
    }
  }, [isAdmin]);

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanAddress) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('banned_users')
        .insert([{ address: newBanAddress.toLowerCase().trim() }]);
      
      if (error) throw error;
      
      showSuccess(`${newBanAddress} has been blacklisted.`);
      setNewBanAddress('');
      fetchBannedUsers();
    } catch (err) {
      showError("Failed to ban user. They might already be blacklisted.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnban = async (targetAddress: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('address', targetAddress);
      
      if (error) throw error;
      
      showSuccess(`${targetAddress} has been removed from blacklist.`);
      fetchBannedUsers();
    } catch (err) {
      showError("Failed to unban user.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request? This action is permanent.")) return;
    try {
      await deleteRequest(id);
      showSuccess("Request removed.");
    } catch (err) {
      showError("Failed to delete request.");
    }
  };

  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-12 text-center space-y-6 border-red-500/20">
          <ShieldAlert className="text-red-500 mx-auto" size={48} />
          <h1 className="text-2xl font-black">Access Restricted</h1>
          <p className="text-muted-foreground">Admin privileges required.</p>
          <Button asChild variant="outline" className="w-full">
            <a href="/">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060912] text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(244,201,93,0.1)]">
                  <ShieldCheck className="text-primary" size={28} />
                </div>
                <h1 className="text-4xl font-black tracking-tight">System Control</h1>
              </div>
              <p className="text-muted-foreground font-medium">Global platform management and safety tools.</p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={() => window.open('https://explorer.xprnetwork.org/account/askguy', '_blank')} variant="outline" className="h-11 border-white/10 hover:bg-white/5 rounded-xl gap-2 font-bold text-xs uppercase tracking-widest">
                <Globe size={14} /> Explorer <ExternalLink size={12} />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="analytics" className="space-y-8">
            <TabsList className="bg-white/5 border border-white/10 p-1.5 h-14 rounded-2xl w-full md:w-auto justify-start">
              <TabsTrigger value="analytics" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2">
                <TrendingUp size={14} /> Analytics
              </TabsTrigger>
              <TabsTrigger value="moderation" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2">
                <Activity size={14} /> Moderation
              </TabsTrigger>
              <TabsTrigger value="safety" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2">
                <ShieldAlert size={14} /> Safety
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Volume", value: `${stats.totalXPRGiven.toLocaleString()} XPR`, icon: <Coins />, color: "text-primary" },
                  { label: "GUY Support", value: `${stats.totalGUYGiven.toLocaleString()} GUY`, icon: <Sparkles />, color: "text-blue-400" },
                  { label: "Total Needs", value: stats.totalRequests, icon: <LayoutDashboard />, color: "text-emerald-400" },
                  { label: "Success Rate", value: `${((stats.completedRequests / stats.totalRequests) * 100 || 0).toFixed(1)}%`, icon: <ShieldCheck />, color: "text-purple-400" }
                ].map((stat, i) => (
                  <Card key={i} className="glass-card border-white/5 bg-white/[0.02] p-6 rounded-[24px]">
                    <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/5", stat.color)}>
                      {stat.icon}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-black">{stat.value}</h3>
                  </Card>
                ))}
              </div>
              
              <Card className="glass-card border-white/5 p-8 rounded-[32px]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black">Status Distribution</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Open", count: stats.activeRequests, color: "bg-primary" },
                    { label: "Funded", count: requests.filter(r => r.status === 'Funded').length, color: "bg-blue-500" },
                    { label: "Completed", count: stats.completedRequests, color: "bg-emerald-500" }
                  ].map((s, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
                        <span className="text-lg font-black">{s.count}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div className={cn("h-full rounded-full", s.color)} style={{ width: `${(s.count / stats.totalRequests) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                <Search size={20} className="text-muted-foreground" />
                <Input 
                  placeholder="Filter requests by title or address..." 
                  className="border-none bg-transparent focus-visible:ring-0 text-lg font-medium p-0"
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {requestsLoading ? (
                  <div className="py-20 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Database...</p>
                  </div>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map(req => (
                    <Card key={req.id} className="glass-card border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-5 rounded-[24px] flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden">
                          {req.proofUrl ? <img src={req.proofUrl} className="w-full h-full object-cover" /> : <LayoutDashboard size={20} />}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black text-white group-hover:text-primary transition-colors">{req.title}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span className="text-primary">@{req.requestor}</span>
                            <span>•</span>
                            <span>{req.amount} {req.token}</span>
                            <span>•</span>
                            <span className={cn(
                              req.status === 'Completed' ? "text-emerald-400" : "text-blue-400"
                            )}>{req.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteRequest(req.id)}
                          className="h-10 w-10 text-red-400 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="py-20 text-center glass-card border-dashed border-white/10 rounded-[32px] text-muted-foreground italic">
                    No matching requests found.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="safety" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-4 glass-card border-red-500/20 bg-red-500/[0.02] rounded-[32px]">
                  <CardHeader>
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                      <UserX size={20} className="text-red-400" />
                      Blacklist Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-medium text-red-200/80 leading-relaxed">
                      <AlertTriangle size={14} className="mb-2 text-red-400" />
                      Blacklisting an address immediately restricts their access to all community features and hides their requests.
                    </div>
                    <form onSubmit={handleBan} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Address</label>
                        <Input 
                          placeholder="e.g. bad_actor.xpr" 
                          value={newBanAddress}
                          onChange={(e) => setNewBanAddress(e.target.value)}
                          className="bg-white/5 border-white/10 h-12 font-black rounded-xl"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={processing || !newBanAddress}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-12 rounded-xl"
                      >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : "Add to Blacklist"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-8 glass-card border-white/5 bg-white/[0.01] rounded-[32px]">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
                    <CardTitle className="text-lg font-black">Restricted Assets</CardTitle>
                    <div className="text-[10px] font-black px-3 py-1 rounded-full bg-white/5 border border-white/10 uppercase tracking-widest text-muted-foreground">
                      {bannedUsers.length} Entries
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-primary" size={32} />
                      </div>
                    ) : bannedUsers.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {bannedUsers.map((user) => (
                          <div key={user.address} className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/10">
                                <UserX size={18} />
                              </div>
                              <div>
                                <p className="font-black text-white italic">@{user.address}</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                  Banned {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              onClick={() => handleUnban(user.address)}
                              className="h-10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-black text-[10px] uppercase tracking-widest rounded-xl px-5"
                            >
                              <UserCheck size={16} className="mr-2" />
                              Restore Access
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-24 text-center text-muted-foreground/40 italic font-medium">
                        Platform integrity is 100%. No active blacklists.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;