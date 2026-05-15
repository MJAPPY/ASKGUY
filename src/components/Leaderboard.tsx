"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Crown, Star, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const getRankStyles = (rank: number) => {
    switch(rank) {
      case 1: return {
        bg: "bg-gradient-to-br from-yellow-400/20 to-yellow-600/5",
        border: "border-yellow-500/30",
        shadow: "shadow-[0_0_40px_rgba(234,179,8,0.25)]",
        iconColor: "text-yellow-400",
        numBg: "bg-yellow-400 text-black",
        badgeScale: "scale-125"
      };
      case 2: return {
        bg: "bg-gradient-to-br from-slate-300/10 to-slate-400/5",
        border: "border-slate-300/20",
        shadow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]",
        iconColor: "text-slate-300",
        numBg: "bg-slate-300 text-black",
        badgeScale: "scale-110"
      };
      case 3: return {
        bg: "bg-gradient-to-br from-amber-700/10 to-amber-900/5",
        border: "border-amber-700/20",
        shadow: "shadow-[0_0_25px_rgba(180,83,9,0.15)]",
        iconColor: "text-amber-600",
        numBg: "bg-amber-600 text-white",
        badgeScale: "scale-105"
      };
      case 4:
      case 5: return {
        bg: "bg-white/[0.03]",
        border: "border-emerald-500/20",
        shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        iconColor: "text-emerald-400",
        numBg: "bg-emerald-500 text-black",
        badgeScale: "scale-100"
      };
      default: return null;
    }
  };

  return (
    <Card className="glass-card border-none bg-white/[0.02] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <Trophy className="text-primary" size={22} />
            Hall of Fame
          </CardTitle>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">The community's biggest hearts</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <Users size={12} className="text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest">{limit} Members</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={limit > 10 ? "h-[800px]" : ""}>
          <div className="divide-y divide-white/5">
            {leaders.map((leader) => {
              const styles = getRankStyles(leader.rank);
              const isTop5 = leader.rank <= 5;
              
              return (
                <div 
                  key={leader.name} 
                  className={`flex items-center justify-between p-4 px-6 transition-all duration-300 hover:bg-white/[0.05] ${styles?.bg || ''} ${leader.rank <= 3 ? 'py-8' : 'py-4'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="relative flex flex-col items-center justify-center min-w-[56px]">
                      {isTop5 && styles ? (
                        <div className={`relative flex items-center justify-center transition-all duration-500 hover:scale-110 ${styles.badgeScale}`}>
                          <Trophy className={`${styles.iconColor} opacity-20 absolute -top-1`} size={48} />
                          <div className={`relative z-10 w-8 h-8 rounded-full ${styles.numBg} flex items-center justify-center font-black text-sm shadow-xl border-2 border-background`}>
                            {leader.rank}
                          </div>
                          {leader.rank === 1 && (
                            <div className="absolute -top-4 -right-1 text-yellow-400 animate-bounce">
                              <Crown size={14} className="fill-current" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-black text-muted-foreground/30 ml-2">
                          #{leader.rank}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base border transition-all duration-500 group-hover:rotate-3 ${isTop5 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'} shadow-xl`}>
                          {leader.avatar}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-base tracking-tight ${leader.rank === 1 ? 'text-white' : 'text-foreground/90'}`}>
                            {leader.name}
                          </span>
                          {isTop5 && <Star className="text-primary fill-primary" size={10} />}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Verified Contributor</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`text-xl font-black tabular-nums ${leader.rank === 1 ? 'text-primary' : 'text-white'}`}>
                        {leader.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground tracking-tighter">XPR</span>
                    </div>
                    {isTop5 && (
                      <div className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${styles?.iconColor || ''} opacity-80`}>
                        {leader.rank === 1 ? 'PLATINUM' : leader.rank <= 3 ? 'ELITE' : 'TOP TIER'}
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