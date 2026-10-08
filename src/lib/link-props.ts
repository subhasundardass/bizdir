// lib/link-props.ts
import type { UrlTarget } from './urls'

export function linkProps(t: UrlTarget) {
  switch (t.type) {
    case 'home':
      return { to: '/' } as const
    case 'categories':
      return { to: '/categories' } as const
    case 'city':
      return { to: '/$city', params: { city: t.city } } as const
    case 'category':
      return {
        to: '/$city/$category',
        params: { city: t.city, category: t.category },
      } as const
    case 'area':
      return {
        to: '/$city/$category/in-{$area}',
        params: { city: t.city, category: t.category, area: t.area },
      } as const
    case 'business':
      return { to: '/biz/$slug', params: { slug: t.slug } } as const
  }
}

// import { Link } from '@tanstack/react-router'

// <Link {...linkProps({ type: 'category', city: 'siliguri', category: 'restaurants' })}>
//   Restaurants in Siliguri
// </Link>