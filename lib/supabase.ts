import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://szcezibzyxqnujttaxbk.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Y2V6aWJ6eXhxbnVqdHRheGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTQzNzQsImV4cCI6MjA5NjYzMDM3NH0.w6T9y02oVqsixQ4XxkKZwan7bavGIRrvUaPQWNlSO-4';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  wake_time: string;
  bed_time: string;
  activity_level: string;
  goals: string[];
  water_goal_ml: number;
};