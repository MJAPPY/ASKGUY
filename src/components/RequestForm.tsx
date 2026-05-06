"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Send, X, AlertCircle, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useRequests, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';

const RequestForm = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [skipProof, setSkipProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addRequest } = useRequests();
  const { address } = useWallet();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Medical / Healthcare',
    customCategory: '',
    amount: '',
    token: 'XPR' as TokenSymbol,
    description: ''
  });

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
    if (!address) return;
    
    setLoading(true);
    
    const categoryToSubmit = formData.category === 'Other' 
      ? formData.customCategory || 'Other' 
      : formData.category;

    setTimeout(() => {
      addRequest({
        user: address,
        title: formData.title,
        category: categoryToSubmit,
        amount: parseFloat(formData.amount),
        token: formData.token,
        description: formData.description,
        proofUrl: preview || undefined
      });
      setLoading(false);
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
      // Focus the browse section
      const browseSection = document.getElementById('browse-requests');
      if (browseSection) browseSection.scrollIntoView({ behavior: 'smooth' });
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
    <Card className="glass-card border-emerald-500/20 shadow-emerald-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Send className="text-emerald-400" size={18} />
          </div>
          <CardTitle className="text-emerald-400 text-xl">Post New Request</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground/80">
          Be honest and clear. The community is here to support you.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Short Summary</Label>
              <Input 
                id="title"
                placeholder="e.g. Help with Rent for March" 
                required 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-11"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 h-11">
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
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Category</Label>
                  <Input 
                    placeholder="e.g. Education, Pet Care..." 
                    required 
                    value={formData.customCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-11"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount Needed (XPR)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                required 
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Brief situation</Label>
              <Textarea 
                placeholder="Explain your situation. Being detailed helps donors understand your need..." 
                className="min-h-[120px] bg-white/5 border-white/10 focus:border-emerald-500/50 leading-relaxed" 
                required 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Proof Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proof of Need (Highly Recommended)</Label>
              </div>
              
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                {/* Moved and restyled warning box */}
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-100 text-xs font-semibold leading-normal shadow-sm">
                  <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                  <p>
                    <span className="text-amber-400 font-bold uppercase tracking-tight mr-1">Warning:</span> 
                    All requests and photos are public. Please blur or cover sensitive personal ID numbers before uploading.
                  </p>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-[11px] leading-relaxed text-emerald-100/70">
                    <span className="font-bold text-emerald-400">Recommended:</span> Upload a photo of your bill with your <span className="text-emerald-400 font-bold">@{address}</span> handwritten clearly on a piece of paper next to it. This builds trust and increases chances of receiving help.
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
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group ${skipProof ? 'opacity-40 border-white/10 pointer-events-none' : 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                  >
                    <Upload className={`mx-auto mb-2 transition-colors ${skipProof ? 'text-muted-foreground' : 'text-emerald-400 group-hover:scale-110'}`} size={24} />
                    <p className="text-sm font-medium">Click to upload photo proof</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Supports JPG, PNG</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 aspect-video bg-black/40 group">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button 
                        type="button" 
                        variant="destructive"
                        size="sm"
                        className="h-8 gap-2"
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
                    className="text-[11px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer"
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
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Posting Request...
              </span>
            ) : (
              <>
                <Send size={18} />
                Submit Bill Request
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RequestForm;