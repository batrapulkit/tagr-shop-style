import { supabase } from "@/integrations/supabase/client";
import mixpanel from "mixpanel-browser";

export type FunnelStep =
  | "landing_view"
  | "login_page_viewed"
  | "phone_entered"
  | "otp_screen_viewed"
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

declare global {
  interface Window {
    __firedSteps?: Set<string>;
  }
}

export async function logFunnel(
  step: FunnelStep,
  meta?: Record<string, unknown>,
): Promise<void> {
  // Only track on the client to avoid SSR shared state leaks and window errors
  if (typeof window === "undefined") {
    return;
  }

  // Deduplicate on client to prevent multiple event fires in single-page session
  if (!window.__firedSteps) {
    window.__firedSteps = new Set<string>();
  }
  if (window.__firedSteps.has(step)) {
    console.log(`[Analytics] Deduplicated duplicate step: ${step}`);
    return;
  }
  window.__firedSteps.add(step);

  const currentPhone = (meta?.["phone"] as string | undefined) || getStoredPhone() || "";

  console.log(`📣 [TagLoop Analytics] Fired event: "${step}"`, {
    meta,
    phone: currentPhone,
  });

  // 1. Meta Pixel
  if ((window as any).fbq) {
    try {
      if (step === "landing_view") {
        (window as any).fbq("track", "ViewContent", { content_name: "Results View", ...meta });
        (window as any).fbq("trackCustom", "landingScreen");
      } else if (step === "login_page_viewed") {
        (window as any).fbq("track", "ViewContent", { content_name: "Login Page" });
        (window as any).fbq("trackCustom", "phoneNumberScreen");
      } else if (step === "phone_entered") {
        (window as any).fbq("track", "Lead", { content_name: "Phone Submission" });
        (window as any).fbq("trackCustom", "phoneNumberAdded", { phoneNumber: currentPhone });
      } else if (step === "otp_screen_viewed") {
        (window as any).fbq("track", "ViewContent", { content_name: "OTP Screen" });
        (window as any).fbq("trackCustom", "OTPScreen");
      } else if (step === "otp_verified") {
        (window as any).fbq("track", "CompleteRegistration");
      } else if (step === "paywall_viewed") {
        (window as any).fbq("track", "ViewContent", { content_name: "Paywall" });
        (window as any).fbq("trackCustom", "PaymentScreen");
      } else if (step === "checkout_started") {
        (window as any).fbq("track", "InitiateCheckout");
        (window as any).fbq("trackCustom", "paymentInitiated");
      } else if (step === "payment_success") {
        (window as any).fbq("track", "Purchase", { value: 99.00, currency: "INR" });
        (window as any).fbq("trackCustom", "paymentSuccess");
      }
    } catch (e) {
      console.warn("Meta Pixel tracking failed:", e);
    }
  }

  // 2. Mixpanel Tracking
  try {
    const creatorId = getCreatorId();
    if (creatorId) {
      mixpanel.identify(creatorId);
    }
    if (currentPhone) {
      mixpanel.people.set({
        $phone: currentPhone,
      });
    }

    // Map steps to user requested Mixpanel events
    if (step === "landing_view") {
      mixpanel.track("landingScreen", meta);
    } else if (step === "login_page_viewed") {
      mixpanel.track("phoneNumberScreen");
    } else if (step === "phone_entered") {
      mixpanel.track("phoneNumberAdded", { phoneNumber: currentPhone });
    } else if (step === "otp_screen_viewed") {
      mixpanel.track("OTPScreen");
    } else if (step === "paywall_viewed") {
      mixpanel.track("PaymentScreen", meta);
    } else if (step === "checkout_started") {
      mixpanel.track("paymentInitiated", meta);
    } else if (step === "payment_success") {
      mixpanel.track("paymentSuccess", { value: 99.00, currency: "INR", ...meta });
    } else {
      mixpanel.track(step, meta);
    }
  } catch (e) {
    console.warn("Mixpanel tracking failed:", e);
  }

  // 3. Database Event Logging
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
