import { getCategoryIcon } from '@/client-app/lib/category-icons';

export function Categories() {
  const RestaurantsIcon = getCategoryIcon('utensils');
  const SalonIcon = getCategoryIcon('scissors');
  const GymsIcon = getCategoryIcon('dumbbell');
  const DentistsIcon = getCategoryIcon('stethoscope');
  const PlumbersIcon = getCategoryIcon('wrench');
  const ElectriciansIcon = getCategoryIcon('bolt');
  const HotelsIcon = getCategoryIcon('hotel');
  const CarRepairIcon = getCategoryIcon('car');
  const PetShopsIcon = getCategoryIcon('shopping-bag');
  const TutorsIcon = getCategoryIcon('graduation-cap');
  const MobileIcon = getCategoryIcon('mobile');
  const HomeServicesIcon = getCategoryIcon('home');

  return (
    <section className='bg-white py-12 sm:py-16'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-7 flex items-end justify-between gap-4'>
          <div>
            <p className='mb-1 text-xs font-bold uppercase tracking-widest text-jd-orange'>
              Explore
            </p>
            <h2 className='text-2xl font-bold tracking-tight text-ink sm:text-3xl'>
              Popular Categories
            </h2>
          </div>

          <a href='#' className='group shrink-0 text-sm font-semibold text-jd-orange'>
            View All
            <span className='ml-1 inline-block transition-transform duration-200 group-hover:translate-x-1'>
              →
            </span>
          </a>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5 lg:grid-cols-6'>
          <Category icon={RestaurantsIcon} name='Restaurants' count='1,240+ options' />

          <Category icon={SalonIcon} name='Salon & Spa' count='890+ options' />

          <Category icon={GymsIcon} name='Gyms' count='620+ options' />

          <Category icon={DentistsIcon} name='Dentists' count='410+ options' />

          <Category icon={PlumbersIcon} name='Plumbers' count='320+ options' />

          <Category icon={ElectriciansIcon} name='Electricians' count='280+ options' />

          <Category icon={HotelsIcon} name='Hotels' count='740+ options' />

          <Category icon={CarRepairIcon} name='Car Repair' count='530+ options' />

          <Category icon={PetShopsIcon} name='Pet Shops' count='190+ options' />

          <Category icon={TutorsIcon} name='Tutors' count='450+ options' />
          <Category icon={MobileIcon} name='Mobile & Electronics' count='380+ options' />

          <Category icon={HomeServicesIcon} name='Home Services' count='560+ options' />
        </div>
      </div>
    </section>
  );
}

function Category({
  icon: Icon,
  name,
  count
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  count: string;
}) {
  return (
    <a
      href='#'
      className='group rounded-2xl border border-jd-line bg-white p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-jd-border hover:shadow-orange'
    >
      <div className='mx-auto flex size-17 items-center justify-center rounded-full bg-jd-light text-jd-orange transition-all duration-200 group-hover:bg-jd-orange group-hover:text-white'>
        <Icon className='h-7 w-7' />
      </div>

      <h3 className='mt-3 min-h-10 text-sm font-semibold leading-5 text-ink'>{name}</h3>

      <p className='mt-1 text-[11px] text-muted'>{count}</p>
    </a>
  );
}
