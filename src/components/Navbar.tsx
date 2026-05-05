"use client";

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, User, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.jpg';

const Navbar = () => {
  const { isConnected, address, guyBalance, connect, disconnect } = useWallet();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img 
                src={logo} 
                alt="GUY Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
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

        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="hidden md:flex gap-2 border-white/10 hover:bg-white/5 text-xs font-bold group"
          >
            <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
              Buy $GUY
              <ExternalLink size={12} className="transition-all group-hover:brightness-150 group-hover:scale-110" />
            </a>
          </Button>

          <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-white/90">XPR Network</span>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end text-[10px] font-bold uppercase tracking-wider">
                <span className="text-muted-foreground">{address}</span>
                <span className={guyBalance >= 25000 ? "text-primary" : "text-destructive"}>
                  {guyBalance.toLocaleString()} GUY
                </span>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 gap-2 group">
                <Link to="/profile">
                  <User size={16} className="transition-all group-hover:brightness-150 group-hover:scale-110" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
              <Button variant="secondary" size="sm" onClick={disconnect} className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 gap-2 bg-white/5 hover:bg-white/10 border-white/10 group">
                <LogOut size={16} className="transition-all group-hover:brightness-150 group-hover:scale-110" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            </div>
          ) : (
            <Button onClick={connect} className="gap-2 bg-primary hover:bg-primary/90 text-black font-bold rounded-full px-6 gold-glow group">
              <Wallet size={18} className="transition-all group-hover:scale-110" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;