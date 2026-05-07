"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Share2, CheckCircle2, Coins, Eye, AlertTriangle, MessageSquare, ImageIcon, ShieldCheck, X } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useRequests, AidRequest, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RequestCard: React.FC<AidRequest> = ({ id, user, title, category, amount, token, raised, description, status, proofUrl, isUrgent, contributions }) => {
  const { contribute, markCompleted } = useRequests();
  const { address } = useWallet();
  const [contributionAmount, setContributionAmount] = useState("10");
  const [contributionToken, setContributionToken] = useState<TokenSymbol>(token);
  const [contributionMessage, setContributionMessage] = useState("");
  const [isContributing, setIsContributing] = useState(false);

  const progress = Math.min((raised / amount) * 100, 100);
  const isOwner = address === user;

  const handleContribute = () => {
    const val = parseFloat(contributionAmount);
    if (isNaN(val) || val <= 0 || !address) return;
    
    contribute(id, address, val, contributionToken, contributionMessage);
    showSuccess(`Contributed ${val} ${contributionToken} to ${user}'s request!`);
    setIsContributing(false);
    setContributionMessage("");
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

  return (
    <Card className={`glass-card overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 ${isUrgent && status === 'Open' ? 'border-red-500/30 red-glow' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>{user}</span>
              {isOwner && <Badge variant="outline" className="text-[8px] h-3 px-1 border-white/20">You</Badge>}
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="outline" className={`${getCategoryColor()} border text-[10px] h-5`}>
                {category}
              </Badge>
              {proofUrl && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] h-5 flex gap-1 items-center">
                  <ImageIcon size={10} /> Verified Proof
                </Badge>
              )}
            </div>
          </div>
          <Badge className={
            status === 'Open' ? 'bg-primary/10 text-primary border-primary/20' : 
            status === 'Funded' ? 'bg-blue-500/20 text-blue-400 font-bold border-blue-500/30' : 
            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }>
            {status}
          </Badge>
        </div>

        <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
          {title}
        </h3>

        <p className="text-sm line-clamp-2 mb-6 text-foreground/70 min-h-[2.5rem] leading-relaxed">
          {description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="text-muted-foreground">Progress ({token})</span>
            <span className="text-foreground">{raised.toLocaleString()} / {amount.toLocaleString()}</span>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5" 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              // @ts-ignore
              '--progress-background': status === 'Funded' ? 'hsl(var(--brand-blue))' : 'hsl(var(--primary))'
            }} 
          />
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-3">
        <div className="flex gap-2 w-full">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 gap-2 border-white/5 bg-white/5 hover:bg-white/10 group h-9">
                <Eye size={14} className="group-hover:text-emerald-400 transition-colors" /> Details
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className={getCategoryColor()}>{category}</Badge>
                  <span className="text-xs text-muted-foreground">ID: {id}</span>
                </div>
                <DialogTitle className="text-2xl">{title}</DialogTitle>
                <DialogDescription className="text-muted-foreground flex items-center gap-2">
                  Requested by <span className="text-emerald-400 font-bold">{user}</span> • {new Date().toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">The Story</h4>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{description}</p>
                  </div>

                  {proofUrl && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Verified Proof of Need</h4>
                        <ShieldCheck className="text-emerald-400" size={14} />
                      </div>
                      <div className="rounded-xl overflow-hidden border border-emerald-500/20 aspect-video bg-black/40 shadow-inner group cursor-zoom-in">
                        <img src={proofUrl} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Goal Amount</p>
                      <p className="text-2xl font-bold text-emerald-400">{amount.toLocaleString()} {token}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Raised So Far</p>
                      <p className={`text-2xl font-bold ${status === 'Funded' ? 'text-blue-400' : 'text-foreground'}`}>
                        {raised.toLocaleString()} {token}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Heart size={14} className="text-red-500 fill-red-500" /> Supporters ({contributions.length})
                    </h4>
                    <div className="space-y-3">
                      {contributions.length > 0 ? (
                        contributions.map((c) => (
                          <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5 hover:bg-white/[0.07] transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-emerald-400">{c.user}</span>
                              <span className="text-sm font-bold text-white">{c.amount} {c.token}</span>
                            </div>
                            {c.message && (
                              <p className="text-xs text-muted-foreground leading-relaxed italic">"{c.message}"</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/50 pt-1">{new Date(c.timestamp).toLocaleDateString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 px-4 rounded-xl bg-white/5 border border-dashed border-white/10">
                          <p className="text-xs text-muted-foreground italic">No contributions yet. Be the first to help {user}!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="icon" className="shrink-0 border-white/5 bg-white/5 hover:bg-white/10 group h-9 w-9">
            <Share2 size={14} className="group-hover:text-emerald-400 transition-colors" />
          </Button>
        </div>

        {status === 'Completed' ? (
          <Button variant="outline" className="w-full gap-2 border-emerald-500/50 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 h-10 font-bold" disabled>
            <CheckCircle2 size={16} />
            Aid Completed
          </Button>
        ) : status === 'Funded' && isOwner ? (
          <Button onClick={() => markCompleted(id)} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 h-10 font-bold text-white shadow-lg shadow-emerald-900/20">
            <CheckCircle2 size={16} />
            Mark as Completed
          </Button>
        ) : isContributing ? (
          <div className="space-y-3 animate-in slide-in-from-top-2 w-full pt-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
                <Input 
                  type="number" 
                  className="pl-12 h-14 bg-white/10 border-white/20 focus:border-emerald-500/50 text-xl font-black" 
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                />
              </div>
              <Select 
                value={contributionToken} 
                onValueChange={(v: TokenSymbol) => setContributionToken(v)}
              >
                <SelectTrigger className="w-[100px] h-14 bg-white/10 border-white/20 text-sm font-bold">
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
                placeholder="Add a message of support..." 
                className="pl-9 h-10 text-xs bg-white/5 border-white/10 focus:border-emerald-500/50" 
                value={contributionMessage}
                onChange={(e) => setContributionMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleContribute} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-12 font-bold text-base shadow-lg shadow-emerald-900/20">
                Send Contribution
              </Button>
              <Button variant="ghost" onClick={() => setIsContributing(false)} className="h-12 w-12 p-0 text-muted-foreground hover:text-white hover:bg-white/5">
                <X size={20} />
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsContributing(true)} 
            className={`w-full gap-2 font-bold h-10 transition-all ${status === 'Funded' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}`}
            disabled={status === 'Funded' && !isOwner}
          >
            <Heart size={16} className="fill-current" />
            {status === 'Funded' ? 'Fully Funded' : 'Contribute Now'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;