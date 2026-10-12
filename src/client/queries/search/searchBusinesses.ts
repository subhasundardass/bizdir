import { queryOptions } from "@tanstack/react-query";
import { searchBusinessesFn } from "@/server/functions/searchBusinessesFn";

export type SearchBusinessesParams = {
  query: string;
  location?: string;
  locationId?: number;
  userLocation?: { lat: number; lng: number };
  page?: number;
  perPage?: number;
};

export function searchBusinessesQuery({
  query,
  location,
  locationId,
  userLocation,
  page = 1,
  perPage = 20,
}: SearchBusinessesParams) {
  return queryOptions({
    queryKey: [
      "search-businesses",
      query,
      location,
      locationId,
      userLocation?.lat,
      userLocation?.lng,
      page,
      perPage,
    ],

    queryFn: () =>
      searchBusinessesFn({
        data: {
          query,
          location,
          locationId,
          userLocation,
          page,
          perPage,
        },
      }),

    enabled: query.trim().length >= 2,
  });
}
