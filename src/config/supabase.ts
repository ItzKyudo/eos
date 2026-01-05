import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qkkvavhvyidylqjgbsrs.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFra3Zhdmh2eWlkeWxxamdic3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzYxNjQsImV4cCI6MjA4MzA1MjE2NH0.gy8hjdXEcvPbqgExIBYlshpFJ_MJ0IMCXTIlr9lZptA';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE')) {
    console.error("⚠️ Supabase Keys are missing! Check your .env file or paste them hardcoded for testing.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
