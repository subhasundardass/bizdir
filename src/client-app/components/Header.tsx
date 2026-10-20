import { Brand } from '@/components/brand';
import { Button } from '@/client-app/components/ui/button';
export default function Header() {
  return (
    <header className='sticky top-0 z-50 h-16 border-b border-jd-line bg-white/95 shadow-sm backdrop-blur'>
      <div className='mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo */}
        <a href='/' className='group flex items-center gap-2.5' aria-label='JustDial home'>
          <Brand />
        </a>
        {/* Header Actions */}
        <div className='flex items-center gap-2 sm:gap-3'>
          <a
            href='/admin'
            className='rounded-full px-3 py-2 text-sm font-semibold text-jd-orange transition hover:bg-jd-light'
          >
            Admin
          </a>
          <Button
            variant='unstyled'
            size='unstyled'
            type='button'
            className='hidden rounded-full border border-jd-orange px-4 py-2 text-sm font-semibold text-jd-orange transition-all duration-200 hover:bg-jd-orange hover:text-white sm:inline-flex'
          >
            Login / Sign Up
          </Button>
          <Button
            variant='unstyled'
            size='unstyled'
            type='button'
            aria-label='Shopping bag with 3 items'
            className='relative flex h-10 w-10 items-center justify-center rounded-full text-jd-orange transition-all duration-200 hover:bg-jd-light'
          >
            <i className='fa-solid fa-bag-shopping text-lg' />
            <span className='absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-jd-orange px-1 text-[9px] font-bold text-white ring-2 ring-white'>
              3
            </span>
          </Button>
          <Button
            variant='unstyled'
            size='unstyled'
            type='button'
            aria-label='Login or sign up'
            className='flex h-10 w-10 items-center justify-center rounded-full border border-jd-border text-jd-orange transition-all duration-200 hover:bg-jd-light sm:hidden'
          >
            <i className='fa-regular fa-user' />
          </Button>
        </div>
      </div>
    </header>
  );
}
