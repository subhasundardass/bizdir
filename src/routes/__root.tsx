import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import appCss from '@/styles/globals.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#ff6b00' },
      { title: 'JustDial — Discover local businesses' }
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
    ]
  }),
  component: () => (
    <html lang='en-IN'>
      <head>
        <HeadContent />
      </head>
      <body>
        <Toaster theme='light' />
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
});
