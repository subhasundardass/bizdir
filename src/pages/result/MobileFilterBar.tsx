import { SortSelect, type FilterProps } from "./Filters";
export function MobileFilterBar({
  open,
  onToggle,
  ...props
}: FilterProps & { open: boolean; onToggle: () => void }) {
  return (
    <div className="sticky top-16 z-30 border-b border-jd-line bg-white lg:hidden">
      <div className="flex min-h-12 items-center justify-between gap-2 px-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="text-xs font-semibold text-jd-orange"
        >
          {open ? "Hide filters" : "Filters"}
        </button>
        <SortSelect {...props} />
      </div>
    </div>
  );
}
