import { CircleCheck } from "lucide-react";

const BRAND = "YourBrand"; // move to a shared constant, imported by lib/seo.ts too

const linkClass =
  "text-sm text-sub transition-colors duration-200 hover:text-jd-orange";

const columns = [
  {
    title: `About ${BRAND}`,
    links: [
      { label: "About Us", href: "/about/" },
      { label: "Careers", href: "/careers/" },
      { label: "Press", href: "/press/" },
      { label: "Blog", href: "/blog/" },
    ],
  },
  {
    title: "For Businesses",
    links: [
      { label: "List Your Business", href: "/list-your-business/" },
      { label: "Advertise", href: "/advertise/" },
      { label: "Business App", href: "/business-app/" },
      { label: "Support", href: "/contact/" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "Nearby", href: "/nearby/" },
      { label: "Top Rated", href: "/top-rated/" },
      { label: "Offers", href: "/offers/" },
      { label: "Gift Cards", href: "/gift-cards/" },
    ],
  },
];

const socials = [
  { label: "Facebook", icon: "fa-facebook-f", href: "#" },
  { label: "X (Twitter)", icon: "fa-x-twitter", href: "#" },
  { label: "Instagram", icon: "fa-instagram", href: "#" },
  { label: "YouTube", icon: "fa-youtube", href: "#" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2.5">
              <span className="jd-logo-mark">YB</span>
              <span className="text-xl font-extrabold tracking-[-0.05em] text-ink">
                Your<span className="text-jd-orange">Brand</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-6 text-sub">
              India's local search destination for discovering trusted
              businesses, services and experiences around you.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-success">
                <CircleCheck className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-sub">
                Trusted local discovery
              </span>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col, i) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-bold text-ink">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={linkClass}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Contact sits under the last column */}
              {i === columns.length - 1 && (
                <div className="mt-5 space-y-2">
                  <a
                    href="tel:18001234567"
                    className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-jd-orange"
                  >
                    <i
                      className="fa-solid fa-phone text-jd-orange"
                      aria-hidden="true"
                    />
                    1800 123 4567
                  </a>
                  <a
                    href="mailto:support@example.com"
                    className="flex items-center gap-2 text-sm text-sub hover:text-jd-orange"
                  >
                    <i
                      className="fa-solid fa-envelope text-jd-orange"
                      aria-hidden="true"
                    />
                    support@example.com
                  </a>
                </div>
              )}
            </nav>
          ))}
        </div>

        {/* App badges */}
        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">
              Get the {BRAND} app
            </p>
            <p className="mt-1 text-xs text-sub">
              Search local businesses wherever you go.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="#"
              aria-label="Download on the App Store"
              className="flex min-w-[145px] items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-white transition-colors duration-200 hover:bg-gray-800"
            >
              <i className="fa-brands fa-apple text-xl" aria-hidden="true" />
              <span>
                <span className="block text-[8px] uppercase leading-none text-gray-300">
                  Download on the
                </span>
                <span className="block text-sm font-semibold leading-5">
                  App Store
                </span>
              </span>
            </a>
            <a
              href="#"
              aria-label="Get it on Google Play"
              className="flex min-w-[145px] items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-white transition-colors duration-200 hover:bg-gray-800"
            >
              <i
                className="fa-brands fa-google-play text-lg"
                aria-hidden="true"
              />
              <span>
                <span className="block text-[8px] uppercase leading-none text-gray-300">
                  Get it on
                </span>
                <span className="block text-sm font-semibold leading-5">
                  Google Play
                </span>
              </span>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col gap-5 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-faint">
            © {year} {BRAND}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-alt text-sub transition-colors duration-200 hover:bg-jd-light hover:text-jd-orange"
              >
                <i
                  className={`fa-brands ${s.icon} text-sm`}
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
