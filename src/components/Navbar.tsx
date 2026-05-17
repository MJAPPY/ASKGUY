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
  Calculator,
  ShieldCheck
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
import logo from '@/assets/hero-guylogo.jpg';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { isConnected, isConnecting, isFetchingBalances, isAdmin, address, xprBalance, guyBalance, avatarUrl, disconnect, refreshBalances, connect } = useWallet();
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
  const currentAvatarSeed = avatarUrl || displayAddress;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-14 h-14 md:w-16 md:h-16 transition-all duration-300 group-hover:scale-110 shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src={logo} 
                alt="Logo" 
                className="w-full h-full object-contain contrast-[1.08] brightness-[1.05]" 
                style={{ 
                  imageRendering: 'crisp-edges',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }} 
              />
            </div>
            <span className="font-black text-xl md:text-2xl tracking-tighter transition-colors uppercase italic group-hover:text-primary">
              Ask<span className="text-[#1565C0]">Guy</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                asChild
                className={`gap-2 text-sm font-black uppercase tracking-widest h-10 px-4 transition-all duration-300 hover:scale-105 ${
                  isActive(item.path) 
                    ? 'text-[#1565C0] bg-[#1565C0]/10 border border-[#1565C0]/20 shadow-[0_0_15px_rgba(21,101,192,0.1)]' 
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
                <div className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] md:text-[11px] font-bold hover:bg-purple-500/20 transition-all cursor-default shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  {isFetchingBalances ? (
                    <Loader2 size={12} className="animate-spin text-purple-400" />
                  ) : (
                    <>
                      <span className="text-purple-400 font-black tracking-tight">{xprBalance.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                      <span className="text-purple-400/50 font-black uppercase text-[8px] md:text-[9px]">XPR</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/30 text-[10px] md:text-[11px] font-bold hover:bg-primary/20 transition-all cursor-default shadow-[0_0_15px_rgba(244,201,93,0.15)]">
                  {isFetchingBalances ? (
                    <Loader2 size={12} className="animate-spin text-primary" />
                  ) : (
                    <>
                      <span className="text-primary font-black tracking-tight">{guyBalance.toLocaleString()}</span>
                      <span className="text-primary/60 font-black uppercase text-[8px] md:text-[9px]">GUY</span>
                    </>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 md:h-12 gap-2 md:gap-3 px-1 md:px-2 hover:bg-white/5 rounded-xl group transition-all duration-300">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-[#1565C0]/40 to-emerald-400/40 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Avatar className="h-7 w-7 md:h-8 md:w-8 border border-white/20 group-hover:border-[#1565C0]/50 transition-all duration-300 relative z-10 shadow-lg p-1 bg-black/20">
                        <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentAvatarSeed}`} />
                        <AvatarFallback className="bg-[#1565C0] text-white font-bold text-[10px]">
                          {displayAddress.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-sm font-black hidden sm:inline-block group-hover:text-[#1565C0] transition-colors">@{displayAddress}</span>
                    <ChevronDown size={14} className="text-muted-foreground group-data-[state=open]:rotate-180 transition-transform hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-card border-white/10 p-2 mt-2 animate-in fade-in zoom-in-95 duration-200 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                  <div className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Live Balances</p>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center bg-purple-500/5 p-2 rounded-lg border border-purple-500/10">
                          <span className="text-[10px] text-purple-400/70 font-black uppercase">XPR</span>
                          <span className="text-sm font-black text-purple-400 tabular-nums">{xprBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-lg border border-primary/10">
                          <span className="text-[10px] text-primary/70 font-black uppercase">GUY</span>
                          <span className="text-sm font-black text-primary tabular-nums">{guyBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest gap-2 border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all rounded-xl shadow-lg" asChild>
                      <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                        Buy $GUY on DEX <ExternalLink size={12} className="text-primary" />
                      </a>
                    </Button>
                  </div>

                  <DropdownMenuSeparator className="bg-white/5" />
                  
                  <div className="p-1 space-y-0.5">
                    {isAdmin && (
                      <DropdownMenuItem asChild className="cursor-pointer focus:bg-primary/10 rounded-lg transition-colors group/item">
                        <Link to="/admin" className="flex items-center gap-3 py-2.5 px-3 text-primary font-black">
                          <ShieldCheck size={18} className="transition-transform group-hover/item:scale-110" />
                          <span className="text-xs uppercase tracking-wider">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 rounded-lg transition-colors group/item">
                      <Link to="/profile" className="flex items-center gap-3 py-2.5 px-3">
                        <User size={18} className="text-muted-foreground transition-transform group-hover/item:scale-110" />
                        <span className="text-xs font-bold uppercase tracking-wider">My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={refreshBalances} className="cursor-pointer focus:bg-white/10 rounded-lg flex items-center gap-3 py-2.5 px-3 transition-colors group/item">
                      <RefreshCw size={18} className={cn("text-muted-foreground transition-all group-hover/item:scale-110", isFetchingBalances ? 'animate-spin' : '')} />
                      <span className="text-xs font-bold uppercase tracking-wider">Refresh Balance</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/5 my-1" />

                    <DropdownMenuItem 
                      onClick={disconnect}
                      className="cursor-pointer focus:bg-red-500/10 text-red-400 rounded-lg flex items-center gap-3 py-2.5 px-3 transition-colors group/item"
                    >
                      <LogOut size={18} className="transition-transform group-hover/item:scale-110" />
                      <span className="text-xs font-bold uppercase tracking-wider">Disconnect</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              onClick={connect} 
              disabled={isConnecting}
              className="bg-[#1565C0] hover:bg-[#1565C0]/90 text-white font-black rounded-xl px-4 md:px-6 h-10 md:h-11 shadow-[0_0_20px_rgba(21,101,192,0.3)] btn-premium text-xs md:text-sm"
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