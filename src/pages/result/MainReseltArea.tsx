import { Controller, useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
type Filters = {
  restaurants: boolean;
  cafes: boolean;
  fastFood: boolean;
  pureVeg: boolean;
  openNow: boolean;
  distance: string;
};

export function MainResultArea() {
  const { control, reset } = useForm<Filters>({
    defaultValues: {
      restaurants: true,
      cafes: false,
      fastFood: false,
      pureVeg: false,
      openNow: false,
      distance: "",
    },
  });
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
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                onClick={() =>
                  reset({
                    restaurants: false,
                    cafes: false,
                    fastFood: false,
                    pureVeg: false,
                    openNow: false,
                    distance: "",
                  })
                }
                className="text-[11px] font-semibold text-jd-orange hover:text-jd-hover"
              >
                Clear All
              </Button>
            </div>
            {/* Category */}
            <div className="border-b border-jd-line px-4 py-4">
              <h3 className="text-xs font-bold text-ink">Category</h3>
              <Label className="mt-3 flex font-normal cursor-pointer items-center gap-3">
                <Controller
                  name="restaurants"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      ref={field.ref}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      onBlur={field.onBlur}
                      className="h-4 w-4 rounded-[3px] border-gray-400 shadow-none data-[state=checked]:border-jd-orange data-[state=checked]:bg-jd-orange"
                    />
                  )}
                />
                <span className="text-xs ">Restaurants</span>
              </Label>
              <Label className="mt-3 flex font-normal cursor-pointer items-center gap-3">
                <Controller
                  name="cafes"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      ref={field.ref}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      onBlur={field.onBlur}
                      className="h-4 w-4 rounded-[3px] border-gray-400 shadow-none data-[state=checked]:border-jd-orange data-[state=checked]:bg-jd-orange"
                    />
                  )}
                />
                <span className="text-xs ">Cafes</span>
              </Label>
              <Label className="mt-3 flex font-normal cursor-pointer items-center gap-3">
                <Controller
                  name="fastFood"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      ref={field.ref}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      onBlur={field.onBlur}
                      className="h-4 w-4 rounded-[3px] border-gray-400 shadow-none data-[state=checked]:border-jd-orange data-[state=checked]:bg-jd-orange"
                    />
                  )}
                />
                <span className="text-xs ">Fast Food</span>
              </Label>
              <Label className="mt-3 flex font-normal cursor-pointer items-center gap-3">
                <Controller
                  name="pureVeg"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      ref={field.ref}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      onBlur={field.onBlur}
                      className="h-4 w-4 rounded-[3px] border-gray-400 shadow-none data-[state=checked]:border-jd-orange data-[state=checked]:bg-jd-orange"
                    />
                  )}
                />
                <span className="text-xs ">Pure Veg</span>
              </Label>
            </div>
            {/* Rating */}
            <div className="border-b border-jd-line px-4 py-4">
              <h3 className="text-xs font-bold text-ink">Rating</h3>
              <div className="mt-3 space-y-2">
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-200 hover:bg-jd-light"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    <i className="fa-solid fa-star text-jd-rating" />
                    4.5+
                  </span>
                  <span className="text-[11px] text-gray-500">(1200)</span>
                </Button>
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-200 hover:bg-jd-light"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    <i className="fa-solid fa-star text-jd-rating" />
                    4.0+
                  </span>
                  <span className="text-[11px] text-gray-500">(2400)</span>
                </Button>
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-200 hover:bg-jd-light"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    <i className="fa-solid fa-star text-jd-rating" />
                    3.5+
                  </span>
                  <span className="text-[11px] text-gray-500">(3700)</span>
                </Button>
              </div>
            </div>
            {/* Open Now */}
            <div className="border-b border-jd-line px-4 py-4">
              <h3 className="text-xs font-bold text-ink">Availability</h3>
              <Label className="mt-3 flex font-normal cursor-pointer items-center justify-between">
                <span className="text-xs ">Open Now</span>
                <Controller
                  name="openNow"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      ref={field.ref}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      onBlur={field.onBlur}
                      className="h-4 w-4 rounded-[3px] border-gray-400 shadow-none data-[state=checked]:border-jd-orange data-[state=checked]:bg-jd-orange"
                    />
                  )}
                />
              </Label>
            </div>
            {/* Distance */}
            <div className="px-4 py-4">
              <h3 className="text-xs font-bold text-ink">Distance</h3>
              <Controller
                name="distance"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="mt-3 gap-2"
                  >
                    {["1", "3", "5"].map((distance) => (
                      <Label
                        key={distance}
                        className="flex cursor-pointer items-center gap-3 font-normal"
                      >
                        <RadioGroupItem
                          ref={distance === "1" ? field.ref : undefined}
                          value={distance}
                          className="h-4 w-4 border-gray-400 text-jd-orange shadow-none data-[state=checked]:border-jd-orange"
                        />
                        <span className="text-xs">Within {distance} km</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>
          </div>
        </aside>
        {/* ===================================================== */}
        {/* RESULTS */}
        {/* ===================================================== */}
        <div className="min-w-0">
          {/* Active filters */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-jd-border bg-jd-light px-3 py-1.5 text-[11px] font-semibold text-jd-orange"
            >
              Restaurants
              <i className="fa-solid fa-xmark text-[9px]" />
            </Button>
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-jd-line bg-white px-3 py-1.5 text-[11px] font-medium  transition-all duration-200 hover:border-jd-border hover:text-jd-orange"
            >
              4.0+ Rating
              <i className="fa-solid fa-xmark text-[9px]" />
            </Button>
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-jd-line bg-white px-3 py-1.5 text-[11px] font-medium  transition-all duration-200 hover:border-jd-border hover:text-jd-orange"
            >
              Open Now
              <i className="fa-solid fa-xmark text-[9px]" />
            </Button>
          </div>
          {/* Result Card 1 */}
          <article className="group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange">
            <div className="flex flex-col sm:flex-row">
              {/* Image */}
              <div className="relative h-48 shrink-0 overflow-hidden sm:h-auto sm:w-[350px]">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80"
                  alt="Spice Symphony restaurant"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold text-jd-orange shadow-sm backdrop-blur">
                  FEATURED
                </span>
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  aria-label="Save Spice Symphony"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95  shadow-sm backdrop-blur transition-all duration-200 hover:text-jd-orange"
                >
                  <i className="fa-regular fa-heart text-sm" />
                </Button>
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
                        Spice Symphony
                      </h2>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-trust">
                        <i className="fa-solid fa-circle-check" />
                        Verified
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-jd-orange">
                      North Indian Restaurant
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white">
                    4.7
                    <i className="fa-solid fa-star text-[9px]" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="flex items-start gap-2 text-xs leading-5 ">
                    <i className="fa-solid fa-location-dot mt-0.5 w-3 shrink-0 text-jd-orange" />
                    Linking Road, Bandra West, Mumbai
                  </p>
                  <p className="flex items-center gap-2 text-xs ">
                    <i className="fa-regular fa-clock w-3 text-jd-orange" />
                    Open until 11:30 PM
                    <span className="font-semibold text-success">Open Now</span>
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
                  <a
                    href="tel:+912241234567"
                    className="flex items-center gap-2 text-xs font-bold text-ink transition-colors duration-200 hover:text-jd-orange"
                  >
                    <i className="fa-solid fa-phone text-jd-orange" />
                    +91 22 4123 4567
                  </a>
                  <Button
                    variant="unstyled"
                    size="unstyled"
                    type="button"
                    className="rounded-full bg-jd-orange px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-jd-hover"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </article>
          {/* Result Card 2 */}
          <article className="group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange">
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-48 shrink-0 overflow-hidden sm:h-auto sm:w-[350px]">
                <img
                  src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&auto=format&fit=crop&q=80"
                  alt="Urban Tadka restaurant"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold text-jd-orange shadow-sm">
                  POPULAR
                </span>
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  aria-label="Save Urban Tadka"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95  shadow-sm transition-all duration-200 hover:text-jd-orange"
                >
                  <i className="fa-regular fa-heart text-sm" />
                </Button>
              </div>
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
                        Urban Tadka
                      </h2>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-trust">
                        <i className="fa-solid fa-circle-check" />
                        Verified
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-jd-orange">
                      Multi Cuisine Restaurant
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white">
                    4.5
                    <i className="fa-solid fa-star text-[9px]" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="flex items-start gap-2 text-xs leading-5 ">
                    <i className="fa-solid fa-location-dot mt-0.5 w-3 shrink-0 text-jd-orange" />
                    Hill Road, Bandra West, Mumbai
                  </p>
                  <p className="flex items-center gap-2 text-xs ">
                    <i className="fa-regular fa-clock w-3 text-jd-orange" />
                    Open until 12:00 AM
                    <span className="font-semibold text-success">Open Now</span>
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold ">
                    ₹₹
                  </span>
                  <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold ">
                    986 Reviews
                  </span>
                  <span className="rounded-full bg-jd-light px-3 py-1.5 text-[10px] font-semibold text-jd-orange">
                    1.8 km away
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-jd-line pt-4">
                  <a
                    href="tel:+919820112233"
                    className="flex items-center gap-2 text-xs font-bold text-ink transition-colors duration-200 hover:text-jd-orange"
                  >
                    <i className="fa-solid fa-phone text-jd-orange" />
                    +91 98201 12233
                  </a>
                  <Button
                    variant="unstyled"
                    size="unstyled"
                    type="button"
                    className="rounded-full bg-jd-orange px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-jd-hover"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </article>
          {/* Result Card 3 */}
          <article className="group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange">
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-48 shrink-0 overflow-hidden sm:h-auto sm:w-[350px]">
                <img
                  src="https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=600&auto=format&fit=crop&q=80"
                  alt="The Bombay Kitchen"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  aria-label="Save The Bombay Kitchen"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95  shadow-sm transition-all duration-200 hover:text-jd-orange"
                >
                  <i className="fa-regular fa-heart text-sm" />
                </Button>
              </div>
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
                        The Bombay Kitchen
                      </h2>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-trust">
                        <i className="fa-solid fa-circle-check" />
                        Verified
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-jd-orange">
                      Indian Restaurant
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white">
                    4.4
                    <i className="fa-solid fa-star text-[9px]" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="flex items-start gap-2 text-xs leading-5 ">
                    <i className="fa-solid fa-location-dot mt-0.5 w-3 shrink-0 text-jd-orange" />
                    Lower Parel, Mumbai
                  </p>
                  <p className="flex items-center gap-2 text-xs ">
                    <i className="fa-regular fa-clock w-3 text-jd-orange" />
                    Open until 11:00 PM
                    <span className="font-semibold text-success">Open Now</span>
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold ">
                    ₹₹₹
                  </span>
                  <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold ">
                    731 Reviews
                  </span>
                  <span className="rounded-full bg-jd-light px-3 py-1.5 text-[10px] font-semibold text-jd-orange">
                    3.7 km away
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-jd-line pt-4">
                  <a
                    href="tel:+912249876543"
                    className="flex items-center gap-2 text-xs font-bold text-ink transition-colors duration-200 hover:text-jd-orange"
                  >
                    <i className="fa-solid fa-phone text-jd-orange" />
                    +91 22 4987 6543
                  </a>
                  <Button
                    variant="unstyled"
                    size="unstyled"
                    type="button"
                    className="rounded-full bg-jd-orange px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-jd-hover"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </article>
          {/* Result Card 4 */}
          <article className="group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange">
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-48 shrink-0 overflow-hidden sm:h-auto sm:w-[350px]">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"
                  alt="Coastal Spice restaurant"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  aria-label="Save Coastal Spice"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95  shadow-sm transition-all duration-200 hover:text-jd-orange"
                >
                  <i className="fa-regular fa-heart text-sm" />
                </Button>
              </div>
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
                      Coastal Spice
                    </h2>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-jd-orange">
                      Seafood Restaurant
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white">
                    4.3
                    <i className="fa-solid fa-star text-[9px]" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="flex items-start gap-2 text-xs leading-5 ">
                    <i className="fa-solid fa-location-dot mt-0.5 w-3 shrink-0 text-jd-orange" />
                    Andheri West, Mumbai
                  </p>
                  <p className="flex items-center gap-2 text-xs ">
                    <i className="fa-regular fa-clock w-3 text-jd-orange" />
                    Open until 10:30 PM
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold ">
                    ₹₹₹
                  </span>
                  <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-semibold ">
                    542 Reviews
                  </span>
                  <span className="rounded-full bg-jd-light px-3 py-1.5 text-[10px] font-semibold text-jd-orange">
                    4.6 km away
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-jd-line pt-4">
                  <a
                    href="tel:+919821334455"
                    className="flex items-center gap-2 text-xs font-bold text-ink hover:text-jd-orange"
                  >
                    <i className="fa-solid fa-phone text-jd-orange" />
                    +91 98213 34455
                  </a>
                  <Button
                    variant="unstyled"
                    size="unstyled"
                    type="button"
                    className="rounded-full bg-jd-orange px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-jd-hover"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </article>
          {/* Result Card 5 */}
          <article className="group mb-4 overflow-hidden rounded-2xl border border-jd-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-jd-border hover:shadow-orange">
            <div className="flex flex-col sm:flex-row"></div>
          </article>
        </div>
      </div>
    </section>
  );
}
