"use client";

import React, { useState, useRef } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Loader2, Save, ImageIcon } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';
import { showSuccess, showError } from '@/utils/toast';

interface EditRequestDialogProps {
  request: {
    id: string;
    title: string;
    description: string;
    proofUrl?: string;
  };
  onSuccess: () => void;
}

const EditRequestDialog = ({ request, onSuccess }: EditRequestDialogProps) => {
  const { updateRequest } = useRequests();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [preview, setPreview] = useState<string | null>(request.proofUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!title || !description) {
      showError("Title and description are required");
      return;
    }

    setLoading(true);
    try {
      await updateRequest(request.id, {
        title,
        description,
        proofUrl: preview || undefined
      });
      showSuccess("Request updated successfully");
      onSuccess();
    } catch (err) {
      showError("Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="glass-card border-white/10 max-w-lg p-8 rounded-[32px] shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-black tracking-tight">Edit Request</DialogTitle>
        <DialogDescription className="text-muted-foreground font-medium">Update the details of your community request.</DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</Label>
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/5 border-white/10 h-11 font-medium rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
          <Textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 rounded-xl leading-relaxed font-medium"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verification Proof</Label>
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
              className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group"
            >
              <Upload size={20} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-bold">Upload New Proof</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/40 group">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <Button 
                  type="button" 
                  variant="secondary"
                  size="sm"
                  className="h-9 rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  size="sm"
                  className="h-9 rounded-lg"
                  onClick={() => setPreview(null)}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-black font-black h-12 rounded-xl gold-glow"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default EditRequestDialog;