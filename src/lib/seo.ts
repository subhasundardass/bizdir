const BRAND = 'YourBrand'
const YEAR = new Date().getFullYear()

// ---------- helpers ----------
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.:;–-]+$/, '') + '…'
}

// Brand is dropped automatically if it would push the title over the limit
function withBrand(title: string, max = 60): string {
  const full = `${title} | ${BRAND}`
  return full.length <= max ? full : truncate(title, max)
}

// Deterministic pick: same page always gets the same template,
// but different pages get different ones (avoids near-duplicate metadata)
function pick<T>(items: T[], seed: string): T {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return items[h % items.length]
}

const plural = (n: number, one: string, many = one + 's') =>
  `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`

// ---------- types ----------
export type Meta = {
  title: string
  description: string
  robots: 'index,follow' | 'noindex,follow'
}

const MIN_LISTINGS_TO_INDEX = 5   // thin-page threshold, tune this

// ---------- city page ----------
export function cityMeta(d: {
  city: string; totalListings: number; topCategories: string[]
}): Meta {
  const cats = d.topCategories.slice(0, 3).join(', ')
  return {
    title: withBrand(`Business Directory in ${d.city} – Find Local Services`),
    description: truncate(
      `Browse ${plural(d.totalListings, 'business', 'businesses')} in ${d.city}. ` +
      `Find ${cats} and more, with addresses, phone numbers and reviews.`, 155),
    robots: d.totalListings >= MIN_LISTINGS_TO_INDEX ? 'index,follow' : 'noindex,follow',
  }
}

// ---------- city + category page ----------
export function categoryMeta(d: {
  city: string
  category: string          // display name, plural: "Restaurants"
  count: number
  topRated?: string[]       // names of top-rated listings
  page?: number
}): Meta {
  const pageSuffix = d.page && d.page > 1 ? ` – Page ${d.page}` : ''
  const seed = `${d.city}/${d.category}`

  const title = pick([
    `Best ${d.category} in ${d.city} (${YEAR})`,
    `Top ${d.count > 10 ? d.count : 10} ${d.category} in ${d.city}`,
    `${d.category} in ${d.city} – Reviews & Contacts`,
  ], seed) + pageSuffix

  const named = d.topRated?.slice(0, 3).join(', ')
  const description = truncate(
    named
      ? `Compare ${plural(d.count, 'listing')} for ${d.category.toLowerCase()} in ${d.city}, ` +
        `including ${named}. See phone numbers, addresses, hours and ratings.`
      : `Find ${d.category.toLowerCase()} in ${d.city}. ` +
        `${plural(d.count, 'listing')} with phone numbers, addresses, hours and ratings.`,
    155)

  return {
    title: withBrand(title),
    description,
    robots: d.count >= MIN_LISTINGS_TO_INDEX ? 'index,follow' : 'noindex,follow',
  }
}

// ---------- city + category + area page ----------
export function areaMeta(d: {
  city: string; category: string; area: string; count: number; page?: number
}): Meta {
  const pageSuffix = d.page && d.page > 1 ? ` – Page ${d.page}` : ''
  return {
    title: withBrand(`${d.category} in ${d.area}, ${d.city}${pageSuffix}`),
    description: truncate(
      `${plural(d.count, d.category.replace(/s$/, ''))} in ${d.area}, ${d.city}. ` +
      `Check ratings, opening hours, contact details and directions.`, 155),
    robots: d.count >= 3 ? 'index,follow' : 'noindex,follow',
  }
}

// ---------- business listing ----------
export function businessMeta(d: {
  name: string
  category: string          // singular: "Chinese Restaurant"
  area?: string
  city: string
  rating?: number
  reviewCount?: number
  description?: string      // owner/editor-written, if any
  hasPhone: boolean
  hasPhotos: boolean
}): Meta {
  const place = d.area ? `${d.area}, ${d.city}` : d.city
  const title = withBrand(`${d.name} – ${d.category} in ${place}`)

  const ratingText =
    d.rating && d.reviewCount && d.reviewCount >= 3
      ? `Rated ${d.rating.toFixed(1)}/5 by ${plural(d.reviewCount, 'reviewer')}. `
      : ''

  const description = d.description
    ? truncate(d.description, 155)
    : truncate(
        `${d.name} is a ${d.category.toLowerCase()} in ${place}. ${ratingText}` +
        `See address, phone number, opening hours and directions.`, 155)

  // A listing with almost no content shouldn't be indexed yet
  const contentScore =
    Number(!!d.description) + Number(d.hasPhone) + Number(d.hasPhotos) +
    Number((d.reviewCount ?? 0) > 0)

  return { title, description, robots: contentScore >= 2 ? 'index,follow' : 'noindex,follow' }
}

// ---------- static pages ----------
export const homeMeta = (): Meta => ({
  title: `${BRAND} – Find Local Businesses Across India`,
  description: 'Discover trusted local businesses, read genuine reviews and get contact details, addresses and directions in your city.',
  robots: 'index,follow',
})