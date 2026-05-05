"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Share2, CheckCircle2, Coins, Eye, AlertTriangle, MessageSquare } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useRequests, AidRequest, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RequestCard: React.FC<AidRequest> = ({ id, user, category, amount, token, raised, description, status, proofUrl, isUrgent, contributions }) => {
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
    switch (category.toLowerCase()) {
      case 'medical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'utilities': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'emergency': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <Card className={`glass-card overflow-hidden group hover:border-primary/30 transition-all duration-300 ${isUrgent && status === 'Open' ? 'border-red-500/30 red-glow' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Posted by {user} {isOwner && "(You)"}</p>
            <div className="flex gap-2 items-center">
              <Badge variant="secondary" className={`${getCategoryColor()} border`}>
                {category}
              </Badge>
              {isUrgent && status === 'Open' && (
                <Badge className="bg-red-500/20 text-red-400 border-none flex gap-1 items-center animate-pulse">
                  <AlertTriangle size={10} /> Urgent
                </Badge>
              )}
            </div>
          </div>
          <Badge className={
            status === 'Open' ? 'bg-primary/10 text-primary' : 
            status === 'Funded' ? 'bg-blue-500/20 text-blue-400 font-bold' : 
            'bg-green-500/20 text-green-400'
          }>
            {status}
          </Badge>
        </div>

        <p className="text-sm line-clamp-2 mb-6 text-foreground/80">
          {description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress ({token})</span>
            <span className="font-medium">{raised.toLocaleString()} / {amount.toLocaleString()} {token}</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2" 
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
              <Button variant="outline" size="sm" className="flex-1 gap-2 border-white/5 hover:bg-white/10 group">
                <Eye size={14} className="group-hover:text-blue-400 transition-colors" /> Details
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className={getCategoryColor()}>{category}</Badge>
                  <span className="text-xs text-muted-foreground">ID: {id}</span>
                </div>
                <DialogTitle className="text-2xl">Request by {user}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Posted on {new Date().toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Description</h4>
                    <p className="text-foreground leading-relaxed">{description}</p>
                  </div>

                  {proofUrl && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Proof of Need</h4>
                      <div className="rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                        <img src={proofUrl} alt="Proof" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-xs text-muted-foreground">Goal Amount</p>
                      <p className="text-xl font-bold text-primary">{amount.toLocaleString()} {token}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Raised So Far</p>
                      <p className={`text-xl font-bold ${status === 'Funded' ? 'text-blue-400' : 'text-foreground'}`}>
                        {raised.toLocaleString()} {token}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Heart size={14} className="text-red-500" /> Supporters ({contributions.length})
                    </h4>
                    <div className="space-y-3">
                      {contributions.length > 0 ? (
                        contributions.map((c) => (
                          <div key={c.id} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-blue-400">{c.user}</span>
                              <span className="text-xs font-bold">{c.amount} {c.token}</span>
                            </div>
                            {c.message && (
                              <p className="text-xs text-muted-foreground italic">"{c.message}"</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/50">{new Date(c.timestamp).toLocaleDateString()}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No contributions yet. Be the first!</p>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="icon" className="shrink-0 border-white/5 hover:bg-white/10 group">
            <Share2 size={14} className="group-hover:text-primary transition-colors" />
          </Button>
        </div>

        {status === 'Completed' ? (
          <Button variant="outline" className="w-full gap-2 border-green-500/50 text-green-400 hover:bg-green-500/10" disabled>
            <CheckCircle2 size={16} />
            Aid Completed
          </Button>
        ) : status === 'Funded' && isOwner ? (
          <Button onClick={() => markCompleted(id)} className="w-full gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 size={16} />
            Mark as Completed
          </Button>
        ) : isContributing ? (
          <div className="space-y-2 animate-in slide-in-from-top-2 w-full">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={14} />
                <Input 
                  type="number" 
                  className="pl-9 h-9 bg-white/5" 
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                />
              </div>
              <Select 
                value={contributionToken} 
                onValueChange={(v: TokenSymbol) => setContributionToken(v)}
              >
                <SelectTrigger className="w-[80px] h-9 bg-white/5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XPR">XPR</SelectItem>
                  <SelectItem value="GUY">GUY</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleContribute} className="blue-glow bg-blue-600 hover:bg-blue-700 text-white">Send</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsContributing(false)}>X</Button>
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input 
                placeholder="Add a message (optional)" 
                className="pl-9 h-8 text-xs bg-white/5" 
                value={contributionMessage}
                onChange={(e) => setContributionMessage(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsContributing(true)} 
            className={`w-full gap-2 ${status === 'Funded' ? 'bg-blue-600 hover:bg-blue-700 blue-glow' : 'gold-glow bg-primary hover:bg-primary/90 text-black'}`}
            disabled={status === 'Funded' && !isOwner}
          >
            <Heart size={16} className={status === 'Funded' ? 'fill-white' : 'fill-black'} />
            {status === 'Funded' ? 'Fully Funded' : 'Contribute Now'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;