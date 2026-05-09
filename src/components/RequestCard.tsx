"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Share2, CheckCircle2, Coins, Eye, MessageSquare, ShieldCheck, X, Calendar, User, MessageCircle, Gift, Sparkles, Clock, Target, Send } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, AidRequest, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

interface RequestCardProps extends AidRequest {
  variant?: 'grid' | 'list';
}

const RequestCard: React.FC<RequestCardProps> = ({ id, user, title, category, amount, token, raised, description, status, proofUrl, isUrgent, contributions, timestamp, variant = 'grid' }) => {
  const { contribute, markCompleted } = useRequests();
  const { address } = useWallet();
  const [contributionAmount, setContributionAmount] = useState("10");
  const [contributionToken, setContributionToken] = useState<TokenSymbol>(token);
  const [contributionMessage, setContributionMessage] = useState("");
  const [isContributing, setIsContributing] = useState(false);

  const progress = Math.min((raised / amount) * 100, 100);
  const isOwner = address === user;
  const messageCount = contributions.filter(c => c.message).length;

  const totalGuyBonus = useMemo(() => {
    if (token === 'GUY') return 0;
    return contributions
      .filter(c => c.token === 'GUY')
      .reduce((acc, c) => acc + c.amount, 0);
  }, [contributions, token]);

  const handleContribute = () => {
    const val = parseFloat(contributionAmount);
    if (isNaN(val) || val <= 0 || !address) return;
    
    contribute(id, address, val, contributionToken, contributionMessage);
    
    if (contributionToken === 'GUY' && token !== 'GUY') {
      showSuccess(`Sent ${val} GUY as a bonus gift to ${user}!`);
    } else {
      showSuccess(`Contributed ${val} ${contributionToken} to ${user}'s request!`);
    }
    
    setIsContributing(false);
    setContributionMessage("");
  };

  const handleShare = async () => {
    const shareData = {
      title: `AskGuy: ${title}`,
      text: `Help ${user} with "${title}" on AskGuy XPR Network.`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        showSuccess("Link copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showError("Could not share request");
      }
    }
  };

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

  const isList = variant === 'list';

  return (
    <Card className={`glass-card overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 ${isUrgent && status === 'Open' ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''} ${isList ? 'flex flex-col md:flex-row' : ''}`}>
      <CardContent className={`p-6 ${isList ? 'flex-1 pb-6' : ''}`}>
        <div className="flex justify-between items-start mb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                <User size={12} className="text-muted-foreground" />
                <span className="text-[11px] font-bold text-foreground/90">{user}</span>
              </div>
              {isOwner && <Badge className="bg-primary text-black text-[9px] font-black h-4 px-1.5">YOU</Badge>}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                <Clock size={10} />
                {formatDistanceToNow(timestamp, { addSuffix: true })}
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="outline" className={`${getCategoryColor()} border text-[10px] font-black h-5 px-2.5 tracking-tight`}>
                {category.toUpperCase()}
              </Badge>
              {messageCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded-md border border-blue-400/10">
                  <MessageCircle size={10} /> {messageCount}
                </div>
              )}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
            status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
            status === 'Funded' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
            'bg-white/5 text-muted-foreground border-white/10'
          }`}>
            {status.toUpperCase()}
          </div>
        </div>

        <h3 className="text-xl font-black mb-3 group-hover:text-emerald-400 transition-colors line-clamp-1 tracking-tight leading-tight">
          {title}
        </h3>

        <p className={`text-sm mb-6 text-muted-foreground leading-relaxed font-medium ${isList ? 'line-clamp-1 mb-4' : 'line-clamp-2 min-h-[2.5rem]'}`}>
          {description}
        </p>

        <div className="space-y-4">
          <div className="space-y-2.5">
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Funding Progress</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-foreground">{raised.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">/ {amount.toLocaleString()} {token}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-black ${progress >= 100 ? 'text-emerald-400' : 'text-primary'}`}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${
                  progress >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-primary shadow-[0_0_10px_rgba(244,201,93,0.3)]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {totalGuyBonus > 0 && (
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500/15 via-blue-600/15 to-red-500/15 border border-white/10 shimmer-effect animate-pulse-subtle ${isList ? 'mt-4' : ''}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                  <Gift size={12} className="text-white animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none mb-0.5">Community Bonus</p>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">GUY Bonus Gift</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-white drop-shadow-md">+{totalGuyBonus.toLocaleString()} GUY</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className={`p-6 flex flex-col gap-3 ${isList ? 'md:w-72 md:border-l border-white/5 pt-6' : 'pt-0'}`}>
        <div className="flex gap-2 w-full">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 gap-2 border-white/10 bg-white/5 hover:bg-white/10 h-11 font-black text-[11px] tracking-widest uppercase">
                <Eye size={14} /> Details
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <DialogHeader className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className={`${getCategoryColor()} font-black text-[10px] tracking-widest`}>{category.toUpperCase()}</Badge>
                    <span className="text-[10px] font-black text-muted-foreground tracking-widest">ID: {id.toUpperCase()}</span>
                  </div>
                  <DialogTitle className="text-3xl font-black tracking-tight leading-tight">{title}</DialogTitle>
                  <div className="flex items-center gap-6 text-[11px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-2"><User size={14} className="text-emerald-400" /> {user}</span>
                    <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(timestamp).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2"><Target size={14} className="text-primary" /> {amount.toLocaleString()} {token} Goal</span>
                  </div>
                </DialogHeader>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-3">
                  <h4 className="font-black text-[11px] uppercase text-muted-foreground tracking-widest">The Situation</h4>
                  <p className="text-foreground/90 leading-relaxed text-base font-medium">{description}</p>
                </div>

                {proofUrl && (
                  <div className="space-y-3">
                    <h4 className="font-black text-[11px] uppercase text-muted-foreground tracking-widest">Verified Proof</h4>
                    <div className="rounded-2xl overflow-hidden border border-emerald-500/20 bg-black/40 shadow-2xl">
                      <img src={proofUrl} alt="Proof" className="w-full object-contain max-h-[400px]" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-[11px] uppercase text-muted-foreground tracking-widest">Supporters ({contributions.length})</h4>
                    <div className="h-px flex-1 bg-white/5 mx-4" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contributions.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-emerald-400">{c.user}</span>
                          <span className="text-xs font-black text-white">{c.amount.toLocaleString()} {c.token}</span>
                        </div>
                        {c.message && <p className="text-[11px] italic text-muted-foreground leading-relaxed">"{c.message}"</p>}
                      </div>
                    ))}
                    {contributions.length === 0 && (
                      <p className="text-xs text-muted-foreground italic col-span-full py-4 text-center">No contributions yet. Be the first to help!</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Target Goal</p>
                    <p className="text-xl font-black text-emerald-400">{amount.toLocaleString()} {token}</p>
                  </div>
                  <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Raised</p>
                    <p className="text-xl font-black text-white">{raised.toLocaleString()} {token}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="icon" 
            className="shrink-0 border-white/10 bg-white/5 hover:bg-white/10 h-11 w-11"
            onClick={handleShare}
          >
            <Share2 size={16} />
          </Button>
        </div>

        {status === 'Completed' ? (
          <Button variant="outline" className="w-full gap-2 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 h-12 font-black text-[11px] tracking-widest uppercase" disabled>
            <CheckCircle2 size={16} /> Help Completed
          </Button>
        ) : status === 'Funded' && isOwner ? (
          <Button onClick={() => markCompleted(id)} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 h-12 font-black text-[11px] tracking-widest uppercase text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={16} /> Mark Completed
          </Button>
        ) : isContributing ? (
          <div className="space-y-3 w-full pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex gap-2">
              <Input 
                type="number" 
                className="h-11 bg-white/10 border-white/20 text-sm font-black" 
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
              <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                <SelectTrigger className="w-28 h-11 bg-white/10 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="XPR">XPR</SelectItem>
                  <SelectItem value="GUY">GUY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input 
                placeholder="Add a support message..." 
                className="h-11 pl-9 bg-white/5 border-white/10 text-xs font-medium focus:border-emerald-500/50"
                value={contributionMessage}
                onChange={(e) => setContributionMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleContribute} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-11 font-black text-[11px] tracking-widest uppercase gap-2">
                <Send size={14} /> Send Help
              </Button>
              <Button variant="ghost" onClick={() => setIsContributing(false)} className="h-11 w-11 hover:bg-white/10">
                <X size={18} />
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsContributing(true)} 
            className={`w-full gap-2 font-black text-[11px] tracking-widest uppercase h-12 transition-all shadow-lg ${status === 'Funded' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'}`}
            disabled={status === 'Funded' && !isOwner}
          >
            <Heart size={16} className="fill-current" />
            {status === 'Funded' ? 'Fully Funded' : 'Contribute'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;