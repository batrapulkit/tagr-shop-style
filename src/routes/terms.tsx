import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — TagLoop" },
      { name: "description", content: "The terms that apply when you use TagLoop to scan your content." },
      { property: "og:title", content: "Terms and Conditions — TagLoop" },
      { property: "og:description", content: "The terms that apply when you use TagLoop." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <h1 className="text-2xl">Terms and Conditions</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        TagLoop is a beta product. You upload content you own, and you ask us to scan it for
        shoppable items. We never scrape your accounts. Affiliate links are generated against the
        Amazon India Associates programme and earnings are subject to their terms.
      </p>
      <Link to="/signup" className="mt-6 inline-block text-sm font-semibold text-signal">
        Back to signup
      </Link>
    </main>
  );
}
