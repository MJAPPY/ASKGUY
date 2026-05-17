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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  Loader2, 
  ShieldCheck, 
  TrendingUp, 
  Activity,
  Settings,
  Search,
  Trash2,
  Trophy,
  Hammer,
  Gift,
  Zap,
  Sparkles,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { 
    isConnected, 
    isAdmin, 
    transferTokens, 
    guyBalance, 
    membershipFee: currentFee, 
    isMembershipEnabled: currentEnabled, 
    postingFeeGuy: currentPostingFee, 
    avatarSet: currentAvatarSet, 
    isMaintenanceMode: currentMaintenance,
    maintenanceMessage: currentMessage,
    fetchSettings, 
    address 
  } = useWallet();
  
  const { requests, deleteRequest, batchDeleteRequests, loading: requestsLoading } = useRequests();
  const [bannedUsers, setBannedUsers] = useState<{ address: string, created_at: string }[]>([]);
  const [newBanAddress, setNewBanAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [modSearch, setModSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [membershipActive, setMembershipActive] = useState(currentEnabled);
  const [membershipFee, setMembershipFee] = useState(currentFee.toString());
  const [postingFeeGuy, setPostingFeeGuy] = useState(currentPostingFee.toString());
  const [avatarSet, setAvatarSet] = useState(currentAvatarSet);
  const [maintenanceMode, setMaintenanceMode] = useState(currentMaintenance);
  const [maintenanceMessage, setMaintenanceMessage] = useState(currentMessage);

  const [individualRewards, setIndividualRewards] = useState<Record<string, string>>({});

  useEffect(() => {
    setMembershipActive(currentEnabled);
    setMembershipFee(currentFee.toString());
    setPostingFeeGuy(currentPostingFee.toString());
    setAvatarSet(currentAvatarSet);
    setMaintenanceMode(currentMaintenance);
    setMaintenanceMessage(currentMessage);
  }, [currentEnabled, currentFee, currentPostingFee, currentAvatarSet, currentMaintenance, currentMessage]);

  const stats = useMemo(() => {
    const contributionMap: Record<string, number> = {};
    let totalXPRGiven = 0;
    
    requests.forEach(req => {
      req.contributions.forEach(c => {
        if (c.token === 'XPR') {
          totalXPRGiven += c.amount;
          contributionMap[c.user] = (contributionMap[c.user] || 0) + c.amount;
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
      top5 
    };
  }, [requests]);

  useEffect(() => {
    const newRewards: Record<string, string> = { ...individualRewards };
    stats.top5.forEach(user => {
      if (!newRewards[user.address]) newRewards[user.address] = '1000';
    });
    setIndividualRewards(newRewards);
  }, [stats.top5]);

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
    if (isAdmin) fetchBannedUsers();
  }, [isAdmin]);

  const handleUpdateSettings = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('manage-platform', {
        body: {
          action: 'UPDATE_SETTINGS',
          callerAddress: address,
          payload: { 
            membership_active: membershipActive,
            membership_fee: parseFloat(membershipFee),
            posting_fee_guy: parseFloat(postingFeeGuy),
            avatar_set: avatarSet,
            maintenance_mode: maintenanceMode,
            maintenance_message: maintenanceMessage 
          }
        }
      });

      if (error) throw error;
      await fetchSettings();
      showSuccess("Global settings updated.");
    } catch (err: any) {
      showError(err.message || "Failed to update settings.");
    } finally {
      setProcessing(false);
    }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanAddress) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('manage-platform', {
        body: {
          action: 'BAN_USER',
          callerAddress: address,
          payload: { address: newBanAddress }
        }
      });
      
      if (error) throw error;
      showSuccess(`${newBanAddress} blacklisted.`);
      setNewBanAddress('');
      fetchBannedUsers();
    } catch (err: any) {
      showError(err.message || "Failed to ban user.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnban = async (targetAddress: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('manage-platform', {
        body: {
          action: 'UNBAN_USER',
          callerAddress: address,
          payload: { address: targetAddress }
        }
      });
      
      if (error) throw error;
      showSuccess(`${targetAddress} restored.`);
      fetchBannedUsers();
    } catch (err: any) {
      showError(err.message || "Failed to unban user.");
    } finally {
      setProcessing(false);
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
          <Button asChild variant="outline" className="w-full"><a href="/">Return Home</a></Button>
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
              <p className="text-muted-foreground font-medium">Secure global platform management.</p>
            </div>
          </div>

          <Tabs defaultValue="moderation" className="space-y-8">
            <TabsList className="bg-white/5 border border-white/10 p-1.5 h-14 rounded-2xl w-full md:w-auto justify-start">
              <TabsTrigger value="analytics" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2"><TrendingUp size={14} /> Analytics</TabsTrigger>
              <TabsTrigger value="moderation" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2"><Activity size={14} /> Moderation</TabsTrigger>
              <TabsTrigger value="safety" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2"><ShieldAlert size={14} /> Safety</TabsTrigger>
              <TabsTrigger value="settings" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2"><Settings size={14} /> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-8">
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
            </TabsContent>

            <TabsContent value="safety" className="space-y-8">
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Blacklist User Address</label>
                    <div className="flex gap-3">
                      <Input placeholder="badactor.xpr" value={newBanAddress} onChange={(e) => setNewBanAddress(e.target.value)} className="bg-black/20 border-white/10 h-12 font-black rounded-xl" />
                      <Button type="submit" disabled={processing || !newBanAddress} className="bg-red-600 hover:bg-red-500 text-white font-black px-6 rounded-xl text-[10px] uppercase tracking-widest">
                        {processing ? <Loader2 className="animate-spin" size={16} /> : "Ban User"}
                      </Button>
                    </div>
                  </form>

                  <div className="divide-y divide-white/5">
                    {bannedUsers.map((user) => (
                      <div key={user.address} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <UserX className="text-red-500" size={20} />
                          <div>
                            <p className="text-sm font-black text-white">@{user.address}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Restricted</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleUnban(user.address)} className="text-emerald-400 hover:bg-emerald-500/10 h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest">Restore Access</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-8">
              <Card className="glass-card border-white/10 p-8 rounded-[32px] max-w-2xl">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Settings size={20} /></div>
                    <CardTitle className="text-xl font-black">Global Platform Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                   <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-black text-white">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground font-medium">Restricts visitor access.</p>
                      </div>
                      <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                    {maintenanceMode && (
                      <Textarea value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} placeholder="Maintenance message..." className="bg-black/20 border-orange-500/20 h-24" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="space-y-1">
                      <p className="font-black text-white">Membership System</p>
                    </div>
                    <Switch checked={membershipActive} onCheckedChange={setMembershipActive} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membership Fee (XPR)</label>
                      <Input type="number" value={membershipFee} onChange={(e) => setMembershipFee(e.target.value)} className="bg-black/20 border-white/10 h-14 font-black rounded-xl text-lg" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Post Fee (GUY)</label>
                      <Input type="number" value={postingFeeGuy} onChange={(e) => setPostingFeeGuy(e.target.value)} className="bg-black/20 border-white/10 h-14 font-black rounded-xl text-lg" />
                    </div>
                  </div>

                  <Button onClick={handleUpdateSettings} disabled={processing} className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl uppercase tracking-widest text-[10px] gold-glow">
                    {processing ? <Loader2 className="animate-spin" /> : <><Sparkles size={14} className="mr-2" /> Save System Changes</>}
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