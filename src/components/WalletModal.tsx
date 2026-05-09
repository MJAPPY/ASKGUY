"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Fingerprint, QrCode, ShieldCheck, Smartphone, Loader2, ArrowRight } from 'lucide-react';

interface WalletModalProps {
  trigger?: React.ReactNode;
}

const WalletModal: React.FC<WalletModalProps> = ({ trigger }) => {
  const { connect, isConnecting } = useWallet();
  const [open, setOpen] = React.useState(false);

  const handleConnect = async (method: 'passkey' | 'qr') => {
    await connect(method);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full px-6 h-11 gold-glow btn-premium">
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-card border-white/10 max-w-md w-[95vw] p-0 overflow-hidden bg-[#0a0a0c]">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500 animate-pulse" />
        
        <div className="p-8 space-y-8">
          <DialogHeader className="space-y-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 mb-2">
              <ShieldCheck className="text-primary" size={32} />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight">Connect WebAuth</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Choose your preferred way to securely sign in to the XPR Network.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Passkey Option */}
            <button 
              onClick={() => handleConnect('passkey')}
              disabled={isConnecting}
              className="w-full group relative flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Fingerprint size={80} />
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <Fingerprint className="text-emerald-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-emerald-400 text-lg leading-tight">Passkey</h3>
                <p className="text-xs text-muted-foreground font-medium">Fastest & most secure login</p>
              </div>
              <ArrowRight size={18} className="text-emerald-500/50 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* QR Code Option */}
            <button 
              onClick={() => handleConnect('qr')}
              disabled={isConnecting}
              className="w-full group relative flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                <QrCode className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-white text-lg leading-tight">Mobile App</h3>
                <p className="text-xs text-muted-foreground font-medium">Scan QR with WebAuth Wallet</p>
              </div>
              <ArrowRight size={18} className="text-white/20 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Smartphone size={12} />
              <span>Securely powered by Proton WebAuth</span>
            </div>
          </div>
        </div>

        {isConnecting && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
            <Loader2 className="text-primary animate-spin mb-4" size={48} />
            <p className="font-black text-white tracking-widest uppercase text-sm">Waiting for Wallet...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;