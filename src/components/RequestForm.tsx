"use client";

import React, { useState, useRef, useMemo } from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, X, AlertCircle, ShieldCheck, Sparkles, AlertTriangle, Coins, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';

interface RequestFormProps {
  onSuccess?: () => void;
}

const RequestForm = ({ onSuccess }: RequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [skipProof, setSkipProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { requests, addRequest } = useRequests();
  const { address, requestor, guyBalance, transferTokens } = useWallet();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Medical / Healthcare',
    customCategory: '',
    amount: '',
    token: 'XPR' as TokenSymbol,
    description: ''
  });

  const activeRequestsCount = useMemo(() => {
    return requests.filter(req => req.requestor === address && (req.status === 'Open' || req.status === 'Funded')).length;
  }, [requests, address]);

  const isLimitReached = activeRequestsCount >= 3;
  const hasEnoughGuy = guyBalance >= 25;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setSkipProof(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || isLimitReached) return;
    
    if (!hasEnoughGuy) {
      showError("You need at least 25 GUY to post a request.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Process the 25 GUY payment
      const paymentSuccess = await transferTokens(
        'askguy', 
        25, 
        'GUY', 
        `Request Fee: ${formData.title.substring(0, 50)}`
      );

      if (!paymentSuccess) {
        showError("Failed to process GUY payment. Please try again.");
        setLoading(false);
        return;
      }

      // Step 2: Save the request to the database
      const categoryToSubmit = formData.category === 'Other' 
        ? formData.customCategory || 'Other' 
        : formData.category;

      const success = await addRequest({
        requestor: requestor,
        title: formData.title,
        category: categoryToSubmit,
        amount: parseFloat(formData.amount),
        token: formData.token,
        description: formData.description,
        proofUrl: preview || undefined
      });

      if (success) {
        setFormData({ 
          title: '',
          category: 'Medical / Healthcare', 
          customCategory: '',
          amount: '', 
          token: 'XPR', 
          description: '' 
        });
        setPreview(null);
        setSkipProof(false);
        showSuccess("25 GUY Paid & Request posted successfully!");
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Rent / Housing",
    "Medical / Healthcare",
    "Utilities (Electricity, Water, Internet)",
    "Groceries / Food",
    "Emergency / Crisis",
    "Transportation",
    "Other"
  ];

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <CardHeader className="px-0 pb-6 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="text-emerald-400" size={18} />
            </div>
            <CardTitle className="text-white text-xl font-black tracking-tight">Post New Request</CardTitle>
          </div>
          <div className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${isLimitReached ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
            {activeRequestsCount}/3 Active
          </div>
        </div>
        <CardDescription className="text-muted-foreground/80 font-medium">
          Share your situation. Posting costs <span className="text-primary font-bold">25 GUY</span>.
        </CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <form id="request-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
          {isLimitReached && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-100 text-xs font-semibold leading-normal">
              <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
              <p>
                <span className="text-red-400 font-black uppercase tracking-widest mr-1">Limit Reached:</span> 
                You have 3 active requests. Please complete an existing one before posting again.
              </p>
            </div>
          )}

          {!hasEnoughGuy && !isLimitReached && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-100 text-xs font-semibold leading-normal">
              <AlertTriangle size={18} className="shrink-0 text-orange-400 mt-0.5" />
              <p>
                <span className="text-orange-400 font-black uppercase tracking-widest mr-1">Insufficient GUY:</span> 
                You need 25 GUY tokens to post. Your current balance is {guyBalance.toLocaleString()} GUY.
              </p>
            </div>
          )}

          <div className={`space-y-5 ${(isLimitReached || !hasEnoughGuy) ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request Title</Label>
              <Input 
                id="title"
                placeholder="Briefly summarize your need..." 
                required 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-11 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 h-11 font-medium">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount Requested ({formData.token})</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  required 
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-11 font-black"
                />
              </div>
            </div>

            {formData.category === 'Other' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Category</Label>
                <Input 
                  placeholder="e.g. Education, Pet Care..." 
                  required 
                  value={formData.customCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                  className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-11 font-medium"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brief Situation</Label>
              <Textarea 
                placeholder="Explain your situation..." 
                className="min-h-[100px] bg-white/5 border-white/10 focus:border-emerald-500/50 leading-relaxed font-medium" 
                required 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proof of Need (Recommended)</Label>
              
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                <div className="flex gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-[11px] leading-relaxed text-emerald-100/70 font-medium">
                    Upload a photo of your bill with your <span className="text-emerald-400 font-black">@{address}</span> handwritten.
                  </p>
                </div>

                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png"
                />
                
                {!preview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group ${skipProof ? 'opacity-40 border-white/10 pointer-events-none' : 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                  >
                    <p className="text-sm font-black tracking-tight">Click to upload photo proof</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">JPG or PNG</p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 aspect-video bg-black/40 group">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button 
                        type="button" 
                        variant="destructive"
                        size="sm"
                        className="h-9 gap-2 font-black text-[10px] uppercase tracking-widest"
                        onClick={removePreview}
                      >
                        <X size={14} /> Remove Photo
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox 
                    id="skip" 
                    checked={skipProof} 
                    onCheckedChange={(checked) => {
                      setSkipProof(checked as boolean);
                      if (checked) removePreview();
                    }}
                  />
                  <label 
                    htmlFor="skip" 
                    className="text-[11px] font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer uppercase tracking-tight"
                  >
                    I prefer not to upload proof at this time
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
      </ScrollArea>
      
      <CardFooter className="px-0 pt-6 shrink-0 border-t border-white/5 mt-4">
        <Button 
          form="request-form"
          type="submit" 
          className="w-full gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black h-16 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] uppercase tracking-widest text-[11px]" 
          disabled={loading || isLimitReached || !hasEnoughGuy}
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={18} /> Processing...</>
          ) : isLimitReached ? (
            "Limit Reached (3/3)"
          ) : !hasEnoughGuy ? (
            "Insufficient GUY Balance"
          ) : (
            <><Coins size={18} /> Pay 25 GUY & Post Request</>
          )}
        </Button>
      </CardFooter>
    </div>
  );
};

export default RequestForm;