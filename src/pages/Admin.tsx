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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Settings,
  User,
  Eye,
  CheckCircle2,
  Clock,
  Heart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { isConnected, isAdmin, transferTokens, guyBalance, membershipFee: currentFee, isMembershipEnabled: currentEnabled, postingFeeGuy: currentPostingFee, avatarSet: currentAvatarSet, fetchSettings, address } = useWallet();
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
  const [postingFeeGuy, setPostingFeeGuy] = useState(currentPostingFee.toString());
  const [avatarSet, setAvatarSet] = useState(currentAvatarSet);

  // Individual rewards state
  const [individualRewards, setIndividualRewards] = useState<Record<string, string>>({});

  useEffect(() => {
    setMembershipActive(currentEnabled);
    setMembershipFee(currentFee.toString());
    setPostingFeeGuy(currentPostingFee.toString());
    setAvatarSet(currentAvatarSet);
  }, [currentEnabled, currentFee, currentPostingFee, currentAvatarSet]);

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
        .update({ 
          membership_active: membershipActive,
          membership_fee: parseFloat(membershipFee),
          posting_fee_guy: parseFloat(postingFeeGuy),
          avatar_set: avatarSet
        })
        .eq('id', 'global');

      if (error) throw error;
      
      await fetchSettings();
      showSuccess("Global settings updated.");
    } catch (err) {
      console.error("Settings update error:", err);
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

  const avatarStyles = [
    { value: 'pixel-art', label: 'Pixel Art' },
    { value: 'avataaars', label: 'Realistic' },
    { value: 'bottts', label: 'Robots' },
    { value: 'identicon', label: 'Geometric' },
    { value: 'lorelei', label: 'Modern' },
    { value: 'miniavs', label: 'Mini Avatars' },
    { value: 'open-peeps', label: 'Hand-drawn' },
    { value: 'personas', label: 'Personas' },
    { value: 'shapes', label: 'Abstract Shapes' }
  ];

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Impact</p>
                  <h3 className="text-3xl font-black text-white">{stats.totalXPRGiven.toLocaleString()} <span className="text-xs text-muted-foreground">XPR</span></h3>
                </Card>
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Requests</p>
                  <h3 className="text-3xl font-black text-primary">{stats.activeRequests}</h3>
                </Card>
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Success Stories</p>
                  <h3 className="text-3xl font-black text-emerald-400">{stats.completedRequests}</h3>
                </Card>
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">GUY Pool</p>
                  <h3 className="text-3xl font-black text-purple-400">{guyBalance.toLocaleString()}</h3>
                </Card>
              </div>

              <Card className="glass-card border-white/10 p-8 rounded-[32px]">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Trophy size={20} />
                    </div>
                    <CardTitle className="text-xl font-black">Top 5 Quarterly Contributors</CardTitle>
                  </div>
                  <Button 
                    onClick={handleDistributeRewards}
                    disabled={processing || stats.top5.length === 0}
                    className="bg-primary hover:bg-primary/90 text-black font-black h-11 px-6 rounded-xl gold-glow text-[10px] uppercase tracking-widest"
                  >
                    <Gift size={16} className="mr-2" /> Distribute Rewards
                  </Button>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="divide-y divide-white/5">
                    {stats.top5.map((user, i) => (
                      <div key={user.address} className="py-6 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <span className="text-xl font-black text-muted-foreground w-6">#{i + 1}</span>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-white/10 p-1 bg-black/20">
                              <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${user.address}`} />
                            </Avatar>
                            <div>
                              <p className="text-sm font-black text-white">@{user.address}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{user.amount.toLocaleString()} XPR Contributed</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Reward Amount</p>
                            <Input 
                              type="number" 
                              value={individualRewards[user.address] || '0'} 
                              onChange={(e) => setIndividualRewards(prev => ({ ...prev, [user.address]: e.target.value }))}
                              className="h-10 w-32 bg-white/5 border-white/10 text-right font-black"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {stats.top5.length === 0 && (
                      <div className="py-12 text-center text-muted-foreground font-medium italic">
                        Waiting for quarterly activity...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card border-white/10 p-8 rounded-[32px]">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Activity size={20} />
                    </div>
                    <CardTitle className="text-xl font-black">Content Moderation</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={14} />
                      <Input 
                        placeholder="Search users or titles..." 
                        value={modSearch}
                        onChange={(e) => setModSearch(e.target.value)}
                        className="pl-9 h-11 bg-white/5 border-white/10 rounded-xl font-medium"
                      />
                    </div>
                    {selectedIds.length > 0 && (
                      <Button 
                        variant="destructive"
                        onClick={handleBatchDelete}
                        className="h-11 px-4 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest"
                      >
                        <Trash2 size={14} /> Delete ({selectedIds.length})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-0 pt-6">
                  <div className="space-y-10">
                    {Object.entries(groupedRequests).map(([group, groupRequests]) => groupRequests.length > 0 && (
                      <div key={group} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={groupRequests.every(r => selectedIds.includes(r.id))}
                              onCheckedChange={() => selectAllInGroup(groupRequests)}
                            />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{group} Requests</h4>
                          </div>
                          <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-full">{groupRequests.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupRequests.map(req => (
                            <div key={req.id} className={cn(
                              "p-4 rounded-2xl border transition-all flex items-start justify-between group",
                              selectedIds.includes(req.id) ? "bg-red-500/5 border-red-500/30" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                            )}>
                              <div className="flex items-start gap-3 min-w-0">
                                <Checkbox 
                                  checked={selectedIds.includes(req.id)}
                                  onCheckedChange={() => toggleSelect(req.id)}
                                  className="mt-1"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-white truncate">{req.title}</p>
                                  <p className="text-[10px] font-bold text-primary">@{req.requestor}</p>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/60">{req.amount} {req.token}</span>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/60">{group}</span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteRequest(req.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {requests.length === 0 && !requestsLoading && (
                      <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
                          <Activity size={32} />
                        </div>
                        <p className="text-muted-foreground font-medium italic">No requests available to moderate.</p>
                      </div>
                    )}
                    {requestsLoading && (
                      <div className="py-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Database...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="safety" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card border-white/10 p-8 rounded-[32px] max-w-2xl">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                      <ShieldAlert size={20} />
                    </div>
                    <CardTitle className="text-xl font-black">Platform Safety & Blacklist</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  <form onSubmit={handleBan} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Blacklist New User Address</label>
                    <div className="flex gap-3">
                      <Input 
                        placeholder="e.g. badactor.xpr" 
                        value={newBanAddress}
                        onChange={(e) => setNewBanAddress(e.target.value)}
                        className="bg-black/20 border-white/10 h-12 font-black rounded-xl"
                      />
                      <Button 
                        type="submit" 
                        disabled={processing || !newBanAddress}
                        className="bg-red-600 hover:bg-red-500 text-white font-black px-6 rounded-xl text-[10px] uppercase tracking-widest"
                      >
                        {processing ? <Loader2 className="animate-spin" size={16} /> : "Ban User"}
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Restricted Accounts</h4>
                      <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-full">{bannedUsers.length}</span>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                      {bannedUsers.map((user) => (
                        <div key={user.address} className="py-4 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                              <UserX size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">@{user.address}</p>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase">Restricted on {new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUnban(user.address)}
                            className="text-emerald-400 hover:bg-emerald-500/10 h-9 px-4 rounded-xl gap-2 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <UserCheck size={14} /> Restore Access
                          </Button>
                        </div>
                      ))}
                      {bannedUsers.length === 0 && !loading && (
                        <div className="py-12 text-center text-muted-foreground font-medium italic">
                          No users are currently blacklisted.
                        </div>
                      )}
                      {loading && (
                        <div className="py-12 text-center">
                          <Loader2 className="animate-spin mx-auto text-primary" size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card border-white/10 p-8 rounded-[32px] max-w-2xl">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Settings size={20} />
                    </div>
                    <CardTitle className="text-xl font-black">Global Platform Settings</CardTitle>
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

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        Global Avatar Set
                        <span className="text-primary/50 text-[8px] italic">(Live Preview)</span>
                      </label>
                      <Select value={avatarSet} onValueChange={setAvatarSet}>
                        <SelectTrigger className="h-16 bg-black/20 border-white/10 font-black rounded-xl text-lg hover:border-primary/30 transition-all">
                          <SelectValue placeholder="Select avatar style" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10 max-h-[400px]">
                          {avatarStyles.map(style => (
                            <SelectItem key={style.value} value={style.value} className="font-black py-3 focus:bg-primary/10 transition-colors">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-10 h-10 border border-white/10 p-1 bg-black/40 rounded-lg">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/${style.value}/svg?seed=example-user`} />
                                </Avatar>
                                <span>{style.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                       <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Set Style Preview</p>
                         <Eye size={12} className="text-primary/40" />
                       </div>
                       <div className="flex flex-wrap gap-4">
                         {['alice', 'bob', 'charlie', 'delta', 'echo'].map((seed, i) => (
                           <div key={seed} className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                             <Avatar className="w-12 h-12 border-2 border-primary/20 p-1 bg-black/40 rounded-xl shadow-lg">
                               <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${seed}`} />
                             </Avatar>
                             <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60">User {i + 1}</span>
                           </div>
                         ))}
                       </div>
                       <p className="text-[9px] text-muted-foreground/50 italic text-center pt-2">
                         Switching styles will update the appearance of every user on the platform.
                       </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membership Fee (XPR)</label>
                      <Input 
                        type="number"
                        value={membershipFee}
                        onChange={(e) => setMembershipFee(e.target.value)}
                        className="bg-black/20 border-white/10 h-14 font-black rounded-xl text-lg"
                        placeholder="7777"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Post Request Fee (GUY)</label>
                      <Input 
                        type="number"
                        value={postingFeeGuy}
                        onChange={(e) => setPostingFeeGuy(e.target.value)}
                        className="bg-black/20 border-white/10 h-14 font-black rounded-xl text-lg"
                        placeholder="25"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleUpdateSettings}
                    disabled={processing}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl px-8 uppercase tracking-widest text-[10px] gold-glow"
                  >
                    {processing ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={14} className="mr-2" /> Update Global Settings</>}
                  </Button>
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