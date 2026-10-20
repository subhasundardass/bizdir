import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search } from 'lucide-react';
import { suggestSearchFn } from '@/client-app/server/functions/suggestSearchFn';

export type SearchValues = {
  query: string;
  location: string;
  locationId?: number;
};

function SuggestionInput({
  type,
  value,
  onChange,
  onSelect
}: {
  type: 'concept' | 'location';
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string, id: number) => void;
}) {
  const [debounced, setDebounced] = useState(value);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
      setActive(-1);
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);
  const suggestions = useQuery({
    queryKey: ['search-suggestions', type, debounced],
    queryFn: () => suggestSearchFn({ data: { query: debounced, type } }),
    enabled: focused && debounced.trim().length >= 2,
    staleTime: 60_000
  });
  const rows = debounced === value ? (suggestions.data ?? []) : [];
  const open = focused && value.trim().length >= 2;
  const select = (row: (typeof rows)[number]) => {
    onSelect(row.text, row.id);
    setFocused(false);
    setActive(-1);
  };
  const listId = `search-${type}-suggestions`;
  return (
    <div className='relative min-w-0 flex-1 text-left'>
      <div className='flex items-center gap-2 px-3 py-2'>
        {type === 'location' ? (
          <MapPin className='h-4 w-4 shrink-0 text-jd-orange' />
        ) : (
          <Search className='h-4 w-4 shrink-0 text-jd-orange' />
        )}
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setFocused(true);
            setActive(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setFocused(false);
              setActive(-1);
            }
            if (event.key === 'ArrowDown' && rows.length) {
              event.preventDefault();
              setFocused(true);
              setActive((index) => (index + 1) % rows.length);
            }
            if (event.key === 'ArrowUp' && rows.length) {
              event.preventDefault();
              setActive((index) => (index - 1 + rows.length) % rows.length);
            }
            if (event.key === 'Enter' && open && active >= 0 && rows[active]) {
              event.preventDefault();
              select(rows[active]);
            }
          }}
          role='combobox'
          aria-autocomplete='list'
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          aria-label={type === 'location' ? 'Search location' : 'Search businesses and services'}
          placeholder={
            type === 'location' ? 'Type a city or locality' : 'Search businesses, services…'
          }
          maxLength={type === 'location' ? 200 : 300}
          required={type === 'concept'}
          minLength={type === 'concept' ? 2 : undefined}
          className='h-10 w-full min-w-0 bg-transparent text-sm text-ink outline-none'
        />
      </div>
      {open && (
        <div className='absolute left-0 right-0 top-full z-60 rounded-xl border border-jd-line bg-white p-1 shadow-lg'>
          <ul id={listId} role='listbox' aria-label={`${type} suggestions`}>
            {rows.map((row, index) => (
              <li
                id={`${listId}-${index}`}
                key={row.id}
                role='option'
                aria-selected={index === active}
              >
                <button
                  type='button'
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(row)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-jd-light ${index === active ? 'bg-jd-light' : ''}`}
                >
                  {row.label}
                </button>
              </li>
            ))}
          </ul>
          {suggestions.isFetching && (
            <p role='status' className='px-3 py-2 text-xs text-gray-500'>
              Finding suggestions…
            </p>
          )}
          {suggestions.isError && (
            <p role='alert' className='px-3 py-2 text-xs text-red-600'>
              Suggestions unavailable. You can still type and search.
            </p>
          )}
          {type === 'location' && (
            <p className='px-3 py-2 text-xs text-gray-500'>
              Select a match or search with your typed location.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function BusinessSearchForm({
  initialValues,
  onSearch,
  isFetching = false
}: {
  initialValues?: SearchValues;
  onSearch: (values: SearchValues) => void;
  isFetching?: boolean;
}) {
  const [values, setValues] = useState<SearchValues>(initialValues ?? { query: '', location: '' });
  useEffect(() => {
    setValues(initialValues ?? { query: '', location: '' });
  }, [initialValues?.query, initialValues?.location, initialValues?.locationId]);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (values.query.trim().length >= 2)
          onSearch({
            ...values,
            query: values.query.trim(),
            location: values.location.trim()
          });
      }}
      className='flex w-full flex-col rounded-2xl border border-jd-line bg-white p-1 shadow-sm sm:flex-row sm:items-center'
    >
      <SuggestionInput
        type='location'
        value={values.location}
        onChange={(location) => setValues((old) => ({ ...old, location, locationId: undefined }))}
        onSelect={(location, locationId) => setValues((old) => ({ ...old, location, locationId }))}
      />
      <SuggestionInput
        type='concept'
        value={values.query}
        onChange={(query) => setValues((old) => ({ ...old, query }))}
        onSelect={(query) => setValues((old) => ({ ...old, query }))}
      />
      <button
        type='submit'
        disabled={values.query.trim().length < 2 || isFetching}
        className='rounded-xl bg-jd-orange px-5 py-3 text-sm font-bold text-white disabled:opacity-50'
      >
        {isFetching ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
