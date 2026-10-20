# JustDial — directory and admin

One application for the public directory and its admin workspace, with one repository, one database configuration, one server, and one deployment. Both use the client's orange-and-white JustDial palette and Inter typography.

- Public directory: `/`
- Search results: `/result`
- Admin overview and sign-in: `/admin`
- Management screens: `/admin/business`, `/admin/location`, `/admin/concept`, and the other sections in the admin navigation.

Use the **Admin** link in the public header or footer. Use **View directory** in the admin header to return. All existing admin functionality remains available. Old `/dashboard` URLs redirect to `/admin`.

## Local setup

Requires Node.js 22.12 or newer.

```sh
npm install --legacy-peer-deps
npm run db:generate
npm run dev
```

Open **http://localhost:3000** for the directory, or **http://localhost:3000/admin** for administration. Sign in with `ADMIN_PASSWORD` from `.env.local`. For a fresh checkout, copy `.env.example` to `.env.local`, set a strong administrator password and a persistent session signing secret, and configure the database URL.

The server loads `.env.local` and `.env` from this project, without replacing existing environment variables. Set `DATABASE_URL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` there. Both public search and administration use the same Prisma/database singleton. The optional ignored `bizdir/` folder is reference material; it is not imported or required to run or deploy this application.

Run `npm run dev` **from this repository's root**, not from the reference folder. Stop any old dev server already using port 3000 before restarting. The dev server uses a strict port so it reports a conflict instead of silently moving the app to another port.

The public client's code lives in `src/client-app/`, admin UI in `src/features/admin/`, shared routes in `src/routes/`, and the shared database connection in `src/server/db.ts`. Environment files are ignored by Git; database credentials stay on the server. Restart the server after changing environment values.

## Directory management

| Area                    | Functionality                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Overview                | Live counts, recent places, pending listings/reviews, listing status, top cities, searches, and interactions                    |
| Places                  | Contact and address details, verification and publication status, city/locality, coordinates, primary category, and local names |
| Locations               | State → district → city → locality/landmark hierarchy, coordinates, aliases, and search radius                                  |
| Categories and services | Parent categories, service tags, aliases, category attributes, and local names                                                  |
| Attributes              | Yes/no, number, and choice attributes, options, aliases, and category assignments                                               |
| Place details           | Category tags, typed attribute values, media URLs, weekly opening hours, aliases, and date-specific closures                    |
| Community               | Users, review moderation, leads, creators, and ownership claims                                                                 |
| Commerce                | Business subscriptions and creator payouts                                                                                      |
| Activity                | Read-only search logs, clicks, search impressions, and lead status history                                                      |

All 22 editable application models support creation, updates, and confirmed deletion. Four audit/activity models remain read only. Lists provide search, status filtering where applicable, pagination, refresh, and readable references. Relationship selectors support name search and filter locality/option choices by their parent city/attribute.

Create reference locations and categories before adding places. New places require valid coordinates and a primary category. The place editor handles PostGIS coordinates and category assignments in one transaction. Use the Place details sections to add services, attributes, hours, media, and closures. Media entries accept hosted URLs; file upload/storage is not configured. Location boundary polygons and database views are not editable in this interface.

Review changes recalculate approved-review ratings. Approved ownership claims assign the claimant as the place owner. Booked leads require a booking value; commissions/payouts require the matching booking and guest confirmation. The database records lead status changes automatically. Subscriptions cannot overlap according to the existing database exclusion constraint.

Updates load the current database record before checking dependent values. Parent edits reject cycles and invalid geographic levels. Generated IDs, timestamps, and place rating aggregates are protected. Existing foreign keys and database cascade rules govern deletions; the confirmation explains that linked records may also be removed.

## Schema maintenance

The checked-in schema was introspected from the configured database because the reference client's schema omitted application tables and fields. No database migrations, schema pushes, or seeds run automatically.

After an intentional schema change, introspect and regenerate locally:

```sh
npx prisma db pull
npm run db:generate
```

`db:generate` also regenerates the admin field catalog. New resource labels and navigation entries must be added explicitly when introducing tables. PostGIS system metadata and derived database views are excluded from management.

## Verification

```sh
npm test
npm run typecheck
npm run db:check
npm run check:client
npm run test:db
npm run build
```

`db:check` reads directory counts. `check:client` verifies the integrated public search and suggestion services against the shared database. `test:db` creates isolated fixtures for every editable model, exercises updates/deletions and integrity rules, then rolls back the transaction. Test rows do not persist; PostgreSQL identity sequences can advance.

For HTTP verification, start the built app with `npm start`, then run `npm run check:smoke` in another terminal. Both default to port 3000. Set `PORT` and `ADMIN_TEST_URL` together to verify on another local port. The smoke suite checks `/`, `/admin`, legacy redirects, signs in, reads all 26 resources, checks filters and invalid requests, and signs out without saving database records. It reads the local password without printing it.

## Access and deployment

Authentication uses a shared administrator password for the `/admin` workspace. Signed HTTP-only same-site sessions expire after eight hours. Sign-in and mutations check the request origin, and sign-in attempts are limited in process.

Deploy this one application to Node.js with access to PostgreSQL/PostGIS. The public directory and `/admin` are served on the same origin; no second client/admin server is needed. Configure HTTPS, a strong `ADMIN_PASSWORD`, and a persistent `ADMIN_SESSION_SECRET`. Multiple instances should use infrastructure-level rate limiting. Build with `npm run build` and serve with `npm start`; set `PORT` as appropriate for the host.

The starter has an older Zod adapter peer declaration; `--legacy-peer-deps` accommodates that existing dependency conflict during installation.
