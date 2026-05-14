"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from '@/components/ui/loader';
import { Heart, Send, X, AlertCircle, ShieldCheck, Calendar, User, ExternalLink, Trophy, Medal, Crown, Star } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, AidRequest, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { formatDistanceToNow } from 'date-fns';

/** Props for the RequestCard component */
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

/** RequestCard component */
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
  const [contributionAmount, setContributionAmount] = React.useState('10');
  const [contributionToken, setContributionToken] = React.useState<TokenSymbol>(token);
  const [contributionMessage, setContributionMessage] = React.useState('');
  const [isContributing, setIsContributing] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

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
      const success = await transferTokens(
        requestor,
        val,
        contributionToken,
        contributionMessage || `AskGuy: ${title}`
      );

      if (success) {
        contribute(id, address, val, contributionToken, contributionMessage);
        if (contributionToken === 'GUY' && token !== 'GUY') {
          showSuccess(`Sent ${val} GUY as a bonus gift to ${requestor}!`);
        } else {
          showSuccess(`Contributed ${val} ${contributionToken} to ${requestor}'s request!`);
        }
      }
    } catch (err) {
      showError('Contribution failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    // share logic...
  };

  const getCategoryColor = () => {
    // same as above
  };

  const isList = variant === 'list';

  return (
    <Card className={`glass-card overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 ${isUrgent && status === 'Open' ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''} ${isList ? 'flex flex-col md:flex-row' : ''}`}>
      <CardContent className={`p-6 ${isList ? 'flex-1 pb-6' : ''}`}>
        {/* ... existing UI ... */}
      </CardContent>

      <CardFooter className={`p-6 flex flex-col gap-3 ${isList ? 'md:w-72 md:border-l border-white/5 pt-6' : 'pt-0'}`}>
        {/* ... button UI ... */}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;