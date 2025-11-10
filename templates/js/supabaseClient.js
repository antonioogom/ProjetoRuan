// js/supabaseClient.js
// VERSÃO FINAL E CORRETA

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://lslnyyfpwxhwsesnihfj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbG55eWZwd3hod3Nlc25paGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjE5NDEsImV4cCI6MjA3NzUzNzk0MX0.o1yO79aBHvDt6MQ5PRhMPsl4Qzad6SuA8HDTbn73TgI';

// A CORREÇÃO: Força o Supabase a usar o esquema 'public'
const options = {
    db: {
        schema: 'public',
    },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);

console.log("Supabase Client Conectado ao schema 'public'. (Versão 999)");