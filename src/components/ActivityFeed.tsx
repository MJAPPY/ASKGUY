"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Heart, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = () => {
  const { requests } = useRequests();

  // Aggregate all possible activities from the requests and their contributions
  const activities = useMemo(() => {
    const list: any[] = [];

    requests.forEach(req => {
      // 1. Add the original "Post" activity
      list.push({
        id: `post-${req.id}`,
        type: 'request',
        user: req.user,
        category: req.category,
        amount: `${req.amount} ${req.token}`,
        time: req.timestamp,
      });

      // 2. Add each contribution activity
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

      // 3. Add "Completed" activity if the status is Completed
      if (req.status === 'Completed') {
        // We'll approximate the completion time as the time of the last contribution 
        // or the post time if no contributions exist
        const completionTime = req.contributions.length > 0 
          ? Math.max(...req.contributions.map(c => c.timestamp))
          : req.timestamp;

        list.push({
          id: `complete-${req.id}`,
          type: 'completed',
          user: req.user,
          time: completionTime + 1, // Slightly after to keep order
        });
      }
    });

    // Sort by newest first and take the top 8
    return list
      .sort((a, b) => b.time - a.time)
      .slice(0, 8);
  }, [requests]);

  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity size={16} className="text-blue-400 animate-pulse" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 items-start group animate-in fade-in slide-in-from-right-2 duration-500">
                <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${
                  activity.type === 'contribution' ? 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20' :
                  activity.type === 'request' ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' :
                  'bg-green-500/10 text-green-400 group-hover:bg-green-500/20'
                }`}>
                  {activity.type === 'contribution' ? <Heart size={12} className="fill-current" /> :
                   activity.type === 'request' ? <PlusCircle size={12} /> :
                   <CheckCircle2 size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-tight">
                    <span className="font-bold text-foreground group-hover:text-blue-400 transition-colors">{activity.user}</span>
                    {activity.type === 'contribution' && (
                      <> contributed <span className="text-primary font-bold">{activity.amount}</span> to <span className="text-blue-400">{activity.target}</span></>
                    )}
                    {activity.type === 'request' && (
                      <> posted a new <span className="text-red-400 font-bold">{activity.category.split(' ')[0]}</span> request</>
                    )}
                    {activity.type === 'completed' && (
                      <> marked their request as <span className="text-green-400 font-bold">Completed</span></>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(activity.time, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-4">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;