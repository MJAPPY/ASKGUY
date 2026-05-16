"use client";

import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';
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
    <div className="w-full py-4 overflow-hidden whitespace-nowrap relative carbon-ticker-container">
      {/* High-visibility borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1565C0]/30 to-transparent" />
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-black/20 pointer-events-none z-10" />
      
      {/* Edge Fades */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-background via-background/80 to-transparent z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-background via-background/80 to-transparent z-20" />
      
      {/* Ticker Content */}
      <div className="flex animate-marquee relative z-10">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center">
            {recentDonations.map((donation, idx) => (
              <span key={`${i}-${idx}`} className="inline-flex items-center gap-4 mx-16 text-[12px] font-black uppercase tracking-[0.25em] italic">
                <div className="relative">
                  <Heart size={16} className="text-primary fill-primary animate-pulse" />
                  <div className="absolute inset-0 bg-primary/60 blur-lg rounded-full -z-10" />
                </div>
                
                <span className="text-primary drop-shadow-[0_0_12px_rgba(251,212,81,0.8)]">@{donation.user}</span>
                <span className="text-white/30 font-bold not-italic scale-y-90">SENT</span>
                <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] text-[13px]">{donation.amount.toLocaleString()} {donation.token}</span>
                <span className="text-white/30 font-bold not-italic scale-y-90">TO</span>
                <span className="text-[#1565C0] drop-shadow-[0_0_12px_rgba(21,101,192,0.8)]">@{donation.target}</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .carbon-ticker-container {
          background-color: #0d1117;
          background-image: 
            linear-gradient(45deg, #161b22 25%, transparent 25%), 
            linear-gradient(-45deg, #161b22 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #161b22 75%), 
            linear-gradient(-45deg, transparent 75%, #161b22 75%);
          background-size: 8px 8px;
          box-shadow: 
            inset 0 0 50px rgba(0,0,0,0.9),
            0 10px 40px -10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default LiveTicker;