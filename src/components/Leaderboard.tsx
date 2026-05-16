"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Crown, Star, Zap, Flame } from 'lucide-react';
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
      return [{ address: "Waiting for legends...", amount: 0, avatar: "?", rank: 1 }];
    }

    return sortedList
      .map((l, i) => ({ ...l, rank: i + 1 }))
      .slice(0, limit);
  }, [requests, limit]);

  const getRankConfig = (rank: number) => {
    switch(rank) {
      case 1: return { 
        wrapper: "bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_40px_rgba(234,179,8,0.2)] scale-[1.02] z-20", 
        badge: "bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.6)]", 
        icon: <Crown size={28} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-bounce" />,
        glow: "from-yellow-500/20 to-transparent",
        numberColor: "text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]"
      };
      case 2: return { 
        wrapper: "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] z-10", 
        badge: "bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]", 
        icon: <Star size={24} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />,
        glow: "from-cyan-500/15 to-transparent",
        numberColor: "text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
      };
      case 3: return { 
        wrapper: "bg-rose-500/10 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)] z-10", 
        badge: "bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]", 
        icon: <Flame size={24} className="text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />,
        glow: "from-rose-500/15 to-transparent",
        numberColor: "text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
      };
      default: return null;
    }
  };

  return (
    <Card className="glass-card border-2 border-white/5 bg-[#0a0a0c] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
      
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-6 px-8 relative bg-white/[0.01]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg shadow-[0_0_15px_rgba(251,212,81,0.2)]">
              <Trophy className="text-primary" size={20} />
            </div>
            <CardTitle className="text-2xl font-black tracking-[0.1em] uppercase italic text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              Hall of Fame
            </CardTitle>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-11">The Legends List</p>
        </div>
        <Zap className="text-primary/20 animate-pulse" size={24} />
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <ScrollArea className={limit > 10 ? "h-[800px]" : ""}>
          <div className="divide-y divide-white/5">
            {leaders.map((leader) => {
              const config = getRankConfig(leader.rank);
              const isTopThree = leader.rank <= 3;
              
              return (
                <div 
                  key={leader.address} 
                  className={cn(
                    "group relative flex items-center justify-between p-6 px-8 transition-all duration-500 hover:bg-white/[0.03]",
                    config?.wrapper,
                    !isTopThree && "hover:border-white/10"
                  )}
                >
                  {config && (
                    <div className={cn("absolute inset-0 bg-gradient-to-r opacity-20 pointer-events-none", config.glow)} />
                  )}

                  <div className="flex items-center gap-10 relative z-10">
                    <div className="min-w-[60px] flex items-center justify-center">
                      <span className={cn(
                        "font-black text-4xl italic tracking-tighter transition-all duration-500",
                        isTopThree ? config.numberColor : "text-muted-foreground/20 group-hover:text-white/40 group-hover:scale-110"
                      )}>
                        #{leader.rank}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-5 pt-3">
                      <div className="relative">
                        <div className={cn(
                          "absolute -inset-1 rounded-[20px] blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-700",
                          isTopThree ? config.badge : "bg-white/10"
                        )} />
                        
                        {/* Crown/Rank Icon on top of Avatar */}
                        {isTopThree && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                            {config.icon}
                          </div>
                        )}

                        <Avatar className={cn(
                          "w-16 h-16 rounded-2xl border-2 transition-all duration-500 group-hover:scale-105 p-1 bg-black/40 relative z-10",
                          isTopThree ? "border-white/30" : "border-white/5"
                        )}>
                          <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${leader.address}`} />
                          <AvatarFallback className="bg-white/5 font-black">{leader.avatar}</AvatarFallback>
                        </Avatar>

                        {/* Smaller Rank Number on Avatar for non-top 3 */}
                        {!isTopThree && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-[10px] text-muted-foreground z-20">
                            {leader.rank}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-black text-xl tracking-tight transition-colors",
                          isTopThree ? "text-white" : "text-muted-foreground group-hover:text-white"
                        )}>
                          @{leader.address}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Verified Supporter</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end relative z-10">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "text-3xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]",
                        leader.rank === 1 ? "text-yellow-400" : "text-white"
                      )}>
                        {leader.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground uppercase mt-1">XPR</span>
                    </div>
                    {isTopThree && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">Elite Level</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
      
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-primary to-rose-500 opacity-30" />
    </Card>
  );
};

export default Leaderboard;