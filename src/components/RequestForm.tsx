"use client";

import React, { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, X, AlertCircle, ShieldCheck, Sparkles, AlertTriangle, Coins, Loader2, Zap, Camera } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useRequests, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

interface RequestFormProps {
  onSuccess?: () => void;
}

const RequestForm = ({ onSuccess }: RequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [submittingStep, setSubmittingStep] = useState<'idle' | 'authorizing' | 'finalizing'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [skipProof, setSkipProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { requests, addRequest } = useRequests();
  const { address, requestor, guyBalance, transferTokens, isMember, postingFeeGuy } = useWallet();
  
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
  const hasEnoughGuy = guyBalance >= postingFeeGuy;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showError("File is too large. Please upload an image smaller than 5MB.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

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
    
    if (!isMember) {
      showError("You need an active membership to post requests. Visit your profile to join.");
      return;
    }

    if (!hasEnoughGuy) {
      showError(`You need at least ${postingFeeGuy} GUY to post a request.`);
      return;
    }
    
    setLoading(true);
    setSubmittingStep('authorizing');
    
    try {
      const paymentSuccess = await transferTokens(
        'askguy', 
        postingFeeGuy, 
        'GUY', 
        `Request Fee: ${formData.title.substring(0, 50)}`
      );

      if (!paymentSuccess) {
        showError("Payment authorization failed. Please try again.");
        setLoading(false);
        setSubmittingStep('idle');
        return;
      }

      setSubmittingStep('finalizing');

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
        showSuccess(`${postingFeeGuy} GUY authorized & request published!`);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError("An error occurred. Please check your connection.");
    } finally {
      setLoading(false);
      setSubmittingStep('idle');
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
          Authorise a <span className="text-primary font-bold">{postingFeeGuy} GUY</span> contribution to post your need.
        </CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <form id="request-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
          {!isMember && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#1565C0]/10 border border-[#1565C0]/30 text-blue-100 text-xs font-semibold leading-normal">
              <AlertCircle size={18} className="shrink-0 text-[#1565C0] mt-0.5" />
              <p>
                <span className="text-[#1565C0] font-black uppercase tracking-widest mr-1">Membership Required:</span> 
                You need an active membership to post. Visit your <Link to="/profile" className="underline text-white">profile</Link> to join.
              </p>
            </div>
          )}

          {isLimitReached && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-100 text-xs font-semibold leading-normal">
              <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
              <p>
                <span className="text-red-400 font-black uppercase tracking-widest mr-1">Limit Reached:</span> 
                You have 3 active requests. Please complete an existing one before posting again.
              </p>
            </div>
          )}

          {!hasEnoughGuy && !isLimitReached && isMember && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-100 text-xs font-semibold leading-normal">
              <AlertTriangle size={18} className="shrink-0 text-orange-400 mt-0.5" />
              <p>
                <span className="text-orange-400 font-black uppercase tracking-widest mr-1">Insufficient GUY:</span> 
                You need {postingFeeGuy} GUY tokens to post. Your current balance is {guyBalance.toLocaleString()} GUY.
              </p>
            </div>
          )}

          <div className={`space-y-5 ${(isLimitReached || !hasEnoughGuy || !isMember) ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request Title</Label>
              <Input 
                id="title"
                placeholder="What do you need help with?" 
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
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Amount ({formData.token})</Label>
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
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed Description</Label>
              <Textarea 
                placeholder="Please provide details so the community can understand your situation..." 
                className="min-h-[120px] bg-white/5 border-white/10 focus:border-emerald-500/50 leading-relaxed font-medium" 
                required 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proof & Verification</Label>
              
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                <div className="flex gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-[11px] leading-relaxed text-emerald-100/70 font-medium">
                    Highly recommended: Take a photo of the bill with your handle <span className="text-emerald-400 font-black">@{address}</span> written next to it.
                  </p>
                </div>

                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                
                {!preview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group ${skipProof ? 'opacity-40 border-white/10 pointer-events-none' : 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg border border-white/10">
                      <Camera size={24} className="text-emerald-400" />
                    </div>
                    <p className="text-sm font-black tracking-tight">Take or Select Photo</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Camera or Gallery</p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 aspect-video bg-black/40 group">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button 
                        type="button" 
                        variant="destructive"
                        size="sm"
                        className="h-10 gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl"
                        onClick={removePreview}
                      >
                        <X size={14} /> Remove and Retake
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
                    Post without photo verification
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
          className="w-full gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black h-16 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] uppercase tracking-[0.15em] text-[11px]" 
          disabled={loading || isLimitReached || !hasEnoughGuy || !isMember}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin" size={18} />
              <span>{submittingStep === 'authorizing' ? 'Authorizing Transaction...' : 'Publishing Request...'}</span>
            </div>
          ) : !isMember ? (
            "Membership Required"
          ) : isLimitReached ? (
            "Limit Reached (3/3)"
          ) : !hasEnoughGuy ? (
            "Insufficient GUY Balance"
          ) : (
            <div className="flex items-center gap-3">
              <Zap size={18} className="fill-current" />
              <span>Submit Request • {postingFeeGuy} GUY Fee</span>
            </div>
          )}
        </Button>
      </CardFooter>
    </div>
  );
};

export default RequestForm;