"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

export const MadeWithDyad = () => {
  return (
    <div className="p-8 text-center relative z-10">
      <a
        href="https://www.dyad.sh/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-all duration-300 hover:scale-105"
      >
        <Sparkles size={12} className="text-primary/60 animate-pulse" />
        Made with Dyad
      </a>
    </div>
  );
};