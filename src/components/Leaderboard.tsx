"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';

const Leaderboard = () => {
  const leaders = [
    { name: "tripseven.xpr", amount: 15400, rank: 1 },
    { name: "guy_whale.xpr", amount: 12200, rank: 2 },
    { name: "helper.xpr", amount: 8900, rank: 3 },
    { name: "community.xpr", amount: 5400, rank: 4 },
    { name: "friend.xpr", amount: 3200, rank: 5 },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">Top Contributors</CardTitle>
        <Trophy className="text-primary" size={20} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-4">
          {leaders.map((leader) => (
            <div key={leader.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  leader.rank === 1 ? 'bg-yellow-500 text-black' : 
                  leader.rank === 2 ? 'bg-slate-300 text-black' : 
                  leader.rank === 3 ? 'bg-amber-600 text-black' : 'bg-white/10'
                }`}>
                  {leader.rank}
                </div>
                <span className="text-sm font-medium">{leader.name}</span>
              </div>
              <span className="text-sm text-primary font-bold">{leader.amount.toLocaleString()} XPR</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;