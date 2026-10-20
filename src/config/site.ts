/**
 * Central site metadata used for SEO, Open Graph / Twitter cards, the sitemap,
 * and the `llms.txt` AEO file.
 *
 * `url` is the canonical production origin — update it to your deployed domain.
 * It is used to build absolute URLs for og:image / twitter:image and the sitemap.
 */
export const siteConfig = {
  name: 'JustDial',
  // Canonical production URL — change this to your deployed domain.
  url: import.meta.env.VITE_SITE_URL || 'http://localhost:3000',
  description: 'Discover local businesses and manage the JustDial directory in one application.',
  // Path (relative to the site root) of the Open Graph / Twitter share image.
  ogImage: '/tanstack-dashboard.png',
  keywords: [
    'TanStack Start',
    'TanStack Router',
    'TanStack Query',
    'admin dashboard',
    'dashboard template',
    'React admin dashboard',
    'shadcn/ui',
    'Base UI',
    'Tailwind CSS',
    'React',
    'TypeScript',
    'admin panel',
    'starter template',
    'SaaS boilerplate'
  ],
  links: {
    github: 'https://github.com/Kiranism/tanstack-start-dashboard',
    demo: 'https://dub.sh/tanstack-start-dashboard'
  }
} as const;

export type SiteConfig = typeof siteConfig;
