export function ResultHeader() {
  return (
    <section className="border-b border-jd-line bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Restaurants in Mumbai
            </h1>
            <p className="mt-1.5 text-sm ">
              4,860+ restaurants found near Mumbai
            </p>
          </div>
          {/* Desktop sort */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs font-medium text-gray-500">Sort by</span>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-jd-line bg-white px-4 py-2.5 text-xs font-semibold text-ink transition-all duration-200 hover:border-jd-border hover:text-jd-orange"
            >
              Relevance
              <i className="fa-solid fa-chevron-down text-[9px] text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
