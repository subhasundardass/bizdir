import { Button } from "@/components/ui/button";
export function MobileFilterBar() {
  return (
    <div className="sticky top-16 z-30 border-b border-jd-line bg-white sm:hidden">
      <div className="flex h-12 items-center divide-x divide-jd-line">
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold text-ink transition-all duration-200 hover:bg-jd-light"
        >
          <i className="fa-solid fa-sliders text-jd-orange" />
          Filters
        </Button>
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold text-ink transition-all duration-200 hover:bg-jd-light"
        >
          <i className="fa-solid fa-arrow-down-wide-short text-jd-orange" />
          Sort
        </Button>
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold text-ink transition-all duration-200 hover:bg-jd-light"
        >
          <i className="fa-solid fa-map text-jd-orange" />
          Map
        </Button>
      </div>
    </div>
  );
}
