"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Heart, PlusCircle, CheckCircle2, Zap } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = () => {
  const { requests } = useRequests();

  const activities = useMemo(() => {
    const list: any[] = [];

    requests.forEach(req => {
      list.push({
        id: `post-${req.id}`,
        type: 'request',
        user: req.user,
        category: req.category,
        amount: `${req.amount} ${req.token}`,
        time: req.timestamp,
      });

      req.contributions.forEach(c => {
        list.push({
          id: `contrib-${c.id}`,
          type: 'contribution',
          user: c.user,
          target: req.user,
          amount: `${c.amount} ${c.token}`,
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
          user: req.user,
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
    <Card className="glass-card border-white/5 overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-sm font-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <span>LIVE ACTIVITY</span>
          </div>
          <Zap size={12} className="text-primary animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const isLatest = activity.id === latestId;
              return (
                <div 
                  key={activity.id} 
                  className={`flex gap-3 items-start p-4 transition-all duration-500 relative group ${
                    isLatest 
                      ? 'bg-blue-500/[0.03] shadow-[inset_4px_0_0_0_#60a5fa]' 
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {isLatest && (
                    <div className="absolute inset-0 bg-blue-400/5 blur-xl pointer-events-none animate-pulse" />
                  )}
                  
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110 ${
                    activity.type === 'contribution' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    activity.type === 'request' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {activity.type === 'contribution' ? <Heart size={14} className="fill-current" /> :
                     activity.type === 'request' ? <PlusCircle size={14} /> :
                     <CheckCircle2 size={14} />}
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10">
                    <p className="text-xs leading-normal">
                      <span className="font-black text-foreground hover:text-blue-400 transition-colors cursor-pointer">{activity.user}</span>
                      {activity.type === 'contribution' && (
                        <span className="text-muted-foreground"> contributed <span className="text-primary font-bold">{activity.amount}</span> to <span className="text-blue-400 font-bold">{activity.target}</span></span>
                      )}
                      {activity.type === 'request' && (
                        <span className="text-muted-foreground"> posted a new <span className="text-red-400 font-bold">{activity.category.split(' ')[0]}</span> request</span>
                      )}
                      {activity.type === 'completed' && (
                        <span className="text-muted-foreground"> marked their request as <span className="text-emerald-400 font-bold">COMPLETED</span></span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      {formatDistanceToNow(activity.time, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-8">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;