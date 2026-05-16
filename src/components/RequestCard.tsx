"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Heart, X, Loader2, CheckCircle2, Zap, Sparkles, Image as ImageIcon, MessageSquare, Quote, AlertTriangle, Share2, Info, Wallet, Trash2, Calendar, User, ShieldCheck, Gift, Edit3 } from 'lucide-react';
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

  const handleDelete = async () => {
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

  return (
    <Card className={cn(
      "glass-card overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col h-full",
      variant === 'list' ? "flex-row h-auto min-h-[160px]" : "h-full",
      isUrgent && !isCompleted ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : '',
      isFunded && !isCompleted ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''
    )}>
      <Dialog>
        <DialogTrigger asChild>
          <div className={cn("p-0 cursor-pointer hover:bg-white/[0.02] transition-colors flex-1", variant === 'list' && "flex flex-col md:flex-row items-stretch")}>
            {proofUrl && (
              <div className={cn("overflow-hidden relative border-white/5 shrink-0", variant === 'grid' ? "w-full aspect-[21/9] border-b" : "hidden md:block w-36 h-full border-r")}>
                <img src={proofUrl} alt="Proof" className="w-full h-full object-cover" />
              </div>
            )}
            <div className={cn("p-6 flex-1 flex flex-col justify-between", variant === 'list' ? "grid grid-cols-1 md:grid-cols-12 gap-8 items-center" : "space-y-4")}>
              <div className={variant === 'list' ? "md:col-span-5" : "space-y-4"}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border", getCategoryColor())}>{category}</span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                </div>
                <h3 className="font-black group-hover:text-primary transition-colors text-xl leading-tight">{title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-6 h-6 border border-white/20 p-0.5 bg-black/20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${requestor}`} />
                    <AvatarFallback>{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">@{requestor}</div>
                </div>
              </div>

              <div className={variant === 'list' ? "md:col-span-4" : "space-y-3"}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Zap size={12} className="fill-primary" />
                        {raised.toLocaleString()} {token}
                      </div>
                      {guyTotal > 0 && (
                        <div className="flex items-center gap-1.5 text-rose-400">
                          <Heart size={10} className="fill-current" />
                          {guyTotal.toLocaleString()} GUY Gifted
                        </div>
                      )}
                    </div>
                    <span className="text-muted-foreground opacity-50 self-start">/ {amount.toLocaleString()} {token}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 border border-white/5 p-[1px]">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", isFunded ? "bg-emerald-500" : "bg-primary")} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="glass-card border-white/10 max-w-3xl h-[90vh] overflow-hidden flex flex-col p-0 rounded-[32px] shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/[0.015] shrink-0 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-[#1565C0]/30 p-1.5 bg-black/20 rounded-[20px] shadow-lg">
                  <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${requestor}`} />
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-black text-white uppercase italic">@{requestor}</h2>
                    <Badge className={cn("text-[9px] uppercase px-2 py-0.5", getCategoryColor())}>{category}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> Posted {formatDistanceToNow(timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleShare}
                  className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground"
                >
                  <Share2 size={18} />
                </Button>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleDelete}
                    className="h-11 w-11 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-black tracking-tight text-white leading-tight">{title}</h1>
              <div className="relative group">
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
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
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
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Heart size={14} className="text-rose-400" />
                      Supporters List ({contributions.length})
                    </h4>
                    {guyTotal > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest">
                        {guyTotal.toLocaleString()} GUY Included
                      </Badge>
                    )}
                  </div>

                  {sortedContributions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {sortedContributions.map((c, i) => (
                        <div key={i} className="glass-card bg-white/[0.02] border-white/5 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/[0.04] transition-all group">
                          <Avatar className="w-10 h-10 border border-white/10 p-1 bg-black/20 rounded-xl group-hover:scale-110 transition-transform">
                            <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${c.user}`} />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-sm font-black text-white">@{c.user}</p>
                              <p className="text-[10px] font-black text-emerald-400">+{c.amount.toLocaleString()} {c.token}</p>
                            </div>
                            {c.message && (
                              <p className="text-xs text-muted-foreground italic font-medium">"{c.message}"</p>
                            )}
                            <p className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest mt-2">
                              {formatDistanceToNow(c.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
                        <Gift size={28} />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">No contributions yet. Be the first!</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="p-8 border-t border-white/5 bg-white/[0.01] shrink-0">
              <div className="flex flex-col sm:flex-row gap-4">
                {!isCompleted && !isOwner && (
                  <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 h-14 bg-primary hover:bg-primary/90 text-black font-black text-sm uppercase tracking-widest rounded-2xl gold-glow gap-3">
                        <Heart size={20} className="fill-current" />
                        Help This Person
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-white/10 max-w-md p-8 rounded-[32px] shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Send Support</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">Your contribution goes directly to the recipient's wallet.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</label>
                            <Input 
                              type="number" 
                              value={contributionAmount} 
                              onChange={(e) => setContributionAmount(e.target.value)}
                              className="h-12 bg-white/5 border-white/10 font-black text-lg rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Token</label>
                            <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                              <SelectTrigger className="h-12 bg-white/5 border-white/10 font-black rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-card">
                                <SelectItem value="XPR">XPR</SelectItem>
                                <SelectItem value="GUY">GUY</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message (Optional)</label>
                          <Textarea 
                            placeholder="Send a kind word..."
                            value={contributionMessage}
                            onChange={(e) => setContributionMessage(e.target.value)}
                            className="bg-white/5 border-white/10 rounded-xl font-medium"
                          />
                        </div>
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Your Balance</span>
                          <span className="text-sm font-black text-primary">{currentBalance.toLocaleString()} {contributionToken}</span>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleContribute}
                          disabled={isProcessing}
                          className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow"
                        >
                          {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm & Send"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {isOwner && !isCompleted && (
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 h-14 border-white/10 hover:bg-white/5 text-white font-black text-sm uppercase tracking-widest rounded-2xl gap-3">
                          <Edit3 size={18} /> Edit Request
                        </Button>
                      </DialogTrigger>
                      <EditRequestDialog request={{ id, title, description, proofUrl }} onSuccess={() => setIsEditModalOpen(false)} />
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                          <CheckCircle2 size={20} /> Complete Request
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-white/10 p-8 rounded-[32px]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black">Ready to Archive?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground font-medium">This will mark your request as completed. You can leave a final thank you message for your supporters.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-6 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final Thank You</label>
                          <Textarea 
                            value={thanksMessage}
                            onChange={(e) => setThanksMessage(e.target.value)}
                            className="bg-white/5 border-white/10 rounded-xl"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/5 border-white/10 h-12 rounded-xl">Back</AlertDialogCancel>
                          <AlertDialogAction onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-500 h-12 rounded-xl font-black">Complete & Archive</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {isCompleted && (
                  <div className="flex-1 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3">
                    <CheckCircle2 size={20} />
                    This Need Has Been Met
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!isCompleted && (
        <div className="p-4 pt-0 mt-auto">
          <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest h-10 rounded-xl gold-glow gap-2">
                <Heart size={14} className="fill-current" />
                Help Now
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-w-md p-8 rounded-[32px] shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Send Support</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">Your contribution goes directly to the recipient's wallet.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</label>
                    <Input 
                      type="number" 
                      value={contributionAmount} 
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 font-black text-lg rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Token</label>
                    <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                      <SelectTrigger className="h-12 bg-white/5 border-white/10 font-black rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="XPR">XPR</SelectItem>
                        <SelectItem value="GUY">GUY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message (Optional)</label>
                  <Textarea 
                    placeholder="Send a kind word..."
                    value={contributionMessage}
                    onChange={(e) => setContributionMessage(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl font-medium"
                  />
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Your Balance</span>
                  <span className="text-sm font-black text-primary">{currentBalance.toLocaleString()} {contributionToken}</span>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleContribute}
                  disabled={isProcessing}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm & Send"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </Card>
  );
};

export default RequestCard;