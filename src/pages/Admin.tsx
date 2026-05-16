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
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { isConnected, isAdmin, transferTokens, guyBalance, membershipFee: currentFee, isMembershipEnabled: currentEnabled, postingFeeGuy: currentPostingFee, avatarSet: currentAvatarSet, fetchSettings } = useWallet();
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
    { value: 'avataaars', label: 'Avatars (Realistic)' },
    { value: 'bottts', label: 'Robots' },
    { value: 'identicon', label: 'Geometric (Identicon)' },
    { value: 'lorelei', label: 'Lorelei (Modern)' },
    { value: 'miniavs', label: 'Mini Avatars' },
    { value: 'open-peeps', label: 'Hand-drawn Peeps' },
    { value: 'personas', label: 'Personas' }
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

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Avatar Set</label>
                    <Select value={avatarSet} onValueChange={setAvatarSet}>
                      <SelectTrigger className="h-14 bg-black/20 border-white/10 font-black rounded-xl text-lg">
                        <SelectValue placeholder="Select avatar style" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {avatarStyles.map(style => (
                          <SelectItem key={style.value} value={style.value} className="font-black">
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl px-8 uppercase tracking-widest text-[10px]"
                  >
                    {processing ? <Loader2 className="animate-spin" size={18} /> : "Update Global Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Other TabsContent preserved */}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;