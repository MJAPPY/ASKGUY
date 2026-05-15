"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, X, Loader2, CheckCircle2, Zap, Sparkles, Image as ImageIcon, MessageSquare, Quote, AlertTriangle, Share2, Info, Wallet, Trash2, Calendar, User, ShieldCheck } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface RequestCardProps {
  id: string;
  requestor: string;
  title: string;
  category: string;
  amount: number;
  token: TokenSymbol;
  raised: number;
  description: string;
  status: string;
  proofUrl?: string;
  isUrgent?: boolean;
  contributions?: {
    id: string;
    user: string;
    amount: number;
    token: TokenSymbol;
    message?: string;
    timestamp: number;
  }[];
  timestamp: number;
  variant?: 'grid' | 'list';
}

const DEFAULT_THANKS = "Thanks very much to everyone who contributed to this request! Your support means the world to me.";

const RequestCard: React.FC<RequestCardProps> = ({
  id,
  requestor,
  title,
  category,
  amount,
  token,
  raised,
  description,
  status,
  proofUrl,
  isUrgent = false,
  contributions = [],
  timestamp,
  variant = 'grid'
}) => {
  const { contribute, markCompleted, deleteRequest } = useRequests();
  const { address, transferTokens, xprBalance, guyBalance, isAdmin } = useWallet();
  const [contributionAmount, setContributionAmount] = useState('100');
  const [contributionToken, setContributionToken] = useState<TokenSymbol>(token);
  const [contributionMessage, setContributionMessage] = useState('');
  const [thanksMessage, setThanksMessage] = useState(DEFAULT_THANKS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const getCategoryColor = () => {
    switch (category) {
      case 'Medical / Healthcare':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Rent / Housing':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Groceries / Food':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Utilities (Electricity, Water, Internet)':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Emergency / Crisis':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Transportation':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-white/5 text-muted-foreground border-white/10';
    }
  };

  const progress = Math.min((raised / amount) * 100, 100);
  
  const currentAddr = address?.toLowerCase()?.trim() || "";
  const ownerAddr = requestor?.toLowerCase()?.trim() || "";
  const isOwner = currentAddr !== "" && currentAddr === ownerAddr;
  
  const isCompleted = status === 'Completed';
  const isFunded = progress >= 100;

  const currentBalance = contributionToken === 'XPR' ? xprBalance : guyBalance;

  const handleContribute = async () => {
    const val = parseFloat(contributionAmount);
    if (isNaN(val) || val <= 0 || !address) {
      showError("Please enter a valid amount");
      return;
    }
    if (val > currentBalance) {
      showError(`Insufficient ${contributionToken} balance`);
      return;
    }

    setIsProcessing(true);
    try {
      const success = await transferTokens(requestor, val, contributionToken, contributionMessage || `AskGuy: ${title}`);
      if (success) {
        await contribute(id, address, val, contributionToken, contributionMessage);
        showSuccess(`Contributed ${val} ${contributionToken} to ${requestor}!`);
        setIsHelpModalOpen(false);
        setContributionMessage('');
      }
    } catch (err) {
      showError('Contribution failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await markCompleted(id, thanksMessage);
      showSuccess("Request marked as done and thanks sent!");
    } catch (err) {
      showError("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteRequest(id);
      showSuccess("Request deleted by moderator.");
    } catch (err) {
      showError("Failed to delete request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `Help @${requestor} with ${title}`,
      text: `Support @${requestor} on AskGuy! They need help with ${category}. ${description.substring(0, 50)}...`,
      url: `${window.location.origin}/profile/${requestor}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showSuccess("Profile link copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showError("Could not share request");
      }
    }
  };

  const sortedContributions = [...contributions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Card className={cn(
      "glass-card overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col h-full",
      variant === 'list' ? "flex-row h-auto min-h-[160px]" : "h-full",
      isUrgent && !isCompleted ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : '',
      isFunded && !isCompleted ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''
    )}>
      {variant === 'grid' && <div className={cn("h-1 transition-all duration-1000 shadow-[0_0_10px_currentColor]", isFunded ? "bg-emerald-500 text-emerald-500" : "bg-primary text-primary")} style={{ width: `${progress}%` }} />}
      
      <Dialog>
        <DialogTrigger asChild>
          <div className={cn("p-0 cursor-pointer hover:bg-white/[0.02] transition-colors flex-1", variant === 'list' && "flex flex-col md:flex-row items-stretch")}>
            {proofUrl && (
              <div className={cn(
                "overflow-hidden relative border-white/5 shrink-0",
                variant === 'grid' ? "w-full aspect-[21/9] border-b" : "hidden md:block w-36 h-full min-h-[160px] border-r"
              )}>
                <img src={proofUrl} alt="Request Proof" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary">
                  <ImageIcon size={10} /> Proof
                </div>
              </div>
            )}
            
            <div className={cn("p-6 flex-1 flex flex-col justify-center", variant === 'list' ? "grid grid-cols-1 md:grid-cols-12 gap-8 items-center" : "space-y-4")}>
              <div className={cn(variant === 'list' ? "md:col-span-5" : "space-y-4")}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border", getCategoryColor())}>
                    {category}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                    {formatDistanceToNow(timestamp, { addSuffix: true })}
                  </span>
                </div>

                <h3 className={cn("font-black group-hover:text-primary transition-colors line-clamp-2 tracking-tight leading-tight", variant === 'list' ? "text-xl" : "text-xl")}>
                  {title}
                </h3>

                <div className="flex items-center gap-2 mt-2 group/user">
                  <Avatar className="w-6 h-6 border border-white/20 p-0.5 bg-black/20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${requestor}`} />
                    <AvatarFallback className="text-[8px] bg-primary text-black font-black">{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs font-black text-muted-foreground group-hover/user:text-primary transition-colors uppercase tracking-widest">
                    @{requestor}
                  </div>
                </div>
              </div>

              <div className={cn(variant === 'list' ? "md:col-span-4" : "space-y-3")}>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-2">
                  <div className="flex items-center gap-1.5 text-primary">
                    <Zap size={14} className="fill-primary" />
                    <span className="text-sm">{raised.toLocaleString()} {token}</span>
                  </div>
                  <span className="text-muted-foreground opacity-50">/ {amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 p-[1px]">
                  <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", isFunded ? "bg-emerald-500" : "bg-primary shadow-[0_0_10px_rgba(244,201,93,0.3)]")} style={{ width: `${progress}%` }} />
                </div>
              </div>

              {variant === 'grid' && (
                <p className="text-sm font-bold text-foreground/90 leading-relaxed line-clamp-3 min-h-[60px] italic bg-white/5 p-4 rounded-xl border border-white/5">
                  "{description}"
                </p>
              )}
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="glass-card border-white/10 max-w-3xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.5)]">
          <DialogHeader className="p-6 md:p-8 border-b border-white/5 shrink-0 bg-white/[0.015] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10 gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className={cn("text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] border", getCategoryColor())}>
                    {category}
                  </span>
                  {isUrgent && <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em]">Urgent</span>}
                </div>
                <DialogTitle className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-white line-clamp-2">{title}</DialogTitle>
                
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center gap-2.5 group/user cursor-pointer">
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white/20 p-1 bg-black/20 group-hover/user:border-primary/50 transition-all">
                      <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${requestor}`} />
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm font-black text-white group-hover/user:text-primary transition-colors">@{requestor}</span>
                      <span className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Verified Member</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground font-black uppercase tracking-tighter text-[9px] md:text-[10px]">
                    <Calendar size={12} className="text-primary" />
                    {formatDistanceToNow(timestamp, { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                 <div className="flex gap-2">
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/10">
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-white/10 p-8 rounded-[32px]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black tracking-tight">Delete Request?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground font-medium">
                            This action will permanently remove this request and all associated activity from the platform. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                          <AlertDialogCancel className="rounded-xl font-bold h-12">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl h-12 shadow-[0_0_20px_rgba(220,38,38,0.2)]">Delete Permanently</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button variant="outline" size="icon" onClick={handleShare} className="h-9 w-9 md:h-10 md:w-10 rounded-xl border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all">
                    <Share2 size={16} />
                  </Button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-right min-w-[120px] md:min-w-[160px] space-y-1">
                  <div className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground">Raised</div>
                  <div className="text-lg md:text-2xl font-black text-primary flex items-center justify-end gap-1.5">
                    {raised.toLocaleString()} <span className="text-[10px] md:text-xs text-white/40">{token}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1 md:h-1.5 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 bg-[#0a0a0c] min-h-0">
            <div className="p-6 md:p-12 space-y-12 md:space-y-16 pb-24">
              <section className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                    <MessageSquare size={16} />
                  </div>
                  <h4 className="text-[11px] md:text-sm font-black uppercase tracking-[0.2em] text-white/90">The Situation</h4>
                </div>
                <div className="relative group">
                  <Quote className="absolute -top-4 -left-4 text-primary/10 w-16 h-16 md:w-24 md:h-24 rotate-12 transition-transform group-hover:rotate-0 duration-700" />
                  <div className="text-lg md:text-2xl font-bold leading-relaxed italic text-white/90 bg-white/[0.02] p-6 md:p-10 rounded-[28px] md:rounded-[40px] border border-white/5 relative z-10 shadow-inner">
                    "{description}"
                  </div>
                </div>
              </section>

              {proofUrl && (
                <section className="space-y-4 md:space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#1565C0]/10 border border-[#1565C0]/20 flex items-center justify-center text-[#1565C0] shadow-lg shadow-[#1565C0]/5">
                      <ImageIcon size={16} />
                    </div>
                    <h4 className="text-[11px] md:text-sm font-black uppercase tracking-[0.2em] text-white/90">Verification Proof</h4>
                  </div>
                  <div className="rounded-[28px] md:rounded-[40px] overflow-hidden border border-white/10 bg-black/40 relative group shadow-2xl p-2 md:p-4 flex justify-center">
                    <img src={proofUrl} alt="Proof" className="w-full h-auto max-h-[800px] object-contain transition-transform duration-1000 group-hover:scale-[1.02]" />
                    <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[9px] md:text-xs font-black text-emerald-400">
                      <ShieldCheck size={14} /> Image Verified
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/5">
                      <Heart size={16} className="fill-current" />
                    </div>
                    <h4 className="text-[11px] md:text-sm font-black uppercase tracking-[0.2em] text-white/90">Community Support</h4>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    {contributions.length} Contributions
                  </span>
                </div>

                {sortedContributions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                    {sortedContributions.map((msg, idx) => (
                      <div key={idx} className="p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-white/[0.015] border border-white/5 space-y-3 md:space-y-4 hover:bg-white/[0.03] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                          <Zap size={48} />
                        </div>
                        
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-3 md:gap-4">
                            <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white/10 p-1 bg-black/20">
                              <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.user}`} />
                            </Avatar>
                            <div>
                              <span className="text-xs md:text-sm font-black text-primary uppercase tracking-widest">@{msg.user}</span>
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">
                                {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <span className="text-sm md:text-base font-black text-emerald-400">+{msg.amount.toLocaleString()} {msg.token}</span>
                          </div>
                        </div>
                        {msg.message && (
                          <div className="pl-11 md:pl-14 relative z-10">
                            <p className="text-sm md:text-base font-medium text-white/80 leading-relaxed italic border-l-2 border-primary/30 pl-4 md:pl-6 py-0.5 md:py-1">
                              "{msg.message}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 md:py-24 text-center border-2 border-dashed border-white/5 rounded-[28px] md:rounded-[40px] bg-white/[0.01] space-y-3 md:space-y-4">
                    <Heart className="mx-auto text-muted-foreground/10" size={32} />
                    <div className="space-y-1">
                      <p className="text-[11px] md:text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">No gifts yet</p>
                      <p className="text-[9px] md:text-[11px] text-muted-foreground/60 font-medium">Be the first to show support for @{requestor}!</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className={cn("flex flex-col gap-3", variant === 'list' ? "p-6 border-l border-white/5 shrink-0 justify-center min-w-[160px]" : "p-6 pt-0")}>
        {!isOwner && !isCompleted && (
          <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
            <DialogTrigger asChild>
              <Button className={cn("w-full bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow uppercase tracking-widest gap-2 transition-all shadow-[0_0_15px_rgba(244,201,93,0.15)]", variant === 'list' ? "h-12 text-[11px]" : "h-14 text-sm")}>
                <Heart size={14} className="fill-current" /> Help Now
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-w-sm p-8 space-y-8 shadow-2xl rounded-[32px]">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight">Send Support</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">Helping <span className="text-primary font-bold">@{requestor}</span> with {title}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount & Token</p>
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary/80 uppercase tracking-tight">
                      <Wallet size={12} />
                      Balance: {currentBalance.toLocaleString()} {contributionToken}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        className="bg-white/5 border-white/10 h-12 font-black rounded-xl pr-16 focus:border-primary/50"
                      />
                      <button 
                        type="button"
                        onClick={() => setContributionAmount(currentBalance.toString())}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary hover:text-white transition-colors bg-primary/10 px-2 py-1 rounded-md border border-primary/20"
                      >
                        MAX
                      </button>
                    </div>
                    <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                      <SelectTrigger className="w-28 h-12 bg-white/5 border-white/10 font-black rounded-xl focus:border-primary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        <SelectItem value="XPR" className="font-black">XPR</SelectItem>
                        <SelectItem value="GUY" className="font-black">GUY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {contributionToken !== token && (
                    <div className="flex gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <Info size={14} className="text-blue-400 shrink-0" />
                      <p className="text-[9px] leading-tight text-blue-100/70 font-bold uppercase tracking-tight">
                        Note: Gifts in {contributionToken} won't update the progress bar, but will be sent directly to @{requestor}.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message (Optional)</p>
                  <Input
                    placeholder="WAGMI! Stay strong."
                    value={contributionMessage}
                    onChange={(e) => setContributionMessage(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 italic rounded-xl focus:border-primary/50"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button className="w-full bg-primary hover:bg-primary/90 text-black font-black h-14 rounded-2xl gold-glow transition-all shadow-[0_0_25px_rgba(244,201,93,0.2)] uppercase tracking-widest text-xs" onClick={handleContribute} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin mr-2" size={18} /> : <Zap size={18} className="mr-2 fill-current" />}
                  Confirm & Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {isOwner && !isCompleted && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className={cn("w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-black rounded-xl gap-2 uppercase tracking-widest", variant === 'list' ? "h-12 text-[10px]" : "h-14 text-xs")} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> Mark as Done</>}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-white/10 p-8 rounded-[32px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black tracking-tight">Mark as Done</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground font-medium">Complete your request and send a thanks to your supporters.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4 space-y-4">
                <Textarea value={thanksMessage} onChange={(e) => setThanksMessage(e.target.value)} className="min-h-[100px] bg-white/5 border-white/10 rounded-2xl italic font-medium" />
              </div>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="rounded-xl font-bold h-12">Not Yet</AlertDialogCancel>
                <AlertDialogAction onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl h-12 shadow-[0_0_20px_rgba(16,185,129,0.25)]">Confirm & Send Thanks</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isAdmin && !isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className={cn("w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 font-black rounded-xl gap-2 uppercase tracking-widest", variant === 'list' ? "h-12 text-[10px]" : "h-10 text-[10px]")}>
                <Trash2 size={14} /> Delete Request
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-white/10 p-8 rounded-[32px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black tracking-tight text-red-400">Moderator Action</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground font-medium">
                  Are you sure you want to remove this request from the platform? This action is permanent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="rounded-xl font-bold h-12">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white font-black rounded-xl h-12">Delete Permanently</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isCompleted && (
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-widest"><CheckCircle2 size={12} /> COMPLETED</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RequestCard;