"use client";

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Lightweight background pulse to keep Supabase project from auto-pausing.
 * Runs once every 24 hours while the app is open in any tab.
 */
const SupabasePulse = () => {
  useEffect(() => {
    const performPulse = async () => {
      try {
        // Lightest possible query: just check one row of settings
        await supabase.from('site_settings').select('id').limit(1).single();
        console.log('[Supabase] Keep-alive pulse sent');
      } catch (e) {
        // Silent fail
      }
    };

    // Run on mount
    performPulse();

    // Interval: 24 hours (86,400,000 ms)
    const interval = setInterval(performPulse, 86400000);
    return () => clearInterval(interval);
  }, []);

  return null;
};

export default SupabasePulse;