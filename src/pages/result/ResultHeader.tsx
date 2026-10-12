import { Button } from "@/components/ui/button";
export function ResultHeader({
  query,
  location,
  total,
  nearest = false,
}: {
  query: string;
  location: string;
  total?: number;
  nearest?: boolean;
}) {
  return (
    <section className="border-b border-jd-line bg-white">
      <div className="mx-auto max-w-360 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {query || "Search businesses"}
              {location ? ` in ${location}` : ""}
            </h1>
            <p className="mt-1.5 text-sm ">
              {total === undefined
                ? "Search local businesses and services"
                : `${total} businesses found${location ? ` near ${location}` : ""}`}
            </p>
          </div>
          {/* Desktop sort */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs font-medium text-gray-500">Sort by</span>
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="flex items-center gap-2 rounded-full border border-jd-line bg-white px-4 py-2.5 text-xs font-semibold text-ink transition-all duration-200 hover:border-jd-border hover:text-jd-orange"
            >
              {nearest ? "Nearest first" : "Relevance"}
              <i className="fa-solid fa-chevron-down text-[9px] text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
