"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Share2, CheckCircle2, Coins, Eye, MessageSquare, ShieldCheck, X, Calendar, User, MessageCircle, Gift, Sparkles } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, AidRequest, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RequestCardProps extends AidRequest {
  variant?: 'grid' | 'list';
}

const RequestCard: React.FC<RequestCardProps> = ({ id, user, title, category, amount, token, raised, description, status, proofUrl, isUrgent, contributions, variant = 'grid' }) => {
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
    if (cat.includes('medical')) return 'bg-red-500/15 text-red-400 border-red-500/30';
    if (cat.includes('rent') || cat.includes('housing')) return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    if (cat.includes('utilities')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (cat.includes('groceries') || cat.includes('food')) return 'bg-green-500/15 text-green-400 border-green-500/30';
    if (cat.includes('emergency') || cat.includes('crisis')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    if (cat.includes('transportation')) return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  };

  const isList = variant === 'list';

  return (
    <Card className={`glass-card overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 ${isUrgent && status === 'Open' ? 'border-red-500/40 red-glow' : ''} ${isList ? 'flex flex-col md:flex-row' : ''}`}>
      <CardContent className={`p-6 ${isList ? 'flex-1 pb-6' : ''}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="flex items-center gap-1"><User size={10} /> {user}</span>
              {isOwner && <Badge variant="outline" className="text-[8px] h-3.5 px-1.5 border-primary/30 text-primary font-bold">YOU</Badge>}
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="outline" className={`${getCategoryColor()} border text-[10px] font-bold h-5 px-2`}>
                {category}
              </Badge>
              {messageCount > 0 && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-bold h-5 px-2 flex gap-1 items-center">
                  <MessageCircle size={10} /> {messageCount} {messageCount === 1 ? 'MESSAGE' : 'MESSAGES'}
                </Badge>
              )}
            </div>
          </div>
          <Badge className={`font-black text-[10px] px-2.5 py-0.5 border ${
            status === 'Open' ? 'bg-primary/10 text-primary border-primary/30' : 
            status === 'Funded' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 
            'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            {status.toUpperCase()}
          </Badge>
        </div>

        <h3 className="text-lg font-black mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1 tracking-tight">
          {title}
        </h3>

        <p className={`text-sm mb-6 text-foreground/80 leading-relaxed font-medium ${isList ? 'line-clamp-1 mb-4' : 'line-clamp-2 min-h-[2.5rem]'}`}>
          {description}
        </p>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-muted-foreground">Progress ({token})</span>
              <span className="text-foreground">{raised.toLocaleString()} / {amount.toLocaleString()}</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-white/5" />
          </div>

          {totalGuyBonus > 0 && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 gold-glow shimmer-effect animate-pulse-subtle ${isList ? 'mt-4' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles size={10} className="text-primary animate-spin-slow" />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-tight">GUY Bonus Gift</span>
              </div>
              <span className="text-sm font-black text-primary drop-shadow-sm">+{totalGuyBonus.toLocaleString()} GUY</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className={`p-6 flex flex-col gap-3 ${isList ? 'md:w-72 md:border-l border-white/5 pt-6' : 'pt-0'}`}>
        <div className="flex gap-2 w-full">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 gap-2 border-white/10 bg-white/5 hover:bg-white/10 h-10 font-bold text-xs">
                <Eye size={14} /> VIEW DETAILS
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <DialogHeader className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className={`${getCategoryColor()} font-bold`}>{category}</Badge>
                    <span className="text-[10px] font-black text-muted-foreground">ID: {id.toUpperCase()}</span>
                  </div>
                  <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
                  <DialogDescription className="text-muted-foreground flex items-center gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5"><User size={14} className="text-emerald-400" /> {user}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date().toLocaleDateString()}</span>
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="font-black text-[10px] uppercase text-muted-foreground">The Situation</h4>
                  <p className="text-foreground/90 leading-relaxed text-sm">{description}</p>
                </div>

                {proofUrl && (
                  <div className="space-y-2">
                    <h4 className="font-black text-[10px] uppercase text-muted-foreground">Verified Proof</h4>
                    <div className="rounded-xl overflow-hidden border border-emerald-500/20 bg-black/40">
                      <img src={proofUrl} alt="Proof" className="w-full object-contain max-h-[300px]" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-black text-[10px] uppercase text-muted-foreground">Supporters ({contributions.length})</h4>
                  <div className="space-y-3">
                    {contributions.map((c) => (
                      <div key={c.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-emerald-400">{c.user}</span>
                          <span className="text-xs font-black text-white">{c.amount} {c.token}</span>
                        </div>
                        {c.message && <p className="text-xs italic text-muted-foreground">"{c.message}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Goal</p>
                    <p className="text-lg font-black text-emerald-400">{amount.toLocaleString()} {token}</p>
                  </div>
                  <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Raised</p>
                    <p className="text-lg font-black text-white">{raised.toLocaleString()} {token}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="icon" 
            className="shrink-0 border-white/10 bg-white/5 hover:bg-white/10 h-10 w-10"
            onClick={handleShare}
          >
            <Share2 size={14} />
          </Button>
        </div>

        {status === 'Completed' ? (
          <Button variant="outline" className="w-full gap-2 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 h-11 font-black text-xs" disabled>
            <CheckCircle2 size={16} /> HELP COMPLETED
          </Button>
        ) : status === 'Funded' && isOwner ? (
          <Button onClick={() => markCompleted(id)} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 h-11 font-black text-xs text-white">
            <CheckCircle2 size={16} /> MARK COMPLETED
          </Button>
        ) : isContributing ? (
          <div className="space-y-2 w-full pt-1">
            <div className="flex gap-2">
              <Input 
                type="number" 
                className="h-10 bg-white/10 border-white/20 text-sm font-bold" 
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
              <Select value={contributionToken} onValueChange={(v: TokenSymbol) => setContributionToken(v)}>
                <SelectTrigger className="w-24 h-10 bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XPR">XPR</SelectItem>
                  <SelectItem value="GUY">GUY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleContribute} className="flex-1 bg-emerald-600 text-white h-10 font-black text-xs">
                SEND
              </Button>
              <Button variant="ghost" onClick={() => setIsContributing(false)} className="h-10 w-10">
                <X size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsContributing(true)} 
            className={`w-full gap-2 font-black text-xs h-11 transition-all ${status === 'Funded' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            disabled={status === 'Funded' && !isOwner}
          >
            <Heart size={16} className="fill-current" />
            {status === 'Funded' ? 'FULLY FUNDED' : 'CONTRIBUTE'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;