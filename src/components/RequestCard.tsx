"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, X, Loader2, CheckCircle2, Zap, Sparkles, Image as ImageIcon, MessageSquare, Quote } from 'lucide-react';
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

  const messagesOfSupport = contributions.filter(c => c.message && c.message.trim().length > 0);

  return (
    <Dialog>
      <Card className={cn(
        "glass-card overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col",
        isUrgent && status === 'Open' ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : '',
        isFunded && status !== 'Completed' ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''
      )}>
        <div className={cn("h-1 transition-all duration-1000", isFunded ? "bg-emerald-500" : getCategoryColor().split(' ')[1])} style={{ width: `${progress}%` }} />
        
        <DialogTrigger asChild>
          <CardContent className="p-0 cursor-pointer hover:bg-white/[0.02] transition-colors flex-1">
            {proofUrl && (
              <div className="w-full aspect-[21/9] overflow-hidden relative border-b border-white/5">
                <img src={proofUrl} alt="Request Proof" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary">
                  <ImageIcon size={10} /> Photo Evidence
                </div>
              </div>
            )}
            
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border", getCategoryColor())}>
                    {category}
                  </span>
                  {status === 'Completed' ? (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20 uppercase tracking-widest">
                      <CheckCircle2 size={10} /> Completed
                    </span>
                  ) : isFunded ? (
                    <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-primary/20 uppercase tracking-widest animate-pulse">
                      <Sparkles size={10} /> Fully Funded
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
              </div>

              <h3 className="text-xl font-black group-hover:text-primary transition-colors line-clamp-1 tracking-tight">{title}</h3>
              
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 border border-white/10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${requestor}`} />
                  <AvatarFallback className="text-[10px] bg-primary text-black font-black">{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-xs font-black text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                  @{requestor}
                </div>
              </div>

              <p className="text-sm font-bold text-foreground/90 leading-relaxed line-clamp-3 min-h-[60px] italic bg-white/5 p-4 rounded-xl border border-white/5">
                "{description}"
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 text-primary">
                    <Zap size={14} className="fill-primary" />
                    <span className="text-sm">{raised.toLocaleString()} {token}</span>
                  </div>
                  <span className="text-muted-foreground">Goal: {amount.toLocaleString()}</span>
                </div>
                
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 p-[1px] shadow-inner">
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
                
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Heart size={12} className="text-primary fill-primary" />
                    <span className="text-foreground">{contributions.length} Supports</span>
                  </div>
                  <span className={cn("text-sm", progress >= 100 ? "text-emerald-400" : "text-primary")}>
                    {Math.round(progress)}% Complete
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </DialogTrigger>

        <CardFooter className="p-6 pt-0 flex flex-col gap-3 mt-auto">
          {!isOwner && status === 'Open' && (
            <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {!showContribute ? (
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-black font-black h-14 rounded-xl btn-premium gold-glow uppercase tracking-widest text-sm gap-2" 
                  onClick={() => setShowContribute(true)}
                >
                  <Heart size={18} className="fill-current" />
                  Help Now
                </Button>
              ) : (
                <div className="space-y-5 bg-white/5 p-5 rounded-2xl border border-primary/20 animate-in zoom-in-95 duration-200 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-widest text-primary">Send Contribution</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={() => setShowContribute(false)}>
                      <X size={14} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quick Select</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map(amt => (
                        <Button 
                          key={amt} 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setContributionAmount(amt.toString())}
                          className={cn(
                            "h-10 text-xs font-black border-white/5 hover:border-primary/50 transition-all",
                            contributionAmount === amt.toString() ? "bg-primary text-black border-primary" : "bg-white/5"
                          )}
                        >
                          {amt}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amount to Send</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          className="bg-white/5 border-white/10 h-12 text-lg font-black focus:border-primary/50 text-white"
                        />
                      </div>
                      <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                        <SelectTrigger className="w-28 h-12 bg-white/5 border-white/10 text-sm font-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                          <SelectItem value="XPR" className="font-black">XPR</SelectItem>
                          <SelectItem value="GUY" className="font-black">GUY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Support Message (Optional)</Label>
                    <Input
                      placeholder="Leave a kind word..."
                      value={contributionMessage}
                      onChange={(e) => setContributionMessage(e.target.value)}
                      className="bg-white/5 border-white/10 h-12 text-xs font-bold italic"
                    />
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-black font-black h-14 rounded-xl shadow-[0_0_30px_rgba(244,201,93,0.3)] transition-all active:scale-95 text-base uppercase tracking-widest" 
                    onClick={handleContribute} 
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : `Confirm ${contributionAmount} ${contributionToken}`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {isOwner && status !== 'Completed' && (
            <Button 
              variant="outline" 
              className="w-full h-14 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-black rounded-xl gap-2 uppercase tracking-widest text-xs"
              onClick={handleComplete}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Finish My Request</>}
            </Button>
          )}

          {status === 'Completed' && (
            <div className="w-full h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
               <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Need Fulfilled</span>
            </div>
          )}
        </CardFooter>
      </Card>

      <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-black tracking-tight">{title}</DialogTitle>
            <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border", getCategoryColor())}>
              {category}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="w-5 h-5 border border-white/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${requestor}`} />
              <AvatarFallback className="text-[8px] bg-primary text-black font-black">{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">@{requestor}</span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
              Posted {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Quote size={12} /> The Situation
              </h4>
              <p className="text-base font-medium leading-relaxed italic text-foreground/90 bg-white/5 p-6 rounded-2xl border border-white/5">
                "{description}"
              </p>
            </div>

            {proofUrl && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ImageIcon size={12} /> Proof of Need
                </h4>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 aspect-video relative group">
                  <img src={proofUrl} alt="Proof of Need" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <MessageSquare size={12} /> Messages of Support
              </h4>
              {messagesOfSupport.length > 0 ? (
                <div className="space-y-3">
                  {messagesOfSupport.map((msg, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user}`} />
                            <AvatarFallback className="text-[6px] bg-primary text-black">{msg.user.substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-black text-blue-400">@{msg.user}</span>
                        </div>
                        <span className="text-[9px] font-black text-primary">{msg.amount} {msg.token}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">"{msg.message}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <p className="text-xs font-medium text-muted-foreground">No messages yet. Be the first to send a kind word!</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 bg-white/[0.02] border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress</p>
              <p className="text-lg font-black text-primary">{raised.toLocaleString()} / {amount.toLocaleString()} {token}</p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{contributions.length} Supports</p>
               <p className="text-lg font-black text-emerald-400">{Math.round(progress)}%</p>
            </div>
          </div>
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-black font-black h-12 rounded-xl">
             <DialogTrigger>Close Details</DialogTrigger>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCard;