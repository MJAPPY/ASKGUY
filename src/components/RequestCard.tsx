"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, X, Loader2, CheckCircle2, Zap, Sparkles, Image as ImageIcon, MessageSquare, Quote, ArrowRight, ExternalLink } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContribute, setShowContribute] = useState(false);

  const progress = Math.min((raised / amount) * 100, 100);
  const isOwner = address === requestor;
  const isFunded = progress >= 100;

  const quickAmounts = [10, 50, 100, 500];

  const getCategoryColor = () => {
    const cat = category.toLowerCase();
    if (cat.includes('medical')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (cat.includes('rent') || cat.includes('housing')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (cat.includes('utilities')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (cat.includes('groceries') || cat.includes('food')) return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (cat.includes('emergency') || cat.includes('crisis')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (cat.includes('transportation')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
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
        setShowContribute(false);
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
      await markCompleted(id);
      showSuccess("Request marked as completed!");
    } catch (err) {
      showError("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const sortedContributions = [...contributions].sort((a, b) => b.timestamp - a.timestamp);

  const cardContent = (
    <div className={cn("p-0 cursor-pointer hover:bg-white/[0.02] transition-colors flex-1", variant === 'list' && "flex flex-col md:flex-row")}>
      {proofUrl && (
        <div className={cn(
          "overflow-hidden relative border-white/5 shrink-0",
          variant === 'grid' ? "w-full aspect-[21/9] border-b" : "hidden md:block w-32 h-32 border-r"
        )}>
          <img src={proofUrl} alt="Request Proof" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-black uppercase tracking-widest text-primary">
            <ImageIcon size={8} /> Proof
          </div>
        </div>
      )}
      
      <div className={cn("p-6 flex-1", variant === 'list' ? "grid grid-cols-1 md:grid-cols-12 gap-6 items-center" : "space-y-4")}>
        {/* Basic Info Column */}
        <div className={cn(variant === 'list' ? "md:col-span-5" : "space-y-4")}>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border", getCategoryColor())}>
              {category}
            </span>
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>

          <h3 className={cn("font-black group-hover:text-primary transition-colors line-clamp-1 tracking-tight", variant === 'list' ? "text-lg" : "text-xl")}>
            {title}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <Avatar className="w-5 h-5 border border-white/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${requestor}`} />
              <AvatarFallback className="text-[8px] bg-primary text-black font-black">{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
              @{requestor}
            </div>
          </div>
        </div>

        {/* Progress Column */}
        <div className={cn(variant === 'list' ? "md:col-span-4" : "space-y-4")}>
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest mb-2">
            <div className="flex items-center gap-1.5 text-primary">
              <Zap size={14} className="fill-primary" />
              <span className="text-sm">{raised.toLocaleString()} {token}</span>
            </div>
            <span className="text-muted-foreground text-[10px]">/ {amount.toLocaleString()}</span>
          </div>
          
          <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5 p-[1px]">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out relative",
                isFunded ? "bg-emerald-500" : "bg-primary"
              )} 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Status indicator in List View */}
        {variant === 'list' && (
           <div className="md:col-span-3 flex flex-wrap gap-2 justify-end">
              {status === 'Completed' ? (
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20 uppercase tracking-widest">
                  <CheckCircle2 size={10} /> Completed
                </span>
              ) : isFunded ? (
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1 border border-primary/20 uppercase tracking-widest animate-pulse">
                  <Sparkles size={10} /> Funded
                </span>
              ) : (
                <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full flex items-center gap-1 border border-blue-500/20 uppercase tracking-widest">
                  Open
                </span>
              )}
           </div>
        )}

        {/* Grid-only description */}
        {variant === 'grid' && (
          <p className="text-sm font-bold text-foreground/90 leading-relaxed line-clamp-3 min-h-[60px] italic bg-white/5 p-4 rounded-xl border border-white/5">
            "{description}"
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Dialog>
      <Card className={cn(
        "glass-card overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col h-full",
        variant === 'list' ? "flex-row h-auto min-h-[140px]" : "h-full",
        isUrgent && status === 'Open' ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : '',
        isFunded && status !== 'Completed' ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''
      )}>
        {variant === 'grid' && <div className={cn("h-1 transition-all duration-1000", isFunded ? "bg-emerald-500" : getCategoryColor().split(' ')[1])} style={{ width: `${progress}%` }} />}
        
        <DialogTrigger asChild>
          {cardContent}
        </DialogTrigger>

        {/* Action Section on right for List, bottom for Grid */}
        <div className={cn(
          "flex flex-col gap-3",
          variant === 'list' ? "p-6 border-l border-white/5 shrink-0 justify-center min-w-[160px]" : "p-6 pt-0"
        )}>
          {!isOwner && status === 'Open' && (
            <>
              {!showContribute ? (
                <Button 
                  className={cn(
                    "w-full bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow uppercase tracking-widest gap-2",
                    variant === 'list' ? "h-11 text-[10px]" : "h-14 text-sm btn-premium"
                  )} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContribute(true);
                  }}
                >
                  <Heart size={14} className="fill-current" />
                  Help
                </Button>
              ) : (
                <div className={cn(
                  "space-y-4 bg-white/5 p-4 rounded-xl border border-primary/20 animate-in zoom-in-95 duration-200",
                  variant === 'list' ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 z-50 shadow-2xl" : "w-full"
                )}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Quick Help</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={(e) => {
                      e.stopPropagation();
                      setShowContribute(false);
                    }}>
                      <X size={12} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {quickAmounts.map(amt => (
                      <Button 
                        key={amt} 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setContributionAmount(amt.toString());
                        }}
                        className={cn("h-7 px-1 text-[9px] font-black", contributionAmount === amt.toString() ? "bg-primary text-black" : "")}
                      >
                        {amt}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      value={contributionAmount}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="bg-white/5 border-white/10 h-9 text-xs font-black"
                    />
                    <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                      <SelectTrigger className="w-16 h-9 bg-white/5 border-white/10 text-[9px] font-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="XPR">XPR</SelectItem>
                        <SelectItem value="GUY">GUY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-black font-black h-10 rounded-lg text-xs" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContribute();
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={14} /> : `Confirm Send`}
                  </Button>
                </div>
              )}
              {variant === 'list' && (
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white">
                    Details
                  </Button>
                </DialogTrigger>
              )}
            </>
          )}

          {isOwner && status !== 'Completed' && (
            <Button 
              variant="outline" 
              className={cn(
                "w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-black rounded-xl gap-2 uppercase tracking-widest",
                variant === 'list' ? "h-11 text-[9px]" : "h-14 text-xs"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> Complete</>}
            </Button>
          )}

          {status === 'Completed' && variant === 'list' && (
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full h-11 text-[10px] font-black uppercase tracking-widest text-emerald-400/60">
                View Proof
              </Button>
            </DialogTrigger>
          )}
        </div>
      </Card>

      {/* Reusing the existing Dialog Content as is */}
      <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-black tracking-tight leading-tight">{title}</DialogTitle>
            <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shrink-0 ml-4", getCategoryColor())}>
              {category}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="w-6 h-6 border border-white/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${requestor}`} />
              <AvatarFallback className="text-[10px] bg-primary text-black font-black">{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-black text-white uppercase tracking-wider">@{requestor}</span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
              Posted {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-10 pb-12">
            <div className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Quote size={14} /> The Situation
              </h4>
              <div className="text-lg font-black leading-relaxed italic text-foreground/90 bg-white/5 p-8 rounded-[24px] border border-white/10 shadow-inner">
                "{description}"
              </div>
            </div>

            {proofUrl && (
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ImageIcon size={14} /> Proof of Need
                </h4>
                <div className="rounded-[24px] overflow-hidden border border-white/10 bg-black/40 aspect-video relative group shadow-2xl">
                  <img src={proofUrl} alt="Proof of Need" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <MessageSquare size={14} /> Community Support ({contributions.length})
              </h4>
              {sortedContributions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {sortedContributions.map((msg, idx) => (
                    <div key={idx} className="p-5 rounded-[20px] bg-white/5 border border-white/10 space-y-3 hover:bg-white/[0.08] transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-6 h-6 border border-white/10 group-hover:border-primary/50 transition-colors">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user}`} />
                            <AvatarFallback className="text-[8px] bg-primary text-black font-black">{msg.user.substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-[11px] font-black text-primary uppercase tracking-widest">@{msg.user}</span>
                            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">
                              {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                          <span className="text-xs font-black text-emerald-400">+{msg.amount} {msg.token}</span>
                        </div>
                      </div>
                      {msg.message ? (
                        <p className="text-sm font-black text-white/90 leading-relaxed italic border-l-2 border-primary/30 pl-4 py-1">
                          "{msg.message}"
                        </p>
                      ) : (
                        <p className="text-[10px] font-black text-muted-foreground italic uppercase tracking-widest opacity-50">
                          Sent support with no message
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[24px] bg-white/[0.02]">
                  <Heart className="mx-auto text-muted-foreground/20 mb-3" size={32} />
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No support yet. Be the first to help!</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="p-8 bg-[#0a0a0c]/90 backdrop-blur-xl border-t border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{raised.toLocaleString()}</span>
                <span className="text-lg font-black text-muted-foreground">/ {amount.toLocaleString()} {token}</span>
              </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{contributions.length} Supports</p>
               <p className={cn("text-4xl font-black drop-shadow-sm transition-colors", isFunded ? "text-emerald-400" : "text-primary")}>
                {Math.round(progress)}%
               </p>
            </div>
          </div>
          
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-black font-black h-16 rounded-[20px] text-lg shadow-[0_0_30px_rgba(244,201,93,0.2)] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]">
             <DialogTrigger>Close Details</DialogTrigger>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCard;