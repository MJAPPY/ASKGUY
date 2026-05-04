"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Send } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useRequests } from '@/hooks/use-requests';
import { useWallet } from '@/hooks/use-wallet';

const RequestForm = () => {
  const [loading, setLoading] = useState(false);
  const { addRequest } = useRequests();
  const { address } = useWallet();
  
  const [formData, setFormData] = useState({
    category: 'medical',
    amount: '',
    description: ''
  });

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
            <Label>Photo Proof</Label>
            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload bill photo or receipt</p>
            </div>
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