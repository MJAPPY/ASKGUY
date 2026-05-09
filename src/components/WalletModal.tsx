"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Monitor, ArrowRight, X } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] bg-[#0a0e17] border-white/10 p-0 overflow-hidden rounded-[24px]">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <span className="text-black font-black text-[10px]">W</span>
              </div>
              <DialogTitle className="text-white text-lg font-bold">Connect WebAuth</DialogTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-white/5 text-muted-foreground"
            >
              <X size={18} />
            </Button>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onConnect}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="text-white" size={24} />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Mobile App</p>
                <p className="text-muted-foreground text-sm">Scan QR Code</p>
              </div>
            </button>

            <button 
              onClick={onConnect}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Monitor className="text-white" size={24} />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Browser wallet</p>
                <p className="text-muted-foreground text-sm">Authorize device</p>
              </div>
            </button>
          </div>

          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 rounded-2xl blur-[2px] opacity-50 group-hover:opacity-100 transition-opacity" />
            <Button className="relative w-full h-14 bg-[#0a0e17] hover:bg-[#0a0e17] text-white font-bold rounded-2xl flex items-center justify-center gap-2 border-none">
              <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                <span className="text-black font-black text-[8px]">W</span>
              </div>
              Get WebAuth
            </Button>
          </div>

          <div className="pt-4 space-y-6 text-center">
            <button className="text-white/60 hover:text-white text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors">
              Connect with other wallets <ArrowRight size={14} />
            </button>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              By connecting, I accept XPR Network's <a href="#" className="underline hover:text-white">Terms of Service</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;