"use client";

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid, 
  List, 
  Trophy, 
  Activity, 
  LogOut, 
  User, 
  RefreshCw, 
  ChevronDown,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from '@/assets/logo.jpg';

const Navbar = () => {
  const { isConnected, address, guyBalance, xprBalance, connect, disconnect } = useWallet();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: <LayoutGrid size={18} />, path: '/' },
    { label: 'Browse', icon: <List size={18} />, path: '/#browse-requests' },
    { label: 'Leaderboard', icon: <Trophy size={18} />, path: '/leaderboard' },
    { label: 'Activity', icon: <Activity size={18} />, path: '/#activity' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side: Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">
              Ask<span className="text-primary">Guy</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                asChild
                className={`gap-2 text-sm font-medium h-9 px-4 hover:bg-white/5 transition-colors ${
                  isActive(item.path) ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-white'
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

        {/* Right Side: Balances & Profile */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              {/* Balance Pills */}
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold">
                  <span className="text-muted-foreground">{xprBalance.toFixed(4)}</span>
                  <span className="text-white/60">XPR</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold">
                  <span className={guyBalance < 25000 ? "text-red-400" : "text-primary"}>
                    {guyBalance.toLocaleString()}
                  </span>
                  <span className="text-white/60">GUY</span>
                </div>
              </div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 gap-3 px-2 hover:bg-white/5 rounded-xl group">
                    <Avatar className="h-7 w-7 border border-white/10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`} />
                      <AvatarFallback className="bg-primary text-black font-bold text-[10px]">
                        {address?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold hidden sm:inline-block">{address}</span>
                    <ChevronDown size={14} className="text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-card border-white/10 p-2 mt-2">
                  <div className="p-3 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Balances</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">{xprBalance.toFixed(4)} XPR</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold ${guyBalance < 25000 ? 'text-red-400' : 'text-primary'}`}>
                          {guyBalance.toLocaleString()} GUY
                        </span>
                      </div>
                    </div>

                    {guyBalance < 25000 && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                        <p className="text-[10px] font-bold text-red-400">Below 25,000 GUY minimum</p>
                      </div>
                    )}

                    <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold gap-2 border-white/10 hover:bg-white/5" asChild>
                      <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer">
                        Buy $GUY on DEX <ExternalLink size={10} />
                      </a>
                    </Button>
                  </div>

                  <DropdownMenuSeparator className="bg-white/5" />
                  
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/5 rounded-lg">
                    <Link to="/profile" className="flex items-center gap-2 py-2">
                      <User size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium">My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="cursor-pointer focus:bg-white/5 rounded-lg flex items-center gap-2 py-2">
                    <RefreshCw size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Refresh Balances</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/5" />

                  <DropdownMenuItem 
                    onClick={disconnect}
                    className="cursor-pointer focus:bg-red-500/10 text-red-400 rounded-lg flex items-center gap-2 py-2"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={connect} className="gap-2 bg-primary hover:bg-primary/90 text-black font-bold rounded-full px-6 gold-glow">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;