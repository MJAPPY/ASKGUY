"use client";

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid, 
  Trophy, 
  LogOut, 
  User, 
  RefreshCw, 
  ChevronDown,
  ExternalLink,
  Loader2,
  Calculator
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from '@/assets/logo.jpg';

const Navbar = () => {
  const { isConnected, isConnecting, isFetchingBalances, address, guyBalance, xprBalance, disconnect, refreshBalances, connect } = useWallet();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: <LayoutGrid size={18} />, path: '/', private: true },
    { label: 'Leaderboard', icon: <Trophy size={18} />, path: '/leaderboard', private: false },
    { label: 'Calculator', icon: <Calculator size={18} />, path: '/calculator', private: false },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const visibleNavItems = navItems.filter(item => !item.private || isConnected);
  const displayAddress = typeof address === 'string' ? address : '';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(244,201,93,0.3)]">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-lg md:text-xl hidden xs:inline-block tracking-tight group-hover:text-primary transition-colors">
              Ask<span className="text-primary group-hover:text-white transition-colors">Guy</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                asChild
                className={`gap-2 text-sm font-medium h-10 px-4 transition-all duration-300 hover:scale-105 ${
                  isActive(item.path) 
                    ? 'text-primary bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(244,201,93,0.1)]' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <Link to={item.path}>
                  {item.icon}
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          {isConnected ? (
            <>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-[11px] font-bold hover:bg-white/10 transition-colors cursor-default">
                  {isFetchingBalances ? (
                    <Loader2 size={12} className="animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <span className="text-muted-foreground font-black">{xprBalance.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                      <span className="text-white/40">XPR</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-[11px] font-bold hover:bg-white/10 transition-colors cursor-default">
                  {isFetchingBalances ? (
                    <Loader2 size={12} className="animate-spin text-primary" />
                  ) : (
                    <>
                      <span className="font-black text-primary">
                        {guyBalance.toLocaleString()}
                      </span>
                      <span className="text-white/40">GUY</span>
                    </>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 md:h-12 gap-2 md:gap-3 px-1 md:px-2 hover:bg-white/5 rounded-xl group transition-all duration-300">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-primary/40 to-emerald-400/40 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Avatar className="h-7 w-7 md:h-8 md:w-8 border border-white/20 group-hover:border-primary/50 transition-all duration-300 relative z-10 shadow-lg p-1 bg-black/20">
                        <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayAddress}`} />
                        <AvatarFallback className="bg-primary text-black font-bold text-[10px]">
                          {displayAddress.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-sm font-bold hidden sm:inline-block group-hover:text-primary transition-colors">{displayAddress}</span>
                    <ChevronDown size={14} className="text-muted-foreground group-data-[state=open]:rotate-180 transition-transform hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-card border-white/10 p-2 mt-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Balances</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black">{xprBalance.toLocaleString()} XPR</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-primary">
                          {guyBalance.toLocaleString()} GUY
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold gap-2 border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all" asChild>
                      <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                        Buy $GUY on DEX <ExternalLink size={10} />
                      </a>
                    </Button>
                  </div>

                  <DropdownMenuSeparator className="bg-white/5" />
                  
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 rounded-lg transition-colors">
                    <Link to="/profile" className="flex items-center gap-2 py-2">
                      <User size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium">My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={refreshBalances} className="cursor-pointer focus:bg-white/10 rounded-lg flex items-center gap-2 py-2 transition-colors">
                    <RefreshCw size={16} className={`text-muted-foreground ${isFetchingBalances ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">Refresh Balances</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/5" />

                  <DropdownMenuItem 
                    onClick={disconnect}
                    className="cursor-pointer focus:bg-red-500/10 text-red-400 rounded-lg flex items-center gap-2 py-2 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              onClick={connect} 
              disabled={isConnecting}
              className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full px-4 md:px-6 h-10 md:h-11 gold-glow btn-premium text-xs md:text-sm"
            >
              {isConnecting ? <Loader2 className="animate-spin" size={18} /> : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;