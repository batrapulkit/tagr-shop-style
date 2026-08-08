import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import brandGraphic from "@/assets/tagloop-brand.png";
import { logFunnel, setStoredPhone } from "@/lib/funnel";
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

  const valid = phone.length === 10 && accepted;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      setStoredPhone(phone);
      await logFunnel("phone_entered", { phone });

      const { sendOtpFn } = await import("@/lib/server-functions");
      const res = await sendOtpFn({ data: { phone } });

      if (res.success) {
        if (res.isDemo) {
          toast.info(`MVP Demo mode: Enter code ${res.code || '1234'}`);
        } else {
          toast.success("Verification code dispatched via SMS!");
        }
        void navigate({ to: "/verify" });
      } else {
        toast.error("Internal gateway error sending OTP. Try again.");
        setBusy(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting with SMS gateway.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-8">
      <p className="text-center font-display text-sm font-bold tracking-[-0.02em]">TagLoop</p>

      <div className="mt-6 flex justify-center">
        <img
          src={brandGraphic}
          alt="Outfit photo annotated with product tag chips"
          className="w-56 max-w-full"
        />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Find what's shoppable in your photos and get paid for it.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-1 flex-col">
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
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
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
          className="mt-auto w-full rounded-[8px] bg-signal px-4 py-4 text-[0.95rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
