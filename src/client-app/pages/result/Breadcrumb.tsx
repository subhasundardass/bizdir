import { ChevronRight, Home } from 'lucide-react';

export function BreadCrumb({ query, location }: { query: string; location: string }) {
  return (
    <nav aria-label='Breadcrumb' className='border-b border-jd-line bg-white'>
      <div className='mx-auto max-w-360 px-4 sm:px-6 lg:px-8'>
        <ol className='flex min-h-12 items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none'>
          <li className='flex items-center gap-2'>
            <a
              href='/'
              className='inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-jd-orange'
            >
              <Home className='h-3.5 w-3.5' />
              Home
            </a>

            <ChevronRight className='h-3.5 w-3.5 shrink-0 text-gray-300' />
          </li>

          <li className='flex items-center gap-2'>
            <a
              href='#'
              className='text-xs font-medium text-gray-500 transition-colors hover:text-jd-orange'
            >
              {location || 'All locations'}
            </a>

            <ChevronRight className='h-3.5 w-3.5 shrink-0 text-gray-300' />
          </li>

          <li>
            <span aria-current='page' className='text-xs font-semibold text-ink'>
              {query || 'Search'}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
}
