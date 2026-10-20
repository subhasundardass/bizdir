import { parseSearchFilters } from '@/client-app/shared/searchFilters';
import { useNavigate } from '@tanstack/react-router';
import { BusinessSearchForm } from '@/client-app/components/BusinessSearchForm';
import { MapPin } from 'lucide-react';

export function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className='relative bg-linear-to-b from-[#FFF7F0] to-white'>
      <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20'>
        <div className='mx-auto max-w-4xl text-center'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-jd-border bg-white px-3.5 py-1.5 text-xs font-semibold text-jd-orange shadow-sm'>
            <MapPin className='h-3.5 w-3.5' />
            Discover local businesses near you
          </div>

          <h1 className='text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl'>
            Find the best{' '}
            <span className='relative inline-block text-jd-orange'>
              around you
              <span className='absolute -bottom-1 left-0 h-1 w-full rounded-full bg-jd-orange/25' />
            </span>
          </h1>

          <p className='mx-auto mt-5 max-w-2xl text-sm leading-6  sm:text-base'>
            Discover trusted restaurants, salons, doctors, gyms, hotels and thousands of local
            services near you.
          </p>

          {/* Search */}
          <div className='mx-auto mt-8 max-w-4xl'>
            <BusinessSearchForm
              onSearch={(values) =>
                navigate({
                  to: '/result',
                  search: {
                    ...parseSearchFilters({}),
                    ...values,
                    locationId: values.locationId,
                    page: 1
                  }
                })
              }
            />
          </div>

          {/* Popular Searches */}
          <div className='mt-6 flex flex-wrap items-center justify-center gap-2'>
            <span className='mr-1 text-xs font-semibold '>Popular:</span>

            {[
              'Restaurants',
              'Salons',
              'Gyms',
              'Doctors',
              'Plumbers',
              'Electricians',
              'Hotels',
              'Hospitals',
              'Pet Shops'
            ].map((item) => (
              <a
                key={item}
                href={`/result?query=${encodeURIComponent(item)}`}
                className='rounded-full bg-gray-100 px-3.5 py-1.5 text-xs font-medium transition-all duration-200 hover:bg-jd-light hover:text-jd-orange'
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
