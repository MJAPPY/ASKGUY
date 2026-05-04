"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Send, X, FileText, AlertCircle } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useRequests } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';

const RequestForm = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addRequest } = useRequests();
  const { address } = useWallet();
  
  const [formData, setFormData] = useState({
    category: 'medical',
    amount: '',
    description: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mock preview
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
    setTimeout(() => {
      addRequest({
        user: address,
        category: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
        amount: parseFloat(formData.amount),
        description: formData.description,
      });
      setLoading(false);
      setFormData({ category: 'medical', amount: '', description: '' });
      setPreview(null);
      showSuccess("Request posted successfully!");
    }, 1000);
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary">Post Bill Request</CardTitle>
        <CardDescription>Submit your bill for community mutual aid support.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (XPR)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                required 
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Explain why you need help with this bill..." 
              className="min-h-[100px]" 
              required 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Photo Proof</Label>
              <div className="flex items-center gap-1 text-[10px] text-orange-400 font-medium">
                <AlertCircle size={10} />
                <span>Hide sensitive info (address, acc numbers)</span>
              </div>
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
                className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <Upload className="mx-auto text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Click to upload bill photo or receipt</p>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-white/10 aspect-video bg-black/20">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={removePreview}
                >
                  <X size={14} />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  <span className="text-[10px] truncate">bill_proof_image.jpg</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <Send size={18} />
            {loading ? "Posting..." : "Submit Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RequestForm;