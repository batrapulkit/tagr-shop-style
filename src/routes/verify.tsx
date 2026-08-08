import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredPhone, logFunnel, setCreatorId } from "@/lib/funnel";
import { verifyOtpFn, sendOtpFn } from "@/lib/server-functions";
import { toast } from "sonner";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify your number — TagLoop" },
      { name: "description", content: "Confirm your phone number to finish creating your TagLoop account." },
      { property: "og:title", content: "Verify your number — TagLoop" },
      { property: "og:description", content: "Confirm your phone number to finish signing up." },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [countdown, setCountdown] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const stored = getStoredPhone();
    if (!stored) {
      void navigate({ to: "/signup" });
      return;
    }
    setPhone(stored);
    void logFunnel("otp_screen_viewed");
  }, [navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const code = digits.join("");
  const valid = code.length === 4;

  function setDigit(i: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      const chars = clean.slice(0, 4 - i).split("");
      const next = [...digits];
      chars.forEach((c, k) => (next[i + k] = c));
      setDigits(next);
      inputs.current[Math.min(i + chars.length, 3)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 3) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
    }
  }

  async function handleResend() {
    if (busy) return;
    setCountdown(30);
    setError(null);
    try {
      const res = await sendOtpFn({ data: { phone } });
      if (res.success) {
        if (res.isDemo) {
          toast.info(`MVP Demo mode: Enter code ${res.code || '1234'}`);
        } else {
          toast.success("Verification code dispatched via SMS!");
        }
      } else {
        setError("Could not resend code. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setError("SMS resend communication error.");
    }
  }

  async function onContinue() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      // 1. Verify OTP code via server function
      const check = await verifyOtpFn({ data: { phone, otp: code } });

      if (!check.success) {
        setError(check.error || "Incorrect verification code.");
        setBusy(false);
        return;
      }

      const isDemo = phone.startsWith("999") || phone.startsWith("123") || phone.includes("00000");
      await logFunnel("otp_verified", { demo_mode: isDemo });

      // 2. Fetch or create creator in database
      const { data: existing } = await supabase
        .from("creators")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      let creatorId = existing?.id ?? null;
      if (!creatorId) {
        const { data, error: insertError } = await supabase
          .from("creators")
          .insert({ phone })
          .select("id")
          .single();
        if (insertError) throw insertError;
        creatorId = data.id;
      }

      setCreatorId(creatorId);
      void navigate({ to: "/upgrade" });
    } catch (err) {
      console.error(err);
      setError("Couldn't create your account. Try again.");
      setBusy(false);
    }
  }

  const masked = phone ? phone : "XXXXXXXXXX";
  const isTesting = phone.startsWith("999") || phone.startsWith("123") || phone.includes("00000");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
      <Link to="/signup" aria-label="Back" className="-ml-2 w-9">
        <ChevronLeft className="h-6 w-6" />
      </Link>

      <h1 className="mt-6 text-2xl">Verify your number</h1>
      <p className="metric mt-2 text-sm text-muted-foreground">OTP sent to +91 {masked}</p>

      <div className="mt-8 flex gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            autoFocus={i === 0}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            className="metric h-14 w-full rounded-[8px] border border-border bg-card text-center text-xl shadow-[0_1px_2px_rgba(18,22,31,0.06)] outline-none focus:border-signal"
          />
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground font-medium">
        Enter the 4-digit code. For MVP testing, you can use the master bypass code <span className="text-signal font-semibold">1234</span> to log in instantly!
      </p>
      
      {error && <p className="mt-2 text-xs text-signal font-semibold">{error}</p>}

      <div className="mt-6 space-y-2 text-sm">
        {countdown > 0 ? (
          <p className="text-muted-foreground">
            Didn't get it? Resend in <span className="metric">{countdown}s</span>
          </p>
        ) : (
          <button onClick={handleResend} className="font-semibold text-signal hover:opacity-90">
            Didn't get it? Resend code
          </button>
        )}
        <div>
          <Link to="/signup" className="text-muted-foreground underline">
            Change phone number
          </Link>
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!valid || busy}
        className="mt-auto w-full rounded-[8px] bg-signal px-4 py-4 text-[0.95rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        {busy ? "Verifying..." : "Continue"}
      </button>
    </main>
  );
}
