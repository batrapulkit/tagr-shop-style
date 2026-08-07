import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TagLoop" },
      { name: "description", content: "What TagLoop stores about you and why." },
      { property: "og:title", content: "Privacy Policy — TagLoop" },
      { property: "og:description", content: "What TagLoop stores about you and why." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <h1 className="text-2xl">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        We store your phone number, the photos you choose to upload, and anonymous product-usage
        events so we can measure how the product performs. We do not sell your data, and we only
        scan content you explicitly upload and consent to.
      </p>
      <Link to="/signup" className="mt-6 inline-block text-sm font-semibold text-signal">
        Back to signup
      </Link>
    </main>
  );
}
