import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type HeaderProps = {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isFetching: boolean;
};

export function Header({ query, setQuery, onSearch, isFetching }: HeaderProps) {
  const { register, handleSubmit } = useForm<{ query: string }>({
    values: { query },
  });

  return (
    <header className="sticky top-0 z-50 border-b border-jd-line bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-360 items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="#"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="JustDial home"
        >
          <span className="jd-logo-mark">JD</span>

          <span className="hidden text-[21px] font-extrabold tracking-[-0.055em] sm:block">
            Just<span className="text-jd-orange">Dial</span>
          </span>
        </a>

        {/* Search */}
        <div className="flex min-w-0 flex-1 justify-center">
          <form
            onSubmit={handleSubmit(onSearch)}
            className="flex h-11 w-full max-w-3xl items-center overflow-hidden rounded-full border border-jd-line bg-white shadow-sm"
          >
            {/* Location */}
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="hidden h-full items-center gap-2 border-r border-jd-line px-4 text-left transition-all duration-200 hover:bg-jd-light md:flex md:w-[29%]"
            >
              <i className="fa-solid fa-location-dot text-sm text-jd-orange" />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium text-gray-500">
                  Location
                </span>

                <span className="block truncate text-xs font-semibold text-ink">
                  Siliguri, West Bengal
                </span>
              </span>

              <i className="fa-solid fa-chevron-down text-[9px] text-gray-500" />
            </Button>

            {/* Search Input */}
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <Search className="h-4 w-4 shrink-0 text-jd-orange" />

              <Input
                type="text"
                {...register("query", {
                  onChange: (event) => setQuery(event.target.value),
                  validate: (value) => value.trim().length >= 2,
                })}
                aria-label="Search businesses"
                placeholder="Search businesses, services..."
                className="h-auto min-w-0 rounded-none border-0 p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 w-full bg-transparent text-sm font-medium text-ink outline-none"
              />
            </div>

            {/* Search Button */}
            <Button
              variant="unstyled"
              size="unstyled"
              type="submit"
              disabled={query.trim().length < 2 || isFetching}
              aria-label="Search"
              className="mr-1 flex h-9 w-10 shrink-0 items-center justify-center rounded-full bg-jd-orange text-white transition-all duration-200 hover:bg-jd-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-2 sm:px-5"
            >
              <i className="fa-solid fa-magnifying-glass text-xs" />

              <span className="hidden text-xs font-bold sm:inline">
                {isFetching ? "Searching..." : "Search"}
              </span>
            </Button>
          </form>
        </div>

        {/* Header actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            className="hidden rounded-full border border-jd-orange px-4 py-2 text-xs font-semibold text-jd-orange transition-all duration-200 hover:bg-jd-orange hover:text-white lg:inline-flex"
          >
            Login / Sign Up
          </Button>

          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            aria-label="Shopping bag"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-jd-orange transition-all duration-200 hover:bg-jd-light"
          >
            <i className="fa-solid fa-bag-shopping" />

            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-jd-orange px-1 text-[9px] font-bold text-white ring-2 ring-white">
              3
            </span>
          </Button>
        </div>
      </div>

    </header>
  );
}
