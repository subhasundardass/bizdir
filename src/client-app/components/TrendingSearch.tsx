export function TrendingSearch() {
  return (
    <section className='bg-white py-10 sm:py-14'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-7'>
          <p className='mb-1 text-xs font-bold uppercase tracking-widest text-jd-orange'>
            What's hot
          </p>
          <h2 className='text-2xl font-bold tracking-tight text-ink sm:text-3xl'>
            Trending Searches
          </h2>
        </div>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'>
          <a
            href='#'
            className='group rounded-xl border-l-4 border-jd-orange bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-jd-light hover:shadow-card'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='font-semibold text-ink'>Best restaurants</span>
              <i className='fa-solid fa-arrow-right text-xs text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-jd-orange' />
            </div>
            <p className='mt-2 text-xs '>🔥 2.3k searches today</p>
          </a>
          <a
            href='#'
            className='group rounded-xl border-l-4 border-jd-orange bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-jd-light hover:shadow-card'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='font-semibold text-ink'>Nearby salons</span>
              <i className='fa-solid fa-arrow-right text-xs text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-jd-orange' />
            </div>
            <p className='mt-2 text-xs '>🔥 2.1k searches today</p>
          </a>
          <a
            href='#'
            className='group rounded-xl border-l-4 border-jd-orange bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-jd-light hover:shadow-card'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='font-semibold text-ink'>Home cleaning</span>
              <i className='fa-solid fa-arrow-right text-xs text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-jd-orange' />
            </div>
            <p className='mt-2 text-xs '>🔥 1.8k searches today</p>
          </a>
          <a
            href='#'
            className='group rounded-xl border-l-4 border-jd-orange bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-jd-light hover:shadow-card'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='font-semibold text-ink'>AC repair</span>
              <i className='fa-solid fa-arrow-right text-xs text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-jd-orange' />
            </div>
            <p className='mt-2 text-xs '>🔥 1.6k searches today</p>
          </a>
          <a
            href='#'
            className='group rounded-xl border-l-4 border-jd-orange bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-jd-light hover:shadow-card'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='font-semibold text-ink'>Top rated gyms</span>
              <i className='fa-solid fa-arrow-right text-xs text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-jd-orange' />
            </div>
            <p className='mt-2 text-xs '>🔥 1.4k searches today</p>
          </a>
        </div>
      </div>
    </section>
  );
}
