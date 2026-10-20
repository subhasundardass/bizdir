import { BusinessSearchForm, type SearchValues } from '@/client-app/components/BusinessSearchForm';
import { Button } from '@/client-app/components/ui/button';

type HeaderProps = {
  values: SearchValues;
  onSearch: (values: SearchValues) => void;
  isFetching: boolean;
};

export function Header({ values, onSearch, isFetching }: HeaderProps) {
  return (
    <header className='sticky top-0 z-50 border-b border-jd-line bg-white/95 shadow-sm backdrop-blur'>
      <div className='mx-auto flex min-h-16 max-w-360 items-center gap-4 px-4 py-2 sm:px-6 lg:px-8'>
        {/* Logo */}
        <a href='/' className='flex shrink-0 items-center gap-2.5' aria-label='JustDial home'>
          <span className='jd-logo-mark'>JD</span>

          <span className='hidden text-[21px] font-extrabold tracking-[-0.055em] sm:block'>
            Just<span className='text-jd-orange'>Dial</span>
          </span>
        </a>

        {/* Search */}
        <div className='flex min-w-0 flex-1 justify-center'>
          <div className='w-full max-w-3xl'>
            <BusinessSearchForm
              initialValues={values}
              onSearch={onSearch}
              isFetching={isFetching}
            />
          </div>
        </div>

        {/* Header actions */}
        <div className='flex shrink-0 items-center gap-2'>
          <Button
            variant='unstyled'
            size='unstyled'
            type='button'
            className='hidden rounded-full border border-jd-orange px-4 py-2 text-xs font-semibold text-jd-orange transition-all duration-200 hover:bg-jd-orange hover:text-white lg:inline-flex'
          >
            Login / Sign Up
          </Button>

          <Button
            variant='unstyled'
            size='unstyled'
            type='button'
            aria-label='Shopping bag'
            className='relative flex h-10 w-10 items-center justify-center rounded-full text-jd-orange transition-all duration-200 hover:bg-jd-light'
          >
            <i className='fa-solid fa-bag-shopping' />

            <span className='absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-jd-orange px-1 text-[9px] font-bold text-white ring-2 ring-white'>
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
