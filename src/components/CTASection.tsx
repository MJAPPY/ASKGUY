"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';

const CTASection = () => {
  const { connect, isConnecting } = useWallet();

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto glass-card rounded-3xl p-12 text-center space-y-8 border-primary/20 bg-primary/5 relative overflow-hidden">
        <div className="flex justify-center">
          <Heart className="text-primary fill-primary animate-pulse" size={48} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to help or be helped?</h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Join the AskGuy community today. Hold 7,770 GUY and start making a difference.
          </p>
        </div>

        <Button 
          onClick={connect}
          disabled={isConnecting}
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-black font-bold h-14 px-10 rounded-xl gold-glow flex gap-2 mx-auto"
        >
          {isConnecting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Heart size={18} className="fill-black" />
              Get Started
            </>
          )}
        </Button>
      </div>
    </section>
  );
};

export default CTASection;