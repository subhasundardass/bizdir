export function MobileFilterBar() {
  return (
    <div className="sticky top-16 z-30 border-b border-jd-line bg-white sm:hidden">
      <div className="flex h-12 items-center divide-x divide-jd-line">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold text-ink transition-all duration-200 hover:bg-jd-light"
        >
          <i className="fa-solid fa-sliders text-jd-orange" />
          Filters
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold text-ink transition-all duration-200 hover:bg-jd-light"
        >
          <i className="fa-solid fa-arrow-down-wide-short text-jd-orange" />
          Sort
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold text-ink transition-all duration-200 hover:bg-jd-light"
        >
          <i className="fa-solid fa-map text-jd-orange" />
          Map
        </button>
      </div>
    </div>
  );
}
