// lib/head.ts
import type { Meta } from './seo'

export function buildHead(m: Meta, canonical: string, jsonLd?: object[]) {
  return {
    meta: [
      { title: m.title },
      { name: 'description', content: m.description },
      { name: 'robots', content: m.robots },
      { property: 'og:title', content: m.title },
      { property: 'og:description', content: m.description },
      { property: 'og:url', content: canonical },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: canonical }],
    scripts: (jsonLd ?? []).map(obj => ({
      type: 'application/ld+json',
      children: JSON.stringify(obj),
    })),
  }
}