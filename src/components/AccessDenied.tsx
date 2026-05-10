"use client";

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ExternalLink, LogOut, RefreshCw, Loader2 } from 'lucide-react';

const AccessDenied = () => {
  const { guyBalance, disconnect, refreshBalances, isFetchingBalances } = useWallet();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-md w-full glass-card rounded-[32px] p-8 md:p-12 text-center space-y-8 border-red-500/20 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <ShieldAlert className="text-red-500" size={40} />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-white">Access Restricted</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The AskGuy community is exclusive to members who support the ecosystem. You need at least <span className="text-white font-bold">7,770 GUY</span> tokens in your wallet to enter.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Your Current Balance</p>
          <p className="text-3xl font-black text-red-400">{guyBalance.toLocaleString()} GUY</p>
          <p className="text-[10px] text-red-400/60 font-bold uppercase tracking-tighter">
            Missing {(7770 - guyBalance).toLocaleString()} GUY
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button 
            asChild 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black rounded-xl gold-glow btn-premium text-base gap-3"
          >
            <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
              Buy GUY on Vibrr
              <ExternalLink size={20} />
            </a>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={refreshBalances} 
              disabled={isFetchingBalances}
              className="h-12 border-white/10 hover:bg-white/5 font-bold gap-2"
            >
              {isFetchingBalances ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </Button>
            <Button 
              variant="ghost" 
              onClick={disconnect}
              className="h-12 text-muted-foreground hover:text-red-400 font-bold gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Once you have acquired the tokens, click refresh or reconnect your wallet.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;