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
import { Heart, X, Loader2, CheckCircle2, Zap, Sparkles, Image as ImageIcon, MessageSquare, Quote, AlertTriangle, Share2 } from 'lucide-react';
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
  const { contribute, markCompleted } = useRequests();
  const { address, transferTokens } = useWallet();
  const [contributionAmount, setContributionAmount] = useState('100');
  const [contributionToken, setContributionToken] = useState<TokenSymbol>(token);
  const [contributionMessage, setContributionMessage] = useState('');
  const [thanksMessage, setThanksMessage] = useState(DEFAULT_THANKS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const progress = Math.min((raised / amount) * 100, 100);
  const isOwner = address?.toLowerCase() === requestor?.toLowerCase();
  const isCompleted = status === 'Completed';
  const isFunded = progress >= 100;

  const quickAmounts = [10, 50, 100, 500];

  const getCategoryColor = () => {
    const cat = category.toLowerCase();
    if (cat.includes('medical')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-white/5 text-brand-offWhite border-white/10';
  };

  const handleContribute = async () => {
    const val = parseFloat(contributionAmount);
    if (isNaN(val) || val <= 0 || !address) {
      showError("Please enter a valid amount");
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `Help @${requestor} with ${title}`,
      text: `Support @${requestor} on AskGuy! They need help with ${category}.`,
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

  const cardInner = (
    <div className={cn("p-0 cursor-pointer hover:bg-white/[0.02] transition-colors flex-1", variant === 'list' && "flex flex-col md:flex-row items-stretch")}>
      {proofUrl && (
        <div className={cn(
          "overflow-hidden relative border-white/5 shrink-0",
          variant === 'grid' ? "w-full aspect-[21/9] border-b" : "hidden md:block w-36 h-full min-h-[160px] border-r"
        )}>
          <img src={proofUrl} alt="Request Proof" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest metallic-pantone">
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

          <h3 className={cn("font-black group-hover:text-brand-gold transition-colors line-clamp-2 tracking-tight leading-tight text-brand-offWhite", variant === 'list' ? "text-xl" : "text-xl")}>
            {title}
          </h3>

          <div className="flex items-center gap-2 mt-2 group/user">
            <Avatar className="w-6 h-6 border border-white/20 relative z-10 p-0.5 bg-black/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${requestor}`} />
              <AvatarFallback className="text-[8px] bg-brand-gold text-brand-dark font-black">{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-xs font-black text-muted-foreground group-hover/user:text-brand-gold transition-colors uppercase tracking-widest">
              @{requestor}
            </div>
          </div>
        </div>

        <div className={cn(variant === 'list' ? "md:col-span-4" : "space-y-3")}>
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-2">
            <div className="flex items-center gap-1.5 text-brand-gold">
              <Zap size={14} className="fill-brand-gold" />
              <span className="text-sm">{raised.toLocaleString()} {token}</span>
            </div>
            <span className="text-muted-foreground opacity-50">/ {amount.toLocaleString()}</span>
          </div>
          
          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 p-[1px]">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out relative",
                isFunded ? "success-green-bg" : "bg-brand-gold"
              )} 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>

        {variant === 'list' && (
           <div className="md:col-span-3 flex flex-wrap gap-3 justify-end items-center">
              {isCompleted ? (
                <span className="text-[10px] font-black success-green-text bg-white/5 px-3 py-1 rounded-full flex items-center gap-1.5 border border-brand-success/20 uppercase tracking-widest">
                  <CheckCircle2 size={12} /> Done
                </span>
              ) : isFunded ? (
                <span className="text-[10px] font-black text-brand-gold bg-white/5 px-3 py-1 rounded-full flex items-center gap-1.5 border border-brand-gold/20 uppercase tracking-widest animate-pulse">
                  <Sparkles size={12} /> Funded
                </span>
              ) : (
                <span className="text-[10px] font-black text-brand-blue bg-white/5 px-3 py-1 rounded-full flex items-center gap-1.5 border border-brand-blue/20 uppercase tracking-widest">
                  Open
                </span>
              )}
           </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className={cn(
      "glass-card overflow-hidden group hover:border-brand-gold/40 transition-all duration-500 flex flex-col h-full",
      variant === 'list' ? "flex-row h-auto min-h-[160px]" : "h-full"
    )}>
      <Dialog>
        <DialogTrigger asChild>
          {cardInner}
        </DialogTrigger>
        <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 shadow-2xl">
          <DialogHeader className="p-6 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-3xl font-black tracking-tight text-brand-offWhite">{title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleShare} className="h-8 w-8 rounded-full border-white/10 hover:bg-white/10">
                  <Share2 size={14} className="text-brand-offWhite" />
                </Button>
                <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border", getCategoryColor())}>
                  {category}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="w-8 h-8 border border-white/20 p-0.5 bg-black/20">
                <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${requestor}`} />
                <AvatarFallback className="text-[10px] bg-brand-gold text-brand-dark font-black">{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-black text-brand-offWhite uppercase tracking-wider">@{requestor}</span>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter ml-2">
                Posted {formatDistanceToNow(timestamp, { addSuffix: true })}
              </span>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              <div className="p-8 rounded-[24px] bg-white/[0.03] border border-white/5 italic text-brand-offWhite font-bold leading-relaxed">
                "{description}"
              </div>
              
              {proofUrl && (
                <div className="rounded-[24px] overflow-hidden border border-white/10 bg-black/40 aspect-video relative group">
                  <img src={proofUrl} alt="Proof" className="w-full h-full object-contain" />
                  <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 rounded-lg metallic-pantone text-[10px] font-black">IMAGE PROOF</div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-8 bg-black/80 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Raised</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-brand-gold">{raised.toLocaleString()}</span>
                  <span className="text-sm font-bold text-muted-foreground">/ {amount.toLocaleString()} {token}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress</p>
                <p className={cn("text-4xl font-black", isFunded ? "success-green-text" : "text-brand-offWhite")}>
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
            <DialogTrigger asChild>
               <Button className="w-full btn-primary-blue h-14 rounded-xl uppercase tracking-widest text-xs">Close Details</Button>
            </DialogTrigger>
          </div>
        </DialogContent>
      </Dialog>

      <div className={cn(
        "flex flex-col gap-3",
        variant === 'list' ? "p-6 border-l border-white/5 shrink-0 justify-center min-w-[180px]" : "p-6 pt-0"
      )}>
        {!isOwner && !isCompleted && (
          <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
            <DialogTrigger asChild>
              <Button className={cn("w-full btn-gold-high gold-glow uppercase tracking-widest text-[11px] gap-2", variant === 'list' ? "h-12" : "h-14")}>
                <Heart size={16} className="fill-current" />
                GIFT HELP
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-w-sm p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-brand-gold">Send Support</DialogTitle>
                <DialogDescription className="text-brand-offWhite">Helping @{requestor}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className="bg-white/5 border-white/10 h-12 text-brand-gold font-black" />
                <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 font-black"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card"><SelectItem value="XPR">XPR</SelectItem><SelectItem value="GUY">GUY</SelectItem></SelectContent>
                </Select>
                <Input placeholder="Message..." value={contributionMessage} onChange={(e) => setContributionMessage(e.target.value)} className="bg-white/5 border-white/10 h-12 italic" />
              </div>
              <Button className="w-full btn-gold-high h-12" onClick={handleContribute} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm Gift"}
              </Button>
            </DialogContent>
          </Dialog>
        )}

        {isOwner && !isCompleted && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className={cn("w-full border-brand-success/30 text-brand-success hover:bg-brand-success/10 font-black rounded-xl", variant === 'list' ? "h-12 text-[10px]" : "h-14 text-xs")}>
                MARK DONE
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-brand-gold">Complete Request?</AlertDialogTitle>
                <AlertDialogDescription className="text-brand-offWhite">Send thanks to your supporters.</AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea value={thanksMessage} onChange={(e) => setThanksMessage(e.target.value)} className="bg-white/5 border-white/10 mt-4 h-32" />
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel className="bg-white/5 text-brand-offWhite">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleComplete} className="bg-brand-success text-white">Confirm & Complete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isCompleted && (
          <div className="p-3 rounded-xl bg-white/5 border border-brand-success/20 text-center">
            <span className="text-[10px] font-black success-green-text uppercase tracking-widest flex items-center justify-center gap-2">
              <CheckCircle2 size={12} /> COMPLETED
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RequestCard;