"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Users, CheckCircle2, Heart } from 'lucide-react';

const CommunityStats = () => {
  const stats = [
    {
      label: "Total Aid Provided",
      value: "142,500 XPR",
      icon: <Coins className="text-emerald-400" size={20} />,
      color: "from-emerald-500/20 to-transparent",
      borderColor: "border-emerald-500/20",
      description: "Directly to community members"
    },
    {
      label: "Bills Fully Funded",
      value: "342",
      icon: <CheckCircle2 className="text-blue-400" size={20} />,
      color: "from-blue-500/20 to-transparent",
      borderColor: "border-blue-500/20",
      description: "100% success rate"
    },
    {
      label: "Active Members",
      value: "1,204",
      icon: <Users className="text-purple-400" size={20} />,
      color: "from-purple-500/20 to-transparent",
      borderColor: "border-purple-500/20",
      description: "Verified GUY holders"
    },
    {
      label: "Total Contributors",
      value: "856",
      icon: <Heart className="text-rose-400" size={20} />,
      color: "from-rose-500/20 to-transparent",
      borderColor: "border-rose-500/20",
      description: "Unique donors this month"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <Card key={i} className={`glass-card ${stat.borderColor} overflow-hidden relative group cursor-default transition-all duration-500 hover:translate-y-[-2px]`}>
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-60 transition-opacity duration-500">
            {stat.icon}
          </div>
          <CardContent className="p-5 relative z-10">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] text-muted-foreground/70 font-medium">{stat.description}</p>
          </CardContent>
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          <div className={`absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r ${stat.color.replace('/20', '')} opacity-30`} />
        </Card>
      ))}
    </div>
  );
};

export default CommunityStats;