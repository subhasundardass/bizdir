import { queryOptions } from '@tanstack/react-query';
import {
  searchBusinessesFn,
  type SearchBusinessesInput
} from '@/client-app/server/functions/searchBusinessesFn';
export type SearchBusinessesParams = SearchBusinessesInput;
export function searchBusinessesQuery(params: SearchBusinessesParams) {
  return queryOptions({
    queryKey: ['search-businesses', params],
    queryFn: () => searchBusinessesFn({ data: params }),
    enabled:
      params.query.trim().length >= 2 &&
      (!(params.distance || params.sort === 'distance') || Boolean(params.userLocation))
  });
}
