"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Users, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRequests } from '@/hooks/use-requests';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  limit?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 7 }) => {
  const { requests } = useRequests();

  // Calculate dynamic leaders from real contribution data
  const leaders = useMemo(() => {
    const contributionMap: Record<string, number> = {};

    requests.forEach(req => {
      req.contributions.forEach(c => {
        // We only count XPR for the primary leaderboard rankings
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

    // If no one has contributed yet, show a placeholder
    if (sortedList.length === 0) {
      return [{ address: "Waiting for helpers...", amount: 0, avatar: "?", rank: 1 }];
    }

    return sortedList
      .map((l, i) => ({ ...l, rank: i + 1 }))
      .slice(0, limit);
  }, [requests, limit]);

  const getRankConfig = (rank: number) => {
    switch(rank) {
      case 1: return {
        wrapper: "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.3)]",
        badge: "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]",
        icon: "text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]",
        rowBg: "bg-yellow-500/[0.03]"
      };
      case 2: return {
        wrapper: "bg-slate-400/10 border-slate-400/30",
        badge: "bg-slate-400 text-black",
        icon: "text-slate-400",
        rowBg: "bg-slate-400/[0.02]"
      };
      case 3: return {
        wrapper: "bg-orange-700/10 border-orange-700/30",
        badge: "bg-orange-700 text-white",
        icon: "text-orange-700",
        rowBg: "bg-orange-700/[0.01]"
      };
      default: return null;
    }
  };

  return (
    <Card className="glass-card border-none bg-white/[0.02] overflow-hidden shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6 px-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Trophy className="text-primary" size={18} />
            </div>
            <CardTitle className="text-xl font-black tracking-tight">Hall of Fame</CardTitle>
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">XPR Network Legends</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <Users size={12} className="text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Season 1</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={limit > 10 ? "h-[800px]" : ""}>
          <div className="divide-y divide-white/5">
            {leaders.map((leader) => {
              const config = getRankConfig(leader.rank);
              const isTop3 = !!config;
              
              return (
                <div 
                  key={leader.address} 
                  className={cn(
                    "flex items-center justify-between p-6 px-8 transition-all duration-500 hover:bg-white/[0.04] relative group",
                    config?.rowBg || "transparent"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                  <div className="flex items-center gap-8 relative z-10">
                    <div className="flex items-center justify-center min-w-[64px]">
                      {isTop3 ? (
                        <div className="relative flex flex-col items-center">
                          <div className={cn(
                            "w-12 h-12 rounded-[18px] border flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 relative",
                            config.wrapper
                          )}>
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm z-10 border border-white/20",
                              config.badge
                            )}>
                              {leader.rank}
                            </div>
                            <Trophy className={cn("absolute -bottom-1.5 -right-1.5 opacity-40 -rotate-12", config.icon)} size={20} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 opacity-40">
                           <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Rank</span>
                           <span className="text-lg font-black text-white">#{leader.rank}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className={cn(
                          "w-14 h-14 rounded-2xl border transition-all duration-500 group-hover:scale-105 shadow-2xl p-1 bg-black/40",
                          isTop3 ? 'border-white/20' : 'border-white/10'
                        )}>
                          <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${leader.address}`} />
                          <AvatarFallback className="bg-primary text-black font-black text-xl rounded-xl">
                            {leader.avatar}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-black text-lg tracking-tight transition-colors",
                            leader.rank === 1 ? 'text-primary' : 'text-white'
                          )}>
                            {leader.address.startsWith('Waiting') ? leader.address : `@${leader.address}`}
                          </span>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                          {leader.amount > 0 ? 'Verified Supporter' : 'Community Member'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right relative z-10">
                    <div className="flex items-center gap-2.5 justify-end">
                      <Zap size={14} className={cn("fill-current transition-transform duration-500 group-hover:scale-125", isTop3 ? 'text-primary' : 'text-white/20')} />
                      <span className={cn(
                        "text-2xl font-black tabular-nums tracking-tighter transition-all duration-500 group-hover:scale-105",
                        leader.rank === 1 ? 'text-primary drop-shadow-[0_0_10px_rgba(244,201,93,0.3)]' : 'text-white'
                      )}>
                        {leader.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground/50 tracking-widest uppercase">XPR</span>
                    </div>
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