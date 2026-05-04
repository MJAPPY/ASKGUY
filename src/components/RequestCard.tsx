"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Share2, CheckCircle2, Coins } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useRequests, AidRequest } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { Input } from '@/components/ui/input';

const RequestCard: React.FC<AidRequest> = ({ id, user, category, amount, raised, description, status }) => {
  const { contribute, markCompleted } = useRequests();
  const { address, xprBalance } = useWallet();
  const [contributionAmount, setContributionAmount] = useState("10");
  const [isContributing, setIsContributing] = useState(false);

  const progress = Math.min((raised / amount) * 100, 100);
  const isOwner = address === user;

  const handleContribute = () => {
    const val = parseFloat(contributionAmount);
    if (isNaN(val) || val <= 0) return;
    
    contribute(id, val);
    showSuccess(`Contributed ${val} XPR to ${user}'s request!`);
    setIsContributing(false);
  };

  return (
    <Card className="glass-card overflow-hidden group hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Posted by {user} {isOwner && "(You)"}</p>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
              {category}
            </Badge>
          </div>
          <Badge className={
            status === 'Open' ? 'bg-blue-500/20 text-blue-400' : 
            status === 'Funded' ? 'bg-primary/20 text-primary' : 
            'bg-green-500/20 text-green-400'
          }>
            {status}
          </Badge>
        </div>

        <p className="text-sm line-clamp-3 mb-6 text-foreground/80">
          {description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{raised.toLocaleString()} / {amount.toLocaleString()} XPR</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-3">
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
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input 
                type="number" 
                className="pl-9 h-9" 
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleContribute}>Send</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsContributing(false)}>X</Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Button 
              onClick={() => setIsContributing(true)} 
              className="flex-1 gap-2"
              disabled={status === 'Funded'}
            >
              <Heart size={16} />
              {status === 'Funded' ? 'Fully Funded' : 'Contribute'}
            </Button>
            <Button variant="outline" size="icon">
              <Share2 size={16} />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;