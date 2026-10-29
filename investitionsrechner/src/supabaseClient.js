import { createClient } from "@supabase/supabase-js";

// Diese beiden Werte kommen aus den Vercel-Umgebungsvariablen
// VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY (Project Settings → API
// in Supabase). Ohne sie startet die App, zeigt aber einen Hinweis
// statt der Login-Maske.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseKonfiguriert = Boolean(url && anonKey);

export const supabase = supabaseKonfiguriert
  ? createClient(url, anonKey)
  : null;
