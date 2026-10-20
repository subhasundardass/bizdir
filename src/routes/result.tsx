import Footer from '@/client-app/components/Footer';
import { parseSearchFilters } from '@/client-app/shared/searchFilters';
import { SearchResult } from '@/client-app/pages/result';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/result')({
  validateSearch: (search: Record<string, unknown>) => ({
    ...parseSearchFilters(search),
    query: typeof search.query === 'string' ? search.query.slice(0, 300) : '',
    location: typeof search.location === 'string' ? search.location.slice(0, 200) : '',
    locationId:
      Number.isSafeInteger(Number(search.locationId)) && Number(search.locationId) > 0
        ? Number(search.locationId)
        : undefined,
    page:
      Number.isSafeInteger(Number(search.page)) && Number(search.page) > 0 ? Number(search.page) : 1
  }),
  component: () => (
    <>
      <SearchResult />
      <Footer />
    </>
  )
});
