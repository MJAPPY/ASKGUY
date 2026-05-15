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
        shadow: "shadow-[0_0_30px_rgba(234,179,8,0.2)]",
        icon: <Trophy className="text-yellow-400 fill-yellow-400/20" size={24} />,
        medal: "text-yellow-400",
        rankColor: "text-yellow-400"
      };
      case 2: return {
        bg: "bg-gradient-to-br from-slate-300/10 to-slate-400/5",
        border: "border-slate-300/20",
        shadow: "shadow-[0_0_20px_rgba(148,163,184,0.15)]",
        icon: <Trophy className="text-slate-300 fill-slate-300/20" size={22} />,
        medal: "text-slate-300",
        rankColor: "text-slate-300"
      };
      case 3: return {
        bg: "bg-gradient-to-br from-amber-700/10 to-amber-900/5",
        border: "border-amber-700/20",
        shadow: "shadow-[0_0_20px_rgba(180,83,9,0.15)]",
        icon: <Trophy className="text-amber-600 fill-amber-600/20" size={20} />,
        medal: "text-amber-600",
        rankColor: "text-amber-600"
      };
      case 4:
      case 5: return {
        bg: "bg-white/[0.03]",
        border: "border-emerald-500/20",
        shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        icon: <Trophy className="text-emerald-400/70 fill-emerald-400/10" size={18} />,
        medal: "text-emerald-400/70",
        rankColor: "text-emerald-400"
      };
      default: return {
        bg: "bg-transparent",
        border: "border-white/5",
        shadow: "shadow-none",
        icon: null,
        medal: "text-muted-foreground",
        rankColor: "text-muted-foreground"
      };
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
              return (
                <div 
                  key={leader.name} 
                  className={`flex items-center justify-between p-4 px-6 transition-all duration-300 hover:bg-white/[0.05] ${styles.bg} ${leader.rank <= 3 ? 'py-6' : 'py-4'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="relative flex flex-col items-center justify-center min-w-[48px]">
                      {leader.rank <= 5 ? (
                        <div className="relative flex flex-col items-center">
                          <div className={`transition-transform duration-500 hover:scale-110`}>
                            {styles.icon}
                          </div>
                          <span className={`absolute -bottom-1 text-[10px] font-black ${styles.rankColor} drop-shadow-md`}>
                            #{leader.rank}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-muted-foreground/40">
                          #{leader.rank}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${styles.border} ${styles.shadow} bg-white/5`}>
                          {leader.avatar}
                        </div>
                        {leader.rank === 1 && (
                          <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 border border-yellow-500/30 shadow-lg">
                            <Crown className="text-yellow-400" size={12} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${leader.rank === 1 ? 'text-white' : 'text-foreground/90'}`}>
                            {leader.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Contributor</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`text-sm font-black ${leader.rank === 1 ? 'text-primary' : 'text-foreground'}`}>
                        {leader.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">XPR</span>
                    </div>
                    {leader.rank <= 5 && (
                      <div className={`text-[8px] font-black uppercase tracking-widest ${styles.medal}`}>
                        Elite Supporter
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