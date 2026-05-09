"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Fingerprint, Smartphone, Wallet, Lock } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connect } = useWallet();

  const handleConnect = async () => {
    await connect();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/10 max-w-md w-[95vw] p-0 overflow-hidden bg-[#0a0a0c]">
        <div className="p-8 space-y-8">
          <DialogHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-2">
              <Shield className="text-primary" size={32} />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Connect to AskGuy</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Choose your preferred way to access the XPR Network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button 
              onClick={handleConnect}
              className="w-full h-20 bg-primary hover:bg-primary/90 text-black flex flex-col items-center justify-center gap-1 rounded-2xl gold-glow transition-all group"
            >
              <div className="flex items-center gap-2">
                <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-lg">Sign in with WebAuth Passkey</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                Fast secure login with Face ID / Fingerprint
              </span>
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-[#0a0a0c] px-4 text-muted-foreground">Other wallets</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 border-white/5 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col gap-1"
                onClick={handleConnect}
              >
                <Smartphone size={16} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Mobile App</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-14 border-white/5 bg-white/5 hover:bg-white/10 rounded-xl flex flex-col gap-1"
                onClick={handleConnect}
              >
                <Wallet size={16} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Anchor Wallet</span>
              </Button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-muted-foreground">
            <Lock size={14} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Keys never leave device</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;