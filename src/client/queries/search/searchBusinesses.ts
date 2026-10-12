import { queryOptions } from "@tanstack/react-query";
import { searchBusinessesFn } from "@/server/functions/searchBusinessesFn";

export type SearchBusinessesParams = {
  query: string;
  location?: string;
  locationId?: number;
  page?: number;
  perPage?: number;
};

export function searchBusinessesQuery({
  query,
  location,
  locationId,
  page = 1,
  perPage = 20,
}: SearchBusinessesParams) {
  return queryOptions({
    queryKey: ["search-businesses", query, location, locationId, page, perPage],

    queryFn: () =>
      searchBusinessesFn({
        data: {
          query,
          location,
          locationId,
          page,
          perPage,
        },
      }),

    enabled: query.trim().length >= 2,
  });
}
