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
    <div className="w-full bg-[#0a0a0c] border-y border-white/5 py-3 overflow-hidden whitespace-nowrap relative shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Edge Fades */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a0c] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0c] to-transparent z-10" />
      
      {/* Ticker Content */}
      <div className="flex animate-marquee">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center">
            {recentDonations.map((donation, idx) => (
              <span key={`${i}-${idx}`} className="inline-flex items-center gap-3 mx-12 text-[11px] font-black uppercase tracking-[0.2em] italic">
                <div className="relative">
                  <Heart size={14} className="text-primary fill-primary animate-pulse" />
                  <div className="absolute inset-0 bg-primary/40 blur-md rounded-full -z-10" />
                </div>
                
                <span className="text-primary drop-shadow-[0_0_8px_rgba(251,212,81,0.5)]">@{donation.user}</span>
                <span className="text-white/40 font-bold not-italic">SENT</span>
                <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{donation.amount.toLocaleString()} {donation.token}</span>
                <span className="text-white/40 font-bold not-italic">TO</span>
                <span className="text-[#1565C0] drop-shadow-[0_0_8px_rgba(21,101,192,0.5)]">@{donation.target}</span>
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
          animation: marquee 50s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default LiveTicker;