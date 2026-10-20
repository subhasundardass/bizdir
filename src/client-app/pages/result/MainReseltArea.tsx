import { CircleCheck, Clock, Heart, MapPin } from 'lucide-react';
import { Button } from '@/client-app/components/ui/button';
import { Filters, type FilterProps } from './Filters';
import { categoryOptions } from '@/client-app/shared/searchFilters';
type SearchBusinessResult = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  cityId: number | null;
  localityId: number | null;
  rating: number | null;
  reviewCount: number | null;
  openNow?: boolean;
  distanceKm?: number | null;
};

type SearchResponse = {
  businesses: SearchBusinessResult[];
  total: number;
  page: number;
  perPage: number;
};

type MainResultAreaProps = FilterProps & {
  mobileFiltersOpen: boolean;
  data: SearchResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

export function MainResultArea({
  data,
  isLoading,
  isError,
  error,
  filters,
  onChange,
  hasLocation,
  requestLocation,
  mobileFiltersOpen
}: MainResultAreaProps) {
  const businesses = data?.businesses ?? [];

  return (
    <section className='mx-auto max-w-360 px-4 py-5 sm:px-6 lg:px-8'>
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-[235px_minmax(0,1fr)]'>
        {/* ===================================================== */}
        {/* FILTER SIDEBAR */}
        {/* ===================================================== */}
        <aside className={mobileFiltersOpen ? 'block' : 'hidden lg:block'}>
          <div className='sticky top-21'>
            <Filters
              filters={filters}
              onChange={onChange}
              hasLocation={hasLocation}
              requestLocation={requestLocation}
            />
          </div>
        </aside>
        {/* ===================================================== */}
        {/* RESULTS */}
        {/* ===================================================== */}
        <div className='min-w-0'>
          <div className='mb-4 flex flex-wrap gap-2'>
            {[
              ...categoryOptions
                .filter((option) => filters.categories.includes(option.value))
                .map((option) => ({
                  label: option.label,
                  remove: () =>
                    onChange({
                      categories: filters.categories.filter((value) => value !== option.value)
                    })
                })),
              ...(filters.pureVeg
                ? [
                    {
                      label: 'Pure Veg',
                      remove: () => onChange({ pureVeg: false })
                    }
                  ]
                : []),
              ...(filters.openNow
                ? [
                    {
                      label: 'Open Now',
                      remove: () => onChange({ openNow: false })
                    }
                  ]
                : []),
              ...(filters.minRating
                ? [
                    {
                      label: `${filters.minRating.toFixed(1)}+ Rating`,
                      remove: () => onChange({ minRating: undefined })
                    }
                  ]
                : []),
              ...(filters.distance
                ? [
                    {
                      label: `Within ${filters.distance} km`,
                      remove: () => onChange({ distance: undefined })
                    }
                  ]
                : [])
            ].map((chip) => (
              <Button
                variant='unstyled'
                size='unstyled'
                key={chip.label}
                onClick={chip.remove}
                aria-label={`Remove ${chip.label} filter`}
                className='rounded-full border border-jd-border bg-jd-light px-3 py-1.5 text-xs text-jd-orange'
              >
                {chip.label} ×
              </Button>
            ))}
          </div>
          {businesses.map((business) => (
            <article
              key={business.id}
              className='group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange'
            >
              <div className='flex flex-col sm:flex-row'>
                {/* Image */}
                <div className='relative h-48 shrink-0 overflow-hidden sm:h-auto sm:w-87.5'>
                  <img
                    src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80'
                    alt={business.name}
                    className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                  />

                  <span className='absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold text-jd-orange shadow-sm backdrop-blur'>
                    FEATURED
                  </span>

                  <Button
                    variant='unstyled'
                    size='unstyled'
                    type='button'
                    aria-label={`Save ${business.name}`}
                    className='absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition-all duration-200 hover:text-jd-orange'
                  >
                    <Heart className='h-3.5 w-3.5' />
                  </Button>
                </div>

                {/* Content */}
                <div className='min-w-0 flex-1 p-4 sm:p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h2 className='flex min-w-0 items-center gap-1.5 text-lg font-bold tracking-tight text-ink sm:text-xl'>
                          <span className='truncate'>{business.name}</span>

                          <CircleCheck
                            className='h-4 w-4 shrink-0 fill-blue-500 text-white sm:h-5 sm:w-5'
                            aria-label='Verified'
                          />
                        </h2>
                      </div>

                      <p className='mt-1 text-[11px] font-semibold uppercase tracking-wide text-jd-orange'>
                        North Indian Restaurant
                      </p>
                    </div>

                    {business.rating != null && (
                      <div className='flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white'>
                        {business.rating.toFixed(1)}
                        <i className='fa-solid fa-star text-[9px]' />
                      </div>
                    )}
                  </div>

                  <div className='mt-3 space-y-1'>
                    <p className='flex items-start gap-2 text-xs leading-5'>
                      <MapPin className='mt-0.5 h-3 w-3 shrink-0 text-jd-orange' />
                      {business.address ?? 'Address not available'}
                    </p>

                    <p className='flex items-center gap-2 text-xs'>
                      <Clock className='h-3 w-3 shrink-0 text-jd-orange' />
                      <span
                        className={
                          business.openNow ? 'font-semibold text-success' : 'text-gray-500'
                        }
                      >
                        {business.openNow ? 'Open Now' : 'Closed or hours unavailable'}
                      </span>
                    </p>
                  </div>

                  <div className='mt-4 flex flex-wrap items-center gap-2'>
                    <span className='rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold '>
                      ₹₹
                    </span>
                    <span className='rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold '>
                      {business.reviewCount ?? 0} Reviews
                    </span>
                    {business.distanceKm != null && (
                      <span className='rounded-full bg-jd-light px-3 py-1.5 text-[10px] font-semibold text-jd-orange'>
                        {business.distanceKm < 1
                          ? `${Math.round(business.distanceKm * 1000)} m`
                          : `${business.distanceKm.toFixed(1)} km`}{' '}
                        away
                      </span>
                    )}
                  </div>

                  <div className='mt-4 flex items-center justify-between gap-3 border-t border-jd-line pt-4'>
                    <span className='flex items-center gap-2 text-xs font-bold text-ink'>
                      <i className='fa-solid fa-location-dot text-jd-orange' />
                      +91 98989 98989
                    </span>

                    <a
                      href={`/business/${business.slug}`}
                      className='shrink-0 rounded-full bg-jd-orange px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-jd-hover'
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {isLoading && (
            <p role='status' className='p-6 text-center text-sm text-gray-500'>
              Loading businesses…
            </p>
          )}
          {isError && (
            <p role='alert' className='p-6 text-center text-sm text-red-600'>
              {error?.message ?? 'Unable to load businesses.'}
            </p>
          )}
          {/* Empty state */}
          {!isLoading && !isError && businesses.length === 0 && (
            <p className='rounded-2xl border border-jd-line bg-white p-6 text-center text-sm text-gray-500'>
              No businesses found.
            </p>
          )}

          {/* Result Card 5 */}
          <article className='group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange'>
            <div className='flex flex-col sm:flex-row'></div>
          </article>
        </div>
      </div>
    </section>
  );
}
