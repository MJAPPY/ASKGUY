"use client";

import React from 'react';
import { Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.jpg';

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-background/50 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 transition-transform group-hover:scale-110">
                <img src={logo} alt="AskGuy Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg group-hover:text-primary transition-colors">AskGuy</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A peer-to-peer mutual help platform built for the XPR Network community. 
              Empowering users to support each other through gifting XPR and GUY tokens.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://explorer.xprnetwork.org/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  XPR Network Explorer
                </a>
              </li>
              <li>
                <a href="https://vibrr.ai/dex/token/20" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  GUY Token Info
                </a>
              </li>
              <li>
                <a href="https://www.webauth.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  WebAuth Wallet
                </a>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-primary transition-colors">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a 
                href="https://snipverse.com/tripseven" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-white transition-all group"
                title="Snipverse"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-[18px] h-[18px] transition-all group-hover:scale-110 group-hover:brightness-125"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </a>
              <a 
                href="https://x.com/777Guyxpr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-white transition-all group"
              >
                <Twitter size={18} className="transition-all group-hover:scale-110 group-hover:brightness-125" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              &copy; {new Date().getFullYear()} AskGuy XPR. Built by the community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;