import { createClient } from '@supabase/supabase-js';

// Supabase baılantı bilgileri (.env / Netlify environment variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables eksik: VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlanmalı.');
}

// Normal client (anon key ile) - Okuma ve auth için
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-bordro-client': 'web'
    }
  }
});

// Frontend'de service_role key KULLANILMAMALIDIR.
// Geriye donuk uyumluluk için adminSupabase adı korunur ve normal client'ı işaret eder.
export const adminSupabase = supabase;

// Kullanıcı tablosu ıeması:
// CREATE TABLE users (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   email TEXT UNIQUE NOT NULL,
//   password TEXT NOT NULL,
//   name TEXT,
//   company TEXT,
//   role TEXT DEFAULT 'user',
//   approved BOOLEAN DEFAULT false,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   created_by TEXT,
//   updated_by TEXT
// );

