"use client";

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { isConnected, address, guyBalance, connect, disconnect, isMember } = useWallet();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative">
            <div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <span className="text-black font-black text-xl">A</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF9100] rounded-full border-2 border-background" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-2xl tracking-tight text-white">
              AskGuy
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              XPR Community
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
            <span className="text-xs font-bold text-white/90">XPR Network</span>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end text-[10px] font-bold uppercase tracking-wider">
                <span className="text-muted-foreground">{address}</span>
                <span className={guyBalance >= 25000 ? "text-[#00E5FF]" : "text-destructive"}>
                  {guyBalance.toLocaleString()} GUY
                </span>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 gap-2">
                <Link to="/profile">
                  <User size={16} />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
              <Button variant="secondary" size="sm" onClick={disconnect} className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 gap-2 bg-white/5 hover:bg-white/10 border-white/10">
                <LogOut size={16} />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            </div>
          ) : (
            <Button onClick={connect} className="gap-2 bg-[#00E5FF] hover:bg-[#00B8CC] text-black font-bold rounded-full px-6">
              <Wallet size={18} />
              Connect
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;