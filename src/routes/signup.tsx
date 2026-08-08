import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { logFunnel, setStoredPhone, setCreatorId } from "@/lib/funnel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Log in — TagLoop" },
      { name: "description", content: "Enter your phone number to start earning from your reels with TagLoop." },
      { property: "og:title", content: "Log in — TagLoop" },
      { property: "og:description", content: "Enter your phone number to start with TagLoop." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void logFunnel("login_page_viewed");
  }, []);

  const valid = phone.length === 10 && accepted;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      setStoredPhone(phone);
      // Fire phone entered funnel event
      await logFunnel("phone_entered", { phone });

      // 1. Fetch or create creator in database
      const { data: existing, error: fetchError } = await supabase
        .from("creators")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (fetchError) throw fetchError;

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
      
      // Auto-trigger registration / otp verification completion analytics
      const isDemo = phone.startsWith("999") || phone.startsWith("123") || phone.includes("00000");
      await logFunnel("otp_verified", { demo_mode: isDemo });

      toast.success("Welcome! Directing to payment page...");
      void navigate({ to: "/upgrade" });
    } catch (err) {
      console.error("Account creation failed:", err);
      toast.error("Couldn't create your account. Try again.");
      setBusy(false);
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(val);
    if (val.length === 10) {
      e.target.blur();
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
      <p className="text-center font-display text-sm font-bold tracking-[-0.02em]">TagLoop</p>

      <div className="mt-4 flex justify-center">
        <img
          src="/logo.jpeg"
          alt="TagLoop Logo"
          className="w-24 h-24 rounded-[12px] object-cover shadow-md"
        />
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Find what's shoppable in your photos and get paid for it.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col">
        <label htmlFor="phone" className="text-sm font-semibold">
          Log in
        </label>

        <div className="mt-2 flex items-stretch overflow-hidden rounded-[8px] border border-border bg-card shadow-[0_1px_2px_rgba(18,22,31,0.06)] focus-within:border-signal">
          <span className="metric flex items-center gap-1 border-r border-border px-3 text-sm">
            🇮🇳 +91
          </span>
          <input
            id="phone"
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="98765 43210"
            value={phone}
            onChange={handlePhoneChange}
            className="metric w-full bg-transparent px-3 py-3.5 text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        <label className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--signal)]"
          />
          <span>
            By signing up you accept the{" "}
            <a href="/terms" className="text-ink underline">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-ink underline">
              Privacy Policy
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={!valid || busy}
          className="mt-6 w-full rounded-[8px] bg-signal px-4 py-4 text-[0.95rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
