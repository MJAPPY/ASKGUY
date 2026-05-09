"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { QrCode, Monitor, ArrowRight, X, Loader2 } from 'lucide-react';

interface WalletModalProps {
  trigger?: React.ReactNode;
}

const WalletModal: React.FC<WalletModalProps> = ({ trigger }) => {
  const { connect, isConnecting } = useWallet();
  const [open, setOpen] = React.useState(false);

  const handleConnect = async () => {
    // We use the standard login which shows the Proton selector
    // But we've styled our trigger to look like the screenshot
    await connect();
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
      <DialogContent className="bg-[#0a0a0c] border-white/10 max-w-[400px] w-[95vw] p-0 overflow-hidden rounded-[24px] shadow-2xl">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-black fill-current">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white">Connect WebAuth</span>
            </div>
            <DialogClose className="text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </DialogClose>
          </div>

          <div className="space-y-3">
            {/* Mobile App Option */}
            <button 
              onClick={handleConnect}
              className="w-full flex items-center gap-4 p-4 rounded-[16px] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                <QrCode className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Mobile App</h3>
                <p className="text-[11px] text-white/40">Scan QR Code</p>
              </div>
            </button>

            {/* Browser Wallet Option */}
            <button 
              onClick={handleConnect}
              className="w-full flex items-center gap-4 p-4 rounded-[16px] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                <Monitor className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Browser wallet</h3>
                <p className="text-[11px] text-white/40">Authorize device</p>
              </div>
            </button>
          </div>

          <div className="pt-2">
            <Button 
              asChild
              className="w-full h-12 rounded-full bg-transparent border-[1.5px] border-transparent relative group overflow-hidden"
            >
              <a href="https://www.webauth.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 p-[1.5px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 -z-10" />
                <div className="absolute inset-0 rounded-full bg-[#0a0a0c] -z-10" />
                
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-black fill-current">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-white">Get WebAuth</span>
              </a>
            </Button>
          </div>

          <div className="space-y-6 pt-2">
            <button className="w-full text-center text-[11px] font-bold text-white/40 hover:text-white transition-colors flex items-center justify-center gap-1 group">
              Connect with other wallets 
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <p className="text-[9px] text-center text-white/30 leading-relaxed px-4">
              By connecting, I accept XPR Network's <a href="#" className="underline hover:text-white">Terms of Service</a>
            </p>
          </div>
        </div>

        {isConnecting && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <Loader2 className="text-white animate-spin mb-4" size={32} />
            <p className="font-bold text-white text-xs tracking-widest uppercase">Connecting...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;