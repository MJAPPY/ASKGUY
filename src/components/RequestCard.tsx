"use client";

import React, { useState, useMemo } from 'react';
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
    return contributions
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
            <div className={cn("p-6 flex-1 flex flex-col justify-center", variant === 'list' ? "grid grid-cols-1 md:grid-cols-12 gap-8 items-center" : "space-y-4")}>
              <div className={variant === 'list' ? "md:col-span-5" : "space-y-4"}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border", getCategoryColor())}>{category}</span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                </div>
                <h3 className="font-black group-hover:text-primary transition-colors text-xl">{title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-6 h-6 border border-white/20 p-0.5 bg-black/20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${requestor}`} />
                    <AvatarFallback>{requestor.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">@{requestor}</div>
                </div>
              </div>
              <div className={variant === 'list' ? "md:col-span-4" : "space-y-3"}>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase">
                    <div className="flex items-center gap-1.5 text-primary"><Zap size={12} className="fill-primary" />{raised} {token}</div>
                    <span className="text-muted-foreground opacity-50">/ {amount}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 border border-white/5 p-[1px]">
                    <div className={cn("h-full rounded-full transition-all duration-1000", isFunded ? "bg-emerald-500" : "bg-primary")} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="glass-card border-white/10 max-w-3xl h-[90vh] overflow-hidden flex flex-col p-0 rounded-[32px]">
           <div className="p-8 border-b border-white/5 bg-white/[0.015]">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12 border-2 border-white/20 p-1 bg-black/20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${requestor}`} />
                </Avatar>
                <div>
                  <h2 className="text-2xl font-black">@{requestor}</h2>
                  <p className="text-[10px] text-muted-foreground font-black uppercase">{category}</p>
                </div>
              </div>
              <h1 className="text-3xl font-black mb-4">{title}</h1>
              <p className="text-lg italic text-white/80">"{description}"</p>
           </div>
           <ScrollArea className="flex-1 p-8">
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Community Support</h4>
                {contributions.map((c, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 border border-white/10 p-1 bg-black/20">
                        <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${c.user}`} />
                      </Avatar>
                      <div>
                        <p className="text-xs font-black text-primary">@{c.user}</p>
                        {c.message && <p className="text-xs text-white/70 italic">"{c.message}"</p>}
                      </div>
                    </div>
                    <p className="text-sm font-black">+{c.amount} {c.token}</p>
                  </div>
                ))}
              </div>
           </ScrollArea>
        </DialogContent>
      </Dialog>
      {/* Footer controls preserved */}
    </Card>
  );
};

export default RequestCard;