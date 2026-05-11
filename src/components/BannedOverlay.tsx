"use client";

import React from 'react';
import { ShieldAlert, LogOut, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';

const BannedOverlay = () => {
  const { disconnect, address } = useWallet();

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-md w-full glass-card rounded-[32px] p-12 text-center space-y-8 border-red-500/30 relative z-10">
        <div className="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="text-red-500" size={48} />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-white">Account Restricted</h1>
          <p className="text-red-400 font-black uppercase tracking-widest text-xs">@{address}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your access to the AskGuy community has been restricted due to a violation of our community guidelines.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            asChild 
            variant="outline"
            className="w-full h-14 border-white/10 hover:bg-white/5 font-bold gap-3"
          >
            <a href="/guidelines">
              Review Guidelines
              <ExternalLink size={18} />
            </a>
          </Button>

          <Button 
            onClick={disconnect}
            className="w-full h-14 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl gap-3"
          >
            <LogOut size={18} />
            Disconnect Wallet
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          If you believe this is a mistake, please contact the community moderators.
        </p>
      </div>
    </div>
  );
};

export default BannedOverlay;