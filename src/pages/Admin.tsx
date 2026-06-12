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
  Eye,
  MoreVertical,
  CheckCircle2,
  Filter,
  Users,
  DollarSign,
  Coins,
  RefreshCw,
  ArrowUpRight,
  Lock,
  Unlock,
  Wallet
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { hashPassword } from '@/utils/crypto';

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
  
  const { requests, deleteRequest, batchDeleteRequests, fetchRequests, loading: requestsLoading } = useRequests();
  const [bannedUsers, setBannedUsers] = useState<{ address: string, created_at: string }[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [qtrMemberCount, setQtrMemberCount] = useState(0);
  const [newBanAddress, setNewBanAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modSearch, setModSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Security Credentials state
  const [isPasswordSet, setIsPasswordSet] = useState(false);
  const [adminSecret, setAdminSecret] = useState(sessionStorage.getItem('askguy_admin_secret') || '');
  const [isSecretSaved, setIsSecretSaved] = useState(
    !!sessionStorage.getItem('askguy_admin_secret')
  );
  
  // Local state for form management
  const [membershipActive, setMembershipActive] = useState(currentEnabled);
  const [membershipFee, setMembershipFee] = useState(currentFee.toString());
  const [postingFeeGuy, setPostingFeeGuy] = useState(currentPostingFee.toString());
  const [selectedAvatarSet, setSelectedAvatarSet] = useState(currentAvatarSet);
  const [maintenanceMode, setMaintenanceMode] = useState(currentMaintenance);
  const [maintenanceMessage, setMaintenanceMessage] = useState(currentMessage);

  const [individualRewards, setIndividualRewards] = useState<Record<string, string>>({});

  // Sync local state when global state updates
  useEffect(() => {
    setMembershipActive(currentEnabled);
    setMembershipFee(currentFee.toString());
    setPostingFeeGuy(currentPostingFee.toString());
    setSelectedAvatarSet(currentAvatarSet);
    setMaintenanceMode(currentMaintenance);
    setMaintenanceMessage(currentMessage);
  }, [currentEnabled, currentFee, currentPostingFee, currentAvatarSet, currentMaintenance, currentMessage]);

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
      .slice(0, 10)
      .map(([address, amount]) => ({ address, amount }));

    const totalGUYFees = requests.length * currentPostingFee;

    return { 
      totalRequests: requests.length, 
      activeRequests: requests.filter(r => r.status === 'Open').length, 
      completedRequests: requests.filter(r => r.status === 'Completed').length, 
      totalXPRGiven,
      totalGUYGiven,
      totalGUYFees,
      top5 
    };
  }, [requests, currentPostingFee]);

  const membershipRevenue = useMemo(() => {
    return memberCount * parseFloat(membershipFee || "0");
  }, [memberCount, membershipFee]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
      req.title.toLowerCase().includes(modSearch.toLowerCase()) || 
      req.requestor.toLowerCase().includes(modSearch.toLowerCase())
    );
  }, [requests, modSearch]);

  const checkPasswordConfigured = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_secrets')
        .select('id, password_hash')
        .eq('id', 'global')
        .maybeSingle();
      setIsPasswordSet(!!data && !!data.password_hash);
    } catch {
      setIsPasswordSet(false);
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const now = new Date();
      const qtStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString();

      const [banRes, profileRes, qtrProfileRes] = await Promise.all([
        supabase.from('banned_users').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', qtStart)
      ]);
      
      if (banRes.error) throw banRes.error;
      setBannedUsers(banRes.data || []);
      setMemberCount(profileRes.count || 0);
      setQtrMemberCount(qtrProfileRes.count || 0);
      await checkPasswordConfigured();
    } catch (err) {
      console.error("[Admin] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchRequests(),
        fetchData(true),
        fetchSettings()
      ]);
      showSuccess("All stats and settings refreshed.");
    } catch (err) {
      showError("Refresh failed.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveAdminSecret = async () => {
    if (!adminSecret.trim()) {
      showError("Secret cannot be empty.");
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase
        .from('admin_secrets')
        .select('password_hash')
        .eq('id', 'global')
        .maybeSingle();

      if (error || !data) {
        throw new Error("Secret table unconfigured. Please configure your database table first.");
      }

      const hash = await hashPassword(adminSecret.trim());
      if (hash === data.password_hash) {
        sessionStorage.setItem('askguy_admin_secret', adminSecret.trim());
        setIsSecretSaved(true);
        showSuccess("Admin Secret successfully configured for session.");
      } else {
        showError("Invalid Admin Secret password.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to verify credentials.");
    } finally {
      setProcessing(false);
    }
  };

  const initializePassword = async () => {
    if (!adminSecret.trim() || adminSecret.trim().length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }
    setProcessing(true);
    try {
      const hashed = await hashPassword(adminSecret.trim());
      const { error } = await supabase
        .from('admin_secrets')
        .upsert({ id: 'global', password_hash: hashed }, { onConflict: 'id' });

      if (error) throw error;
      sessionStorage.setItem('askguy_admin_secret', adminSecret.trim());
      setIsSecretSaved(true);
      setIsPasswordSet(true);
      showSuccess("Master Admin Password initialized and saved securely!");
    } catch (err: any) {
      showError(err.message || "Initialization failed.");
    } finally {
      setProcessing(false);
    }
  };

  const clearAdminSecret = () => {
    sessionStorage.removeItem('askguy_admin_secret');
    setAdminSecret('');
    setIsSecretSaved(false);
    showSuccess("Admin Secret cleared from session memory.");
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleUpdateSettings = async () => {
    if (!isSecretSaved) {
      showError("Please authenticate with your Admin Secret above first.");
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          membership_active: Boolean(membershipActive),
          membership_fee: parseFloat(membershipFee || "0"),
          posting_fee_guy: parseFloat(postingFeeGuy || "0"),
          avatar_set: selectedAvatarSet,
          maintenance_mode: Boolean(maintenanceMode),
          maintenance_message: maintenanceMessage 
        })
        .eq('id', 'global');

      if (error) throw error;
      await fetchSettings();
      showSuccess("Global settings updated successfully!");
    } catch (err: any) {
      showError(err.message || "Failed to update settings.");
    } finally {
      setProcessing(false);
    }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanAddress) return;
    if (!isSecretSaved) {
      showError("Please authenticate with your Admin Secret above first.");
      return;
    }
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('banned_users')
        .insert({ address: newBanAddress.toLowerCase().trim() });
      
      if (error) throw error;
      showSuccess(`${newBanAddress} blacklisted.`);
      setNewBanAddress('');
      fetchData(true);
    } catch (err: any) {
      showError(err.message || "Failed to ban user.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnban = async (targetAddress: string) => {
    if (!isSecretSaved) {
      showError("Please authenticate with your Admin Secret above first.");
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('address', targetAddress.toLowerCase().trim());
      
      if (error) throw error;
      showSuccess(`${targetAddress} restored.`);
      fetchData(true);
    } catch (err: any) {
      showError(err.message || "Failed to unban user.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReward = async (target: string, amount: number) => {
    if (amount <= 0) return;
    setProcessing(true);
    try {
      const success = await transferTokens(target, amount, 'GUY', 'Platform Reward for Generosity');
      if (success) {
        showSuccess(`Rewarded ${amount} GUY to @${target}`);
      }
    } catch (err) {
      showError("Reward failed.");
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

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
          
          {/* Admin Credentials Panel */}
          <Card className={cn(
            "glass-card border-[3px] p-6 rounded-[28px] transition-all duration-300 relative overflow-hidden",
            isSecretSaved ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
                  isSecretSaved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                )}>
                  {isSecretSaved ? <Unlock size={24} /> : <Lock size={24} />}
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-lg tracking-tight uppercase">
                    {!isPasswordSet ? "Set Master Password" : isSecretSaved ? "Console Unlocked" : "Engine Security Settings"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium max-w-xl">
                    {!isPasswordSet 
                      ? "Welcome master administrator! Since no password hash exists in your secure database, please initialize a master password below."
                      : isSecretSaved 
                        ? "Admin Secret matches configured variables. You can execute all settings modifications and moderations." 
                        : "Configure your ADMIN_SECRET key below to unlock writing/updating platform rules securely."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {!isPasswordSet ? (
                  <div className="flex gap-2 w-full">
                    <Input 
                      type="password"
                      placeholder="Define Admin Password..."
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="bg-black/40 border-primary/20 h-12 font-black rounded-xl"
                    />
                    <Button 
                      onClick={initializePassword}
                      disabled={processing}
                      className="bg-primary text-black font-black h-12 px-6 rounded-xl animate-pulse"
                    >
                      Initialize Password
                    </Button>
                  </div>
                ) : isSecretSaved ? (
                  <Button 
                    onClick={clearAdminSecret}
                    variant="outline"
                    className="w-full md:w-auto h-12 px-6 border-red-500/20 hover:bg-red-500/10 text-red-400 font-black rounded-xl"
                  >
                    Lock Console
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Input 
                      type="password"
                      placeholder="Enter Admin Secret..."
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="bg-black/40 border-white/10 h-12 font-black rounded-xl"
                    />
                    <Button 
                      onClick={saveAdminSecret}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black h-12 px-6 rounded-xl"
                    >
                      Verify
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(244,201,93,0.1)]">
                  <ShieldCheck className="text-primary" size={28} />
                </div>
                <h1 className="text-4xl font-black tracking-tight">System Control</h1>
              </div>
              <p className="text-muted-foreground font-medium">Platform-wide management & security dashboard.</p>
            </div>
            <Button 
              onClick={handleGlobalRefresh} 
              disabled={isRefreshing}
              className="h-14 px-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black rounded-2xl gap-3 transition-all"
            >
              {isRefreshing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} className={cn(isRefreshing && "animate-spin")} />}
              Refresh Data
            </Button>
          </div>

          <Tabs defaultValue="analytics" className="space-y-8">
            <TabsList className="bg-white/5 border border-white/10 p-1.5 h-14 rounded-2xl w-full md:w-auto justify-start overflow-x-auto no-scrollbar">
              <TabsTrigger value="analytics" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2"><TrendingUp size={14} /> Analytics</TabsTrigger>
              <TabsTrigger value="moderation" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2"><Activity size={14} /> Requests</TabsTrigger>
              <TabsTrigger value="safety" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2"><ShieldAlert size={14} /> Safety</TabsTrigger>
              <TabsTrigger value="settings" className="px-8 font-black text-[10px] uppercase tracking-widest h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all gap-2"><Settings size={14} /> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total XPR Gifted</p>
                  <h3 className="text-3xl font-black text-white">{stats.totalXPRGiven.toLocaleString()} <span className="text-xs text-muted-foreground">XPR</span></h3>
                </Card>
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total GUY Gifted</p>
                  <h3 className="text-3xl font-black text-rose-400">{stats.totalGUYGiven.toLocaleString()} <span className="text-xs text-muted-foreground">GUY</span></h3>
                </Card>
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Reward Pool (GUY Fees)</p>
                  <div className="flex items-center gap-3">
                    <Coins className="text-purple-400" size={24} />
                    <h3 className="text-3xl font-black text-purple-400">{stats.totalGUYFees.toLocaleString()}</h3>
                  </div>
                </Card>
                <Card className="glass-card border-white/5 p-6 rounded-[28px] relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-emerald-400 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    <ArrowUpRight size={12} />
                    +{qtrMemberCount} This QTR
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Members Joined</p>
                  <div className="flex items-center gap-3">
                    <Users className="text-blue-400" size={24} />
                    <h3 className="text-3xl font-black text-white">{memberCount}</h3>
                  </div>
                </Card>
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Membership Revenue</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Zap className="text-emerald-400" size={20} />
                    </div>
                    <h3 className="text-3xl font-black text-emerald-400">{membershipRevenue.toLocaleString()} <span className="text-xs text-muted-foreground font-black">XPR</span></h3>
                  </div>
                </Card>
                <Card className="glass-card border-white/5 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Admin Wallet Balance</p>
                  <div className="flex items-center gap-3">
                    <Zap className="text-primary" size={24} />
                    <h3 className="text-3xl font-black text-white">{guyBalance.toLocaleString()} <span className="text-xs text-muted-foreground">GUY</span></h3>
                  </div>
                </Card>
              </div>

              <Card className="glass-card border-white/10 p-8 rounded-[32px]">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-primary" size={24} />
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Top Contributors Hall of Fame</CardTitle>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Top 10 Legends</div>
                </CardHeader>
                <CardContent className="px-0 pt-6">
                  <div className="divide-y divide-white/5">
                    {stats.top5.map((user, i) => (
                      <div key={user.address} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <span className="text-2xl font-black italic text-white/20 w-8">#{i + 1}</span>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-white/10 p-0.5 bg-black/20">
                              <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.address}`} />
                            </Avatar>
                            <div>
                              <p className="text-sm font-black text-white">@{user.address}</p>
                              <p className="text-[10px] text-primary font-bold uppercase">{user.amount.toLocaleString()} XPR Contributed</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Input 
                            type="number" 
                            placeholder="Amt" 
                            className="w-24 h-9 bg-black/20 border-white/10 font-black text-xs" 
                            value={individualRewards[user.address] || ''}
                            onChange={(e) => setIndividualRewards(prev => ({ ...prev, [user.address]: e.target.value }))}
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleReward(user.address, parseFloat(individualRewards[user.address] || '0'))}
                            disabled={processing}
                            className="bg-purple-600 hover:bg-purple-500 h-9 rounded-lg font-black text-[9px] uppercase tracking-widest"
                          >
                            <Gift size={14} className="mr-2" /> Reward
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-8 animate-in fade-in duration-500">
               <Card className="glass-card border-white/10 p-8 rounded-[32px]">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <Activity className="text-primary" size={24} />
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Request Moderation Queue</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <Input 
                        placeholder="Search users/titles..." 
                        value={modSearch}
                        onChange={(e) => setModSearch(e.target.value)}
                        className="bg-black/20 border-white/10 h-10 w-64 pl-10 rounded-xl"
                      />
                    </div>
                    {selectedIds.length > 0 && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => batchDeleteRequests(selectedIds)}
                        className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest"
                      >
                        Delete Selected ({selectedIds.length})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-0 pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <th className="py-4 px-2 w-10">
                            <Checkbox 
                              checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                              onCheckedChange={(checked) => {
                                setSelectedIds(checked ? filteredRequests.map(r => r.id) : []);
                              }}
                            />
                          </th>
                          <th className="py-4 px-4">Requestor</th>
                          <th className="py-4 px-4">Title</th>
                          <th className="py-4 px-4">Category</th>
                          <th className="py-4 px-4">Amount</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRequests.map((req) => (
                          <tr key={req.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-2">
                              <Checkbox 
                                checked={selectedIds.includes(req.id)}
                                onCheckedChange={() => toggleSelection(req.id)}
                              />
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-white/10 p-0.5 bg-black/20">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${req.requestor}`} />
                                </Avatar>
                                <span className="font-black text-sm text-white">@{req.requestor}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 max-w-[200px] truncate font-medium text-white/80">{req.title}</td>
                            <td className="py-4 px-4">
                              <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-white/5 border border-white/10">{req.category}</span>
                            </td>
                            <td className="py-4 px-4 font-black text-primary">{req.amount} {req.token}</td>
                            <td className="py-4 px-4">
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                req.status === 'Open' ? "text-primary bg-primary/10" : "text-emerald-400 bg-emerald-500/10"
                              )}>
                                {req.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteRequest(req.id)}
                                className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredRequests.length === 0 && (
                      <div className="py-20 text-center text-muted-foreground italic text-sm">No requests found.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="safety" className="space-y-8 animate-in fade-in duration-500">
              <Card className="glass-card border-white/10 p-8 rounded-[32px] max-w-2xl">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                      <ShieldAlert size={20} />
                    </div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Security & Blacklist</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-8 pt-6">
                  <form onSubmit={handleBan} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Blacklist User Address</label>
                    <div className="flex gap-3">
                      <Input placeholder="badactor.xpr" value={newBanAddress} onChange={(e) => setNewBanAddress(e.target.value)} className="bg-black/20 border-white/10 h-12 font-black rounded-xl" />
                      <Button type="submit" disabled={processing || !newBanAddress} className="bg-red-600 hover:bg-red-500 text-white font-black px-6 rounded-xl text-[10px] uppercase tracking-widest">
                        {processing ? <Loader2 className="animate-spin" size={16} /> : "Ban User"}
                      </Button>
                    </div>
                  </form>

                  <div className="divide-y divide-white/5 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                    {bannedUsers.length > 0 ? bannedUsers.map((user) => (
                      <div key={user.address} className="p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <UserX className="text-red-500" size={20} />
                          <div>
                            <p className="text-sm font-black text-white">@{user.address}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Restricted {new Date(user.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleUnban(user.address)} className="text-emerald-400 hover:bg-emerald-500/10 h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest">Restore</Button>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Blacklist is empty</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 animate-in fade-in duration-500">
              <Card className="glass-card border-white/10 p-8 rounded-[32px] max-w-2xl">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Settings size={20} /></div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Global Platform Engine</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-8 pt-6">
                   <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-black text-white">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground font-medium">Temporarily disable visitor access.</p>
                      </div>
                      <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                    {maintenanceMode && (
                      <Textarea value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} placeholder="Maintenance message..." className="bg-black/20 border-orange-500/20 h-24 rounded-xl leading-relaxed font-medium" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="space-y-1">
                      <p className="font-black text-white">Membership System</p>
                      <p className="text-xs text-muted-foreground font-medium">Toggle verified posting requirements.</p>
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

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Avatar Style</label>
                    <Select value={selectedAvatarSet} onValueChange={setSelectedAvatarSet}>
                      <SelectTrigger className="h-14 bg-black/20 border-white/10 font-black rounded-xl">
                        <SelectValue placeholder="Select avatar style" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="pixel-art" className="font-black">Pixel Art</SelectItem>
                        <SelectItem value="avataaars" className="font-black">Avatars</SelectItem>
                        <SelectItem value="bottts" className="font-black">Robots</SelectItem>
                        <SelectItem value="micah" className="font-black">Micah</SelectItem>
                        <SelectItem value="miniavs" className="font-black">Mini Avatars</SelectItem>
                        <SelectItem value="open-peeps" className="font-black">Open Peeps</SelectItem>
                        <SelectItem value="personas" className="font-black">Personas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleUpdateSettings} disabled={processing} className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl uppercase tracking-widest text-[10px] gold-glow">
                    {processing ? <Loader2 className="animate-spin" /> : <><Sparkles size={14} className="mr-2" /> Deploy Global Updates</>}
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