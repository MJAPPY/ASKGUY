"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Heart, Send, X, AlertCircle, ShieldCheck, Calendar, User, ExternalLink, Trophy, Medal, Crown, Star, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, AidRequest, TokenSymbol } from '@/hooks/use-requests';
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
  isUrgent: boolean;
  contributions: {
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
  isUrgent,
  contributions,
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
  const messageCount = contributions.filter(c => c.message).length;

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
        if (contributionToken === 'GUY' && token !== 'GUY') {
          showSuccess(`Sent ${val} GUY as a bonus gift to ${requestor}!`);
        } else {
          showSuccess(`Contributed ${val} ${contributionToken} to ${requestor}'s request!`);
        }
        setShowContribute(false);
      }
    } catch (err) {
      showError('Contribution failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const isList = variant === 'list';

  return (
    <Card className={`glass-card overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 ${isUrgent && status === 'Open' ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''} ${isList ? 'flex flex-col md:flex-row' : ''}`}>
      <div className={`h-1 ${getCategoryColor().split(' ')[1]}`} style={{ background: getCategoryColor().split(' ')[0] }} />
      <CardContent className={`p-6 ${isList ? 'flex-1 pb-6' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getCategoryColor()}`}>
              {category}
            </span>
            {isUrgent && status === 'Open' && (
              <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                URGENT
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-bold">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
        </div>

        <h3 className="text-lg font-black mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Heart size={14} className="text-primary fill-primary" />
            <span className="font-bold">{contributions.length}</span>
            <span className="text-muted-foreground">contributions</span>
          </div>
          {messageCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xs">💬</span>
              <span className="font-bold">{messageCount}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className={`p-6 flex flex-col gap-3 ${isList ? 'md:w-72 md:border-l border-white/5 pt-6' : 'pt-0'}`}>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-bold">
            {raised.toLocaleString()} / {amount.toLocaleString()} {token}
          </span>
          <span className="text-primary font-black">{Math.round(progress)}%</span>
        </div>

        {!isOwner && status === 'Open' && (
          <div className="space-y-2 pt-2">
            {!showContribute ? (
              <Button className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11 rounded-xl btn-premium gold-glow" onClick={() => setShowContribute(true)}>
                <Heart size={16} className="fill-current" />
                Contribute
              </Button>
            ) : (
              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="bg-white/5 border-white/10 h-10"
                  />
                  <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                    <SelectTrigger className="w-20 h-10 bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E2937] border-white/10">
                      <SelectItem value="XPR">XPR</SelectItem>
                      <SelectItem value="GUY">GUY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Message (optional)"
                  value={contributionMessage}
                  onChange={(e) => setContributionMessage(e.target.value)}
                  className="bg-white/5 border-white/10 h-10"
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

        {isOwner && (
          <div className="space-y-2 pt-2">
            {status !== 'Completed' && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl" onClick={() => markCompleted(id)} disabled={isProcessing}>
                Mark Completed
              </Button>
            )}
            <div className={`text-[10px] font-bold uppercase tracking-widest ${status === 'Completed' ? 'text-emerald-400' : status === 'Funded' ? 'text-primary' : 'text-muted-foreground'}`}>
              Status: {status}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;