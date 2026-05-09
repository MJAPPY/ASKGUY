"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Fingerprint, QrCode, ShieldCheck, Smartphone, Loader2, ChevronRight, X } from 'lucide-react';

interface WalletModalProps {
  trigger?: React.ReactNode;
}

const WalletModal: React.FC<WalletModalProps> = ({ trigger }) => {
  const { connect, isConnecting } = useWallet();
  const [open, setOpen] = React.useState(false);

  const handleConnect = async (method: 'passkey' | 'qr') => {
    // Both methods currently trigger the Proton SDK login which shows the native selector
    // as requested for the 'Mobile App' option.
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
      <DialogContent className="glass-card border-white/10 max-w-[400px] w-[95vw] p-0 overflow-hidden bg-[#1A1F2C] rounded-[32px]">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400" />
        
        <div className="p-8 pt-10 space-y-8 relative">
          <button 
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <DialogHeader className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#222836] flex items-center justify-center mx-auto border border-white/5 shadow-inner">
              <ShieldCheck className="text-primary" size={40} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black tracking-tight text-white">Connect WebAuth</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium text-sm leading-relaxed px-4">
                Choose your preferred way to securely sign in to the XPR Network.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {/* Passkey Option */}
            <button 
              onClick={() => handleConnect('passkey')}
              disabled={isConnecting}
              className="w-full group relative flex items-center gap-4 p-5 rounded-3xl bg-[#222836]/50 border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                <Fingerprint size={120} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Fingerprint className="text-emerald-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-400 text-lg leading-tight">Passkey</h3>
                <p className="text-[11px] text-muted-foreground font-medium">Fastest & most secure login</p>
              </div>
              <ChevronRight size={18} className="text-emerald-500/30 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Mobile App Option */}
            <button 
              onClick={() => handleConnect('qr')}
              disabled={isConnecting}
              className="w-full group relative flex items-center gap-4 p-5 rounded-3xl bg-[#222836]/50 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-110 transition-transform">
                <QrCode className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg leading-tight">Mobile App</h3>
                <p className="text-[11px] text-muted-foreground font-medium">Scan QR with WebAuth Wallet</p>
              </div>
              <ChevronRight size={18} className="text-white/20 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="h-px w-full bg-white/5" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
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