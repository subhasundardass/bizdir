export const categoryOptions = [
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'cafes', label: 'Cafes' },
  { value: 'fastFood', label: 'Fast Food' }
] as const;
export type SearchFilters = {
  categories: string[];
  pureVeg: boolean;
  openNow: boolean;
  minRating?: number;
  distance?: number;
  sort: 'auto' | 'relevance' | 'rating' | 'reviews' | 'distance';
};
export function parseSearchFilters(value: Record<string, unknown>): SearchFilters {
  const categories = Array.isArray(value.categories)
    ? value.categories
    : typeof value.categories === 'string'
      ? value.categories.split(',')
      : [];
  return {
    categories: [
      ...new Set(
        categories.filter((item): item is string =>
          categoryOptions.some((option) => option.value === item)
        )
      )
    ],
    pureVeg: value.pureVeg === true || value.pureVeg === 'true',
    openNow: value.openNow === true || value.openNow === 'true',
    minRating: [3.5, 4, 4.5].includes(Number(value.minRating))
      ? Number(value.minRating)
      : undefined,
    distance: [1, 3, 5].includes(Number(value.distance)) ? Number(value.distance) : undefined,
    sort: ['relevance', 'rating', 'reviews', 'distance'].includes(String(value.sort))
      ? (value.sort as SearchFilters['sort'])
      : 'auto'
  };
}
