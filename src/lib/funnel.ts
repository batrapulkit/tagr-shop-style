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
  if (typeof window !== "undefined" && (window as any).fbq) {
    try {
      if (step === "landing_view") {
        (window as any).fbq("track", "ViewContent", { content_name: "Results View", ...meta });
      } else if (step === "phone_entered") {
        (window as any).fbq("track", "Lead", { content_name: "Phone Submission" });
      } else if (step === "otp_verified") {
        (window as any).fbq("track", "CompleteRegistration");
      } else if (step === "checkout_started") {
        (window as any).fbq("track", "InitiateCheckout");
      } else if (step === "paywall_viewed") {
        (window as any).fbq("track", "ViewContent", { content_name: "Paywall" });
      }
    } catch (e) {
      console.warn("Meta Pixel tracking failed:", e);
    }
  }

  try {
    await supabase.from("funnel_events").insert({
      session_id: getSessionId(),
      phone: getStoredPhone(),
      step,
      meta: (meta ?? null) as never,
    });
  } catch (err) {
    console.error("funnel log failed", step, err);
  }
}
