import { SearchResult } from "#/pages/result";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/result")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SearchResult />;
}
