import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useEffect } from "react";
import brandGraphic from "@/assets/tagloop-brand.png";
import { logFunnel } from "@/lib/funnel";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Start your trial — TagLoop" },
      {
        name: "description",
        content: "₹9 for 7 days: unlimited scans, auto link-in-bio and click analytics on TagLoop.",
      },
      { property: "og:title", content: "Start your trial — TagLoop" },
      { property: "og:description", content: "₹9 for 7 days, then ₹149/month. Cancel anytime." },
    ],
  }),
  component: UpgradePage,
});

function UpgradePage() {
  const navigate = useNavigate();

  useEffect(() => {
    void logFunnel("paywall_viewed");
  }, []);

  async function skip() {
    await logFunnel("paywall_skipped");
    void navigate({ to: "/app" });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
      <div className="overflow-hidden rounded-[8px] border border-border bg-ink">
        <video
          controls
          muted
          poster={brandGraphic}
          className="h-44 w-full bg-ink object-contain"
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">20-second demo</p>

      <h1 className="mt-6 text-center text-2xl">Start your trial</h1>

      <div className="mt-4 flex items-baseline justify-center gap-3">
        <span className="metric text-lg text-muted-foreground line-through">₹149</span>
        <span className="metric text-5xl font-bold text-signal">₹9</span>
      </div>

      <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>₹9 for 7 days, then ₹149/month. Cancel anytime.</span>
      </p>

      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-[8px] border border-border bg-card px-4 py-3 text-xs shadow-[0_1px_2px_rgba(18,22,31,0.06)]">
        <li>Unlimited scans</li>
        <li className="text-muted-foreground">·</li>
        <li>Auto link-in-bio</li>
        <li className="text-muted-foreground">·</li>
        <li>Click analytics</li>
      </ul>

      <p className="mt-4 text-center text-xs text-muted-foreground">Built for Indian creators</p>

      <div className="mt-6 flex items-center justify-between rounded-[8px] border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(18,22,31,0.06)]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#0C2451] text-[0.6rem] font-bold text-white">
            R
          </span>
          <span className="text-sm font-semibold">Razorpay</span>
        </div>
        <button className="text-xs font-semibold text-signal">Change</button>
      </div>

      <div className="mt-auto pt-8">
        <button className="w-full rounded-[8px] bg-signal px-4 py-4 text-[0.95rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          Start trial
        </button>
        <button
          onClick={skip}
          className="mt-3 w-full py-2 text-center text-sm text-muted-foreground underline"
        >
          Skip for now
        </button>
      </div>
    </main>
  );
}
