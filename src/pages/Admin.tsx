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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
  Sparkles,
  Gift,
  Zap,
  ArrowRight,
  Trophy,
  Filter,
  Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { isConnected, isAdmin, transferTokens, guyBalance, membershipFee: currentFee, isMembershipEnabled: currentEnabled } = useWallet();
  const { requests, deleteRequest, batchDeleteRequests, loading: requestsLoading } = useRequests();
  const [bannedUsers, setBannedUsers] = useState<{ address: string, created_at: string }[]>([]);
  const [newBanAddress, setNewBanAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [modSearch, setModSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Settings state
  const [membershipActive, setMembershipActive] = useState(currentEnabled);
  const [membershipFee, setMembershipFee] = useState(currentFee.toString());

  // Individual rewards state
  const [individualRewards, setIndividualRewards] = useState<Record<string, string>>({});

  useEffect(() => {
    setMembershipActive(currentEnabled);
    setMembershipFee(currentFee.toString());
  }, [currentEnabled, currentFee]);

  const stats = useMemo(() => {
    const contributionMap: Record<string, number> = {};
    let totalXPRGiven = 0;
    let totalGUYGiven = 0;
    
    requests.forEach(req => {
      req.contributions.forEach(c => {
        if (c.token === 'XPR') {
          totalXPRGiven += c.amount;
          contributionMap[c.user] = (contributionMap[c.user] || 0) + c.amount;
        } else if (c.token === 'GUY') {
          totalGUYGiven += c.amount;
        }
      });
    });

    const top5 = Object.entries(contributionMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([address, amount]) => ({ address, amount }));

    return { 
      totalRequests: requests.length, 
      activeRequests: requests.filter(r => r.status === 'Open').length, 
      completedRequests: requests.filter(r => r.status === 'Completed').length, 
      totalXPRGiven, 
      totalGUYGiven,
      top5 
    };
  }, [requests]);

  useEffect(() => {
    const newRewards: Record<string, string> = { ...individualRewards };
    stats.top5.forEach(user => {
      if (!newRewards[user.address]) {
        newRewards[user.address] = '1000';
      }
    });
    setIndividualRewards(newRewards);
  }, [stats.top5]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
      r.title.toLowerCase().includes(modSearch.toLowerCase()) || 
      r.requestor.toLowerCase().includes(modSearch.toLowerCase())
    );
  }, [requests, modSearch]);

  const groupedRequests = useMemo(() => {
    const groups: Record<string, typeof requests> = {
      'Open': [],
      'Funded': [],
      'Completed': []
    };
    
    filteredRequests.forEach(req => {
      if (groups[req.status]) {
        groups[req.status].push(req);
      } else {
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push(req);
      }
    });
    
    return groups;
  }, [filteredRequests]);

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

  const handleUpdateSettings = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          id: 'global',
          membership_active: membershipActive,
          membership_fee: parseFloat(membershipFee)
        });

      if (error) throw error;
      showSuccess("Global settings updated.");
    } catch (err) {
      showError("Failed to update settings.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDistributeRewards = async () => {
    let totalNeeded = 0;
    const targets: { address: string, amount: number }[] = [];

    for (const user of stats.top5) {
      const amt = parseFloat(individualRewards[user.address] || '0');
      if (amt > 0) {
        totalNeeded += amt;
        targets.push({ address: user.address, amount: amt });
      }
    }

    if (targets.length === 0) {
      showError("Please enter valid amounts for distribution.");
      return;
    }

    if (guyBalance < totalNeeded) {
      showError(`Insufficient GUY balance. Need ${totalNeeded} GUY.`);
      return;
    }

    if (!confirm(`Distribute a total of ${totalNeeded} GUY to ${targets.length} contributors?`)) return;

    setProcessing(true);
    let successCount = 0;

    for (const target of targets) {
      try {
        const success = await transferTokens(
          target.address, 
          target.amount, 
          'GUY', 
          `kudos for the help you gave others.`
        );
        if (success) successCount++;
      } catch (err) {
        console.error(`Failed to reward ${target.address}:`, err);
      }
    }

    setProcessing(false);
    if (successCount > 0) {
      showSuccess(`Successfully rewarded ${successCount} contributors!`);
    } else {
      showError("Distribution failed or was cancelled.");
    }
  };

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

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} requests? This action is permanent.`)) return;
    
    setProcessing(true);
    try {
      await batchDeleteRequests(selectedIds);
      setSelectedIds([]);
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllInGroup = (groupRequests: typeof requests) => {
    const groupIds = groupRequests.map(r => r.id);
    const allInSelected = groupIds.every(id => selectedIds.includes(id));
    
    if (allInSelected) {
      setSelectedIds(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...groupIds])));
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

          <Tabs defaultValue="moderation" className="space-y-8">
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
              <TabsTrigger value="settings" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2">
                <Settings size={14} /> Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card border-white/5 p-8 rounded-[32px]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black">Status Distribution</h3>
                  </div>
                  <div className="space-y-6">
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

                <Card className="glass-card border-primary/20 bg-primary/[0.02] p-8 rounded-[32px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                    <Gift size={120} className="text-primary" />
                  </div>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Zap size={20} className="fill-primary" />
                      </div>
                      <h3 className="text-xl font-black">Leaderboard Rewards</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      Distribute custom $GUY rewards to the <span className="text-white font-black">Top 5 contributors</span>.
                    </p>

                    <div className="space-y-5">
                      <div className="space-y-3">
                        {stats.top5.map((user, i) => (
                          <div key={user.address} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                                #{i+1}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-bold text-white text-sm">@{user.address}</span>
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">{user.amount.toLocaleString()} XPR Aid</p>
                              </div>
                            </div>
                            
                            <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                              <Input 
                                type="number"
                                placeholder="0"
                                value={individualRewards[user.address] || ''}
                                onChange={(e) => setIndividualRewards(prev => ({ ...prev, [user.address]: e.target.value }))}
                                className="bg-black/20 border-white/10 h-10 font-black rounded-lg text-sm pr-12 text-right w-full"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground pointer-events-none">GUY</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={handleDistributeRewards}
                        disabled={processing || stats.top5.length === 0}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow text-xs uppercase tracking-widest gap-3"
                      >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : <Gift size={18} />}
                        Distribute Rewards
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 px-4 rounded-2xl flex-1 max-w-xl">
                  <Search size={18} className="text-muted-foreground" />
                  <Input 
                    placeholder="Search by title or address..." 
                    className="border-none bg-transparent focus-visible:ring-0 text-base font-medium p-0"
                    value={modSearch}
                    onChange={(e) => setModSearch(e.target.value)}
                  />
                </div>
                
                {selectedIds.length > 0 && (
                  <Button 
                    onClick={handleBatchDelete}
                    disabled={processing}
                    variant="destructive"
                    className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg animate-in zoom-in duration-300"
                  >
                    <Trash2 size={16} />
                    Delete {selectedIds.length} Selected
                  </Button>
                )}
              </div>

              {requestsLoading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Database...</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {Object.entries(groupedRequests).map(([status, groupRequests]) => groupRequests.length > 0 && (
                    <div key={status} className="space-y-5">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-3">
                          <Filter size={14} className="text-muted-foreground" />
                          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            {status} Requests
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md border border-white/10 text-muted-foreground">{groupRequests.length}</span>
                          </h3>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => selectAllInGroup(groupRequests)}
                          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white"
                        >
                          {groupRequests.every(id => selectedIds.includes(id.id)) ? "Deselect Group" : "Select All"}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {groupRequests.map(req => (
                          <div 
                            key={req.id} 
                            onClick={() => toggleSelect(req.id)}
                            className={cn(
                              "glass-card border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-4 rounded-2xl flex items-center justify-between group transition-all cursor-pointer",
                              selectedIds.includes(req.id) ? "border-primary/40 bg-primary/5 translate-x-1" : ""
                            )}
                          >
                            <div className="flex items-center gap-5">
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                  checked={selectedIds.includes(req.id)} 
                                  onCheckedChange={() => toggleSelect(req.id)}
                                  className="h-5 w-5 rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                />
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden">
                                {req.proofUrl ? <img src={req.proofUrl} className="w-full h-full object-cover" /> : <LayoutDashboard size={18} />}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-bold text-white text-sm line-clamp-1">{req.title}</h4>
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                  <span className="text-primary">@{req.requestor}</span>
                                  <span>•</span>
                                  <span>{req.amount} {req.token}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteRequest(req.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              onClick={() => handleUnban(user.address)}
                              className="h-10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-black text-[10px] uppercase tracking-widest rounded-xl px-5"
                            >
                              Restore Access
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-24 text-center text-muted-foreground/40 italic font-medium">
                        No active blacklists.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card border-white/10 p-8 rounded-[32px] max-w-2xl">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Settings size={20} />
                    </div>
                    <CardTitle className="text-xl font-black">Global Membership Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="space-y-1">
                      <p className="font-black text-white">Enable Membership System</p>
                      <p className="text-xs text-muted-foreground font-medium">When off, users can post requests for free.</p>
                    </div>
                    <Switch 
                      checked={membershipActive} 
                      onCheckedChange={setMembershipActive}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membership Fee (XPR)</label>
                    <div className="flex gap-4">
                      <Input 
                        type="number"
                        value={membershipFee}
                        onChange={(e) => setMembershipFee(e.target.value)}
                        className="bg-black/20 border-white/10 h-14 font-black rounded-xl text-lg"
                        placeholder="7777"
                      />
                      <Button 
                        onClick={handleUpdateSettings}
                        disabled={processing}
                        className="h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl px-8 uppercase tracking-widest text-[10px]"
                      >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : "Update Settings"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;