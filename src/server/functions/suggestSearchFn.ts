import { createServerFn } from "@tanstack/react-start";
import { searchService } from "@/server/search/searchService";

export const suggestSearchFn = createServerFn({ method: "GET" })
  .validator((input: { query: string; type: "concept" | "location" }) => {
    if (
      !input ||
      typeof input.query !== "string" ||
      input.query.length > 200 ||
      !["concept", "location"].includes(input.type)
    ) {
      throw new Error("Invalid suggestion input");
    }
    return input;
  })
  .handler(async ({ data }) => searchService.suggestSearch(data));
