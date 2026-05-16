"use client";

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Heart, X, Loader2, CheckCircle2, Zap, Share2, Trash2, Calendar, Edit3, Gift, ShieldCheck } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import EditRequestDialog from './EditRequestDialog';

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
  const { address, transferTokens, xprBalance, guyBalance, isAdmin, avatarSet } = useWallet();
  const [contributionAmount, setContributionAmount] = useState('100');
  const [contributionToken, setContributionToken] = useState<TokenSymbol>(token);
  const [contributionMessage, setContributionMessage] = useState('');
  const [thanksMessage, setThanksMessage] = useState(DEFAULT_THANKS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const guyTotal = useMemo(() => {
    return (contributions || [])
      .filter(c => c.token === 'GUY')
      .reduce((acc, c) => acc + c.amount, 0);
  }, [contributions]);

  const getCategoryColor = () => {
    switch (category) {
      case 'Medical / Healthcare': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Rent / Housing': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Groceries / Food': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Utilities (Electricity, Water, Internet)': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Emergency / Crisis': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Transportation': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-white/5 text-muted-foreground border-white/10';
    }
  };

  const progress = Math.min((raised / amount) * 100, 100);
  const isOwner = address?.toLowerCase() === requestor?.toLowerCase();
  const isCompleted = status === 'Completed';
  const isFunded = progress >= 100;
  const currentBalance = contributionToken === 'XPR' ? xprBalance : guyBalance;

  const handleContribute = async () => {
    const val = parseFloat(contributionAmount);
    if (isNaN(val) || val <= 0 || !address) return showError("Please enter a valid amount");
    if (val > currentBalance) return showError(`Insufficient ${contributionToken} balance`);

    setIsProcessing(true);
    try {
      const success = await transferTokens(requestor, val, contributionToken, contributionMessage || `AskGuy: ${title}`);
      if (success) {
        await contribute(id, address, val, contributionToken, contributionMessage);
        showSuccess(`Contributed ${val} ${contributionToken} to ${requestor}!`);
        setIsHelpModalOpen(false);
      }
    } catch (err) { showError('Contribution failed'); } finally { setIsProcessing(false); }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await markCompleted(id, thanksMessage);
      showSuccess("Request marked as done!");
    } catch (err) { showError("Failed to update status"); } finally { setIsProcessing(false); }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    setIsProcessing(true);
    try { await deleteRequest(id); } finally { setIsProcessing(false); }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/profile/${requestor}`;
    navigator.clipboard.writeText(url);
    showSuccess("Profile link copied!");
  };

  const sortedContributions = [...contributions].sort((a, b) => b.timestamp - a.timestamp);

  const StatusDisplay = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[13px] font-black uppercase tracking-tight">
          <div className="flex items-center gap-2 text-primary">
            <Zap size={16} className="fill-primary" />
            <span className="text-lg md:text-xl leading-none">{raised.toLocaleString()}</span>
            <span className="opacity-70 text-[10px] mt-0.5">{token}</span>
          </div>
          <div className="flex items-center gap-1 opacity-50 text-[11px]">
            <span>/</span>
            <span>{amount.toLocaleString()}</span>
            <span className="text-[9px] mt-0.5">{token}</span>
          </div>
        </div>
        
        <div className="w-full bg-white/5 rounded-full h-2.5 border border-white/5 p-[1px] overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000", isFunded ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-primary shadow-[0_0_15px_rgba(251,212,81,0.2)]")} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {guyTotal > 0 && (
        <div className="flex items-center gap-2 text-rose-400 font-black uppercase text-[11px] tracking-widest pl-0.5 animate-in fade-in duration-700">
          <Heart size={12} className="fill-current" />
          {guyTotal.toLocaleString()} GUY Gifted
        </div>
      )}
    </div>
  );

  return (
    <Card className={cn(
      "glass-card overflow-hidden group hover:border-primary/40 transition-all duration-500 relative flex flex-col",
      variant === 'list' ? "h-auto" : "h-full",
      isUrgent && !isCompleted ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : '',
      isFunded && !isCompleted ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''
    )}>
      <Dialog>
        <DialogTrigger asChild>
          <div className={cn("p-0 cursor-pointer hover:bg-white/[0.02] transition-colors flex h-full", variant === 'list' ? "flex-col md:flex-row" : "flex-col")}>
            {proofUrl && (
              <div className={cn("overflow-hidden relative border-white/5 shrink-0", variant === 'grid' ? "w-full aspect-[21/9] border-b" : "w-full md:w-56 aspect-video md:aspect-auto border-b md:border-b-0 md:border-r")}>
                <img src={proofUrl} alt="Proof" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            
            <div className={cn("p-6 flex-1", variant === 'list' ? "grid grid-cols-1 md:grid-cols-12 gap-8 items-center" : "flex flex-col space-y-7")}>
              {/* Left Section: Request Details */}
              <div className={cn("space-y-4", variant === 'list' ? "md:col-span-6 lg:col-span-5" : "")}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.1em] border shadow-sm", getCategoryColor())}>
                    {category}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                    {formatDistanceToNow(timestamp, { addSuffix: true })}
                  </span>
                </div>
                
                <h3 className={cn("font-black group-hover:text-primary transition-colors tracking-tight leading-tight uppercase italic", variant === 'list' ? "text-xl line-clamp-2 md:line-clamp-1" : "text-2xl line-clamp-2")}>
                  {title}
                </h3>
                
                <div className="flex items-center gap-3 pt-1">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Avatar className="w-7 h-7 border border-white/20 p-0.5 bg-black/20 rounded-xl relative z-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${requestor}`} />
                      <AvatarFallback>{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] hover:text-white transition-colors">@{requestor}</span>
                </div>
              </div>

              {/* Middle Section: Funding Progress */}
              <div className={cn(variant === 'list' ? "md:col-span-3 lg:col-span-4" : "")}>
                <StatusDisplay />
              </div>

              {/* Right Section: Action Button */}
              {variant === 'list' && (
                <div className="md:col-span-3 lg:col-span-3 flex justify-end">
                  {!isCompleted && !isOwner && (
                    <Button 
                      onClick={(e) => { e.stopPropagation(); setIsHelpModalOpen(true); }}
                      className="w-full md:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-black font-black text-[11px] uppercase tracking-[0.15em] rounded-2xl gold-glow flex gap-3 items-center justify-center shadow-lg"
                    >
                      <Heart size={16} className="fill-current" />
                      Help Now
                    </Button>
                  )}
                  {isOwner && !isCompleted && (
                    <Button 
                      onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
                      variant="outline"
                      className="w-full md:w-auto h-12 px-8 border-white/10 hover:bg-white/5 font-black text-[11px] uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2"
                    >
                      <Edit3 size={16} />
                      Manage
                    </Button>
                  )}
                  {isCompleted && (
                    <div className="w-full md:w-auto h-12 px-8 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-black text-[11px] uppercase tracking-[0.15em] rounded-2xl flex items-center gap-3 justify-center">
                      <CheckCircle2 size={16} />
                      Completed
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogTrigger>

        {/* Detailed Modal Content (Same as before) */}
        <DialogContent className="glass-card border-white/10 max-w-3xl h-[90vh] overflow-hidden flex flex-col p-0 rounded-[32px] shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/[0.015] shrink-0 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-[#1565C0]/30 p-1.5 bg-black/20 rounded-[20px] shadow-lg">
                  <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${requestor}`} />
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">@{requestor}</h2>
                    <Badge className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-xl border", getCategoryColor())}>{category}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={12} /> Posted {formatDistanceToNow(timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleShare} className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground">
                  <Share2 size={18} />
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={handleDelete} className="h-11 w-11 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/20 text-red-400">
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-black tracking-tight text-white leading-tight uppercase italic">{title}</h1>
              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                <p className="text-lg text-foreground/90 leading-relaxed font-medium pl-2 italic">
                  "{description}"
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-10">
                {proofUrl && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-400" /> 
                      Verification Proof
                    </h4>
                    <div className="rounded-[32px] overflow-hidden border border-white/10 bg-black/40 shadow-2xl">
                      <img src={proofUrl} alt="Proof" className="w-full h-auto object-contain max-h-[400px]" />
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <Heart size={14} className="text-rose-400" />
                      Supporters List ({contributions.length})
                    </h4>
                    {guyTotal > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                        {guyTotal.toLocaleString()} GUY Included
                      </Badge>
                    )}
                  </div>

                  {sortedContributions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {sortedContributions.map((c, i) => (
                        <div key={i} className="glass-card bg-white/[0.02] border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/[0.04] transition-all group">
                          <Avatar className="w-12 h-12 border border-white/10 p-1 bg-black/20 rounded-xl group-hover:scale-110 transition-transform">
                            <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${c.user}`} />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-base font-black text-white">@{c.user}</p>
                              <p className="text-[12px] font-black text-emerald-400">+{c.amount.toLocaleString()} {c.token}</p>
                            </div>
                            {c.message && (
                              <p className="text-sm text-muted-foreground italic font-medium leading-relaxed">"{c.message}"</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest mt-2">
                              {formatDistanceToNow(c.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
                        <Gift size={32} />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em]">No contributions yet. Be the first!</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="p-8 border-t border-white/5 bg-white/[0.01] shrink-0">
              <div className="flex flex-col sm:flex-row gap-4">
                {!isCompleted && !isOwner && (
                  <Button 
                    onClick={() => setIsHelpModalOpen(true)}
                    className="flex-1 h-16 bg-primary hover:bg-primary/90 text-black font-black text-[12px] uppercase tracking-[0.2em] rounded-2xl gold-glow gap-3"
                  >
                    <Heart size={20} className="fill-current" />
                    Help This Person
                  </Button>
                )}
                {isOwner && !isCompleted && (
                  <div className="flex-1 flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={() => setIsEditModalOpen(true)}
                      variant="outline" 
                      className="flex-1 h-16 border-white/10 hover:bg-white/5 text-white font-black text-[12px] uppercase tracking-[0.2em] rounded-2xl gap-3"
                    >
                      <Edit3 size={18} /> Edit Request
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[12px] uppercase tracking-[0.2em] rounded-2xl gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                          <CheckCircle2 size={22} /> Complete Request
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-white/10 p-8 rounded-[32px]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight italic">Ready to Archive?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground font-medium">This will mark your request as completed. Leave a final thank you message for your supporters.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-6 space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Final Thank You</label>
                          <Textarea value={thanksMessage} onChange={(e) => setThanksMessage(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-32 leading-relaxed" />
                        </div>
                        <AlertDialogFooter className="gap-3">
                          <AlertDialogCancel className="bg-white/5 border-white/10 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]">Back</AlertDialogCancel>
                          <AlertDialogAction onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-500 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]">Complete & Archive</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Modals */}
      <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
        <DialogContent className="glass-card border-white/10 max-w-md p-8 rounded-[32px] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight uppercase italic">Send Support</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">Your contribution goes directly to the recipient's wallet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Amount</label>
                <Input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className="h-14 bg-white/5 border-white/10 font-black text-xl rounded-2xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Token</label>
                <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                  <SelectTrigger className="h-14 bg-white/5 border-white/10 font-black rounded-2xl text-base"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="XPR" className="font-black">XPR</SelectItem>
                    <SelectItem value="GUY" className="font-black">GUY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Message (Optional)</label>
              <Textarea placeholder="Send a kind word..." value={contributionMessage} onChange={(e) => setContributionMessage(e.target.value)} className="bg-white/5 border-white/10 rounded-xl font-medium" />
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Your Balance</span>
              <span className="text-sm font-black text-primary">{currentBalance.toLocaleString()} {contributionToken}</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleContribute} disabled={isProcessing} className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow">
              {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isEditModalOpen && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <EditRequestDialog request={{ id, title, description, proofUrl }} onSuccess={() => setIsEditModalOpen(false)} />
        </Dialog>
      )}

      {!isCompleted && variant === 'grid' && (
        <div className="p-5 pt-0 mt-auto">
          <Button 
            onClick={() => setIsHelpModalOpen(true)}
            className="w-full bg-primary hover:bg-primary/90 text-black font-black text-[12px] uppercase tracking-[0.2em] h-12 rounded-2xl gold-glow gap-3 shadow-[0_10px_30px_rgba(251,212,81,0.1)]"
          >
            <Heart size={16} className="fill-current" />
            Help Now
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RequestCard;