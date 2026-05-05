"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Users, CheckCircle2, Heart } from 'lucide-react';

const CommunityStats = () => {
  const stats = [
    {
      label: "Total Aid Provided",
      value: "142,500 XPR",
      icon: <Coins className="text-primary" size={20} />,
      color: "bg-primary/20",
      description: "Directly to community members"
    },
    {
      label: "Bills Fully Funded",
      value: "342",
      icon: <CheckCircle2 className="text-blue-400" size={20} />,
      color: "bg-blue-500/20",
      description: "100% success rate"
    },
    {
      label: "Active Members",
      value: "1,204",
      icon: <Users className="text-white" size={20} />,
      color: "bg-white/10",
      description: "Verified GUY holders"
    },
    {
      label: "Total Contributors",
      value: "856",
      icon: <Heart className="text-red-500" size={20} />,
      color: "bg-red-500/20",
      description: "Unique donors this month"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <Card key={i} className="glass-card border-white/5 overflow-hidden relative group cursor-default">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-40 group-hover:scale-110 group-hover:brightness-150 transition-all duration-300">
            {stat.icon}
          </div>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
            <h3 className="text-xl font-bold text-foreground mb-1">{stat.value}</h3>
            <p className="text-[10px] text-muted-foreground">{stat.description}</p>
          </CardContent>
          <div className={`absolute bottom-0 left-0 h-1 w-full transition-colors ${stat.color}`} />
        </Card>
      ))}
    </div>
  );
};

export default CommunityStats;