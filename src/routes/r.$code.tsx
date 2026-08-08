import { createFileRoute, redirect } from "@tanstack/react-router";
import { processRedirectFn } from "@/lib/server-functions";

export const Route = createFileRoute("/r/$code")({
  loader: async ({ params }) => {
    const code = params.code;

    // Call the server function to log click and fetch original URL
    const res = await processRedirectFn({ data: { code } });

    // Execute standard 302 redirection (defaults to homepage if code is not resolved)
    throw redirect({ href: res.targetUrl || "/" });
  },
  component: RedirectSpinner,
});

function RedirectSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="text-center">
        <span className="metric text-[10px] uppercase tracking-wider text-muted-foreground">TagLoop</span>
        <h1 className="mt-2 text-xs font-semibold text-foreground">Redirecting to Amazon India...</h1>
      </div>
    </div>
  );
}
