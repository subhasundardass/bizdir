import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Building2,
  RefreshCw,
  Eye,
  LoaderCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { models, type Model, type Field } from './models';
import { human, options, reference } from './options';
import { readData, saveRecord, deleteRecord, lookup } from './api';
type Row = Record<string, any>;
type LocationLevel = 'state' | 'district' | 'city' | 'locality' | 'landmark';
const descriptions: Record<string, string> = {
  business: 'Manage the places people discover, visit, and love.',
  location: 'Build your local reach, from states to neighborhoods.',
  concept: 'Organize the categories and services that connect people to places.',
  review: 'Build trust with thoughtful review moderation.',
  lead: 'Follow every enquiry from first contact to booking.',
  app_user: 'Manage the people behind your directory.'
};
function Relation({
  model,
  field,
  value,
  onChange,
  required,
  parentId,
  levels
}: {
  model: string;
  field: string;
  value: any;
  onChange: (v: string) => void;
  required: boolean;
  parentId?: string;
  levels?: LocationLevel[];
}) {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTerm(search), 250);
    return () => clearTimeout(t);
  }, [search]);
  const q = useQuery({
    queryKey: ['admin-lookup', model, term, value, field, parentId, levels],
    queryFn: () =>
      lookup({
        data: {
          model,
          search: term,
          id: value ? String(value) : undefined,
          field,
          parentId,
          levels
        }
      })
  });
  return (
    <div className='bd-relation'>
      <input
        aria-label={`Search ${human(field)} options`}
        placeholder='Search available records…'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        aria-label={human(field)}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value=''>{q.isPending ? 'Loading…' : 'Select a record'}</option>
        {value && !q.data?.some((r: any) => String(r.id) === String(value)) && (
          <option value={value}>Current record #{value}</option>
        )}
        {q.data?.map((r: any) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      {q.error && <small className='bd-field-error'>Could not load options.</small>}
      <small>Search by name to find records beyond the first 50.</small>
    </div>
  );
}
function Editor({
  m,
  original,
  onClose,
  onSaved
}: {
  m: Model;
  original?: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Row>(() =>
    original
      ? { ...original }
      : Object.fromEntries(
          m.fields
            .filter((f) => !f.generated)
            .map((f) => [f.name, f.default ?? (f.type === 'Boolean' ? false : '')])
        )
  );
  const panelRef = useRef<HTMLElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fields = m.fields.filter((f) => !f.generated);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]'
        ) ?? []
      );
    focusable()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab') {
        const items = focusable();
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
      document.removeEventListener('keydown', handler);
    };
  }, [busy, onClose]);
  const slugify = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        ['concept', 'attribute', 'attribute_option'].includes(m.name) ? '_' : '-'
      )
      .replace(/^[-_]+|[-_]+$/g, '');
  const set = (name: string, value: any) =>
    setValues((v) => ({
      ...v,
      [name]: value,
      ...(name === 'city_id' ? { locality_id: '' } : {}),
      ...(name === 'attribute_id' ? { option_id: '' } : {}),
      ...(m.name === 'location' && name === 'level' ? { parent_id: '' } : {}),
      ...(!original &&
      name === 'name' &&
      m.fields.some((f) => f.name === 'slug') &&
      (!v.slug || v.slug === slugify(v.name || ''))
        ? { slug: slugify(value) }
        : {})
    }));
  function control(f: Field) {
    const disabled = !!original && m.keys.includes(f.name);
    const choices = options[`${m.name}.${f.name}`];
    const ref = reference(m.name, f.name);
    let value = values[f.name] ?? '';
    if (f.type === 'Boolean')
      return (
        <label className='bd-toggle'>
          <input
            type='checkbox'
            checked={!!value}
            disabled={disabled}
            onChange={(e) => set(f.name, e.target.checked)}
          />
          <span>{value ? 'Enabled' : 'Disabled'}</span>
        </label>
      );
    if (choices)
      return (
        <select
          value={value}
          required={f.required}
          disabled={disabled}
          onChange={(e) => set(f.name, e.target.value)}
        >
          <option value=''>Select {human(f.name).toLowerCase()}</option>
          {choices.map((c) => (
            <option key={c} value={c}>
              {human(c)}
            </option>
          ))}
        </select>
      );
    if (ref && !disabled)
      return (
        <Relation
          model={ref}
          field={f.name}
          value={value}
          onChange={(v) => set(f.name, v)}
          required={f.required}
          parentId={
            f.name === 'locality_id' && values.city_id
              ? String(values.city_id)
              : f.name === 'option_id' && values.attribute_id
                ? String(values.attribute_id)
                : undefined
          }
          levels={
            m.name === 'location' && f.name === 'parent_id'
              ? (
                  {
                    state: [],
                    district: ['state'],
                    city: ['district'],
                    locality: ['city'],
                    landmark: ['city', 'locality']
                  } as Record<string, LocationLevel[]>
                )[values.level]
              : undefined
          }
        />
      );
    if (f.type === 'DateTime' && value) {
      const date = new Date(value);
      if (!isNaN(date.getTime()))
        value = f.timeOnly
          ? date.toISOString().slice(11, 19)
          : f.dateOnly
            ? date.toISOString().slice(0, 10)
            : new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
    }
    if (f.type === 'Json' && typeof value !== 'string') value = JSON.stringify(value, null, 2);
    if (['description', 'comment', 'message', 'srtext', 'parsed'].includes(f.name))
      return (
        <textarea
          rows={4}
          maxLength={f.name === 'description' ? 500 : f.name === 'comment' ? 1000 : undefined}
          value={value}
          required={f.required}
          disabled={disabled}
          onChange={(e) => set(f.name, e.target.value)}
        />
      );
    return (
      <input
        value={value}
        required={f.required}
        disabled={disabled}
        type={
          f.type === 'DateTime'
            ? f.timeOnly
              ? 'time'
              : f.dateOnly
                ? 'date'
                : 'datetime-local'
            : ['Int', 'Decimal', 'BigInt'].includes(f.type)
              ? 'number'
              : f.name === 'email'
                ? 'email'
                : f.name === 'website' || f.name === 'url' || f.name === 'channel_url'
                  ? 'url'
                  : 'text'
        }
        step={f.type === 'Decimal' ? 'any' : '1'}
        placeholder={
          f.name === 'phone' || f.name === 'customer_phone'
            ? '+919876543210'
            : f.name === 'slug'
              ? ['concept', 'attribute', 'attribute_option'].includes(m.name)
                ? 'example_category'
                : 'example-place'
              : ''
        }
        onChange={(e) =>
          set(
            f.name,
            f.type === 'DateTime' && !f.dateOnly && !f.timeOnly && e.target.value
              ? new Date(e.target.value).toISOString()
              : e.target.value
          )
        }
      />
    );
  }
  return (
    <div className='bd-modal-backdrop'>
      <section
        ref={panelRef}
        className='bd-editor'
        role='dialog'
        aria-modal='true'
        aria-labelledby='editor-title'
      >
        <div className='bd-editor-heading'>
          <div>
            <span className='bd-eyebrow'>{original ? 'EDIT RECORD' : 'GROW YOUR DIRECTORY'}</span>
            <h2 id='editor-title'>
              {original ? 'Edit' : 'Add'}{' '}
              {m.name === 'business' ? 'place' : human(m.name).toLowerCase()}
            </h2>
          </div>
          <button className='bd-icon' aria-label='Close editor' disabled={busy} onClick={onClose}>
            <X />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await saveRecord({ data: { model: m.name, values, original } });
              toast.success('Record saved');
              onSaved();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className='bd-editor-body'>
            {m.name === 'business' && (
              <div className='bd-form-note'>
                Add the place details below. After saving, use Place categories, Place attributes,
                Opening hours, and Place media to complete the listing.
              </div>
            )}
            {m.name === 'business_attribute' && (
              <div className='bd-form-note'>
                For a yes/no attribute, leave numeric value and option empty. Number attributes
                require a numeric value; choice attributes require an option belonging to that
                attribute.
              </div>
            )}
            <div className='bd-form-grid'>
              {m.name === 'business' && (
                <label className='bd-field bd-full'>
                  <span>
                    Primary category <b>*</b>
                  </span>
                  <Relation
                    model='concept'
                    field='primary_concept_id'
                    value={values.primary_concept_id}
                    onChange={(v) => set('primary_concept_id', v)}
                    required
                  />
                </label>
              )}
              {fields.map((f) => (
                <label
                  className={
                    ['description', 'comment', 'message', 'parsed'].includes(f.name)
                      ? 'bd-field bd-full'
                      : 'bd-field'
                  }
                  key={f.name}
                >
                  <span>
                    {human(f.name)} {f.required && <b>*</b>}
                  </span>
                  {control(f)}
                  {f.name === 'slug' && (
                    <small>
                      Unique URL identifier. Use lowercase letters, numbers, and{' '}
                      {['concept', 'attribute', 'attribute_option'].includes(m.name)
                        ? 'underscores'
                        : 'hyphens'}
                      .
                    </small>
                  )}
                </label>
              ))}
              {['business', 'location'].includes(m.name) &&
                ['latitude', 'longitude'].map((n) => (
                  <label className='bd-field' key={n}>
                    <span>
                      {human(n)} {m.name === 'business' && <b>*</b>}
                    </span>
                    <input
                      type='number'
                      step='any'
                      min={n === 'latitude' ? -90 : -180}
                      max={n === 'latitude' ? 90 : 180}
                      required={m.name === 'business'}
                      value={values[n] ?? ''}
                      onChange={(e) => set(n, e.target.value)}
                    />
                    <small>Coordinates for nearby and map searches.</small>
                  </label>
                ))}
            </div>
            {error && (
              <div role='alert' className='bd-error'>
                {error}
              </div>
            )}
          </div>
          <div className='bd-editor-footer'>
            <span>* Required fields</span>
            <button type='button' className='bd-btn' disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button className='bd-btn bd-primary' disabled={busy}>
              {busy && <LoaderCircle size={15} className='bd-spin' />}
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
function display(value: any) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
export function ResourcePage({ resource }: { resource: string }) {
  const m = models.find((x) => x.name === resource);
  const cache = useQueryClient();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Row | null | undefined>();
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [inspecting, setInspecting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const q = useQuery({
    queryKey: ['admin-records', resource, page, term, status],
    queryFn: () => readData({ data: { model: resource, page, search: term, status } }),
    enabled: !!m,
    retry: 1
  });
  if (!m)
    return (
      <div className='bd-content'>
        <h1>Resource not found</h1>
        <p>Choose a resource from the navigation.</p>
      </div>
    );
  const invalidate = () => {
    cache.invalidateQueries({ queryKey: ['admin-records'] });
    cache.invalidateQueries({ queryKey: ['admin-overview'] });
    cache.invalidateQueries({ queryKey: ['admin-lookup'] });
  };
  const priority: Record<string, string[]> = {
    business: ['name', 'phone', 'city_id', 'status', 'verified', 'created_at'],
    location: ['name', 'level', 'parent_id', 'slug', 'is_active'],
    concept: ['name', 'type', 'slug', 'parent_id', 'is_active'],
    app_user: ['name', 'phone', 'email', 'role', 'is_active'],
    review: ['reviewer_name', 'business_id', 'rating', 'comment', 'status'],
    lead: ['customer_name', 'customer_phone', 'business_id', 'status', 'created_at']
  };
  const columns =
    priority[m.name] ||
    m.fields
      .filter((f) => !f.generated || f.name === 'id')
      .slice(0, 6)
      .map((f) => f.name);
  return (
    <div className='bd-content'>
      <div className='bd-page-heading'>
        <div>
          <span className='bd-eyebrow'>
            {m.readonly ? 'DIRECTORY INSIGHTS' : 'DIRECTORY MANAGEMENT'}
          </span>
          <h1>
            {m.label}
            <span className='bd-title-dot'>.</span>
          </h1>
          <p>{descriptions[m.name] || `Manage ${m.label.toLowerCase()} across your directory.`}</p>
        </div>
        {!m.readonly && (
          <button className='bd-btn bd-primary' onClick={() => setEditor(null)}>
            <Plus size={17} />
            Add {m.name === 'business' ? 'place' : 'record'}
          </button>
        )}
      </div>
      <div className='bd-card'>
        <div className='bd-resource-toolbar'>
          <div className='bd-search'>
            <Search size={17} />
            <input
              aria-label='Search records'
              placeholder={`Search ${m.label.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className='bd-icon' aria-label='Clear search' onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className='bd-table-tools'>
            {options[`${m.name}.status`] && (
              <label className='bd-status-filter'>
                <SlidersHorizontal size={15} />
                <select
                  aria-label='Filter by status'
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value=''>All statuses</option>
                  {options[`${m.name}.status`].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            <button className='bd-btn bd-small' onClick={() => q.refetch()} disabled={q.isFetching}>
              <RefreshCw size={14} className={q.isFetching ? 'bd-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        <div className='bd-list-caption'>
          <strong>{m.label}</strong>
          <span>{q.data?.total ?? '—'} records</span>
          {m.readonly && <span>Read only</span>}
        </div>
        {q.error ? (
          <div role='alert' className='bd-error'>
            Unable to load records. Check your connection or sign in again.{' '}
            <button onClick={() => q.refetch()}>Retry</button>
          </div>
        ) : (
          <div className='bd-table-wrap'>
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{human(c)}</th>
                  ))}
                  <th className='bd-action-cell'>{m.readonly ? 'Details' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {q.data?.rows.map((r: Row) => (
                  <tr key={m.keys.map((k) => r[k]).join(':')}>
                    {columns.map((c, i) => (
                      <td key={c}>
                        {c === 'status' ? (
                          <span className={`bd-pill ${r[c]}`}>{r[c]}</span>
                        ) : c === 'is_active' || c === 'verified' ? (
                          <span className={`bd-pill ${r[c] ? 'active' : 'muted'}`}>
                            {r[c] ? 'Yes' : 'No'}
                          </span>
                        ) : c === 'created_at' ? (
                          new Date(r[c]).toLocaleDateString()
                        ) : i === 0 ? (
                          <strong>{display(r._labels?.[c] ?? r[c])}</strong>
                        ) : (
                          <span title={display(r._labels?.[c] ?? r[c])} className='bd-truncate'>
                            {display(r._labels?.[c] ?? r[c])}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className='bd-action-cell'>
                      {m.readonly && (
                        <button
                          className='bd-icon'
                          aria-label='View record details'
                          onClick={() => setInspecting(r)}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {!m.readonly && (
                        <>
                          <button
                            className='bd-icon'
                            aria-label='Edit record'
                            onClick={() => setEditor(r)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className='bd-icon bd-danger'
                            aria-label='Delete record'
                            onClick={() => {
                              setDeleteError('');
                              setDeleting(r);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {q.isPending ? (
              <div className='bd-empty'>
                <LoaderCircle className='bd-spin' />
                <p>Loading records…</p>
              </div>
            ) : (
              !q.data?.rows.length && (
                <div className='bd-empty'>
                  <Building2 size={32} />
                  <h3>{term || status ? 'No matching records' : 'A fresh start'}</h3>
                  <p>
                    {term || status
                      ? 'Try another search or clear your filters.'
                      : `Add your first ${m.name === 'business' ? 'place' : 'record'} to get started.`}
                  </p>
                  {!m.readonly && !term && !status && (
                    <button className='bd-btn' onClick={() => setEditor(null)}>
                      <Plus size={15} />
                      Add record
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        )}
        <div className='bd-pagination'>
          <span>
            {q.data?.total
              ? `${page * 20 + 1}–${Math.min((page + 1) * 20, q.data.total)} of ${q.data.total}`
              : '0 records'}
          </span>
          <div>
            <button
              className='bd-btn bd-small'
              disabled={page === 0 || q.isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              className='bd-btn bd-small'
              disabled={!q.data || (page + 1) * 20 >= q.data.total || q.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
      {inspecting && (
        <div className='bd-modal-backdrop'>
          <section
            className='bd-editor'
            role='dialog'
            aria-modal='true'
            aria-labelledby='details-title'
          >
            <div className='bd-editor-heading'>
              <h2 id='details-title'>Record details</h2>
              <button
                className='bd-icon'
                aria-label='Close details'
                onClick={() => setInspecting(null)}
              >
                <X />
              </button>
            </div>
            <div className='bd-editor-body'>
              <dl className='bd-details'>
                {Object.entries(inspecting)
                  .filter(([key]) => !key.startsWith('_'))
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt>{human(key)}</dt>
                      <dd>
                        {typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : display(value)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          </section>
        </div>
      )}
      {editor !== undefined && (
        <Editor
          m={m}
          original={editor ?? undefined}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            invalidate();
          }}
        />
      )}
      {deleting && (
        <div className='bd-modal-backdrop'>
          <section
            className='bd-confirm'
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-title'
          >
            <span className='bd-delete-icon'>
              <Trash2 />
            </span>
            <h2 id='delete-title'>Delete this record?</h2>
            <p>
              This permanently removes the record. Related records may also be removed according to
              the database relationships.
            </p>
            {deleteError && <div className='bd-error'>{deleteError}</div>}
            <div>
              <button className='bd-btn' disabled={busy} onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button
                className='bd-btn bd-delete-button'
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await deleteRecord({ data: { model: m.name, original: deleting } });
                    setDeleting(null);
                    toast.success('Record deleted');
                    if (q.data?.rows.length === 1 && page > 0) setPage((p) => p - 1);
                    invalidate();
                  } catch (e) {
                    setDeleteError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? 'Deleting…' : 'Delete record'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
