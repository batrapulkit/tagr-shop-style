import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { logFunnel } from "@/lib/funnel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TagLoop — Turn your reels into affiliate income" },
      {
        name: "description",
        content:
          "Upload one photo. TagLoop spots what you're wearing and hands you Amazon India affiliate links to paste in your bio.",
      },
      { property: "og:title", content: "TagLoop — Turn your reels into affiliate income" },
      {
        property: "og:description",
        content:
          "Upload one photo. TagLoop spots what you're wearing and hands you affiliate links to paste.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  { n: "01", title: "Upload a photo", body: "A still from any reel you already posted." },
  { n: "02", title: "We spot what you're wearing", body: "Every garment, bag and accessory, catalogued." },
  { n: "03", title: "You get affiliate links", body: "Paste them in your bio or story sticker." },
];

function Landing() {
  useEffect(() => {
    void logFunnel("landing_view");
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-8 sm:max-w-xl">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-signal" />
        <span className="font-display text-sm font-bold tracking-[-0.02em]">TagLoop</span>
      </div>

      <h1 className="mt-10 text-[2.1rem] leading-[1.05] sm:text-5xl">
        Your last 40 reels had <span className="money text-[0.95em]">₹0</span> attached to them.
        Fix that in one upload.
      </h1>

      <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
        TagLoop finds the shoppable products already in your photos and turns them into
        affiliate links — no brand deal required.
      </p>

      <ol className="mt-8 space-y-px overflow-hidden rounded-[8px] border border-border bg-card shadow-[0_1px_2px_rgba(18,22,31,0.06)]">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4 border-b border-border p-4 last:border-b-0">
            <span className="metric pt-0.5 text-xs text-signal">{s.n}</span>
            <div>
              <p className="font-display text-[0.95rem] font-bold tracking-[-0.02em]">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        to="/signup"
        className="mt-8 flex h-13 w-full items-center justify-center rounded-[8px] bg-signal px-4 py-4 text-[0.95rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Start free
      </Link>

      <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        Free while we're in beta. Works with Amazon India Associates.
      </p>
    </main>
  );
}
