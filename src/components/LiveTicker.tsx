"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Zap } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';

const LiveTicker = () => {
  const { requests } = useRequests();

  const recentDonations = useMemo(() => {
    return requests
      .flatMap(req => req.contributions.map(c => ({ ...c, target: req.requestor })))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [requests]);

  if (recentDonations.length === 0) return null;

  return (
    <div className="w-full bg-primary/5 border-y border-primary/10 py-2 overflow-hidden whitespace-nowrap relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      
      <div className="inline-block animate-marquee">
        {recentDonations.map((donation, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-widest">
            <Heart size={12} className="text-primary fill-primary" />
            <span className="text-primary">{donation.user}</span>
            <span className="text-muted-foreground">SENT</span>
            <span className="text-white">{donation.amount} {donation.token}</span>
            <span className="text-muted-foreground">TO</span>
            <span className="text-blue-400">{donation.target}</span>
          </span>
        ))}
      </div>
      
      <div className="inline-block animate-marquee">
        {recentDonations.map((donation, i) => (
          <span key={`dup-${i}`} className="inline-flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-widest">
            <Heart size={12} className="text-primary fill-primary" />
            <span className="text-primary">{donation.user}</span>
            <span className="text-muted-foreground">SENT</span>
            <span className="text-white">{donation.amount} {donation.token}</span>
            <span className="text-muted-foreground">TO</span>
            <span className="text-blue-400">{donation.target}</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LiveTicker;