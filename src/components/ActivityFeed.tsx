"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Heart, PlusCircle, CheckCircle2, Zap, Circle } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const ActivityFeed = () => {
  const { requests } = useRequests();

  const activities = useMemo(() => {
    const list: any[] = [];

    requests.forEach(req => {
      // New Requests
      list.push({
        id: `post-${req.id}`,
        type: 'request',
        user: req.requestor,
        category: req.category,
        amount: `${req.amount.toLocaleString()} ${req.token}`,
        time: req.timestamp,
        title: req.title
      });

      // Contributions
      req.contributions.forEach(c => {
        list.push({
          id: `contrib-${c.id}`,
          type: 'contribution',
          user: c.user,
          target: req.requestor,
          amount: `${c.amount.toLocaleString()} ${c.token}`,
          time: c.timestamp,
        });
      });

      // Completions
      if (req.status === 'Completed') {
        const completionTime = req.contributions.length > 0 
          ? Math.max(...req.contributions.map(c => c.timestamp))
          : req.timestamp;

        list.push({
          id: `complete-${req.id}`,
          type: 'completed',
          user: req.requestor,
          time: completionTime + 1,
        });
      }
    });

    return list
      .sort((a, b) => b.time - a.time)
      .slice(0, 8);
  }, [requests]);

  const latestId = activities.length > 0 ? activities[0].id : null;

  return (
    <Card className="glass-card border-white/5 overflow-hidden shadow-2xl">
      <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.01]">
        <CardTitle className="text-sm font-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="tracking-[0.2em] text-white/90">LIVE ACTIVITY</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
             <Zap size={10} className="text-primary fill-primary" />
             <span className="text-[9px] text-primary font-black uppercase tracking-tighter">Real-time</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const isLatest = activity.id === latestId;
              
              const config = {
                contribution: {
                  icon: <Heart size={14} className="fill-current" />,
                  color: "text-rose-400",
                  bg: "bg-rose-500/10",
                  border: "border-rose-500/20",
                  glow: "bg-rose-400/5"
                },
                request: {
                  icon: <PlusCircle size={14} />,
                  color: "text-[#1565C0]",
                  bg: "bg-[#1565C0]/10",
                  border: "border-[#1565C0]/20",
                  glow: "bg-[#1565C0]/5"
                },
                completed: {
                  icon: <CheckCircle2 size={14} />,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                  glow: "bg-emerald-400/5"
                }
              }[activity.type as 'contribution' | 'request' | 'completed'];

              return (
                <div 
                  key={activity.id} 
                  className={cn(
                    "flex gap-4 items-start p-5 transition-all duration-500 relative group border-l-2 border-transparent",
                    isLatest ? "bg-white/[0.03] border-l-primary" : "hover:bg-white/[0.015] hover:border-l-white/20"
                  )}
                >
                  {isLatest && (
                    <div className={cn("absolute inset-0 blur-2xl pointer-events-none opacity-40", config.glow)} />
                  )}
                  
                  <div className={cn(
                    "mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 shadow-lg relative z-10",
                    config.bg, config.color, config.border
                  )}>
                    {config.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10 space-y-1">
                    <p className="text-xs leading-relaxed font-medium">
                      <span className="font-black text-white hover:text-primary transition-colors cursor-pointer tracking-tight">@{activity.user}</span>
                      {activity.type === 'contribution' && (
                        <>
                          <span className="text-muted-foreground"> contributed </span>
                          <span className="text-primary font-black">{activity.amount}</span>
                          <span className="text-muted-foreground"> to </span>
                          <span className="text-[#1565C0] font-black">@{activity.target}</span>
                        </>
                      )}
                      {activity.type === 'request' && (
                        <>
                          <span className="text-muted-foreground"> posted a </span>
                          <span className="text-[#1565C0] font-black">{activity.amount}</span>
                          <span className="text-muted-foreground"> request for </span>
                          <span className="text-white font-black">"{activity.title}"</span>
                        </>
                      )}
                      {activity.type === 'completed' && (
                        <>
                          <span className="text-muted-foreground"> successfully </span>
                          <span className="text-emerald-400 font-black tracking-widest uppercase text-[10px]">Completed</span>
                          <span className="text-muted-foreground"> their request!</span>
                        </>
                      )}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 font-black flex items-center gap-1.5 uppercase tracking-widest">
                      <Circle size={4} className="fill-current" />
                      {formatDistanceToNow(activity.time, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/20">
                <Activity size={24} />
              </div>
              <p className="text-xs text-muted-foreground font-medium italic">Monitoring network for live activity...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;