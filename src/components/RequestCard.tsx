"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, X, Loader2, CheckCircle2, User } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { formatDistanceToNow } from 'date-fns';

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
  const [contributionAmount, setContributionAmount] = useState('10');
  const [contributionToken, setContributionToken] = useState<TokenSymbol>(token);
  const [contributionMessage, setContributionMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContribute, setShowContribute] = useState(false);

  const progress = Math.min((raised / amount) * 100, 100);
  const isOwner = address === requestor;

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
    if (isNaN(val) || val <= 0 || !address) return;
    setIsProcessing(true);
    try {
      const success = await transferTokens(requestor, val, contributionToken, contributionMessage || `AskGuy: ${title}`);
      if (success) {
        await contribute(id, address, val, contributionToken, contributionMessage);
        showSuccess(`Contributed ${val} ${contributionToken} to ${requestor}!`);
        setShowContribute(false);
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
    <Card className={`glass-card overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 ${isUrgent && status === 'Open' ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''}`}>
      <div className={`h-1 ${getCategoryColor().split(' ')[1]}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getCategoryColor()}`}>
              {category}
            </span>
            {status === 'Completed' && (
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> COMPLETED
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-bold">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
        </div>

        <h3 className="text-lg font-black mb-2">{title}</h3>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${requestor}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <Link to={`/profile/${requestor}`} className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <User size={10} /> {requestor}
          </Link>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">{description}</p>

        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Heart size={14} className="text-primary fill-primary" />
            <span className="font-bold">{contributions.length}</span>
            <span className="text-muted-foreground">helpers</span>
          </div>
        </div>

        <div className="w-full bg-white/5 rounded-full h-2 mb-2">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs mb-4">
          <span className="text-muted-foreground font-bold">
            {raised.toLocaleString()} / {amount.toLocaleString()} {token}
          </span>
          <span className="text-primary font-black">{Math.round(progress)}%</span>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-3">
        {!isOwner && status === 'Open' && (
          <div className="w-full space-y-2">
            {!showContribute ? (
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11 rounded-xl btn-premium gold-glow" 
                onClick={() => setShowContribute(true)}
              >
                <Heart size={16} className="fill-current mr-2" />
                Help Now
              </Button>
            ) : (
              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amt"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="bg-white/5 border-white/10 h-10 text-sm"
                  />
                  <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                    <SelectTrigger className="w-24 h-10 bg-white/5 border-white/10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="XPR">XPR</SelectItem>
                      <SelectItem value="GUY">GUY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Supportive message..."
                  value={contributionMessage}
                  onChange={(e) => setContributionMessage(e.target.value)}
                  className="bg-white/5 border-white/10 h-10 text-sm"
                />
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold h-10 rounded-xl" onClick={handleContribute} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Send'}
                  </Button>
                  <Button variant="ghost" className="h-10 border-white/10" onClick={() => setShowContribute(false)}>
                    <X size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isOwner && status !== 'Completed' && (
          <Button 
            variant="outline" 
            className="w-full h-11 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-xl gap-2"
            onClick={handleComplete}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Mark as Completed</>}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;