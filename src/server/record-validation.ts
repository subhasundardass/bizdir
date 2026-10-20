import { models, type Model, type Field } from '@/features/admin/models';
import { options } from '@/features/admin/options';
export type Row = Record<string, any>;
export function getModel(name: string) {
  const m = models.find((x) => x.name === name);
  if (!m) throw new Error('Unknown resource.');
  return m;
}
export function convert(f: Field, v: any): any {
  if (v === null || v === '' || v === undefined) {
    if (f.required) throw new Error(`${f.name.replaceAll('_', ' ')} is required.`);
    return null;
  }
  if (f.type === 'Boolean') {
    if (typeof v !== 'boolean') throw new Error(`Invalid ${f.name}.`);
    return v;
  }
  if (f.type === 'BigInt') {
    if (!/^\d+$/.test(String(v))) throw new Error(`Invalid ${f.name}.`);
    const id = BigInt(v);
    if (id < 1n || id > 9223372036854775807n) throw new Error(`Invalid ${f.name}.`);
    return id;
  }
  if (f.type === 'Int' || f.type === 'Decimal') {
    if (!['string', 'number'].includes(typeof v) || (typeof v === 'string' && !v.trim()))
      throw new Error(`Invalid ${f.name}.`);
    const n = Number(v);
    if (
      !Number.isFinite(n) ||
      (f.type === 'Int' && (!Number.isInteger(n) || n < -2147483648 || n > 2147483647))
    )
      throw new Error(`Invalid ${f.name}.`);
    return n;
  }
  if (f.type === 'DateTime') {
    const d = new Date(
      f.timeOnly && !String(v).includes('T') ? `1970-01-01T${v.length === 5 ? v + ':00' : v}Z` : v
    );
    if (
      f.dateOnly &&
      typeof v === 'string' &&
      (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(v) ||
        (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) !== v.slice(0, 10)))
    )
      throw new Error(`Invalid ${f.name}.`);
    if (isNaN(d.getTime())) throw new Error(`Invalid ${f.name}.`);
    return d;
  }
  if (f.type === 'Json') return typeof v === 'string' ? JSON.parse(v) : v;
  if (typeof v !== 'string') throw new Error(`Invalid ${f.name}.`);
  const text = v.trim();
  if (f.required && !text) throw new Error(`${f.name} is required.`);
  return text || null;
}
export function key(m: Model, row: Row) {
  const k = Object.fromEntries(
    m.keys.map((n) => [n, convert(m.fields.find((f) => f.name === n)!, row[n])])
  );
  return m.keys.length === 1 ? k : { [m.keys.join('_')]: k };
}
export function clean(m: Model, values: Row, editing: boolean) {
  const out: Row = {};
  for (const f of m.fields) {
    if (f.generated || (editing && m.keys.includes(f.name))) continue;
    if (values[f.name] === undefined) {
      if (!editing && f.required && f.default === undefined)
        throw new Error(`${f.name} is required.`);
      continue;
    }
    let v = convert(f, values[f.name]);
    if (
      f.name === 'text' &&
      ['concept_alias', 'location_alias', 'attribute_alias', 'business_alias'].includes(m.name) &&
      typeof v === 'string'
    )
      v = v.toLowerCase().replace(/\s+/g, ' ').trim();
    if (
      f.name === 'slug' &&
      typeof v === 'string' &&
      !(
        ['concept', 'attribute', 'attribute_option'].includes(m.name)
          ? /^[a-z0-9]+(_[a-z0-9]+)*$/
          : /^[a-z0-9]+(-[a-z0-9]+)*$/
      ).test(v)
    )
      throw new Error(
        'Use a lowercase slug with numbers and ' +
          (['concept', 'attribute', 'attribute_option'].includes(m.name)
            ? 'underscores.'
            : 'hyphens.')
      );
    if (v !== null && f.name === 'customer_phone' && !/^\+[1-9][0-9]{7,14}$/.test(v))
      throw new Error(
        'Customer phone numbers must use international format, such as +14155552671.'
      );
    if (v !== null && ['phone', 'whatsapp'].includes(f.name) && !/^\+91[6-9][0-9]{9}$/.test(v))
      throw new Error(
        'Phone numbers must use +91 followed by a valid 10-digit Indian mobile number.'
      );
    const ranges: Record<string, [number, number]> = {
      weekday: [0, 6],
      price_level: [1, 3],
      year_established: [1800, 2100],
      rating: [1, 5],
      trust: [0, 1],
      commission_pct: [0, 100],
      guests: [1, 32767]
    };
    if (
      v !== null &&
      ranges[f.name] &&
      (Number(v) < ranges[f.name][0] || Number(v) > ranges[f.name][1])
    )
      throw new Error(
        `${f.name.replaceAll('_', ' ')} must be between ${ranges[f.name].join(' and ')}.`
      );
    if (
      v !== null &&
      ['amount', 'amount_paid', 'flat_fee_inr', 'booking_value', 'commission_amount'].includes(
        f.name
      ) &&
      Number(v) < 0
    )
      throw new Error('Amounts cannot be negative.');
    const choices = options[`${m.name}.${f.name}`];
    if (choices && !choices.includes(v)) throw new Error(`Invalid ${f.name}.`);
    out[f.name] = v;
  }
  if (out.open_time && out.close_time && out.close_time <= out.open_time)
    throw new Error('Closing time must be after opening time.');
  if (out.starts_on && out.ends_on && out.ends_on < out.starts_on)
    throw new Error('The subscription end date must be on or after the start date.');
  if (out.period_month && out.period_month.getUTCDate() !== 1)
    throw new Error('Choose the first day of the payout month.');
  if (m.fields.some((f) => f.name === 'updated_at')) out.updated_at = new Date();
  return out;
}

export function coordinates(
  values: Row,
  required: boolean
): { latitude: number; longitude: number } | null | undefined {
  const supplied = values.latitude !== undefined || values.longitude !== undefined;
  if (!supplied) {
    if (required) throw new Error('Enter valid latitude and longitude.');
    return undefined;
  }
  const empty = (v: unknown) =>
    v === null || v === undefined || (typeof v === 'string' && !v.trim());
  if (empty(values.latitude) && empty(values.longitude)) {
    if (required) throw new Error('Place coordinates are required.');
    return null;
  }
  if (empty(values.latitude) || empty(values.longitude))
    throw new Error('Provide both latitude and longitude.');
  if (
    !['number', 'string'].includes(typeof values.latitude) ||
    !['number', 'string'].includes(typeof values.longitude)
  )
    throw new Error('Enter valid coordinates.');
  const latitude = Number(values.latitude),
    longitude = Number(values.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  )
    throw new Error('Enter valid coordinates.');
  return { latitude, longitude };
}
