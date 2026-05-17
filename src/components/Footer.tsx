"use client";

import React from 'react';
import { Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/hero-guylogo.jpg';

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-background/50 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4 group w-fit">
              <Link to="/" className="w-12 h-12 transition-transform group-hover:scale-110 shrink-0 flex items-center justify-center overflow-hidden">
                <img 
                  src={logo} 
                  alt="AskGuy Logo" 
                  className="w-full h-full object-contain contrast-[1.08] brightness-[1.05]" 
                  style={{ 
                    imageRendering: 'crisp-edges',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }} 
                />
              </Link>
              <Link to="/" className="font-black text-xl tracking-tighter transition-colors group-hover:text-primary uppercase italic">
                Ask<span className="text-[#1565C0]">Guy</span>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              A peer-to-peer mutual help platform built for the XPR Network community. 
              Empowering users to support each other through gifting XPR and GUY tokens.
            </p>
          </div>
          
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-6 text-white">Resources</h4>
            <ul className="space-y-3 text-[13px] text-muted-foreground font-medium">
              <li>
                <a href="https://explorer.xprnetwork.org/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/20" /> XPR Network Explorer
                </a>
              </li>
              <li>
                <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/20" /> GUY Token Info (Vibrr)
                </a>
              </li>
              <li>
                <a href="https://alcor.exchange/v/xpr/terminal/guy-vtoken" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/20" /> Buy GUY on Alcor
                </a>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-primary transition-colors flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/20" /> Community Guidelines
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-6 text-white">Connect</h4>
            <div className="flex gap-4">
              <a 
                href="https://snipverse.com/tripseven" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1565C0]/20 hover:text-[#1565C0] hover:border-[#1565C0]/30 transition-all group"
                title="Snipverse"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-5 h-5 transition-all group-hover:scale-110"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </a>
              <a 
                href="https://x.com/777Guyxpr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1565C0]/20 hover:text-[#1565C0] hover:border-[#1565C0]/30 transition-all group"
              >
                <Twitter size={20} className="transition-all group-hover:scale-110" />
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground mt-8 font-black uppercase tracking-widest">
              &copy; {new Date().getFullYear()} AskGuy XPR. Built for the community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;