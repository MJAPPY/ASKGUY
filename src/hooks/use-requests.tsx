import { supabase } from '@/integrations/supabase/client';
import { ref, onMounted, onUnmounted } from 'react';

/** Shared hook for all request‑related data */
export const useRequests = () => {
  const requests = ref([]);
  const loading = ref(false);

  const fetchRequests = async () => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      requests.value = data || [];
    } finally {
      loading.value = false;
    }
  };

  const addRequest = async (req) => {
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .insert(req)
        .select();
      if (error) throw error;
      fetchRequests();
      return data;
    } catch (err) {
      console.error('Add request failed:', err);
    }
  };

  const updateRequest = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('aid_requests')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      fetchRequests();
      return data;
    } catch (err) {
      console.error('Update request failed:', err);
    }
  };

  const deleteRequest = async (id) => {
    try {
      const { error } = await supabase
        .from('aid_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchRequests();
    } catch (err) {
      console.error('Delete request failed:', err);
    }
  };

  // Load once on mount
  onMounted(fetchRequests);
  onUnmounted(() => {
    // cleanup if needed
  });

  return {
    requests: requests.value,
    loading: loading.value,
    fetchRequests,
    addRequest,
    updateRequest,
    deleteRequest,
  };
};

/** Types used by the hook */
export interface AidRequest {
  id: string;
  requestor: string;
  title: string;
  category: string;
  amount: number;
  token: 'XPR' | 'GUY';
  description: string;
  status: string;
  timestamp: number;
  proofUrl?: string;
  raised: number;
  contributions?: {
    id: string;
    user: string;
    amount: number;
    token: 'XPR' | 'GUY';
    message?: string;
    timestamp: number;
  }[];
}

/** Token symbol type for UI components */
export type TokenSymbol = 'XPR' | 'GUY';