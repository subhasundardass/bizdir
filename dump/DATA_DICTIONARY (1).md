# Siliguri Directory: Data Dictionary

Companion to `01_schema.sql`. "Req" = required (NOT NULL without a default).
Types shown are simplified. `phone_in` = text in the format `+91` + 10 digits starting 6 to 9.

## How the tables connect

```
location ──< location_alias
concept  ──< concept_alias
business ──< business_concept >── concept
business ──< business_attribute >── attribute
business ──< business_hours, business_media, business_subscription, review
creator ──< lead >── business        creator ──< payout ──< lead
search_log ──< click_log >── business
```

## app_user
People who log in. Customers are optional; most visitors stay anonymous.

| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | Primary key |
| name | text | yes | Full name |
| phone | phone_in | yes | Login and contact number, unique. Verify by OTP |
| email | text | no | Optional |
| role | text | yes | `owner`, `creator`, `admin`, `customer` (default `owner`) |
| is_active | bool | yes | Set false to block a user without deleting them |
| created_at | timestamptz | auto | Signup time |

## location
One row per place in the tree: state > district > city > locality > landmark.

| Field | Type | Req | Description |
|---|---|---|---|
| id | int | auto | Primary key |
| parent_id | int | no | The place one level up (locality's parent is the city). NULL for state |
| level | text | yes | `state`, `district`, `city`, `locality`, `landmark` |
| name | text | yes | Display name, e.g. "Hakim Para" |
| slug | text | yes | URL-safe unique name, e.g. `hakim-para` |
| geom | geography(Point) | no | Centre point, (longitude, latitude). NULL for state and district |
| geom_verified | bool | yes | False until someone checked the point on a real map |
| is_active | bool | yes | Hide a place without deleting it |

## location_alias
Other spellings of a place.

| Field | Type | Req | Description |
|---|---|---|---|
| location_id | int | yes | The place this spelling belongs to |
| text | text | yes | Lowercase, single-spaced spelling, e.g. `hakimpara`. Not unique across the table, because two cities can share a name; the parser picks by city context |

## concept
The taxonomy: categories and services people can search for.

| Field | Type | Req | Description |
|---|---|---|---|
| id | int | auto | Primary key |
| slug | text | yes | Stable code used by your software, e.g. `ac_repair`. Never rename it |
| name | text | yes | Display name, can change freely |
| type | text | yes | `category` (a kind of business) or `service` (a specific job under a category) |
| parent_id | int | no | Parent concept, e.g. AC Repair sits under Home Services |
| sort_order | int | yes | Order in menus |
| is_active | bool | yes | Hide without deleting |
| created_at | timestamptz | auto | |

## concept_alias
Every phrase a person might type for a concept.

| Field | Type | Req | Description |
|---|---|---|---|
| id | int | auto | |
| concept_id | int | yes | The concept this phrase means |
| text | text | yes | Lowercase, single-spaced phrase. Unique: one phrase means one concept |
| kind | text | yes | `main`, `synonym`, `misspelling`, `local`, `abbreviation`. Only for managing the list |
| created_at | timestamptz | auto | |

Keep filters ("near me", "24 hour", "cheap") out of this table. The parser handles those.

## attribute
Yes/no features a business can tick.

| Field | Type | Req | Description |
|---|---|---|---|
| id | int | auto | |
| slug | text | yes | e.g. `vegetarian`, `home_service` |
| name | text | yes | Display label |
| is_active | bool | yes | |

## business
The main listing.

| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | Primary key |
| slug | text | yes | Unique URL name, e.g. `sharma-ac-service` |
| name | text | yes | Business name as shown |
| name_norm | text | auto | Lowercase copy of name, generated. Used for typo and partial-name search |
| owner_user_id | bigint | no | The user who manages this listing |
| address | text | no | Street address in plain text |
| city_id | int | yes | The city (a `location` row) |
| locality_id | int | no | The locality (a `location` row) |
| pincode | text | no | 6 digits |
| geom | geography(Point) | yes | Shop position from the map pin, (longitude, latitude). Distance search depends on this |
| phone | phone_in | yes | Main number. Verify by OTP |
| whatsapp | phone_in | no | WhatsApp number if different |
| email | text | no | |
| website | text | no | |
| description | text | no | Up to 500 characters |
| year_established | smallint | no | |
| price_level | smallint | no | 1 budget, 2 mid, 3 premium. Powers "cheap" searches |
| is_24x7 | bool | yes | True if open all day, every day (no hour rows needed) |
| verified | bool | yes | Set by your team after phone and document checks. Never by the owner |
| rating | numeric(2,1) | yes | Cached average of approved reviews. Maintained by a trigger |
| review_count | int | yes | Cached count of approved reviews. Maintained by a trigger |
| status | text | yes | `pending` (new), `active` (visible), `suspended`, `deleted`. Search shows only `active` |
| source | text | yes | Where the listing came from: `owner`, `team`, `osm`, `import`, `demo` |
| created_at / updated_at | timestamptz | auto | `updated_at` changes on every edit by trigger |

## business_concept
Which categories and services a business offers.

| Field | Type | Req | Description |
|---|---|---|---|
| business_id | bigint | yes | |
| concept_id | int | yes | A category or service |
| is_primary | bool | yes | The main category. A unique index allows only one per business |

## business_attribute
| Field | Type | Req | Description |
|---|---|---|---|
| business_id | bigint | yes | |
| attribute_id | int | yes | A ticked feature |

## business_hours
One row per open window. No row means closed that day. 24x7 businesses use `is_24x7` instead.

| Field | Type | Req | Description |
|---|---|---|---|
| business_id | bigint | yes | |
| weekday | smallint | yes | 0 = Sunday ... 6 = Saturday |
| open_time | time | yes | Local (India) time |
| close_time | time | yes | Must be after `open_time`. For a window that passes midnight, add two rows |

## business_media
| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | |
| business_id | bigint | yes | |
| kind | text | yes | `logo`, `photo`, `menu` |
| url | text | yes | File location (store the image in object storage, keep only the URL here) |
| sort_order | int | yes | Display order |
| created_at | timestamptz | auto | |

## business_subscription
Paid plans. A business with no row has the free listing.

| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | |
| business_id | bigint | yes | |
| plan | text | yes | `verified`, `featured`, `premium` |
| starts_on / ends_on | date | yes | Plan period. A plan counts only between these dates |
| amount_paid | numeric | yes | Rupees received |
| payment_ref | text | no | Payment gateway or UPI reference |
| created_at | timestamptz | auto | |

## review
| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | |
| business_id | bigint | yes | |
| user_id | bigint | no | Logged-in reviewer, if any |
| reviewer_name | text | yes | Name shown |
| rating | smallint | yes | 1 to 5 |
| comment | text | no | Up to 1000 characters |
| status | text | yes | `pending`, `approved`, `rejected`. Only `approved` counts toward the rating |
| trust | numeric(3,2) | yes | 0 to 1. Lower it for suspicious reviewers. Reserved for later weighting; the current trigger uses a plain average |
| created_at | timestamptz | auto | |

## creator
A YouTuber or promoter who brings leads.

| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | |
| user_id | bigint | yes | The login for this creator, one creator per user |
| code | text | yes | Referral code in links, e.g. `?ref=demotravels`. Lowercase, 3 to 30 characters |
| display_name | text | yes | Channel or brand name |
| channel_url | text | no | |
| commission_pct | numeric(4,1) | yes | Share of booking value, default 5 |
| flat_fee_inr | numeric | no | Alternative: fixed rupees per booked lead |
| status | text | yes | `pending`, `active`, `suspended` |
| disclosure_accepted_at | timestamptz | no | When the creator agreed to label content as an ad or partnership |
| created_at | timestamptz | auto | |

## payout
Monthly payment to a creator.

| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | |
| creator_id | bigint | yes | |
| period_month | date | yes | First day of the month being paid. One payout per creator per month |
| amount | numeric | yes | Rupees |
| status | text | yes | `pending`, `paid`, `cancelled` |
| paid_at | timestamptz | no | |
| reference | text | no | Bank or UPI transaction reference |
| created_at | timestamptz | auto | |

## lead
An enquiry sent to a business.

| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | |
| business_id | bigint | yes | The business enquired |
| creator_id | bigint | no | Which creator's link brought the visitor. NULL = organic |
| customer_name | text | no | |
| customer_phone | phone_in | yes | Customer's number |
| message | text | no | What they asked |
| service_date | date | no | Wanted date (check-in, appointment, visit) |
| guests | smallint | no | People count (homestays, hotels, cabs) |
| source | text | yes | `web`, `whatsapp`, `missed_call`, `phone`, `creator` |
| consent_to_share | bool | yes | Customer agreed to share their number with the business |
| status | text | yes | `new`, `contacted`, `booked`, `lost`, `spam` |
| booking_value | numeric | no | Rupees, set when booked |
| commission_amount | numeric | no | Creator's share for this lead |
| payout_id | bigint | no | Set when the commission is included in a payout |
| created_at / updated_at | timestamptz | auto | |

## search_log
One row per search. Your most valuable table for improving aliases and ranking.

| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | |
| session_id | text | no | Anonymous visit id |
| raw_query | text | yes | Exactly what the user typed |
| normalized_query | text | no | Lowercased, cleaned version |
| parsed | jsonb | no | What the parser understood (concept, location, filters) |
| parser_tier | text | no | `rules`, `fuzzy`, `llm`: which stage resolved it |
| city_id | int | no | City context |
| user_geom | geography(Point) | no | User's point, only if they allowed location. Treat as personal data |
| result_count | int | no | Results returned. 0 = a missing alias or missing business |
| took_ms | int | no | Search time |
| created_at | timestamptz | auto | |

This table grows fastest. Partition by month or delete old rows once it is large.

## click_log
What people did after searching.

| Field | Type | Req | Description |
|---|---|---|---|
| id | bigint | auto | |
| search_id | bigint | no | The search that led here. NULL = direct visit |
| business_id | bigint | yes | |
| action | text | yes | `view`, `call`, `whatsapp`, `direction`, `share`, `enquiry` |
| position | smallint | no | Rank in the result list. Needed to correct for position bias later |
| session_id | text | no | |
| created_at | timestamptz | auto | |

## Category-specific attributes (added by `04_category_attributes.sql`)

**New columns on `attribute`:** `value_type` (`bool`, `number`, `choice`), `allow_multiple` (pick many options, e.g. cuisine), `unit` (e.g. `rooms`, `INR`), `is_filterable` (show as a search filter), `sort_order`.

**attribute_option:** the pick-list for `choice` attributes.

| Field | Description |
|---|---|
| attribute_id | The choice attribute, e.g. `cuisine` |
| slug / name | Code and label, e.g. `north_indian` / "North Indian" |
| sort_order | Display order |

**attribute_alias:** words people type for an attribute (`veg` means `vegetarian`). The parser applies it only if the attribute is valid for the category already found.

**concept_attribute:** which category uses which attribute.

| Field | Description |
|---|---|
| concept_id | A group or category. Children inherit it |
| attribute_id | The attribute that applies |
| is_required | Owner must fill it when adding a business |
| sort_order | Order on the form |

**concept_attribute_effective (view):** every concept with its own and inherited attributes. Use it for the add-business form, search filters, and validation.

**business_attribute changes:** now has `id`, `value_number` (for `number` attributes) and `option_id` (for `choice` attributes). For `bool` attributes a row means yes and no row means "not stated". Only one of `value_number` and `option_id` may be set.

## Fixes and additions (added by `05_fixes.sql`)

**New tables**

| Table | Purpose |
|---|---|
| lead_status_history | Every status change on a lead (`from_status`, `to_status`, `changed_by`, `note`, `changed_at`). Filled automatically by trigger. Use it to settle disputes |
| search_impression | Which businesses were shown for a search, at which `position`, in which `layer` (`organic`, `sponsored`, `featured`). Needed for click-through rate |
| business_claim | An owner's request to take over a listing (`pending`, `approved`, `rejected`, with `evidence_note` and reviewer) |
| business_alias | Other names a shop is known by (`former_name`, `short_name`, `local_spelling`, `other`) |
| business_closure | One-off closures such as holidays (`business_id`, `closed_on`, `reason`) |

**New views**
- `concept_tree`: every concept with all its descendants and the `depth`. Use it so a search for a parent category (Electronics) matches businesses tagged with children.
- `payout_reconciliation`: each payout beside the sum of its leads. A non-zero `difference` needs checking.
- `concept_attribute_effective` is rebuilt: the closest ancestor now wins, and loops are guarded.

**New columns**
- `location`: `default_radius_m` (area used for "in X" until a boundary exists), `boundary` (optional polygon), `name_local`
- `business`: `source_ref` (e.g. OpenStreetMap id; unique with `source`), `phone_verified_at`, `name_local`
- `app_user`: `phone_verified_at`
- `concept`: `name_local`
- `lead`: `contacted_at`, `guest_confirmed_at`; `customer_phone` now accepts international numbers (`phone_intl`)
- `search_log`: `user_lat`, `user_lng` (rounded to 2 decimals, about 1 km) replace the exact `user_geom`

**New rules enforced by the database**
- An attribute option must belong to its attribute; values must match the attribute type; single-choice attributes allow one option per business.
- An attribute can be saved only if one of the business's categories uses it (checked at commit).
- A primary tag must be a category. A service tag needs its parent category tag on the same business (checked at commit).
- A business can become `active` only after it has a primary category. Create it as `pending`, add tags, then activate.
- Location levels must nest correctly, and a business's locality must be inside its city.
- Location slugs are unique per parent, so URLs must include the city.
- A `booked` lead needs a booking value. A lead can join a payout only when booked, with a commission and a guest confirmation.
- One lead per phone per business per day (India time), unless marked spam.
- One review per user per business.
- Subscription overlap protection (same plan, overlapping dates) is included but needs the `btree_gist` extension.

Existing rows are not re-checked. The queries at the bottom of `05_fixes.sql` list old rows that break the new rules.

## Seed data notes
- Location coordinates are approximate and flagged `geom_verified = false`.
- Every business, review, lead, log row and phone number is fake (`source = 'demo'`).
  Remove with `DELETE FROM business WHERE source = 'demo';`
- Local-language aliases need review by someone from Siliguri.

## Not in this schema yet
WhatsApp/missed-call conversation state, OTP records, audit log of admin edits, a `suggestion` table for autocomplete, and a denormalized search table. Add them when you build those features.
