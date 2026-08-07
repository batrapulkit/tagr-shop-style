import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Your workspace — TagLoop" },
      { name: "description", content: "Upload a photo and TagLoop will find the shoppable items in it." },
      { property: "og:title", content: "Your workspace — TagLoop" },
      { property: "og:description", content: "Upload a photo and get affiliate links back." },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10 text-center">
      <h1 className="text-2xl">You're in.</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The uploader and item detection land in the next build. Your account is saved.
      </p>
    </main>
  );
}
