"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, X, Loader2, CheckCircle2, User, Zap, Sparkles } from 'lucide-react';
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
  isUrgent = false,
  contributions = [],
  timestamp,
  variant = 'grid',
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

  return (
    <Card className={cn(
      "glass-card overflow-hidden group hover:border-primary/40 transition-all duration-500",
      isUrgent && status === 'Open' ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : '',
      isFunded && status !== 'Completed' ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''
    )}>
      <div className={cn("h-1 transition-all duration-1000", isFunded ? "bg-emerald-500" : getCategoryColor().split(' ')[1])} style={{ width: `${progress}%` }} />
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
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
          <span className="text-[10px] text-muted-foreground font-bold">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
        </div>

        <h3 className="text-lg font-black mb-2 group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
        
        <div className="flex items-center gap-2 mb-4">
          <Avatar className="w-5 h-5 border border-white/10">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${requestor}`} />
            <AvatarFallback className="text-[8px] bg-primary text-black font-black">{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Link to={`/profile/${requestor}`} className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
             @{requestor}
          </Link>
        </div>

        <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed line-clamp-2 min-h-[40px] italic">
          "{description}"
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5 text-primary">
              <Zap size={12} className="fill-primary" />
              <span>{raised.toLocaleString()} {token}</span>
            </div>
            <span className="text-muted-foreground">Goal: {amount.toLocaleString()}</span>
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
          
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart size={10} className="text-primary fill-primary/20" />
              <span>{contributions.length} Support{contributions.length === 1 ? '' : 's'}</span>
            </div>
            <span className={cn("font-black", progress >= 100 ? "text-emerald-400" : "text-primary")}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-3">
        {!isOwner && status === 'Open' && (
          <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!showContribute ? (
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-black font-black h-12 rounded-xl btn-premium gold-glow uppercase tracking-widest text-[11px] gap-2" 
                onClick={() => setShowContribute(true)}
              >
                <Heart size={16} className="fill-current" />
                Support Request
              </Button>
            ) : (
              <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Contribute</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={() => setShowContribute(false)}>
                    <X size={12} />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map(amt => (
                    <Button 
                      key={amt} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setContributionAmount(amt.toString())}
                      className={cn(
                        "h-8 text-[10px] font-black border-white/5 hover:border-primary/50 transition-all",
                        contributionAmount === amt.toString() ? "bg-primary/10 border-primary text-primary" : "bg-white/5"
                      )}
                    >
                      {amt}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="Custom Amount"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="bg-white/5 border-white/10 h-10 text-sm font-black focus:border-primary/50 pr-12"
                    />
                  </div>
                  <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                    <SelectTrigger className="w-24 h-10 bg-white/5 border-white/10 text-xs font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="XPR">XPR</SelectItem>
                      <SelectItem value="GUY">GUY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  placeholder="Leave a message of support..."
                  value={contributionMessage}
                  onChange={(e) => setContributionMessage(e.target.value)}
                  className="bg-white/5 border-white/10 h-10 text-[11px] italic"
                />

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-black font-black h-11 rounded-xl shadow-lg transition-transform active:scale-95" 
                  onClick={handleContribute} 
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : `Send ${contributionAmount} ${contributionToken}`}
                </Button>
              </div>
            )}
          </div>
        )}

        {isOwner && status !== 'Completed' && (
          <Button 
            variant="outline" 
            className="w-full h-12 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-black rounded-xl gap-2 uppercase tracking-widest text-[11px]"
            onClick={handleComplete}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Finish Request</>}
          </Button>
        )}

        {status === 'Completed' && (
          <Button 
            disabled 
            variant="outline" 
            className="w-full h-12 border-white/5 text-muted-foreground font-black rounded-xl uppercase tracking-widest text-[11px]"
          >
            Request Closed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;