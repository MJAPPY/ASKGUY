"use client";

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { isConnected, address, guyBalance, connect, disconnect, isMember } = useWallet();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-background" size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            AskGuy <span className="text-primary">XPR</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-xs">
                <span className="text-muted-foreground">{address}</span>
                <span className={guyBalance >= 25000 ? "text-primary" : "text-destructive"}>
                  {guyBalance.toLocaleString()} GUY
                </span>
              </div>
              {isMember && (
                <Badge variant="outline" className="border-primary text-primary hidden sm:flex">
                  Member
                </Badge>
              )}
              <Button variant="secondary" size="sm" onClick={disconnect} className="gap-2">
                <LogOut size={16} />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </div>
          ) : (
            <Button onClick={connect} className="gap-2 cyan-glow">
              <Wallet size={18} />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;