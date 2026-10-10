import { Search } from "lucide-react";

export type SearchBusinessesParams = {
  query: string;
  page?: number;
  perPage?: number;
};

type HeaderProps = {
  query: string;
  setQuery: (value: string) => void;
  onSearch: () => void;
  isFetching: boolean;
};

export function Header({ query, setQuery, onSearch, isFetching }: HeaderProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      onSearch();
    }
  }

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
          <div className="flex h-11 w-full max-w-3xl items-center overflow-hidden rounded-full border border-jd-line bg-white shadow-sm">
            {/* Search Input */}
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <Search className="h-4 w-4 shrink-0 text-jd-orange" />

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Search businesses"
                placeholder="Search businesses, services..."
                className="w-full bg-transparent text-sm font-medium text-ink outline-none"
              />
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={onSearch}
              disabled={query.trim().length < 2 || isFetching}
              aria-label="Search"
              className="mr-1 flex h-9 w-10 shrink-0 items-center justify-center rounded-full bg-jd-orange text-white transition-all duration-200 hover:bg-jd-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-2 sm:px-5"
            >
              <i className="fa-solid fa-magnifying-glass text-xs" />

              <span className="hidden text-xs font-bold sm:inline">
                {isFetching ? "Searching..." : "Search"}
              </span>
            </button>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="hidden rounded-full border border-jd-orange px-4 py-2 text-xs font-semibold text-jd-orange transition-all duration-200 hover:bg-jd-orange hover:text-white lg:inline-flex"
          >
            Login / Sign Up
          </button>

          <button
            type="button"
            aria-label="Shopping bag"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-jd-orange transition-all duration-200 hover:bg-jd-light"
          >
            <i className="fa-solid fa-bag-shopping" />

            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-jd-orange px-1 text-[9px] font-bold text-white ring-2 ring-white">
              3
            </span>
          </button>
        </div>
      </div>

      {/* Temporary Search Debug Output */}
      {/* <div className="border-t border-jd-line bg-gray-50 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="mb-1 text-xs font-semibold text-gray-500">
            Search Result
          </div>

          {search.isFetching && (
            <div className="text-xs text-gray-500">
              Searching for: <strong>{searchQuery}</strong>
            </div>
          )}

          {search.isError && (
            <pre className="overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {search.error instanceof Error
                ? search.error.message
                : String(search.error)}
            </pre>
          )}

          {search.isSuccess && (
            <pre className="max-h-60 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-700 shadow-sm">
              {JSON.stringify(search.data, null, 2)}
            </pre>
          )}
        </div>
      </div> */}
    </header>
  );
}
