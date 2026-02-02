
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Initializing Supabase...");
console.log("URL:", supabaseUrl ? "Exists" : "MISSING");
console.log("Key:", supabaseKey ? "Exists" : "MISSING");

let supabase;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log("Supabase client created successfully.");
    } catch (err) {
        console.error("Supabase creation failed:", err);
    }
}

// Fallback mock check
if (!supabase) {
    console.warn("Using MOCK Supabase client due to missing config.");
    supabase = {
        auth: {
            getSession: async () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => { throw new Error("Supabase not configured"); },
            signUp: async () => { throw new Error("Supabase not configured"); }
        },
        from: () => ({ select: () => ({ order: async () => ({ data: [], error: null }) }) })
    };
}

export { supabase };
