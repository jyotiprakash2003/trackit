import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykptuwbyzwxjxbyigqmo.supabase.co'; // Paste your URL here
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcHR1d2J5end4anhieWlncW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODUwNDgsImV4cCI6MjA3Mjg2MTA0OH0.viwkGUMYdNHDjCtjHx1pXLEi8hEYnxYS6a_8ViA5E-U'; // Paste your anon key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey);