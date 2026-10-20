import { SortSelect, type FilterProps } from './Filters';
export function ResultHeader({
  query,
  location,
  total,
  filters,
  onChange,
  hasLocation
}: Omit<FilterProps, 'requestLocation'> & {
  query: string;
  location: string;
  total?: number;
}) {
  return (
    <section className='border-b border-jd-line bg-white'>
      <div className='mx-auto max-w-360 px-4 py-5 sm:px-6 lg:px-8'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-ink sm:text-3xl'>
              {query || 'Search businesses'}
              {location ? ` in ${location}` : ''}
            </h1>
            <p className='mt-1.5 text-sm '>
              {total === undefined
                ? 'Search local businesses and services'
                : `${total} businesses found${location ? ` near ${location}` : ''}`}
            </p>
          </div>
          {/* Desktop sort */}
          <div className='hidden items-center gap-2 sm:flex'>
            <SortSelect filters={filters} onChange={onChange} hasLocation={hasLocation} />
          </div>
        </div>
      </div>
    </section>
  );
}
