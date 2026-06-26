"use client";

import { getSiteUrl, supabase } from "./supabase-client";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yatqauonguxjrprcsfyx.supabase.co";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const READING_PRICE = 1000;

export type PendingPayment = {
  kind: "tarot" | "fortune" | "saju";
  orderName: string;
  amount: number;
  payload: unknown;
};

export async function authHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (supabaseKey) {
    headers.apikey = supabaseKey;
    headers.Authorization = `Bearer ${supabaseKey}`;
  }

  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  return headers;
}

export async function requireLogin() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function createOrderId(kind: string) {
  return `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function startPendingPayment(payment: PendingPayment) {
  sessionStorage.setItem("pending-payment", JSON.stringify(payment));
  window.location.href = `/payment/checkout?kind=${payment.kind}`;
}

export function getPaymentRedirectUrl(path: string) {
  return `${getSiteUrl()}${path}`;
}
