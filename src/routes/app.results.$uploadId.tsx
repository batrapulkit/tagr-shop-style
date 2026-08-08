import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Copy, Check, Trash2, Edit2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredPhone, logFunnel } from "@/lib/funnel";
import { toast } from "sonner";

export const Route = createFileRoute("/app/results/$uploadId")({
  head: () => ({
    meta: [
      { title: "Lookbook matches — TagLoop" },
      { name: "description", content: "View clothing detection tags and copy Indian affiliate links." },
    ],
  }),
  component: ResultsPage,
});

interface DetectedItem {
  id: string;
  category: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  pattern: string | null;
  material_guess: string | null;
  fit_or_style: string | null;
  gender_presentation: string | null;
  search_query: string;
  confidence: number | null;
}

interface AffiliateLink {
  id: string;
  detected_item_id: string | null;
  original_url: string;
  short_code: string;
}

interface CommissionRate {
  category: string;
  rate_percent: number;
}

function ResultsPage() {
  const { uploadId } = Route.useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [items, setItems] = useState<DetectedItem[]>([]);
  const [links, setLinks] = useState<Record<string, AffiliateLink>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Fetch upload record
        const { data: upload, error: uploadErr } = await supabase
          .from("uploads")
          .select("*")
          .eq("id", uploadId)
          .maybeSingle();

        if (uploadErr || !upload) {
          toast.error("Upload record not found.");
          void navigate({ to: "/app" });
          return;
        }

        // Get public URL
        const { data: linkData } = supabase.storage
          .from("uploads")
          .getPublicUrl(upload.storage_path);
        setImageUrl(linkData.publicUrl);

        // 2. Fetch detected items
        const { data: dbItems, error: itemsErr } = await supabase
          .from("detected_items")
          .select("*")
          .eq("upload_id", uploadId);

        if (itemsErr) throw itemsErr;
        setItems(dbItems || []);

        // 3. Fetch affiliate links
        if (dbItems && dbItems.length > 0) {
          const itemIds = dbItems.map((it) => it.id);
          const { data: dbLinks, error: linksErr } = await supabase
            .from("affiliate_links")
            .select("*")
            .in("detected_item_id", itemIds);

          if (linksErr) throw linksErr;
          
          const linksMap: Record<string, AffiliateLink> = {};
          dbLinks?.forEach((lnk) => {
            if (lnk.detected_item_id) {
              linksMap[lnk.detected_item_id] = lnk;
            }
          });
          setLinks(linksMap);
        }

        // 4. Fetch commission rates
        const { data: dbRates } = await supabase
          .from("commission_rates")
          .select("category, rate_percent");
        
        const ratesMap: Record<string, number> = {};
        dbRates?.forEach((r) => {
          ratesMap[r.category] = Number(r.rate_percent);
        });
        setRates(ratesMap);

      } catch (err) {
        console.error(err);
        toast.error("Error loading results data.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [uploadId, navigate]);

  async function handleCopy(code: string) {
    const shortUrl = `${window.location.origin}/r/${code}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(code);
      toast.success("Affiliate short URL copied!");
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      toast.error("Failed to copy link.");
    }
  }

  async function handleDelete(itemId: string) {
    if (deletingId) return;
    setDeletingId(itemId);
    try {
      // Log correction event
      await logFunnel("landing_view", {
        action: "item_deleted",
        item_id: itemId,
        upload_id: uploadId,
      });

      const { error } = await supabase.from("detected_items").delete().eq("id", itemId);
      if (error) throw error;

      setItems((prev) => prev.filter((it) => it.id !== itemId));
      toast.success("Garment deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete item.");
    } finally {
      setDeletingId(null);
    }
  }



  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-signal mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Retrieving lookbook annotations...</p>
        </div>
      </div>
    );
  }

  const categoryTargets: Record<string, { x: number; y: number }> = {
    top: { x: 50, y: 38 },
    outerwear: { x: 50, y: 45 },
    dress: { x: 50, y: 55 },
    bottom: { x: 50, y: 72 },
    footwear: { x: 50, y: 88 },
    bag: { x: 42, y: 62 },
    watch: { x: 38, y: 55 },
    jewellery: { x: 50, y: 30 },
    eyewear: { x: 52, y: 22 },
    headwear: { x: 50, y: 15 },
    other: { x: 50, y: 50 },
  };

  const tagPlacements = items.map((item, index) => {
    const isLeft = index % 2 === 0;
    // Spacing out vertically: e.g. 15%, 50%, 85%
    const verticalIndex = Math.floor(index / 2);
    const verticalSpacing = 15 + verticalIndex * 35;
    
    const top = `${verticalSpacing}%`;
    const left = isLeft ? "4%" : "auto";
    const right = isLeft ? "auto" : "4%";

    // Parse box_2d boundary points if they exist
    let targetX = 50;
    let targetY = 50;
    let hasCustomCoordinates = false;

    let boxLeft = 0;
    let boxTop = 0;
    let boxWidth = 0;
    let boxHeight = 0;
    let hasBox = false;

    if (item.fit_or_style && item.fit_or_style.includes("|box:")) {
      const parts = item.fit_or_style.split("|box:");
      const coords = parts[1]?.split(",");
      if (coords && coords.length === 4) {
        const ymin = parseInt(coords[0] || "");
        const xmin = parseInt(coords[1] || "");
        const ymax = parseInt(coords[2] || "");
        const xmax = parseInt(coords[3] || "");
        if (!isNaN(ymin) && !isNaN(xmin) && !isNaN(ymax) && !isNaN(xmax)) {
          boxTop = ymin;
          boxLeft = xmin;
          boxWidth = xmax - xmin;
          boxHeight = ymax - ymin;
          targetX = xmin + boxWidth / 2;
          targetY = ymin + boxHeight / 2;
          hasBox = true;
          hasCustomCoordinates = true;
        }
      }
    }

    if (!hasCustomCoordinates) {
      if (item.fit_or_style && item.fit_or_style.includes("|coords:")) {
        const parts = item.fit_or_style.split("|coords:");
        const coordParts = parts[1]?.split(",");
        if (coordParts && coordParts.length === 2) {
          const cx = parseInt(coordParts[0] || "");
          const cy = parseInt(coordParts[1] || "");
          if (!isNaN(cx) && !isNaN(cy)) {
            targetX = cx;
            targetY = cy;
            hasCustomCoordinates = true;
          }
        }
      }
    }

    if (!hasCustomCoordinates) {
      const cat = item.category?.toLowerCase() || "other";
      const target = categoryTargets[cat] || categoryTargets["other"] || { x: 50, y: 50 };
      // Spread targets slightly by index to prevent overlaps
      targetX = target.x + (index % 2 === 0 ? -6 : 6);
      targetY = target.y + Math.floor(index / 2) * 4;
    }

    const x1 = isLeft ? 4 : 96;
    const y1 = verticalSpacing;
    const x2 = targetX;
    const y2 = targetY;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return {
      itemId: item.id,
      name: item.name,
      top,
      left,
      right,
      isLeft,
      lineLength: `${dist}%`,
      lineAngle: `${angle}deg`,
      lineTop: `${y1}%`,
      lineLeft: `${x1}%`,
      // Bounding box geometries
      boxTop: `${boxTop}%`,
      boxLeft: `${boxLeft}%`,
      boxWidth: `${boxWidth}%`,
      boxHeight: `${boxHeight}%`,
      hasBox,
    };
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6 sm:max-w-xl">
      <div className="flex items-center justify-between">
        <Link to="/app" className="-ml-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
          <span>Workspace</span>
        </Link>
        <span className="font-display text-sm font-bold tracking-[-0.02em]">TagLoop</span>
      </div>

      <h1 className="mt-6 text-2xl leading-none">Cataloged Outfit</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hover details or click bounding boxes to copy affiliate links instantly.
      </p>

      {/* Lookbook image container with tag positioning overlays */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink rounded-[8px] border border-ink shadow-md mt-6">
        <img
          src={imageUrl}
          alt="Outfit analysed by TagLoop"
          className="h-full w-full object-cover opacity-90"
        />

        {/* Bounding Boxes Overlays (Renders behind the line connections/chips) */}
        {tagPlacements.map((tag) => {
          if (!tag.hasBox) return null;
          const isActive = activeTagId === tag.itemId;
          const link = links[tag.itemId];

          return (
            <div
              key={`box-${tag.itemId}`}
              className="absolute border-2 rounded transition-all duration-300 cursor-pointer"
              style={{
                top: tag.boxTop,
                left: tag.boxLeft,
                width: tag.boxWidth,
                height: tag.boxHeight,
                borderColor: isActive ? "var(--signal)" : "rgba(229, 23, 91, 0.4)",
                backgroundColor: isActive ? "rgba(229, 23, 91, 0.15)" : "rgba(229, 23, 91, 0.05)",
                boxShadow: isActive ? "0 0 12px rgba(229, 23, 91, 0.5)" : "none",
                zIndex: isActive ? 10 : 1,
              }}
              onMouseEnter={() => setActiveTagId(tag.itemId)}
              onMouseLeave={() => setActiveTagId(null)}
              onClick={() => {
                if (link?.short_code) {
                  handleCopy(link.short_code);
                }
              }}
              title="Click to copy affiliate search match link"
            />
          );
        })}

        {/* Dynamic overlay lookbook tags and leader lines */}
        {tagPlacements.map((tag) => {
          const isActive = activeTagId === tag.itemId;
          const link = links[tag.itemId];

          return (
            <div key={tag.itemId}>
              {/* The Hairline Leader Line */}
              <div
                className="leader-line transition-opacity duration-300"
                style={{
                  top: tag.lineTop,
                  left: tag.lineLeft,
                  width: tag.lineLength,
                  transform: `rotate(${tag.lineAngle})`,
                  opacity: isActive ? 0.9 : 0.45,
                  backgroundColor: isActive ? "var(--signal)" : "var(--ink)",
                }}
              />

              {/* The Floating Tag Chip */}
              <div
                className="tag-chip transition-all duration-300 cursor-pointer select-none"
                style={{
                  top: tag.top,
                  left: tag.left,
                  right: tag.right,
                  borderColor: isActive ? "var(--signal)" : "var(--ink)",
                  transform: isActive ? "scale(1.05)" : "none",
                  boxShadow: isActive ? "0 4px 12px rgba(18, 22, 31, 0.15)" : "0 1px 2px rgba(18, 22, 31, 0.06)",
                }}
                onMouseEnter={() => setActiveTagId(tag.itemId)}
                onMouseLeave={() => setActiveTagId(null)}
                onClick={() => {
                  if (link?.short_code) {
                    handleCopy(link.short_code);
                  }
                }}
              >
                <span className="tag-chip__dot" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{tag.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg">Detected Clothing Items ({items.length})</h2>

        {items.length === 0 ? (
          <div className="rounded-[8px] border border-border bg-card p-6 text-center shadow-hairline">
            <p className="text-sm text-muted-foreground">
              No worn items found in this photo. Try one where the outfit is clearly visible.
            </p>
            <Link to="/app" className="mt-4 inline-block text-xs font-semibold text-signal underline">
              Back to uploader
            </Link>
          </div>
        ) : (
          items.map((item) => {
            const hasLink = !!links[item.id];
            const link = links[item.id];
            const isCopying = copiedCode === link?.short_code;

            return (
              <div
                key={item.id}
                className="card-flat flex flex-col p-4 transition-shadow hover:shadow-[0_2px_4px_rgba(18,22,31,0.08)] bg-card border border-border rounded-[8px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{
                        backgroundColor: item.primary_color || "#cccccc",
                      }}
                      title={item.primary_color || "Color unknown"}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold capitalize leading-none">{item.name}</span>
                      <span className="text-[0.7rem] text-muted-foreground mt-1 capitalize">
                        {(() => {
                          const cleanFit = (item.fit_or_style || "").split("|box:")[0]?.split("|coords:")[0];
                          return cleanFit || "Standard";
                        })()} · {item.material_guess || "Fabric"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-muted-foreground hover:text-signal p-1 transition-colors"
                      title="Discard item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                      Search matches
                    </span>
                    <div className="flex items-center gap-1 mt-1 group">
                      <span className="text-xs text-foreground break-words">
                        "{item.search_query}"
                      </span>
                    </div>
                  </div>

                  {hasLink && link && (
                    <button
                      onClick={() => handleCopy(link.short_code)}
                      className={`flex h-9 items-center gap-1.5 rounded-[6px] px-3.5 text-xs font-semibold transition-all ${
                        isCopying
                           ? "bg-rupee text-white"
                           : "bg-signal text-white hover:opacity-95"
                      }`}
                    >
                      {isCopying ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-3 bg-rupee/5 border border-rupee/10 p-2.5 rounded-[6px] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-rupee">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      Est. commission: <strong className="money font-bold">Up to 10%</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-10 border-t border-border pt-6 flex items-center justify-between">
        <Link to="/app" className="text-xs font-semibold text-signal underline">
          Scan another Look
        </Link>
        <Link to="/metrics" className="text-xs text-muted-foreground underline">
          View public dashboard metrics
        </Link>
      </div>
    </main>
  );
}
