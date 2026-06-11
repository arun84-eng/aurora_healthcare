import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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