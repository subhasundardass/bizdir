import { CircleCheck, Clock, Heart, MapPin } from "lucide-react";

type SearchBusinessResult = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  cityId: number | null;
  localityId: number | null;
  rating: number | null;
  reviewCount: number | null;
};

type SearchResponse = {
  businesses: SearchBusinessResult[];
  total: number;
  page: number;
  perPage: number;
};

type MainResultAreaProps = {
  data: SearchResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

export function MainResultArea({
  data,
  isLoading,
  isError,
  error,
}: MainResultAreaProps) {
  const businesses = data?.businesses ?? [];

  return (
    <section className="mx-auto max-w-360 px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[235px_minmax(0,1fr)_360px]">
        {/* ===================================================== */}
        {/* FILTER SIDEBAR */}
        {/* ===================================================== */}
        <aside className="hidden lg:block">
          <div className="sticky top-21 overflow-hidden rounded-2xl border border-jd-line bg-white">
            <div className="flex items-center justify-between border-b border-jd-line px-4 py-4">
              <h2 className="text-sm font-bold text-ink">Filters</h2>
              <button
                type="button"
                className="text-[11px] font-semibold text-jd-orange hover:text-jd-hover"
              >
                Clear All
              </button>
            </div>
            {/* Category */}
            <div className="border-b border-jd-line px-4 py-4">
              <h3 className="text-xs font-bold text-ink">Category</h3>
              <label className="mt-3 flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 accent-[#FF6B00]"
                />
                <span className="text-xs ">Restaurants</span>
              </label>
              <label className="mt-3 flex cursor-pointer items-center gap-3">
                <input type="checkbox" className="h-4 w-4 accent-[#FF6B00]" />
                <span className="text-xs ">Cafes</span>
              </label>
              <label className="mt-3 flex cursor-pointer items-center gap-3">
                <input type="checkbox" className="h-4 w-4 accent-[#FF6B00]" />
                <span className="text-xs ">Fast Food</span>
              </label>
              <label className="mt-3 flex cursor-pointer items-center gap-3">
                <input type="checkbox" className="h-4 w-4 accent-[#FF6B00]" />
                <span className="text-xs ">Pure Veg</span>
              </label>
            </div>
            {/* Rating */}
            <div className="border-b border-jd-line px-4 py-4">
              <h3 className="text-xs font-bold text-ink">Rating</h3>
              <div className="mt-3 space-y-0">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-200 hover:bg-jd-light"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    <i className="fa-solid fa-star text-jd-rating" />
                    4.5+
                  </span>
                  <span className="text-[11px] text-gray-500">(1200)</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-200 hover:bg-jd-light"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    <i className="fa-solid fa-star text-jd-rating" />
                    4.0+
                  </span>
                  <span className="text-[11px] text-gray-500">(2400)</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-200 hover:bg-jd-light"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    <i className="fa-solid fa-star text-jd-rating" />
                    3.5+
                  </span>
                  <span className="text-[11px] text-gray-500">(3700)</span>
                </button>
              </div>
            </div>
            {/* Open Now */}
            <div className="border-b border-jd-line px-4 py-4">
              <h3 className="text-xs font-bold text-ink">Availability</h3>
              <label className="mt-3 flex cursor-pointer items-center justify-between">
                <span className="text-xs ">Open Now</span>
                <input type="checkbox" className="h-4 w-4 accent-[#FF6B00]" />
              </label>
            </div>
            {/* Distance */}
            <div className="px-4 py-4">
              <h3 className="text-xs font-bold text-ink">Distance</h3>
              <div className="mt-3 space-y-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="distance"
                    className="h-4 w-4 accent-[#FF6B00]"
                  />
                  <span className="text-xs ">Within 1 km</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="distance"
                    className="h-4 w-4 accent-[#FF6B00]"
                  />
                  <span className="text-xs ">Within 3 km</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="distance"
                    className="h-4 w-4 accent-[#FF6B00]"
                  />
                  <span className="text-xs ">Within 5 km</span>
                </label>
              </div>
            </div>
          </div>
        </aside>
        {/* ===================================================== */}
        {/* RESULTS */}
        {/* ===================================================== */}
        <div className="min-w-0">
          {/* Active filters */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-jd-border bg-jd-light px-3 py-1.5 text-[11px] font-semibold text-jd-orange"
            >
              Restaurants
              <i className="fa-solid fa-xmark text-[9px]" />
            </button>
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-jd-line bg-white px-3 py-1.5 text-[11px] font-medium  transition-all duration-200 hover:border-jd-border hover:text-jd-orange"
            >
              4.0+ Rating
              <i className="fa-solid fa-xmark text-[9px]" />
            </button>
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-jd-line bg-white px-3 py-1.5 text-[11px] font-medium  transition-all duration-200 hover:border-jd-border hover:text-jd-orange"
            >
              Open Now
              <i className="fa-solid fa-xmark text-[9px]" />
            </button>
          </div>

          {/* ===================================================== */}

          {businesses.map((business) => (
            <article
              key={business.id}
              className="group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative h-48 shrink-0 overflow-hidden sm:h-auto sm:w-[350px]">
                  <img
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80"
                    alt={business.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold text-jd-orange shadow-sm backdrop-blur">
                    FEATURED
                  </span>

                  <button
                    type="button"
                    aria-label={`Save ${business.name}`}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition-all duration-200 hover:text-jd-orange"
                  >
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="flex min-w-0 items-center gap-1.5 text-lg font-bold tracking-tight text-ink sm:text-xl">
                          <span className="truncate">{business.name}</span>

                          <CircleCheck
                            className="h-4 w-4 shrink-0 fill-blue-500 text-white sm:h-5 sm:w-5"
                            aria-label="Verified"
                          />
                        </h2>
                      </div>

                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-jd-orange">
                        North Indian Restaurant
                      </p>
                    </div>

                    {business.rating != null && (
                      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white">
                        {business.rating.toFixed(1)}
                        <i className="fa-solid fa-star text-[9px]" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="flex items-start gap-2 text-xs leading-5">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-jd-orange" />
                      {business.address ?? "Address not available"}
                    </p>

                    <p className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 shrink-0 text-jd-orange" />
                      Open until 11:30 PM
                      <span className="font-semibold text-success">
                        Open Now
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold ">
                      ₹₹
                    </span>
                    <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold ">
                      1,842 Reviews
                    </span>
                    <span className="rounded-full bg-jd-light px-3 py-1.5 text-[10px] font-semibold text-jd-orange">
                      1.2 km away
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-jd-line pt-4">
                    <span className="flex items-center gap-2 text-xs font-bold text-ink">
                      <i className="fa-solid fa-location-dot text-jd-orange" />
                      +91 98989 98989
                    </span>

                    <a
                      href={`/business/${business.slug}`}
                      className="shrink-0 rounded-full bg-jd-orange px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-jd-hover"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {/* Empty state */}
          {businesses.length === 0 && (
            <p className="rounded-2xl border border-jd-line bg-white p-6 text-center text-sm text-gray-500">
              No businesses found.
            </p>
          )}

          {/* Result Card 5 */}
          <article className="group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange">
            <div className="flex flex-col sm:flex-row"></div>
          </article>
        </div>
      </div>
    </section>
  );
}
