import { queryOptions } from "@tanstack/react-query";
import { searchBusinessesFn } from "@/server/functions/searchBusinessesFn";

export type SearchBusinessesParams = {
  query: string;
  page?: number;
  perPage?: number;
};

export function searchBusinessesQuery({
  query,
  page = 1,
  perPage = 20,
}: SearchBusinessesParams) {
  return queryOptions({
    queryKey: ["search-businesses", query, page, perPage],

    queryFn: () =>
      searchBusinessesFn({
        data: {
          query,
          page,
          perPage,
        },
      }),

    enabled: query.trim().length >= 2,
  });
}
