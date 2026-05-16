"use client";

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Settings, Hammer, Zap, Heart, Loader2, ArrowRight } from 'lucide-react';
import logo from '@/assets/logo.jpg';

const Maintenance = () => {
  const { maintenanceMessage, connect, isConnecting } = useWallet();

  return (
    <div className="min-h-screen bg-[#060912] text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Retro Grid & Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(21, 101, 192, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(21, 101, 192, 0.2) 1px, transparent 1px)',
             backgroundSize: '40px 40px',
             transform: 'perspective(500px) rotateX(60deg) translateY(-200px) scale(3)',
             transformOrigin: 'top'
           }} 
      />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1565C0]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full glass-card rounded-[40px] p-10 md:p-16 text-center space-y-10 border-white/10 relative z-10 shadow-2xl overflow-hidden">
        {/* Animated Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]" 
             style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)', backgroundSize: '100% 4px' }} />

        <div className="space-y-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-[#1565C0]/10 flex items-center justify-center mx-auto border border-[#1565C0]/20 shadow-[0_0_50px_rgba(21,101,192,0.2)] group animate-pulse">
            <img src={logo} alt="Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-2">
              <Hammer size={12} className="animate-bounce" /> Under Maintenance
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
              Upgrading the <br /> <span className="text-[#1565C0] drop-shadow-[0_0_20px_rgba(21,101,192,0.4)]">Experience.</span>
            </h1>
          </div>
        </div>

        <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 relative">
          <div className="absolute -top-3 left-8 px-4 py-1 bg-[#1565C0] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
            Announcement
          </div>
          <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed italic">
            "{maintenanceMessage || "We're currently fine-tuning the platform to better serve the community. Hang tight!"}"
          </p>
        </div>

        <div className="pt-4 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-primary fill-primary" /> XPR Network
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-rose-400 fill-rose-400" /> GUY Community
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="space-y-4 w-full max-w-xs">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Access</p>
             <Button 
              onClick={connect} 
              disabled={isConnecting}
              variant="outline" 
              className="w-full h-12 border-white/10 hover:bg-white/5 font-black text-[11px] uppercase tracking-widest rounded-xl gap-3 transition-all"
            >
              {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <><Settings size={16} /> Bypass to Settings</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;