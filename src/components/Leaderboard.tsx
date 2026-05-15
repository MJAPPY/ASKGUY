"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Crown, Star, Users, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  limit?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 7 }) => {
  // Generating mock data for top 100
  const leaders = useMemo(() => {
    const baseLeaders = [
      { name: "tripseven.xpr", amount: 15400, avatar: "T" },
      { name: "guy_whale.xpr", amount: 12200, avatar: "G" },
      { name: "helper.xpr", amount: 8900, avatar: "H" },
      { name: "community.xpr", amount: 5400, avatar: "C" },
      { name: "friend.xpr", amount: 3200, avatar: "F" },
      { name: "legend.xpr", amount: 2100, avatar: "L" },
      { name: "supporter.xpr", amount: 1800, avatar: "S" },
    ];

    const generated = Array.from({ length: Math.max(0, limit - baseLeaders.length) }, (_, i) => ({
      name: `user_${i + 8}.xpr`,
      amount: Math.floor(Math.random() * 1500) + 100,
      avatar: String.fromCharCode(65 + (i % 26))
    }));

    return [...baseLeaders, ...generated]
      .sort((a, b) => b.amount - a.amount)
      .map((l, i) => ({ ...l, rank: i + 1 }))
      .slice(0, limit);
  }, [limit]);

  const getRankConfig = (rank: number) => {
    switch(rank) {
      case 1: return {
        wrapper: "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.3)]",
        badge: "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]",
        icon: "text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]",
        label: "Ultimate Helper",
        rowBg: "bg-yellow-500/[0.03]"
      };
      case 2: return {
        wrapper: "bg-slate-400/10 border-slate-400/30 shadow-[0_0_40px_rgba(148,163,184,0.2)]",
        badge: "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 text-black shadow-[0_0_15px_rgba(148,163,184,0.4)]",
        icon: "text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.4)]",
        label: "Diamond Heart",
        rowBg: "bg-slate-400/[0.02]"
      };
      case 3: return {
        wrapper: "bg-amber-700/10 border-amber-700/30 shadow-[0_0_30px_rgba(180,83,9,0.15)]",
        badge: "bg-gradient-to-br from-amber-500 via-amber-700 to-amber-800 text-white shadow-[0_0_12px_rgba(180,83,9,0.4)]",
        icon: "text-amber-600 drop-shadow-[0_0_6px_rgba(180,83,9,0.4)]",
        label: "Golden Giver",
        rowBg: "bg-amber-700/[0.01]"
      };
      case 4:
      case 5: return {
        wrapper: "bg-emerald-500/5 border-emerald-500/20",
        badge: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]",
        icon: "text-emerald-500/50",
        label: "Elite Supporter",
        rowBg: "transparent"
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
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{limit} Verified</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={limit > 10 ? "h-[800px]" : ""}>
          <div className="divide-y divide-white/5">
            {leaders.map((leader) => {
              const config = getRankConfig(leader.rank);
              const isTop5 = !!config;
              
              return (
                <div 
                  key={leader.name} 
                  className={cn(
                    "flex items-center justify-between p-6 px-8 transition-all duration-500 hover:bg-white/[0.04] relative group",
                    config?.rowBg || "transparent"
                  )}
                >
                  {/* Hover Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                  <div className="flex items-center gap-8 relative z-10">
                    {/* Professional Rank Badge */}
                    <div className="flex items-center justify-center min-w-[64px]">
                      {isTop5 ? (
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
                            
                            {leader.rank === 1 && (
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce">
                                <Crown className="text-yellow-400 fill-yellow-400/20" size={16} />
                              </div>
                            )}
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
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border transition-all duration-500 group-hover:scale-105 shadow-2xl overflow-hidden",
                          isTop5 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'
                        )}>
                          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50" />
                          <span className="relative z-10">{leader.avatar}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-black text-lg tracking-tight transition-colors",
                            leader.rank === 1 ? 'text-primary' : 'text-white'
                          )}>
                            {leader.name}
                          </span>
                          {isTop5 && <Star className="text-primary fill-primary animate-pulse" size={10} />}
                        </div>
                        {isTop5 ? (
                          <div className={cn("text-[9px] font-black uppercase tracking-[0.2em]", config.icon)}>
                            {config.label}
                          </div>
                        ) : (
                          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            Verified Contributor
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right relative z-10">
                    <div className="flex items-center gap-2.5 justify-end">
                      <Zap size={14} className={cn("fill-current transition-transform duration-500 group-hover:scale-125", isTop5 ? 'text-primary' : 'text-white/20')} />
                      <span className={cn(
                        "text-2xl font-black tabular-nums tracking-tighter transition-all duration-500 group-hover:scale-105",
                        leader.rank === 1 ? 'text-primary drop-shadow-[0_0_10px_rgba(244,201,93,0.3)]' : 'text-white'
                      )}>
                        {leader.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground/50 tracking-widest uppercase">XPR</span>
                    </div>
                    {isTop5 && (
                      <div className="mt-1.5 flex justify-end gap-1">
                        {Array.from({ length: 5 - leader.rank + 1 }).map((_, i) => (
                          <div key={i} className={cn("w-1 h-1 rounded-full", config.badge.split(' ')[0])} />
                        ))}
                      </div>
                    )}
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