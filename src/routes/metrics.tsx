import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, BarChart3, Users, Zap, Image, ShoppingBag, Eye, DollarSign, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Public Metrics — TagLoop" },
      { name: "description", content: "Transparent usage and funnel metrics updated live." },
    ],
  }),
  component: MetricsPage,
});

interface FunnelData {
  landing_views: number;
  phone_entered: number;
  otp_verified: number;
  paywall_viewed: number;
  checkout_started: number;
  payment_success: number;
  paywall_skipped: number;
}

interface MetricStats {
  photosProcessed: number;
  medianProcessingMs: number;
  itemsDetected: number;
  itemsPerPhoto: number;
  linksGenerated: number;
  realClicks: number;
  creatorsOnboarded: number;
  correctionRate: number;
}

interface RecentUpload {
  id: string;
  created_at: string;
  processing_ms: number | null;
  items_count: number;
  links_count: number;
}

function MetricsPage() {
  const [funnel, setFunnel] = useState<FunnelData>({
    landing_views: 0,
    phone_entered: 0,
    otp_verified: 0,
    paywall_viewed: 0,
    checkout_started: 0,
    payment_success: 0,
    paywall_skipped: 0,
  });

  const [stats, setStats] = useState<MetricStats>({
    photosProcessed: 0,
    medianProcessingMs: 0,
    itemsDetected: 0,
    itemsPerPhoto: 0.0,
    linksGenerated: 0,
    realClicks: 0,
    creatorsOnboarded: 0,
    correctionRate: 0.0,
  });

  const [recent, setRecent] = useState<RecentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [secondsToRefresh, setSecondsToRefresh] = useState(10);

  async function fetchMetrics() {
    try {
      // 1. Funnel Calculations (via distinct session_id counts per step)
      const { data: rawEvents } = await supabase
        .from("funnel_events")
        .select("step, session_id");

      const sessionSteps = {
        landing_view: new Set<string>(),
        phone_entered: new Set<string>(),
        otp_verified: new Set<string>(),
        paywall_viewed: new Set<string>(),
        checkout_started: new Set<string>(),
        payment_success: new Set<string>(),
        paywall_skipped: new Set<string>(),
      };

      rawEvents?.forEach((ev) => {
        if (ev.step in sessionSteps && ev.session_id) {
          sessionSteps[ev.step as keyof typeof sessionSteps].add(ev.session_id);
        }
      });

      const fd: FunnelData = {
        landing_views: sessionSteps.landing_view.size,
        phone_entered: sessionSteps.phone_entered.size,
        otp_verified: sessionSteps.otp_verified.size,
        paywall_viewed: sessionSteps.paywall_viewed.size,
        checkout_started: sessionSteps.checkout_started.size,
        payment_success: sessionSteps.payment_success.size,
        paywall_skipped: sessionSteps.paywall_skipped.size,
      };
      setFunnel(fd);

      // 2. Base Counts from DB Tables
      const { count: uploadsCount } = await supabase.from("uploads").select("*", { count: "exact" });
      const { count: itemsCount } = await supabase.from("detected_items").select("*", { count: "exact" });
      const { count: linksCount } = await supabase.from("affiliate_links").select("*", { count: "exact" });
      const { count: clicksCount } = await supabase.from("clicks").select("*", { count: "exact" });
      const { count: creatorsCount } = await supabase.from("creators").select("*", { count: "exact" });

      // 3. Median Processing Time Calculation
      const { data: times } = await supabase
        .from("uploads")
        .select("processing_ms")
        .not("processing_ms", "is", null);

      let medianMs = 0;
      if (times && times.length > 0) {
        const sorted = times.map((t) => Number(t.processing_ms)).sort((a, b) => a - b);
        medianMs = sorted[Math.floor(sorted.length / 2)] ?? 0;
      }

      // 4. Correction Rates (item edits/deletes ratio)
      const { data: correctEvents } = await supabase
        .from("funnel_events")
        .select("meta")
        .eq("step", "landing_view");

      let editsCount = 0;
      correctEvents?.forEach((ev) => {
        const meta = ev.meta as Record<string, unknown>;
        if (meta && (meta['action'] === "item_deleted" || meta['action'] === "item_query_edited")) {
          editsCount++;
        }
      });

      const totalItems = itemsCount || 0;
      const rate = totalItems ? (editsCount / totalItems) * 100 : 0.0;

      setStats({
        photosProcessed: uploadsCount || 0,
        medianProcessingMs: medianMs,
        itemsDetected: totalItems,
        itemsPerPhoto: uploadsCount ? Number((totalItems / uploadsCount).toFixed(1)) : 0.0,
        linksGenerated: linksCount || 0,
        realClicks: clicksCount || 0,
        creatorsOnboarded: creatorsCount || 0,
        correctionRate: Number(rate.toFixed(1)),
      });

      // 5. Recent Activity (last 20 uploads)
      const { data: dbRecent } = await supabase
        .from("uploads")
        .select("id, created_at, processing_ms")
        .order("created_at", { ascending: false })
        .limit(20);

      if (dbRecent && dbRecent.length > 0) {
        const mappedRecent = await Promise.all(
          dbRecent.map(async (u) => {
            // Count items
            const { count: itCount } = await supabase
              .from("detected_items")
              .select("*", { count: "exact" })
              .eq("upload_id", u.id);

            // Count links
            let lkCount = 0;
            if (itCount && itCount > 0) {
              const { data: itemIds } = await supabase
                .from("detected_items")
                .select("id")
                .eq("upload_id", u.id);
              
              if (itemIds && itemIds.length > 0) {
                const ids = itemIds.map((item) => item.id);
                const { count: matchingLinks } = await supabase
                  .from("affiliate_links")
                  .select("*", { count: "exact" })
                  .in("detected_item_id", ids);
                lkCount = matchingLinks || 0;
              }
            }

            return {
              id: u.id,
              created_at: u.created_at,
              processing_ms: u.processing_ms,
              items_count: itCount || 0,
              links_count: lkCount,
            };
          })
        );
        setRecent(mappedRecent);
      } else {
        setRecent([]);
      }

    } catch (err) {
      console.error("Error fetching metrics dashboard data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMetrics();
    
    // Refresh interval
    const refreshTimer = setInterval(() => {
      setSecondsToRefresh((sec) => {
        if (sec <= 1) {
          void fetchMetrics();
          return 10;
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(refreshTimer);
  }, []);

  // Safe percentage helper for funnel visualization
  const getPercentOfViews = (val: number) => {
    if (!funnel.landing_views) return "0%";
    return `${Math.round((val / funnel.landing_views) * 100)}%`;
  };

  const getStepRatio = (current: number, previous: number) => {
    if (!previous) return "0%";
    return `${Math.round((current / previous) * 100)}%`;
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-10 pt-8 sm:max-w-2xl bg-paper">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal" />
          <span className="font-display text-sm font-bold tracking-[-0.02em]">TagLoop</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Reloading in <strong className="metric">{secondsToRefresh}s</strong></span>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-baseline">
        <h1 className="text-3xl leading-none">Usage Analytics</h1>
        <Link to="/metrics/seed-check" className="text-xs text-muted-foreground underline hover:text-foreground">
          Admin seed integrity
        </Link>
      </div>

      {loading && recent.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Loading public metrics...</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Funnel Visualisation */}
          <div className="card-flat bg-card p-5 border border-border rounded-[8px] shadow-hairline">
            <h2 className="text-md flex items-center gap-2 mb-4 font-semibold">
              <BarChart3 className="h-4.5 w-4.5 text-signal" />
              <span>Conversion Funnel</span>
            </h2>

            <div className="space-y-3.5">
              {[
                { label: "1. Landing page views", val: funnel.landing_views, prev: null },
                { label: "2. Entered mobile phone", val: funnel.phone_entered, prev: funnel.landing_views },
                { label: "3. Checked OTP digits", val: funnel.otp_verified, prev: funnel.phone_entered },
                { label: "4. Viewed payment paywall", val: funnel.paywall_viewed, prev: funnel.otp_verified },
                { label: "5. Clicked checkout start", val: funnel.checkout_started, prev: funnel.paywall_viewed },
                { label: "6. Completed ₹99 payment", val: funnel.payment_success, prev: funnel.checkout_started },
              ].map((step, idx) => {
                const totalPercent = getPercentOfViews(step.val);
                const stepPercent = step.prev !== null ? getStepRatio(step.val, step.prev) : "100%";

                return (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span>{step.label}</span>
                        <span className="metric font-bold">{step.val}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-signal transition-all"
                          style={{ width: totalPercent }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right leading-none">
                      <span className="metric text-xs font-bold block">{totalPercent}</span>
                      {step.prev !== null && (
                        <span className="text-[9px] text-muted-foreground">CR: {stepPercent}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
              <span>Paywall trial skipped rate:</span>
              <span className="metric font-bold text-foreground">
                {funnel.paywall_viewed ? Math.round((funnel.paywall_skipped / funnel.paywall_viewed) * 100) : 0}% ({funnel.paywall_skipped} skips)
              </span>
            </div>
          </div>

          {/* Stats Tiles Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: Image,
                label: "Photos processed",
                val: stats.photosProcessed,
                unit: "",
                desc: "Total scans executed",
              },
              {
                icon: Zap,
                label: "Median processing time",
                val: stats.medianProcessingMs,
                unit: "ms",
                desc: "Gemini latency response",
              },
              {
                icon: ShoppingBag,
                label: "Garments detected",
                val: stats.itemsDetected,
                unit: "",
                desc: `${stats.itemsPerPhoto} items avg / photo`,
              },
              {
                icon: DollarSign,
                label: "Affiliate links generated",
                val: stats.linksGenerated,
                unit: "",
                desc: "Unique codes in DB",
              },
              {
                icon: Eye,
                label: "Short link clicks",
                val: stats.realClicks,
                unit: "",
                desc: "Aggregated redirects logged",
              },
              {
                icon: Users,
                label: "Creators onboarded",
                val: stats.creatorsOnboarded,
                unit: "",
                desc: "Registered phone records",
              },
            ].map((card, idx) => (
              <div key={idx} className="card-flat bg-card p-4 border border-border rounded-[8px] shadow-hairline flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    {card.label}
                  </span>
                  <card.icon className="h-4 w-4 text-signal shrink-0" />
                </div>
                <div className="mt-3">
                  <span className="metric text-3xl font-bold">
                    {card.val}
                    {card.unit && <span className="text-sm font-normal ml-0.5">{card.unit}</span>}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-1">{card.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Correction Rate banner */}
          <div className="card-flat bg-card p-4 border border-border rounded-[8px] shadow-hairline flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-rupee" />
              <span>Correctness error logs (items deleted/corrected by users):</span>
            </div>
            <span className="metric font-bold text-signal">{stats.correctionRate}%</span>
          </div>

          {/* Integrity Note */}
          <div className="bg-muted/50 border border-border p-4 rounded-[8px] text-xs leading-relaxed text-muted-foreground text-center">
            "We're 6 hours old. These are usage and accuracy numbers from real uploads.
            We have no revenue data — affiliate conversions take days to settle, so any
            revenue figure at this stage would be a guess, and we'd rather show you what
            we can prove."
          </div>

          {/* Recent Activity Table */}
          <div className="card-flat bg-card p-5 border border-border rounded-[8px] shadow-hairline">
            <h2 className="text-md font-semibold mb-4">Recent Upload Timeline</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-medium">
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2 text-right">Items</th>
                    <th className="pb-2 text-right">Processing</th>
                    <th className="pb-2 text-right">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No uploads recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recent.map((rec) => (
                      <tr key={rec.id} className="hover:bg-muted/10">
                        <td className="py-2.5 metric text-[11px] text-muted-foreground">
                          {new Date(rec.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 text-right metric font-bold">{rec.items_count}</td>
                        <td className="py-2.5 text-right metric">
                          {rec.processing_ms ? `${rec.processing_ms}ms` : "-"}
                        </td>
                        <td className="py-2.5 text-right metric font-bold text-rupee">
                          {rec.links_count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/app" className="text-xs font-semibold text-signal underline">
          Continue to workspace
        </Link>
      </div>
    </main>
  );
}
