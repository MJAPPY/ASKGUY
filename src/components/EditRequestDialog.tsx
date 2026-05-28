"use client";

import React, { useState, useRef } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Upload, X, Loader2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRequests } from '@/hooks/use-requests';
import { showSuccess, showError } from '@/utils/toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

interface EditRequestDialogProps {
  request: {
    id: string;
    title: string;
    description: string;
    proofUrl?: string;
    status?: string;
  };
  onSuccess: () => void;
}

const DEFAULT_THANKS = "Thanks very much to everyone who contributed to this request! Your support means the world to me.";

const EditRequestDialog = ({ request, onSuccess }: EditRequestDialogProps) => {
  const { updateRequest, markCompleted } = useRequests();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [thanksMessage, setThanksMessage] = useState(DEFAULT_THANKS);
  const [preview, setPreview] = useState<string | null>(request.proofUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (err: any) {
      showError(err.message || "Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async () => {
    setLoading(true);
    try {
      await markCompleted(request.id, thanksMessage);
      showSuccess("Request marked as completed!");
      onSuccess();
    } catch (err: any) {
      showError(err.message || "Failed to complete request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="glass-card border-white/10 max-w-lg p-8 rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh]">
      <DialogHeader>
        <DialogTitle className="text-2xl font-black tracking-tight">Manage Request</DialogTitle>
        <DialogDescription className="text-muted-foreground font-medium">Update details or mark your request as finished.</DialogDescription>
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

      <DialogFooter className="flex flex-col sm:flex-row gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline"
              className="flex-1 h-12 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-black rounded-xl gap-2 hover:bg-emerald-500/10"
              disabled={loading}
            >
              <CheckCircle2 size={18} />
              Mark Completed
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-card border-white/10 rounded-[32px] p-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight italic">Ready to archive?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-medium">This will hide the request from active browsing. You can leave a final thank you message for your supporters below.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-6 space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final Message</Label>
              <Textarea 
                value={thanksMessage} 
                onChange={(e) => setThanksMessage(e.target.value)} 
                className="bg-white/5 border-white/10 rounded-2xl h-32 leading-relaxed" 
              />
            </div>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="bg-white/5 border-white/10 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] px-8">Back</AlertDialogCancel>
              <AlertDialogAction onClick={handleMarkDone} className="bg-emerald-600 hover:bg-emerald-500 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] px-8">Complete & Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button 
          className="flex-1 bg-primary hover:bg-primary/90 text-black font-black h-12 rounded-xl gold-glow"
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