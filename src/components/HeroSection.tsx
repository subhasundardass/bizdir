import { ChevronDown, MapPin, Search } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF7F0] to-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-jd-border bg-white px-3.5 py-1.5 text-xs font-semibold text-jd-orange shadow-sm">
            <MapPin className="h-3.5 w-3.5" />
            Discover local businesses near you
          </div>

          <h1 className="text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl">
            Find the best{" "}
            <span className="relative inline-block text-jd-orange">
              around you
              <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-jd-orange/25" />
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6  sm:text-base">
            Discover trusted restaurants, salons, doctors, gyms, hotels and
            thousands of local services near you.
          </p>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-4xl">
            <div className="rounded-[28px] border border-jd-line bg-white p-2 shadow-soft sm:rounded-full">
              <div className="flex flex-col sm:flex-row sm:items-center">
                {/* Location */}
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 rounded-full px-4 text-left transition-all duration-200 hover:bg-jd-light sm:w-[34%] sm:rounded-r-none sm:border-r sm:border-jd-line"
                  aria-label="Select location"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jd-light text-jd-orange">
                    <MapPin className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Location
                    </span>

                    <span className="block truncate text-sm font-semibold text-ink">
                      Mumbai, Maharashtra
                    </span>
                  </span>

                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                </button>

                {/* Search Input */}
                <div className="flex min-h-14 flex-1 items-center gap-3 border-t border-jd-line px-4 sm:border-t-0">
                  <Search className="h-4 w-4 shrink-0 text-gray-500" />

                  <input
                    type="text"
                    aria-label="Search businesses"
                    placeholder="Search for restaurants, salons, gyms..."
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-gray-500"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-jd-orange px-7 text-sm font-bold text-white shadow-orange transition-all duration-200 hover:bg-jd-hover active:scale-[0.98]"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Popular Searches */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs font-semibold ">Popular:</span>

            {[
              "Restaurants",
              "Salons",
              "Gyms",
              "Doctors",
              "Plumbers",
              "Electricians",
              "Hotels",
              "Hospitals",
              "Pet Shops",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="rounded-full bg-gray-100 px-3.5 py-1.5 text-xs font-medium transition-all duration-200 hover:bg-jd-light hover:text-jd-orange"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
