import Footer from '@/client-app/components/Footer';
import { Categories } from '@/client-app/components/Categories';
import { ExploreCity } from '@/client-app/components/ExploreCity';
import { FeaturedListings } from '@/client-app/components/FeaturedListings';
import Header from '@/client-app/components/Header';
import { HeroSection } from '@/client-app/components/HeroSection';
import { TrendingSearch } from '@/client-app/components/TrendingSearch';
import { TrustStrip } from '@/client-app/components/TrustStrip';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <>
      <Header />
      <main className='px-0 pb-8 pt-0'>
        {/* <!-- HERO --> */}
        <HeroSection />
        {/* <!-- TRUST STRIP --> */}
        <TrustStrip />
        {/* <!-- CATEGORIES --> */}
        <Categories />
        {/* <!-- FEATURED LISTINGS --> */}
        <FeaturedListings />
        {/* <!-- TRENDING SEARCHES --> */}
        <TrendingSearch />
        {/* <!-- EXPLORE CITIES --> */}
        <ExploreCity />
        <Footer />
      </main>
    </>
  );
}
