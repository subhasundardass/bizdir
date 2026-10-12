import { createServerFn } from "@tanstack/react-start";
import { searchService } from "@/server/search/searchService";

export type SearchBusinessesInput = {
  query: string;
  location?: string;
  locationId?: number;
  userLocation?: { lat: number; lng: number };
  page?: number;
  perPage?: number;
};

export const searchBusinessesFn = createServerFn({ method: "GET" })
  .validator((input: SearchBusinessesInput) => input)
  .handler(async ({ data }) => searchService.executeSearch(data));
