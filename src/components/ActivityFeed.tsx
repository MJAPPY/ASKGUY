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
      list.push({
        id: `post-${req.id}`,
        type: 'request',
        user: req.requestor,
        category: req.category,
        amount: `${req.amount.toLocaleString()} ${req.token}`,
        time: req.timestamp,
        title: req.title
      });

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
        <CardTitle className="text-xs font-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="tracking-[0.2em] text-white/90">LIVE ACTIVITY</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
             <Zap size={10} className="text-primary fill-primary" />
             <span className="text-[9px] text-primary font-black uppercase tracking-tight">Real-time</span>
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
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-500/20",
                  glow: "bg-blue-400/5"
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
                    isLatest ? "bg-white/[0.04] border-l-primary" : "hover:bg-white/[0.02] hover:border-l-white/20"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 shadow-lg relative z-10",
                    config.bg, config.color, config.border
                  )}>
                    {config.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10 space-y-1">
                    <p className="text-[13px] leading-relaxed font-semibold text-white/90">
                      <span className="font-black text-primary hover:underline transition-all cursor-pointer">@{activity.user}</span>
                      {activity.type === 'contribution' && (
                        <>
                          <span className="text-white/70"> gifted </span>
                          <span className="text-white font-black">{activity.amount}</span>
                          <span className="text-white/70"> to </span>
                          <span className="text-blue-400 font-black">@{activity.target}</span>
                        </>
                      )}
                      {activity.type === 'request' && (
                        <>
                          <span className="text-white/70"> posted a </span>
                          <span className="text-blue-400 font-black">{activity.amount}</span>
                          <span className="text-white/70"> request for </span>
                          <span className="text-white font-black">"{activity.title}"</span>
                        </>
                      )}
                      {activity.type === 'completed' && (
                        <>
                          <span className="text-white/70"> successfully </span>
                          <span className="text-emerald-400 font-black tracking-widest uppercase text-[10px]">Completed</span>
                          <span className="text-white/70"> their request!</span>
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-black flex items-center gap-1.5 uppercase tracking-widest">
                      <Circle size={4} className="fill-current opacity-50" />
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
              <p className="text-xs text-muted-foreground font-semibold italic">Waiting for live events...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;