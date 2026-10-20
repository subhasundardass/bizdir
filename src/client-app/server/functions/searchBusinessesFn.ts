import { createServerFn } from '@tanstack/react-start';
import { searchService } from '@/client-app/server/search/searchService';

import type { SearchFilters } from '@/client-app/shared/searchFilters';

export type SearchBusinessesInput = Partial<SearchFilters> & {
  query: string;
  location?: string;
  locationId?: number;
  userLocation?: { lat: number; lng: number };
  page?: number;
  perPage?: number;
};

export const searchBusinessesFn = createServerFn({ method: 'GET' })
  .inputValidator((input: SearchBusinessesInput) => input)
  .handler(async ({ data }) => searchService.executeSearch(data));
