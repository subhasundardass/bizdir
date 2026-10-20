import { categoryOptions, type SearchFilters } from '@/client-app/shared/searchFilters';
import { useId } from 'react';
import { Checkbox } from '@/client-app/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/client-app/components/ui/radio-group';
import { Label } from '@/client-app/components/ui/label';
import { Button } from '@/client-app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/client-app/components/ui/select';
const checkboxStyle =
  'rounded-[3px] border-gray-400 shadow-none data-[state=checked]:border-jd-orange data-[state=checked]:bg-jd-orange data-[state=checked]:text-white focus-visible:border-jd-orange focus-visible:ring-jd-orange/30';
const radioStyle =
  'border-gray-400 text-jd-orange shadow-none data-[state=checked]:border-jd-orange focus-visible:border-jd-orange focus-visible:ring-jd-orange/30 [&_svg]:fill-jd-orange';
const labelStyle = 'cursor-pointer gap-3 text-xs font-normal leading-5';
export type FilterProps = {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  hasLocation: boolean;
  requestLocation: () => void;
};
export function Filters({ filters, onChange, hasLocation, requestLocation }: FilterProps) {
  const id = useId();
  return (
    <div className='rounded-2xl border border-jd-line bg-white p-4 text-xs space-y-5'>
      <div className='flex justify-between'>
        <h2 className='font-bold'>Filters</h2>
        <Button
          type='button'
          variant='unstyled'
          size='unstyled'
          className='text-jd-orange hover:text-jd-hover focus-visible:ring-jd-orange/30'
          onClick={() =>
            onChange({
              categories: [],
              pureVeg: false,
              openNow: false,
              minRating: undefined,
              distance: undefined
            })
          }
        >
          Clear All
        </Button>
      </div>
      <fieldset className='space-y-3'>
        <legend className='mb-3 font-bold'>Category</legend>
        {categoryOptions.map((option) => (
          <Label key={option.value} htmlFor={`${id}-${option.value}`} className={labelStyle}>
            <Checkbox
              id={`${id}-${option.value}`}
              className={checkboxStyle}
              checked={filters.categories.includes(option.value)}
              onCheckedChange={(checked) =>
                onChange({
                  categories:
                    checked === true
                      ? [...filters.categories, option.value]
                      : filters.categories.filter((value) => value !== option.value)
                })
              }
            />
            {option.label}
          </Label>
        ))}
        <Label htmlFor={`${id}-pureVeg`} className={labelStyle}>
          <Checkbox
            className={checkboxStyle}
            id={`${id}-pureVeg`}
            checked={filters.pureVeg}
            onCheckedChange={(checked) => onChange({ pureVeg: checked === true })}
          />
          Pure Veg
        </Label>
      </fieldset>
      <fieldset className='space-y-3'>
        <legend className='mb-3 font-bold'>Rating</legend>
        <RadioGroup
          aria-label='Minimum rating'
          value={String(filters.minRating ?? 'any')}
          onValueChange={(value) =>
            onChange({ minRating: value === 'any' ? undefined : Number(value) })
          }
        >
          {[undefined, 4.5, 4, 3.5].map((rating) => (
            <Label
              key={rating ?? 'any'}
              htmlFor={`${id}-rating-${rating ?? 'any'}`}
              className={labelStyle}
            >
              <RadioGroupItem
                id={`${id}-rating-${rating ?? 'any'}`}
                value={String(rating ?? 'any')}
                className={radioStyle}
              />
              {rating ? `${rating.toFixed(1)}+` : 'Any rating'}
            </Label>
          ))}
        </RadioGroup>
      </fieldset>
      <fieldset>
        <legend className='mb-3 font-bold'>Availability</legend>
        <Label htmlFor={`${id}-openNow`} className={labelStyle}>
          <Checkbox
            className={checkboxStyle}
            id={`${id}-openNow`}
            checked={filters.openNow}
            onCheckedChange={(checked) => onChange({ openNow: checked === true })}
          />
          Open Now
        </Label>
      </fieldset>
      <fieldset className='space-y-3'>
        <legend className='mb-3 font-bold'>Distance</legend>
        <RadioGroup
          aria-label='Maximum distance'
          value={String(filters.distance ?? 'any')}
          onValueChange={(value) =>
            onChange({ distance: value === 'any' ? undefined : Number(value) })
          }
        >
          {[undefined, 1, 3, 5].map((distance) => (
            <Label
              key={distance ?? 'any'}
              htmlFor={`${id}-distance-${distance ?? 'any'}`}
              className={`${labelStyle} ${distance && !hasLocation ? 'opacity-50' : ''}`}
            >
              <RadioGroupItem
                id={`${id}-distance-${distance ?? 'any'}`}
                disabled={!!distance && !hasLocation}
                value={String(distance ?? 'any')}
                className={radioStyle}
              />
              {distance ? `Within ${distance} km` : 'Any distance'}
            </Label>
          ))}
        </RadioGroup>
        {!hasLocation && (
          <Button
            type='button'
            variant='unstyled'
            size='unstyled'
            onClick={requestLocation}
            className='text-jd-orange hover:text-jd-hover focus-visible:ring-jd-orange/30'
          >
            Enable location to filter by distance
          </Button>
        )}
      </fieldset>
    </div>
  );
}
export function SortSelect({
  filters,
  onChange,
  hasLocation
}: Omit<FilterProps, 'requestLocation'>) {
  return (
    <div className='flex items-center gap-2 text-xs'>
      <span>Sort by</span>
      <Select
        value={filters.sort}
        onValueChange={(value) => onChange({ sort: value as SearchFilters['sort'] })}
      >
        <SelectTrigger
          aria-label='Sort businesses'
          className='rounded-full border-jd-line bg-white text-xs text-ink hover:border-jd-border focus-visible:border-jd-orange focus-visible:ring-jd-orange/30'
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='auto'>
            {hasLocation ? 'Nearest first (default)' : 'Default'}
          </SelectItem>
          <SelectItem value='relevance'>Relevance</SelectItem>
          <SelectItem value='rating'>Highest rated</SelectItem>
          <SelectItem value='reviews'>Most reviewed</SelectItem>
          <SelectItem value='distance' disabled={!hasLocation}>
            Nearest first
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
