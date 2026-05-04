"use client";

import React from 'react';
import { ShieldCheck, Github, Twitter, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-background/50 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <ShieldCheck className="text-background" size={14} />
              </div>
              <span className="font-bold text-lg">AskGuy XPR</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A peer-to-peer mutual aid platform built for the XPR Network community. 
              Empowering users to support each other through transparent, direct aid.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">XPR Network Explorer</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">GUY Token Info</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">WebAuth Wallet</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Community Guidelines</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Globe size={18} />
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