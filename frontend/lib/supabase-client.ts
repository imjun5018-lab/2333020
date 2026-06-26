"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yatqauonguxjrprcsfyx.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const canonicalSiteUrl = "https://youngwalldang.store";

if (!supabaseKey) {
  console.warn("Supabase public key is not configured.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || canonicalSiteUrl).replace(/\/$/, "");
}

export async function ensureProfile() {
  const { data, error } = await supabase.rpc("ensure_profile");

  if (error) {
    console.warn("Failed to ensure profile:", error.message);
    return null;
  }

  return data;
}
