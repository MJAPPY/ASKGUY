"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Users, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRequests } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  limit?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 7 }) => {
  const { requests } = useRequests();
  const { avatarSet } = useWallet();

  const leaders = useMemo(() => {
    const contributionMap: Record<string, number> = {};
    requests.forEach(req => {
      req.contributions.forEach(c => {
        if (c.token === 'XPR') {
          contributionMap[c.user] = (contributionMap[c.user] || 0) + c.amount;
        }
      });
    });

    const sortedList = Object.entries(contributionMap)
      .map(([address, amount]) => ({
        address,
        amount,
        avatar: address.substring(0, 2).toUpperCase()
      }))
      .sort((a, b) => b.amount - a.amount);

    if (sortedList.length === 0) {
      return [{ address: "Waiting for helpers...", amount: 0, avatar: "?", rank: 1 }];
    }

    return sortedList
      .map((l, i) => ({ ...l, rank: i + 1 }))
      .slice(0, limit);
  }, [requests, limit]);

  const getRankConfig = (rank: number) => {
    switch(rank) {
      case 1: return { wrapper: "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.3)]", badge: "bg-yellow-500 text-black", icon: "text-yellow-400" };
      case 2: return { wrapper: "bg-slate-400/10 border-slate-400/30", badge: "bg-slate-400 text-black", icon: "text-slate-400" };
      case 3: return { wrapper: "bg-orange-700/10 border-orange-700/30", badge: "bg-orange-700 text-white", icon: "text-orange-700" };
      default: return null;
    }
  };

  return (
    <Card className="glass-card border-none bg-white/[0.02] overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6 px-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Trophy className="text-primary" size={18} />
            <CardTitle className="text-xl font-black tracking-tight">Hall of Fame</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={limit > 10 ? "h-[800px]" : ""}>
          <div className="divide-y divide-white/5">
            {leaders.map((leader) => {
              const config = getRankConfig(leader.rank);
              return (
                <div key={leader.address} className="flex items-center justify-between p-6 px-8 transition-all hover:bg-white/[0.04]">
                  <div className="flex items-center gap-8">
                    <div className="min-w-[48px] font-black text-lg">#{leader.rank}</div>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 rounded-2xl border border-white/10 p-1 bg-black/20">
                        <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${leader.address}`} />
                        <AvatarFallback>{leader.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-black text-lg tracking-tight">@{leader.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl font-black">{leader.amount.toLocaleString()}</span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase">XPR</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;