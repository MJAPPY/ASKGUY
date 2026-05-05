"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Heart, PlusCircle, CheckCircle2 } from 'lucide-react';

const ActivityFeed = () => {
  const activities = [
    { id: 1, type: 'contribution', user: 'tripseven.xpr', target: 'alice.xpr', amount: '50 XPR', time: '2m ago' },
    { id: 2, type: 'request', user: 'new_user.xpr', category: 'Medical', amount: '800 XPR', time: '15m ago' },
    { id: 3, type: 'completed', user: 'bob.xpr', time: '1h ago' },
    { id: 4, type: 'contribution', user: 'guy_whale.xpr', target: 'charlie.xpr', amount: '500 XPR', time: '2h ago' },
  ];

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
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 items-start group">
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
                    <> posted a new <span className="text-red-400 font-bold">{activity.category}</span> request</>
                  )}
                  {activity.type === 'completed' && (
                    <> marked their request as <span className="text-green-400 font-bold">Completed</span></>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;