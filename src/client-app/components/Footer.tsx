import { Brand } from '@/components/brand';
export default function Footer() {
  return (
    <footer className='border-t border-jd-line bg-white'>
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-8 sm:px-6 lg:px-8'>
        <div>
          <a href='/' className='inline-flex items-center gap-2.5' aria-label='JustDial home'>
            <Brand />
          </a>
          <p className='mt-3 text-sm text-sub'>
            Discover trusted local businesses and services around you.
          </p>
        </div>
        <nav aria-label='Footer' className='flex gap-6 text-sm font-semibold text-sub'>
          <a className='hover:text-jd-orange' href='/'>
            Home
          </a>
          <a className='hover:text-jd-orange' href='/result'>
            Find businesses
          </a>
          <a className='hover:text-jd-orange' href='/admin'>
            Admin
          </a>
        </nav>
      </div>
    </footer>
  );
}
