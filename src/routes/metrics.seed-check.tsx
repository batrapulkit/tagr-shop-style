import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, ShieldAlert, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/metrics/seed-check")({
  head: () => ({
    meta: [
      { title: "Team seed verification — TagLoop" },
      { name: "description", content: "Displays team test registration records." },
    ],
  }),
  component: SeedCheckPage,
});

interface CreatorRecord {
  id: string;
  phone: string;
  instagram_handle: string | null;
  created_at: string;
  consent_given: boolean;
}

function SeedCheckPage() {
  const [creators, setCreators] = useState<CreatorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCreators() {
      try {
        const { data } = await supabase
          .from("creators")
          .select("*")
          .order("created_at", { ascending: false });
        
        setCreators(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    void loadCreators();
  }, []);

  // Returns true if phone number starts with 999 or matches mock indicators
  const isSeedRecord = (phone: string, handle?: string | null) => {
    const raw = phone.trim();
    if (raw.startsWith("999") || raw.startsWith("123") || raw.includes("00000")) return true;
    if (handle && (handle.toLowerCase().includes("test") || handle.toLowerCase().includes("mock"))) return true;
    return false;
  };

  const seedRecords = creators.filter((c) => isSeedRecord(c.phone, c.instagram_handle));
  const realRecords = creators.filter((c) => !isSeedRecord(c.phone, c.instagram_handle));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6 sm:max-w-xl bg-paper">
      <Link to="/metrics" className="-ml-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        <span>Metrics dashboard</span>
      </Link>

      <h1 className="text-2xl mt-4 leading-none flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-signal" />
        <span>Team Seed Check</span>
      </h1>
      <p className="mt-2 text-xs leading-normal text-muted-foreground">
        Verify flagged developer records and test registrations. Accounts with phone prefixes starting with <strong className="metric">999</strong>, <strong className="metric">123</strong> or <strong className="metric">00000</strong> are labeled as seed accounts and isolated.
      </p>

      {loading ? (
        <p className="mt-8 text-center text-xs text-muted-foreground font-mono">Loading records...</p>
      ) : (
        <div className="mt-6 space-y-6">
          
          {/* Seed indicator split overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-flat bg-card p-4 border border-border rounded-[8px] flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Flagged seed</span>
              <span className="metric text-3xl font-bold mt-1 text-signal">{seedRecords.length}</span>
            </div>
            <div className="card-flat bg-card p-4 border border-border rounded-[8px] flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Real Creators</span>
              <span className="metric text-3xl font-bold mt-1 text-rupee">{realRecords.length}</span>
            </div>
          </div>

          <div className="card-flat bg-card p-4 border border-border rounded-[8px]">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-signal" />
              <span>Flagged seed accounts ({seedRecords.length})</span>
            </h2>

            {seedRecords.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 font-mono">No simulation accounts detected.</p>
            ) : (
              <div className="space-y-3.5 divide-y divide-border/40">
                {seedRecords.map((c) => (
                  <div key={c.id} className="pt-2 flex justify-between items-start text-xs">
                    <div>
                      <span className="metric font-bold text-foreground block">+91 {c.phone}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Insta: @{c.instagram_handle || "none"} (ID: {c.id.substring(0, 8)}...)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="bg-signal/15 text-signal text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                        Seed Flag
                      </span>
                      <span className="metric text-[9px] text-muted-foreground block mt-1">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-flat bg-card p-4 border border-border rounded-[8px]">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-rupee" />
              <span>Active Real Creators ({realRecords.length})</span>
            </h2>

            {realRecords.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 font-mono">No real production registrations yet.</p>
            ) : (
              <div className="space-y-3.5 divide-y divide-border/40">
                {realRecords.map((c) => (
                  <div key={c.id} className="pt-2 flex justify-between items-start text-xs">
                    <div>
                      <span className="metric font-bold text-foreground block">+91 {c.phone}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Insta: @{c.instagram_handle || "none"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="bg-rupee/10 text-rupee text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                        Production
                      </span>
                      <span className="metric text-[9px] text-muted-foreground block mt-1">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </main>
  );
}
