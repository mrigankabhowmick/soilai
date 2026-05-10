import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTI4ODU1NDIsImV4cCI6MTkyODQ2MTU0Mn0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string;
  farm_name: string;
  created_at: string;
};

export type Drone = {
  id: string;
  user_id: string;
  name: string;
  model: string;
  serial_number: string;
  status: 'online' | 'offline' | 'flying' | 'charging';
  battery_level: number;
  signal_strength: number;
  firmware_version: string;
  created_at: string;
};

export type SensorReading = {
  id: string;
  user_id: string;
  zone_id: string | null;
  soil_moisture: number;
  soil_temperature: number;
  air_temperature: number;
  humidity: number;
  ndvi: number;
  water_level: number;
  air_quality_index: number;
  recorded_at: string;
};

export type AiAlert = {
  id: string;
  user_id: string;
  drone_id: string | null;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  is_read: boolean;
  created_at: string;
};

export type MediaFile = {
  id: string;
  user_id: string;
  drone_id: string | null;
  file_name: string;
  file_url: string;
  thumbnail_url: string;
  file_type: string;
  file_size_mb: number;
  crop_type: string;
  farm_area: string;
  latitude: number | null;
  longitude: number | null;
  ai_tags: string[];
  captured_at: string;
};
