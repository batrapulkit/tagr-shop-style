import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — TagLoop" },
      { name: "description", content: "Upload a photo and TagLoop will find the shoppable items in it." },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  return <Outlet />;
}
