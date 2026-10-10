import { createServerFn } from "@tanstack/react-start";
import { searchService } from "@/server/search/searchService";

export type SearchBusinessesInput = {
  query: string;
  page?: number;
  perPage?: number;
};

function validateSearchBusinessesInput(input: unknown): SearchBusinessesInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid search input");
  }

  const value = input as Record<string, unknown>;

  if (typeof value.query !== "string") {
    throw new Error("Search query must be a string");
  }

  const query = value.query.trim();

  if (query.length < 2) {
    throw new Error("Search query must contain at least 2 characters");
  }

  if (query.length > 300) {
    throw new Error("Search query must not exceed 300 characters");
  }

  const page =
    value.page === undefined
      ? 1
      : typeof value.page === "number" &&
          Number.isInteger(value.page) &&
          value.page > 0
        ? value.page
        : (() => {
            throw new Error("Page must be a positive integer");
          })();

  const perPage =
    value.perPage === undefined
      ? 20
      : typeof value.perPage === "number" &&
          Number.isInteger(value.perPage) &&
          value.perPage > 0 &&
          value.perPage <= 100
        ? value.perPage
        : (() => {
            throw new Error("perPage must be between 1 and 100");
          })();

  return {
    query,
    page,
    perPage,
  };
}

export const searchBusinessesFn = createServerFn({
  method: "GET",
})
  .validator(validateSearchBusinessesInput)
  .handler(async ({ data }) => {
    const result = await searchService.executeSearch(data);

    return result;
  });
