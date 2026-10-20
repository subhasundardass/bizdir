import { parseSearchFilters } from '@/client-app/shared/searchFilters';
import { useState } from 'react';
import type { SearchFilters } from '@/client-app/shared/searchFilters';
import { useSearchLocation } from '@/client-app/client/hooks/useSearchLocation';
import { useQuery } from '@tanstack/react-query';
import { Route } from '@/routes/result';
import { searchBusinessesQuery } from '@/client-app/client/queries/search/searchBusinesses';
import type { SearchValues } from '@/client-app/components/BusinessSearchForm';
import { BreadCrumb } from './Breadcrumb';
import { ResultHeader } from './ResultHeader';
import { MobileFilterBar } from './MobileFilterBar';
import { Header } from './Header';
import { MainResultArea } from './MainReseltArea';

export function SearchResult() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const values = Route.useSearch();
  const navigate = Route.useNavigate();
  const userLocation = useSearchLocation();
  const search = useQuery(
    searchBusinessesQuery({
      ...values,
      perPage: 20,
      userLocation: userLocation.coordinates
    })
  );
  function handleSearch(next: SearchValues) {
    void navigate({
      search: {
        ...parseSearchFilters({}),
        ...next,
        locationId: next.locationId,
        page: 1
      }
    });
  }
  function handleFilters(patch: Partial<SearchFilters>) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch, page: 1 })
    });
  }
  const filterProps = {
    filters: values,
    onChange: handleFilters,
    hasLocation: Boolean(userLocation.coordinates),
    requestLocation: userLocation.requestLocation
  };
  const total = search.data?.total ?? 0;
  return (
    <>
      <Header values={values} onSearch={handleSearch} isFetching={search.isFetching} />
      <BreadCrumb query={values.query} location={search.data?.location?.name ?? values.location} />
      <main className='pb-8'>
        <ResultHeader
          query={values.query}
          location={search.data?.location?.name ?? values.location}
          total={search.data?.total}
          {...filterProps}
        />
        <MobileFilterBar
          {...filterProps}
          open={mobileFiltersOpen}
          onToggle={() => setMobileFiltersOpen((open) => !open)}
        />
        <div className='mx-auto flex max-w-360 items-center gap-3 px-6 py-2 text-xs text-gray-500'>
          <span role='status'>
            {userLocation.status === 'ready'
              ? `${values.sort === 'auto' || values.sort === 'distance' ? 'Nearest places first · ' : ''}Distances from your current location`
              : userLocation.status === 'loading'
                ? 'Finding your location…'
                : 'Enable location to show nearest places first'}
          </span>
          {userLocation.status === 'unavailable' && (
            <button
              type='button'
              onClick={userLocation.requestLocation}
              className='font-semibold text-jd-orange'
            >
              Use my location
            </button>
          )}
        </div>
        {search.data?.locationUnresolved && (
          <p role='status' className='mx-auto max-w-360 px-6 py-3 text-sm text-jd-orange'>
            We couldn’t find that location. Try another spelling or select a suggested location.
          </p>
        )}
        {(values.distance || values.sort === 'distance') && !userLocation.coordinates && (
          <p role='status' className='mx-auto max-w-360 px-6 py-3 text-sm'>
            Enable your location to apply the selected distance filter or sort.
          </p>
        )}
        <MainResultArea
          {...filterProps}
          mobileFiltersOpen={mobileFiltersOpen}
          data={search.data}
          isLoading={search.isLoading && search.fetchStatus !== 'idle'}
          isError={search.isError}
          error={search.error}
        />
        {total > 20 && (
          <nav aria-label='Search result pages' className='flex items-center justify-center gap-4'>
            <button
              disabled={values.page <= 1 || search.isFetching}
              onClick={() => navigate({ search: { ...values, page: values.page - 1 } })}
            >
              Previous
            </button>
            <span>
              Page {values.page} of {Math.ceil(total / 20)}
            </span>
            <button
              disabled={values.page * 20 >= total || search.isFetching}
              onClick={() => navigate({ search: { ...values, page: values.page + 1 } })}
            >
              Next
            </button>
          </nav>
        )}
      </main>
    </>
  );
}
