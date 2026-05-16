"use client";

import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from '@/hooks/use-wallet';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AvatarPickerProps {
  onSuccess: () => void;
}

const AvatarPicker = ({ onSuccess }: AvatarPickerProps) => {
  const { address, avatarUrl, avatarSet, refreshBalances } = useWallet();
  const [loading, setLoading] = React.useState(false);
  const [selectedSeed, setSelectedSeed] = React.useState(avatarUrl || address);

  const options = [
    address,
    `${address}-alt1`,
    `${address}-alt2`,
    `${address}-alt3`,
    `${address}-alt4`,
    `${address}-alt5`,
    `${address}-alt6`,
    `${address}-alt7`,
    `${address}-alt8`,
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          address: address.toLowerCase().trim(), 
          avatar_url: selectedSeed 
        }, { onConflict: 'address' });

      if (error) throw error;
      
      showSuccess("Avatar updated successfully!");
      await refreshBalances();
      onSuccess();
    } catch (err) {
      showError("Failed to update avatar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="glass-card border-white/10 max-w-md p-8 rounded-[32px] shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-black tracking-tight">Choose Avatar</DialogTitle>
        <DialogDescription className="text-muted-foreground font-medium">
          Select a style that represents you in the community.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-4 py-8">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelectedSeed(option)}
            className={`relative group rounded-2xl p-1.5 transition-all duration-300 ${
              selectedSeed === option 
                ? 'bg-primary/20 ring-2 ring-primary scale-105' 
                : 'bg-white/5 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Avatar className="w-full h-auto aspect-square rounded-xl border border-white/10 p-1 bg-black/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/${avatarSet}/svg?seed=${option}`} />
            </Avatar>
            {selectedSeed === option && (
              <div className="absolute -top-2 -right-2 bg-primary text-black rounded-full p-1 shadow-lg">
                <Check size={12} strokeWidth={4} />
              </div>
            )}
          </button>
        ))}
      </div>

      <DialogFooter>
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-black font-black h-12 rounded-xl gold-glow gap-2"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          Apply Selection
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default AvatarPicker;