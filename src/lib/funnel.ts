import { supabase } from "@/integrations/supabase/client";

export type FunnelStep =
  | "landing_view"
  | "phone_entered"
  | "otp_verified"
  | "paywall_viewed"
  | "checkout_started"
  | "payment_success"
  | "payment_failed"
  | "paywall_skipped";

const SESSION_KEY = "tagloop.session_id";
const PHONE_KEY = "tagloop.phone";
const CREATOR_KEY = "tagloop.creator_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getStoredPhone(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PHONE_KEY);
}

export function setStoredPhone(phone: string) {
  window.localStorage.setItem(PHONE_KEY, phone);
}

export function getCreatorId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CREATOR_KEY);
}

export function setCreatorId(id: string) {
  window.localStorage.setItem(CREATOR_KEY, id);
}

export async function logFunnel(
  step: FunnelStep,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from("funnel_events").insert({
      session_id: getSessionId(),
      phone: getStoredPhone(),
      step,
      meta: meta ?? null,
    });
  } catch (err) {
    console.error("funnel log failed", step, err);
  }
}
