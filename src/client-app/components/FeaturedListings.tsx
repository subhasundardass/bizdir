export function FeaturedListings() {
  return (
    <section className='bg-jd-alt py-12 sm:py-16'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-8 flex items-end justify-between gap-4'>
          <div>
            <p className='mb-1 text-xs font-bold uppercase tracking-widest text-jd-orange'>
              Recommended
            </p>
            <h2 className='text-2xl font-bold tracking-tight text-ink sm:text-3xl'>
              Featured Listings
            </h2>
            <p className='mt-2 text-sm '>Handpicked businesses popular in your area</p>
          </div>
          <a href='#' className='group shrink-0 text-sm font-semibold text-jd-orange'>
            See All
            <i className='fa-solid fa-arrow-right ml-1 transition-transform duration-200 group-hover:translate-x-1' />
          </a>
        </div>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {/* Listing 1 */}
          <article className='group overflow-hidden rounded-3xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-1 hover:border-jd-border hover:shadow-orange'>
            <div className='relative h-48 overflow-hidden'>
              <img
                src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80'
                alt='Interior of Spice Symphony restaurant'
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-x-0 top-0 flex items-start justify-between p-4'>
                <span className='rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-jd-orange shadow-sm backdrop-blur'>
                  FEATURED
                </span>
                <span className='rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur'>
                  <i className='fa-solid fa-star mr-1 text-jd-rating' />
                  4.7
                </span>
              </div>
            </div>
            <div className='p-5'>
              <div className='mb-2 text-[11px] font-bold uppercase tracking-wider text-jd-orange'>
                Restaurant
              </div>
              <h3 className='text-xl font-bold tracking-tight text-ink'>Spice Symphony</h3>
              <p className='mt-2 flex items-start gap-2 text-sm leading-5 '>
                <i className='fa-solid fa-location-dot mt-1 shrink-0 text-jd-orange' />
                Linking Road, Bandra West, Mumbai
              </p>
              <div className='my-4 border-t border-jd-line' />
              <div className='flex items-center justify-between gap-3'>
                <a
                  href='tel:+912241234567'
                  className='text-sm font-semibold text-ink hover:text-jd-orange'
                >
                  +91 22 4123 4567
                </a>
                <span className='rounded-full bg-jd-light px-3 py-1 text-xs font-semibold text-jd-orange'>
                  1.2 km
                </span>
              </div>
            </div>
          </article>
          {/* Listing 2 */}
          <article className='group overflow-hidden rounded-3xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-1 hover:border-jd-border hover:shadow-orange'>
            <div className='relative h-48 overflow-hidden'>
              <img
                src='https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80'
                alt='Modern Glamour Studio salon'
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-x-0 top-0 flex items-start justify-between p-4'>
                <span className='rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-jd-orange shadow-sm backdrop-blur'>
                  VERIFIED
                </span>
                <span className='rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur'>
                  <i className='fa-solid fa-star mr-1 text-jd-rating' />
                  4.8
                </span>
              </div>
            </div>
            <div className='p-5'>
              <div className='mb-2 text-[11px] font-bold uppercase tracking-wider text-jd-orange'>
                Salon &amp; Spa
              </div>
              <h3 className='text-xl font-bold tracking-tight text-ink'>Glamour Studio</h3>
              <p className='mt-2 flex items-start gap-2 text-sm leading-5 '>
                <i className='fa-solid fa-location-dot mt-1 shrink-0 text-jd-orange' />
                Powai Main Road, Powai, Mumbai
              </p>
              <div className='my-4 border-t border-jd-line' />
              <div className='flex items-center justify-between gap-3'>
                <a
                  href='tel:+919876543210'
                  className='text-sm font-semibold text-ink hover:text-jd-orange'
                >
                  +91 98765 43210
                </a>
                <span className='rounded-full bg-jd-light px-3 py-1 text-xs font-semibold text-jd-orange'>
                  2.4 km
                </span>
              </div>
            </div>
          </article>
          {/* Listing 3 */}
          <article className='group overflow-hidden rounded-3xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-1 hover:border-jd-border hover:shadow-orange'>
            <div className='relative h-48 overflow-hidden'>
              <img
                src='https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80'
                alt='Iron Paradise Gym workout area'
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-x-0 top-0 flex items-start justify-between p-4'>
                <span className='rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-jd-orange shadow-sm backdrop-blur'>
                  POPULAR
                </span>
                <span className='rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur'>
                  <i className='fa-solid fa-star mr-1 text-jd-rating' />
                  4.6
                </span>
              </div>
            </div>
            <div className='p-5'>
              <div className='mb-2 text-[11px] font-bold uppercase tracking-wider text-jd-orange'>
                Fitness Center
              </div>
              <h3 className='text-xl font-bold tracking-tight text-ink'>Iron Paradise Gym</h3>
              <p className='mt-2 flex items-start gap-2 text-sm leading-5 '>
                <i className='fa-solid fa-location-dot mt-1 shrink-0 text-jd-orange' />
                Andheri East, Mumbai
              </p>
              <div className='my-4 border-t border-jd-line' />
              <div className='flex items-center justify-between gap-3'>
                <a
                  href='tel:+919811223344'
                  className='text-sm font-semibold text-ink hover:text-jd-orange'
                >
                  +91 98112 23344
                </a>
                <span className='rounded-full bg-jd-light px-3 py-1 text-xs font-semibold text-jd-orange'>
                  3.1 km
                </span>
              </div>
            </div>
          </article>
          {/* Listing 4 */}
          <article className='group overflow-hidden rounded-3xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-1 hover:border-jd-border hover:shadow-orange'>
            <div className='relative h-48 overflow-hidden'>
              <img
                src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80'
                alt='The Coffee House cafe'
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-x-0 top-0 flex items-start justify-between p-4'>
                <span className='rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-jd-orange shadow-sm backdrop-blur'>
                  FEATURED
                </span>
                <span className='rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur'>
                  <i className='fa-solid fa-star mr-1 text-jd-rating' />
                  4.7
                </span>
              </div>
            </div>
            <div className='p-5'>
              <div className='mb-2 text-[11px] font-bold uppercase tracking-wider text-jd-orange'>
                Cafe
              </div>
              <h3 className='text-xl font-bold tracking-tight text-ink'>The Coffee House</h3>
              <p className='mt-2 flex items-start gap-2 text-sm leading-5 '>
                <i className='fa-solid fa-location-dot mt-1 shrink-0 text-jd-orange' />
                Lower Parel, Mumbai
              </p>
              <div className='my-4 border-t border-jd-line' />
              <div className='flex items-center justify-between gap-3'>
                <a
                  href='tel:+912245678901'
                  className='text-sm font-semibold text-ink hover:text-jd-orange'
                >
                  +91 22 4567 8901
                </a>
                <span className='rounded-full bg-jd-light px-3 py-1 text-xs font-semibold text-jd-orange'>
                  4.2 km
                </span>
              </div>
            </div>
          </article>
          {/* Listing 5 */}
          <article className='group overflow-hidden rounded-3xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-1 hover:border-jd-border hover:shadow-orange'>
            <div className='relative h-48 overflow-hidden'>
              <img
                src='https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80'
                alt='Smile Dental Clinic'
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-x-0 top-0 flex items-start justify-between p-4'>
                <span className='rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-jd-orange shadow-sm backdrop-blur'>
                  VERIFIED
                </span>
                <span className='rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur'>
                  <i className='fa-solid fa-star mr-1 text-jd-rating' />
                  4.9
                </span>
              </div>
            </div>
            <div className='p-5'>
              <div className='mb-2 text-[11px] font-bold uppercase tracking-wider text-jd-orange'>
                Dental Clinic
              </div>
              <h3 className='text-xl font-bold tracking-tight text-ink'>Smile Dental Clinic</h3>
              <p className='mt-2 flex items-start gap-2 text-sm leading-5 '>
                <i className='fa-solid fa-location-dot mt-1 shrink-0 text-jd-orange' />
                Chembur East, Mumbai
              </p>
              <div className='my-4 border-t border-jd-line' />
              <div className='flex items-center justify-between gap-3'>
                <a
                  href='tel:+919820112233'
                  className='text-sm font-semibold text-ink hover:text-jd-orange'
                >
                  +91 98201 12233
                </a>
                <span className='rounded-full bg-jd-light px-3 py-1 text-xs font-semibold text-jd-orange'>
                  5.6 km
                </span>
              </div>
            </div>
          </article>
          {/* Listing 6 */}
          <article className='group overflow-hidden rounded-3xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-1 hover:border-jd-border hover:shadow-orange'>
            <div className='relative h-48 overflow-hidden'>
              <img
                src='https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
                alt='QuickFix plumbing service'
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-x-0 top-0 flex items-start justify-between p-4'>
                <span className='rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-jd-orange shadow-sm backdrop-blur'>
                  AVAILABLE NOW
                </span>
                <span className='rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur'>
                  <i className='fa-solid fa-star mr-1 text-jd-rating' />
                  4.5
                </span>
              </div>
            </div>
            <div className='p-5'>
              <div className='mb-2 text-[11px] font-bold uppercase tracking-wider text-jd-orange'>
                Plumbing Services
              </div>
              <h3 className='text-xl font-bold tracking-tight text-ink'>QuickFix Plumbers</h3>
              <p className='mt-2 flex items-start gap-2 text-sm leading-5 '>
                <i className='fa-solid fa-location-dot mt-1 shrink-0 text-jd-orange' />
                Vile Parle West, Mumbai
              </p>
              <div className='my-4 border-t border-jd-line' />
              <div className='flex items-center justify-between gap-3'>
                <a
                  href='tel:+919900112233'
                  className='text-sm font-semibold text-ink hover:text-jd-orange'
                >
                  +91 99001 12233
                </a>
                <span className='rounded-full bg-jd-light px-3 py-1 text-xs font-semibold text-jd-orange'>
                  6.3 km
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
