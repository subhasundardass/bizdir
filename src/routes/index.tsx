import { Categories } from "#/components/Categories";
import { ExploreCity } from "#/components/ExploreCity";
import { FeaturedListings } from "#/components/FeaturedListings";
import Header from "#/components/Header";
import { HeroSection } from "#/components/HeroSection";
import { TrendingSearch } from "#/components/TrendingSearch";
import { TrustStrip } from "#/components/TrustStrip";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <>
      <Header />
      <main className="px-0 pb-8 pt-0">
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
      </main>
    </>
  );
}
