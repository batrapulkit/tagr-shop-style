import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { logFunnel } from "@/lib/funnel";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to Pro — TagLoop" },
      { name: "description", content: "Your Pro subscription has started successfully. Welcome to TagLoop Pro!" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  useEffect(() => {
    async function trackSuccess() {
      await logFunnel("payment_success");
      // Direct absolute fallback calls to verify the events are loaded on welcome page mount
      if (typeof window !== "undefined" && (window as any).fbq) {
        try {
          (window as any).fbq("track", "Purchase", { value: 99.00, currency: "INR" });
          (window as any).fbq("trackCustom", "paymentSuccess");
          (window as any).fbq("trackCustom", "PaymentCompleted", { value: 99.00, currency: "INR" });
          (window as any).fbq("trackCustom", "paymentCompleted", { value: 99.00, currency: "INR" });
        } catch (pxErr) {
          console.error("Direct welcome fallback pixel track failed:", pxErr);
        }
      }
    }
    void trackSuccess();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-signal" />
        <span className="font-display text-sm font-bold tracking-[-0.02em]">TagLoop</span>
      </div>

      <div className="mt-12 flex h-20 w-20 items-center justify-center rounded-full bg-rupee/10 text-rupee">
        <CheckCircle2 className="h-10 w-10" />
      </div>

      <h1 className="mt-8 text-3xl leading-tight">You are officially in!</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Your Pro subscription has started. You now have unlimited scans, automatic link-in-bios, and click analytics.
      </p>

      <ul className="mt-8 w-full space-y-2 text-left text-xs bg-card border border-border p-4 rounded-[8px] shadow-[0_1px_2px_rgba(18,22,31,0.06)]">
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rupee" />
          <span>Unlimited fashion visual scans</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rupee" />
          <span>Real-time Indian creator metrics</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rupee" />
          <span>Under 50ms redirection response times</span>
        </li>
      </ul>

      <Link
        to="/app"
        className="mt-10 flex h-13 w-full items-center justify-center rounded-[8px] bg-signal text-[0.95rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Go to workspace
      </Link>
    </main>
  );
}
