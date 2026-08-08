import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { logFunnel, getCreatorId, getStoredPhone } from "@/lib/funnel";
import { createRazorpayOrderFn, verifyRazorpayPaymentFn } from "@/lib/server-functions";
import { toast } from "sonner";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Start Making Money — TagLoop" },
      {
        name: "description",
        content: "₹99/month: unlimited scans, auto link-in-bio and click analytics on TagLoop.",
      },
      { property: "og:title", content: "Start Making Money — TagLoop" },
      { property: "og:description", content: "₹99/month. Cancel anytime." },
    ],
  }),
  component: UpgradePage,
});

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

function UpgradePage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [keyId, setKeyId] = useState("");

  useEffect(() => {
    void logFunnel("paywall_viewed");

    // Pre-extract key state to determine test mode banner
    const testKey = import.meta.env['VITE_RAZORPAY_KEY_ID'] || process.env['RAZORPAY_KEY_ID'] || "rzp_live_TN22YzLCuwN2BZ";
    setKeyId(testKey);

    // Dynamically inject Razorpay Checkout JS
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
    return;
  }, []);

  async function skip() {
    await logFunnel("paywall_skipped");
    void navigate({ to: "/app" });
  }

  async function startTrial() {
    if (busy) return;
    setBusy(true);

    const creatorId = getCreatorId();
    if (!creatorId) {
      toast.error("Please login and register your phone first!");
      setBusy(false);
      void navigate({ to: "/signup" });
      return;
    }

    try {
      await logFunnel("checkout_started");

      // Retrieve Razorpay order particulars from server function
      const order = await createRazorpayOrderFn({ data: { creatorId } });

      if (!window.Razorpay) {
        toast.error("Razorpay SDK failed to load. Please refresh and try again.");
        setBusy(false);
        return;
      }

      const phone = getStoredPhone() || "";

      // Configure Razorpay checkout widget
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: "INR",
        name: "TagLoop",
        description: "Pro Monthly Subscription",
        order_id: order.order_id,
        prefill: {
          contact: phone,
        },
        theme: {
          color: "#E5175B",
        },
        handler: async (response) => {
          setBusy(true);
          try {
            const verification = await verifyRazorpayPaymentFn({
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                creator_id: creatorId,
              }
            });

            if (verification.success) {
              await logFunnel("payment_success");
              // Fallback direct calls to Meta Pixel to guarantee transmission
              if (typeof window !== "undefined" && (window as any).fbq) {
                try {
                  (window as any).fbq("track", "Purchase", { value: 99.00, currency: "INR" });
                  (window as any).fbq("trackCustom", "paymentSuccess");
                  (window as any).fbq("trackCustom", "PaymentCompleted", { value: 99.00, currency: "INR" });
                  (window as any).fbq("trackCustom", "paymentCompleted", { value: 99.00, currency: "INR" });
                } catch (pxErr) {
                  console.error("Direct fallback pixel track failed:", pxErr);
                }
              }
              toast.success("Payment succeeded! Welcome to Pro.");
              void navigate({ to: "/welcome" });
            } else {
              toast.error(verification.error || "Payment verification failed.");
            }
          } catch (err) {
            console.error(err);
            toast.error("Error verifying payment.");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: async () => {
            console.log("Checkout modal dismissed.");
            setBusy(false);
            try {
              await verifyRazorpayPaymentFn({
                data: {
                  razorpay_order_id: order.order_id,
                  creator_id: creatorId,
                  dismissed: true,
                }
              });
            } catch (err) {
              console.error(err);
            }
          },
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Could not initialize payment checkout. Try again.");
      setBusy(false);
    }
  }

  const isTestMode = keyId.startsWith("rzp_test_");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-5 pb-8 pt-4">
      {isTestMode && (
        <div className="mb-3 flex items-center gap-2 rounded-[8px] bg-signal/10 p-3 text-xs text-signal font-semibold">
          <AlertCircle className="h-4 w-4" />
          <span>Demo Payment Mode (Test Key Active)</span>
        </div>
      )}

      <div className="overflow-hidden rounded-[8px] border border-border bg-ink aspect-square w-full">
        <video
          src="/video.mp4"
          controls
          autoPlay
          loop
          playsInline
          poster="/logo.jpeg"
          className="h-full w-full bg-ink object-cover"
        />
      </div>
      {/* <p className="mt-2 text-center text-xs text-muted-foreground">20-second demo</p> */}

      <h1 className="mt-4 text-center text-xl font-bold">Start Making Money</h1>

      <div className="mt-3 flex items-baseline justify-center gap-2">
        <span className="metric text-4xl font-bold text-signal">₹99</span>
        <span className="text-lg text-muted-foreground">/month</span>
      </div>

      <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Cancel anytime.</span>
      </p>

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-[8px] border border-border bg-card px-4 py-2.5 text-xs shadow-[0_1px_2px_rgba(18,22,31,0.06)]">
        <li>Unlimited scans</li>
        <li className="text-muted-foreground">·</li>
        <li>Auto link-in-bio</li>
        <li className="text-muted-foreground">·</li>
        <li>Click analytics</li>
      </ul>

      {/* <p className="mt-4 text-center text-xs text-muted-foreground">Built for Indian creators</p>

      <div className="mt-6 flex items-center justify-between rounded-[8px] border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(18,22,31,0.06)]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#0C2451] text-[0.6rem] font-bold text-white">
            R
          </span>
          <span className="text-sm font-semibold">Razorpay</span>
        </div>
        <div className="text-xs text-muted-foreground">Auto-selected</div>
      </div> */}

      <div className="mt-6">
        <button
          onClick={startTrial}
          disabled={busy}
          className="w-full rounded-[8px] bg-signal px-4 py-4 text-[0.95rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Loading..." : "Start Making Money"}
        </button>
        {/* <button
          onClick={skip}
          disabled={busy}
          className="mt-3 w-full py-2 text-center text-sm text-muted-foreground underline disabled:opacity-50"
        >
          Skip for now
        </button> */}
      </div>
    </main>
  );
}
