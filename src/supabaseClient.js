import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywilsmyaylcquttbznix.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWxzbXlheWxjcXV0dGJ6bml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzEzMzgsImV4cCI6MjA2MjcwNzMzOH0.20Jgqur5emrhezKPH0iNQMVyXEVgNPKScvhPfAXfFEA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);