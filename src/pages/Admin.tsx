"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRequests } from '@/hooks/use-requests';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  Loader2, 
  ShieldCheck, 
  Trash2,
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Admin = () => {
  const { isConnected, isAdmin } = useWallet();
  const { clearAllRequests } = useRequests();
  const [bannedUsers, setBannedUsers] = useState<{ address: string, created_at: string }[]>([]);
  const [newBanAddress, setNewBanAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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

  const handleWipeRequests = async () => {
    setProcessing(true);
    await clearAllRequests();
    setProcessing(false);
  };

  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-12 text-center space-y-6 border-red-500/20">
          <ShieldAlert className="text-red-500 mx-auto" size={48} />
          <h1 className="text-2xl font-black">Access Denied</h1>
          <p className="text-muted-foreground">This area is restricted to the platform owner.</p>
          <Button asChild variant="outline" className="w-full">
            <a href="/">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <ShieldCheck className="text-primary" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage community safety and platform data.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 glass-card border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <UserX size={20} className="text-red-400" />
                  Ban User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBan} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Address</label>
                    <Input 
                      placeholder="e.g. spammer.xpr" 
                      value={newBanAddress}
                      onChange={(e) => setNewBanAddress(e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={processing || !newBanAddress}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold"
                  >
                    {processing ? <Loader2 className="animate-spin" size={18} /> : "Blacklist Address"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Blacklisted Wallets</CardTitle>
                <div className="text-[10px] font-black px-2 py-1 rounded-full bg-white/5 border border-white/10 uppercase tracking-widest">
                  {bannedUsers.length} Total
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : bannedUsers.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {bannedUsers.map((user) => (
                      <div key={user.address} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                            <UserX size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{user.address}</p>
                            <p className="text-[10px] text-muted-foreground">Banned on {new Date(user.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleUnban(user.address)}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <UserCheck size={16} className="mr-2" />
                          Unban
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground italic">
                    No users are currently blacklisted.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="border-red-500/50 bg-red-500/5 overflow-hidden">
            <CardHeader className="bg-red-500/10 border-b border-red-500/20">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle size={24} />
                <CardTitle className="text-xl font-black uppercase tracking-tight">Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-red-200/60">
                These actions are irreversible. Please proceed with extreme caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Wipe All Platform Data</h3>
                  <p className="text-sm text-muted-foreground max-w-lg">
                    This will permanently delete every single request and contribution record from the database. This cannot be undone.
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="h-14 px-8 font-black rounded-xl gap-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      disabled={processing}
                    >
                      <Trash2 size={20} />
                      Wipe All Requests
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-red-500/30 p-8 rounded-[32px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-3xl font-black tracking-tight text-white">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground text-base font-medium leading-relaxed">
                        This action will <span className="text-white font-black underline decoration-red-500 underline-offset-4">permanently delete</span> all request cards and contribution history. There is no recovery once this is done.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 pt-6">
                      <AlertDialogCancel className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase tracking-widest text-xs px-8">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleWipeRequests}
                        className="bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl h-14 px-10 shadow-xl uppercase tracking-widest text-xs"
                      >
                        Yes, Wipe Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;