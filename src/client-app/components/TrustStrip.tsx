import { CircleCheck, Star, Users, Headset } from 'lucide-react';

export function TrustStrip() {
  return (
    <section className='border-y border-jd-line bg-white'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-2 divide-x divide-jd-line lg:grid-cols-4'>
          <div className='flex items-center justify-center gap-2 px-3 py-4 text-center sm:gap-3'>
            <CircleCheck className='h-5 w-5 shrink-0 text-jd-orange' />
            <span className='text-xs font-semibold sm:text-sm'>5000+ Verified Businesses</span>
          </div>

          <div className='flex items-center justify-center gap-2 px-3 py-4 text-center sm:gap-3'>
            <Star className='h-5 w-5 shrink-0 fill-current text-jd-orange' />
            <span className='text-xs font-semibold sm:text-sm'>4.8 Average Rating</span>
          </div>

          <div className='flex items-center justify-center gap-2 px-3 py-4 text-center sm:gap-3'>
            <Users className='h-5 w-5 shrink-0 text-jd-orange' />
            <span className='text-xs font-semibold sm:text-sm'>2M+ Happy Users</span>
          </div>

          <div className='col-span-2 flex items-center justify-center gap-2 px-3 py-4 text-center sm:gap-3 lg:col-span-1'>
            <Headset className='h-5 w-5 shrink-0 text-jd-orange' />
            <span className='text-xs font-semibold sm:text-sm'>24/7 Customer Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
