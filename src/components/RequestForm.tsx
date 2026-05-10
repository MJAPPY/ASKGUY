"use client";

import React, { useState, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Send, X, AlertCircle, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useRequests, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';

const RequestForm = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [skipProof, setSkipProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { requests, addRequest } = useRequests();
  const { address } = useWallet();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Medical / Healthcare',
    customCategory: '',
    amount: '',
    token: 'XPR' as TokenSymbol,
    description: ''
  });

  const activeRequestsCount = useMemo(() => {
    return requests.filter(req => req.user === address && (req.status === 'Open' || req.status === 'Funded')).length;
  }, [requests, address]);

  const isLimitReached = activeRequestsCount >= 3;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setSkipProof(false);
    }
  };

  const removePreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || isLimitReached) return;
    
    setLoading(true);
    
    const categoryToSubmit = formData.category === 'Other' 
      ? formData.customCategory || 'Other' 
      : formData.category;

    setTimeout(() => {
      const success = addRequest({
        user: address,
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
        showSuccess("Request posted successfully!");
        const browseSection = document.getElementById('browse-requests');
        if (browseSection) browseSection.scrollIntoView({ behavior: 'smooth' });
      }
      setLoading(false);
    }, 1000);
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
    <Card className="glass-card border-emerald-500/20 shadow-emerald-500/5 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-400 to-emerald-500/50" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="text-emerald-400" size={18} />
            </div>
            <CardTitle className="text-emerald-400 text-xl font-black tracking-tight">Post New Request</CardTitle>
          </div>
          <div className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${isLimitReached ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
            {activeRequestsCount}/3 Active
          </div>
        </div>
        <CardDescription className="text-muted-foreground/80 font-medium">
          Share your situation with the community.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {isLimitReached && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-100 text-xs font-semibold leading-normal animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
              <p>
                <span className="text-red-400 font-black uppercase tracking-widest mr-1">Limit Reached:</span> 
                You have 3 active requests. Please complete an existing one before posting again.
              </p>
            </div>
          )}

          <div className={`space-y-4 ${isLimitReached ? 'opacity-50 pointer-events-none' : ''}`}>
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

            <div className="grid grid-cols-1 gap-4">
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
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount Requested (XPR)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                required 
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-11 font-black"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brief Situation</Label>
              <Textarea 
                placeholder="Explain your situation..." 
                className="min-h-[120px] bg-white/5 border-white/10 focus:border-emerald-500/50 leading-relaxed font-medium" 
                required 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-4 pt-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proof of Need (Recommended)</Label>
              
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                <div className="flex gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-[11px] leading-relaxed text-emerald-100/70 font-medium">
                    Upload a photo of your bill with your <span className="text-emerald-400 font-black">@{address}</span> handwritten next to it to build trust.
                  </p>
                </div>

                {/* Privacy Warning */}
                <div className="flex gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <AlertTriangle className="text-orange-400 shrink-0 mt-0.5" size={14} />
                  <p className="text-[10px] leading-tight text-orange-100/70 font-bold uppercase tracking-tight">
                    Privacy Warning: Please redact or hide sensitive information like your home address, full name, or account numbers before uploading.
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
                    <Upload className={`mx-auto mb-2 transition-colors ${skipProof ? 'text-muted-foreground' : 'text-emerald-400 group-hover:scale-110'}`} size={24} />
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
        </CardContent>
        
        <CardFooter className="pt-2">
          <Button 
            type="submit" 
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] uppercase tracking-widest text-[11px]" 
            disabled={loading || isLimitReached}
          >
            {loading ? "Posting..." : isLimitReached ? "Limit Reached" : "Submit Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RequestForm;