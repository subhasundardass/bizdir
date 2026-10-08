import { QueryClientProvider } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";

import Footer from "../components/Footer";
import { queryClient } from "../lib/queryClient";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "theme-color",
        content: "#FF6B00",
      },
      {
        title: "YourBrand – Find Local Businesses Across India",
      },
      {
        property: "og:site_name",
        content: "YourBrand",
      },
      {
        property: "og:locale",
        content: "en_IN",
      },
    ],

    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

/**
 * React application root.
 *
 * QueryClientProvider must wrap all routes/components
 * that use TanStack Query.
 */
function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

/**
 * HTML document shell.
 *
 * This is responsible for the document structure,
 * global layout, scripts and development tools.
 */
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>

      <body className="flex min-h-screen flex-col selection:bg-jd-border">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-jd-orange focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <main id="main" className="flex-1">
          {children}
        </main>

        <Footer />

        {import.meta.env.DEV && <DevTools />}

        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="page-wrap py-20 text-center">
      <h1 className="text-3xl font-extrabold text-ink">Page not found</h1>

      <p className="mt-2 text-sub">
        The page you're looking for doesn't exist or has moved.
      </p>

      <Link to="/" className="btn btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}

function DevTools() {
  return (
    <TanStackDevtools
      config={{
        position: "bottom-right",
      }}
      plugins={[
        {
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel />,
        },
      ]}
    />
  );
}
