import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCreatorId, getStoredPhone, logFunnel } from "@/lib/funnel";
import { detectItemsFn } from "@/lib/server-functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({
  component: AppWorkspace,
});

function AppWorkspace() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Validate session
    const creatorId = getCreatorId();
    if (!creatorId) {
      void navigate({ to: "/signup" });
    }
  }, [navigate]);

  useEffect(() => {
    // Ticking elapsed timer
    if (uploading) {
      const start = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - start);
      }, 31);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [uploading]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (!selected) return;
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Max allowed size is 10MB.");
        return;
      }
      setFile(selected);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !consent || uploading) return;

    setUploading(true);
    setElapsed(0);

    const creatorId = getCreatorId();
    if (!creatorId) {
      toast.error("No active session found.");
      setUploading(false);
      return;
    }

    try {
      // 1. Update creator consent in database
      await supabase
        .from("creators")
        .update({ consent_given: true })
        .eq("id", creatorId);

      // 2. Upload file to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${creatorId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error", uploadError);
        throw new Error(uploadError.message || "Failed to upload file to storage bucket.");
      }

      // 3. Obtain public URL
      const { data: linkData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      const publicUrl = linkData?.publicUrl;

      if (!publicUrl) {
        throw new Error("Could not retrieve public URL for uploaded image.");
      }

      // 4. Create uploads record
      const { data: dbUpload, error: dbUploadError } = await supabase
        .from("uploads")
        .insert({
          creator_id: creatorId,
          storage_path: filePath,
        })
        .select("id")
        .single();

      if (dbUploadError) throw dbUploadError;

      // 5. Trigger Gemini item detection
      const analysis = await detectItemsFn({
        data: {
          uploadId: dbUpload.id,
          imageUrl: publicUrl,
        }
      });

      if (analysis.success) {
        toast.success(`Cataloging complete! Found ${analysis.count} garments.`);
        void navigate({ to: `/app/results/${dbUpload.id}` });
      } else {
        toast.error("Vision detection could not complete successfully.");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error uploading and analyzing outfit.");
    } finally {
      setUploading(false);
    }
  }

  const [phone, setPhone] = useState("creator");

  useEffect(() => {
    setPhone(getStoredPhone() || "creator");
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-8 sm:max-w-xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal" />
          <span className="font-display text-sm font-bold tracking-[-0.02em]">TagLoop</span>
        </div>
        <span className="metric text-xs text-muted-foreground">Logged in: +91 {phone}</span>
      </div>

      {uploading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="metric text-7xl font-bold text-signal tabular-nums">
            {(elapsed / 1000).toFixed(2)}<span className="text-3xl font-medium">s</span>
          </div>
          <h2 className="mt-8 text-xl font-semibold">Gemini is cataloger scouting...</h2>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Analyzing garment cuts, fabrics, colors, and building Amazon India search-matching queries.
          </p>
          <div className="relative mt-8 h-1.5 w-44 overflow-hidden rounded-full bg-muted">
            <div className="absolute top-0 bottom-0 left-0 animate-pulse bg-signal w-[60%]" style={{ animationDuration: "1s" }} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="mt-8 flex flex-1 flex-col">
          <h1 className="text-3xl leading-none">Scout your look</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Drop a frame/photo of your reel outfit. Our AI catalogs the products and finds shoppers matches.
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="group mt-6 flex h-60 cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-card p-6 shadow-[0_1px_2px_rgba(18,22,31,0.06)] hover:border-signal transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-signal/10 text-signal">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm font-semibold truncate max-w-xs">{file.name}</p>
                <p className="metric mt-1 text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                <p className="mt-2 text-xs text-signal underline group-hover:opacity-80">Change photo</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-signal/10 group-hover:text-signal transition-colors">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold">Click or drop look photo</p>
                <p className="text-xs text-muted-foreground">Supports PNG, JPG up to 10MB</p>
              </div>
            )}
          </div>

          <label className="mt-8 flex items-start gap-3 rounded-[8px] border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground shadow-[0_1px_2px_rgba(18,22,31,0.06)]">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--signal)]"
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">Content ownership & scanning consent</span>
              <span>I own this content and I'm asking TagLoop to scan it.</span>
            </div>
          </label>

          <button
            type="submit"
            disabled={!file || !consent || uploading}
            className="mt-auto w-full rounded-[8px] bg-signal px-4 py-4 text-[0.95rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            Start Scan
          </button>
        </form>
      )}

      <p className="mt-8 pt-4 text-center text-xs text-muted-foreground border-t border-border flex items-center justify-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Average scan times: ~1.5 seconds. Powered by Gemini.</span>
      </p>
    </main>
  );
}
