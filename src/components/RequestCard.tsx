"use client";

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Share2, CheckCircle2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface RequestProps {
  id: string;
  user: string;
  category: string;
  amount: number;
  raised: number;
  description: string;
  status: 'Open' | 'Funded' | 'Completed';
}

const RequestCard: React.FC<RequestProps> = ({ user, category, amount, raised, description, status }) => {
  const progress = (raised / amount) * 100;

  const handleContribute = () => {
    showSuccess(`Contributed to ${user}'s request!`);
  };

  return (
    <Card className="glass-card overflow-hidden group hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Posted by {user}</p>
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
            <span className="font-medium">{raised} / {amount} XPR</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        {status === 'Completed' ? (
          <Button variant="outline" className="w-full gap-2 border-green-500/50 text-green-400 hover:bg-green-500/10">
            <CheckCircle2 size={16} />
            Thanks Sent
          </Button>
        ) : (
          <>
            <Button onClick={handleContribute} className="flex-1 gap-2">
              <Heart size={16} />
              Contribute
            </Button>
            <Button variant="outline" size="icon">
              <Share2 size={16} />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default RequestCard;