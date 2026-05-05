"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Send, X } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useRequests, TokenSymbol } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';

const RequestForm = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addRequest } = useRequests();
  const { address } = useWallet();
  
  const [formData, setFormData] = useState({
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
        category: categoryToSubmit,
        amount: parseFloat(formData.amount),
        token: formData.token,
        description: formData.description,
      });
      setLoading(false);
      setFormData({ 
        category: 'Medical / Healthcare', 
        customCategory: '',
        amount: '', 
        token: 'XPR', 
        description: '' 
      });
      setPreview(null);
      showSuccess("Request posted successfully!");
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
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary">Post Bill Request</CardTitle>
        <CardDescription>Submit your bill for community mutual aid support.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
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
                <Label>Custom Category Name</Label>
                <Input 
                  placeholder="e.g. Education, Pet Care..." 
                  required 
                  value={formData.customCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                  className="bg-white/5 border-white/10 focus:border-primary/50"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token</Label>
              <Select 
                value={formData.token} 
                onValueChange={(v: TokenSymbol) => setFormData(prev => ({ ...prev, token: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="XPR">XPR (Main)</SelectItem>
                  <SelectItem value="GUY">GUY (Community)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ({formData.token})</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                required 
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-primary/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Explain why you need help with this bill..." 
              className="min-h-[100px] bg-white/5 border-white/10 focus:border-primary/50" 
              required 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Photo Proof</Label>
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
                className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <Upload className="mx-auto text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Click to upload bill photo</p>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-white/10 aspect-video bg-black/20">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <button 
                  type="button" 
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  onClick={removePreview}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full gap-2 gold-glow font-bold" disabled={loading}>
            <Send size={18} />
            {loading ? "Posting..." : "Submit Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RequestForm;