import { categoryOptions, type SearchFilters } from "@/shared/searchFilters";
export type FilterProps = {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  hasLocation: boolean;
  requestLocation: () => void;
};
export function Filters({
  filters,
  onChange,
  hasLocation,
  requestLocation,
}: FilterProps) {
  return (
    <div className="rounded-2xl border border-jd-line bg-white p-4 text-xs space-y-5">
      <div className="flex justify-between">
        <h2 className="font-bold">Filters</h2>
        <button
          className="text-jd-orange"
          onClick={() =>
            onChange({
              categories: [],
              pureVeg: false,
              openNow: false,
              minRating: undefined,
              distance: undefined,
            })
          }
        >
          Clear All
        </button>
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-bold">Category</legend>
        {categoryOptions.map((option) => (
          <label key={option.value} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filters.categories.includes(option.value)}
              onChange={(event) =>
                onChange({
                  categories: event.target.checked
                    ? [...filters.categories, option.value]
                    : filters.categories.filter(
                        (value) => value !== option.value,
                      ),
                })
              }
            />
            {option.label}
          </label>
        ))}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={filters.pureVeg}
            onChange={(event) => onChange({ pureVeg: event.target.checked })}
          />
          Pure Veg
        </label>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-bold">Rating</legend>
        {[undefined, 4.5, 4, 3.5].map((rating) => (
          <label key={rating ?? "any"} className="flex items-center gap-3">
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === rating}
              onChange={() => onChange({ minRating: rating })}
            />
            {rating ? `${rating.toFixed(1)}+` : "Any rating"}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-3 font-bold">Availability</legend>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={filters.openNow}
            onChange={(event) => onChange({ openNow: event.target.checked })}
          />
          Open Now
        </label>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-bold">Distance</legend>
        {[undefined, 1, 3, 5].map((distance) => (
          <label key={distance ?? "any"} className="flex items-center gap-3">
            <input
              type="radio"
              name="distance"
              disabled={!!distance && !hasLocation}
              checked={filters.distance === distance}
              onChange={() => onChange({ distance })}
            />
            {distance ? `Within ${distance} km` : "Any distance"}
          </label>
        ))}
        {!hasLocation && (
          <button onClick={requestLocation} className="text-jd-orange">
            Enable location to filter by distance
          </button>
        )}
      </fieldset>
    </div>
  );
}
export function SortSelect({
  filters,
  onChange,
  hasLocation,
}: Omit<FilterProps, "requestLocation">) {
  return (
    <label className="flex items-center gap-2 text-xs">
      Sort by
      <select
        aria-label="Sort businesses"
        value={filters.sort}
        onChange={(event) =>
          onChange({ sort: event.target.value as SearchFilters["sort"] })
        }
        className="rounded-full border border-jd-line bg-white px-3 py-2"
      >
        <option value="auto">
          {hasLocation ? "Nearest first (default)" : "Default"}
        </option>
        <option value="relevance">Relevance</option>
        <option value="rating">Highest rated</option>
        <option value="reviews">Most reviewed</option>
        <option value="distance" disabled={!hasLocation}>
          Nearest first
        </option>
      </select>
    </label>
  );
}
