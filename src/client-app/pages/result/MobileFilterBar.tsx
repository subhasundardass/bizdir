import { Button } from '@/client-app/components/ui/button';
import { SortSelect, type FilterProps } from './Filters';
export function MobileFilterBar({
  open,
  onToggle,
  ...props
}: FilterProps & { open: boolean; onToggle: () => void }) {
  return (
    <div className='sticky top-16 z-30 border-b border-jd-line bg-white lg:hidden'>
      <div className='flex min-h-12 items-center justify-between gap-2 px-4'>
        <Button
          variant='unstyled'
          size='unstyled'
          type='button'
          aria-expanded={open}
          onClick={onToggle}
          className='text-xs font-semibold text-jd-orange'
        >
          {open ? 'Hide filters' : 'Filters'}
        </Button>
        <SortSelect {...props} />
      </div>
    </div>
  );
}
