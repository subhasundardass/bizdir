-- =====================================================================
-- Siliguri Business Directory - Schema v1
-- Needs: PostgreSQL 14+ with PostGIS 3 and pg_trgm
-- Run order: 01_schema.sql -> 02_seed.sql -> 03_example_queries.sql
-- PostGIS reminder: points are (LONGITUDE, LATITUDE): ST_MakePoint(lng, lat)
-- Field descriptions: see DATA_DICTIONARY.md
-- =====================================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
-- Same normalisation for aliases and for user queries: lowercase, trim, collapse spaces
CREATE FUNCTION norm_text(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$ SELECT lower(btrim(regexp_replace(t, '\s+', ' ', 'g'))) $$;

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- Indian mobile number in one format: +91 followed by 10 digits starting 6-9
CREATE DOMAIN phone_in AS text CHECK (VALUE ~ '^\+91[6-9][0-9]{9}$');

-- ---------------------------------------------------------------------
-- 1. Users (owners, creators, admins)
-- ---------------------------------------------------------------------
CREATE TABLE app_user (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  phone      phone_in NOT NULL UNIQUE,
  email      text,
  role       text NOT NULL DEFAULT 'owner'
             CHECK (role IN ('owner','creator','admin','customer')),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. Locations (state > district > city > locality > landmark)
-- ---------------------------------------------------------------------
CREATE TABLE location (
  id            int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id     int REFERENCES location(id),
  level         text NOT NULL
                CHECK (level IN ('state','district','city','locality','landmark')),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  geom          geography(Point,4326),          -- centre point; NULL for state/district
  geom_verified boolean NOT NULL DEFAULT false, -- true once checked on a real map
  is_active     boolean NOT NULL DEFAULT true
);
CREATE INDEX location_parent_idx ON location (parent_id);
CREATE INDEX location_geom_idx   ON location USING gist (geom);

CREATE TABLE location_alias (
  location_id int  NOT NULL REFERENCES location(id) ON DELETE CASCADE,
  text        text NOT NULL CHECK (text = norm_text(text)),
  PRIMARY KEY (location_id, text)
);
-- Not UNIQUE on text on purpose: the same name can exist in two cities.
CREATE INDEX location_alias_text_idx ON location_alias (text);
CREATE INDEX location_alias_trgm_idx ON location_alias USING gin (text gin_trgm_ops);

-- ---------------------------------------------------------------------
-- 3. Taxonomy: concepts (categories/services) and their aliases
-- ---------------------------------------------------------------------
CREATE TABLE concept (
  id         int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug       text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name       text NOT NULL,
  type       text NOT NULL DEFAULT 'category' CHECK (type IN ('category','service')),
  parent_id  int REFERENCES concept(id),
  sort_order int NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX concept_parent_idx ON concept (parent_id);

CREATE TABLE concept_alias (
  id         int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  concept_id int  NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
  text       text NOT NULL UNIQUE CHECK (text = norm_text(text)),
  kind       text NOT NULL DEFAULT 'synonym'
             CHECK (kind IN ('main','synonym','misspelling','local','abbreviation')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX concept_alias_concept_idx ON concept_alias (concept_id);
CREATE INDEX concept_alias_trgm_idx    ON concept_alias USING gin (text gin_trgm_ops);

-- Yes/no features a business can tick (vegetarian, parking, home service ...)
CREATE TABLE attribute (
  id        int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug      text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name      text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------
-- 4. Business
-- ---------------------------------------------------------------------
CREATE TABLE business (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug            text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text NOT NULL,
  name_norm       text GENERATED ALWAYS AS (norm_text(name)) STORED,
  owner_user_id   bigint REFERENCES app_user(id),
  address         text,
  city_id         int NOT NULL REFERENCES location(id),
  locality_id     int REFERENCES location(id),
  pincode         text CHECK (pincode ~ '^[0-9]{6}$'),
  geom            geography(Point,4326) NOT NULL,
  phone           phone_in NOT NULL,
  whatsapp        phone_in,
  email           text,
  website         text,
  description     text CHECK (char_length(description) <= 500),
  year_established smallint CHECK (year_established BETWEEN 1800 AND 2100),
  price_level     smallint CHECK (price_level BETWEEN 1 AND 3),  -- 1 budget, 2 mid, 3 premium
  is_24x7         boolean NOT NULL DEFAULT false,
  verified        boolean NOT NULL DEFAULT false,
  rating          numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count    int NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','suspended','deleted')),
  source          text NOT NULL DEFAULT 'owner'
                  CHECK (source IN ('owner','team','osm','import','demo')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- Search touches only active businesses, so index only those
CREATE INDEX business_geom_active_idx ON business USING gist (geom) WHERE status = 'active';
CREATE INDEX business_city_active_idx ON business (city_id)         WHERE status = 'active';
CREATE INDEX business_locality_idx    ON business (locality_id)     WHERE status = 'active';
CREATE INDEX business_phone_idx       ON business (phone);
CREATE INDEX business_owner_idx       ON business (owner_user_id);
CREATE INDEX business_name_trgm_idx   ON business USING gin (name_norm gin_trgm_ops);

CREATE TRIGGER business_updated_at BEFORE UPDATE ON business
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Category / service tags. Exactly one is_primary row per business is enforced
-- by the unique index below; "at least one" is checked by the app on submit.
CREATE TABLE business_concept (
  business_id bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  concept_id  int    NOT NULL REFERENCES concept(id),
  is_primary  boolean NOT NULL DEFAULT false,
  PRIMARY KEY (business_id, concept_id)
);
CREATE UNIQUE INDEX business_one_primary_idx ON business_concept (business_id) WHERE is_primary;
CREATE INDEX business_concept_concept_idx    ON business_concept (concept_id);

CREATE TABLE business_attribute (
  business_id  bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  attribute_id int    NOT NULL REFERENCES attribute(id),
  PRIMARY KEY (business_id, attribute_id)
);
CREATE INDEX business_attribute_attr_idx ON business_attribute (attribute_id);

-- One row per open window. No row for a weekday = closed that day.
-- weekday: 0 = Sunday ... 6 = Saturday (matches Postgres extract(dow ...)).
-- Windows that pass midnight: split into two rows (e.g. 18:00-23:59 and 00:00-02:00 next day).
CREATE TABLE business_hours (
  business_id bigint   NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  weekday     smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  open_time   time     NOT NULL,
  close_time  time     NOT NULL,
  PRIMARY KEY (business_id, weekday, open_time),
  CHECK (close_time > open_time)
);

CREATE TABLE business_media (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  kind        text   NOT NULL DEFAULT 'photo' CHECK (kind IN ('logo','photo','menu')),
  url         text   NOT NULL,
  sort_order  int    NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_media_business_idx ON business_media (business_id, kind, sort_order);

-- Paid plans (verified badge, featured placement). Free listings have no row.
CREATE TABLE business_subscription (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  plan        text   NOT NULL CHECK (plan IN ('verified','featured','premium')),
  starts_on   date   NOT NULL,
  ends_on     date   NOT NULL,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  payment_ref text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on)
);
CREATE INDEX business_subscription_idx ON business_subscription (business_id, ends_on);

-- ---------------------------------------------------------------------
-- 5. Reviews (business.rating / review_count are cached from approved reviews)
-- ---------------------------------------------------------------------
CREATE TABLE review (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id   bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  user_id       bigint REFERENCES app_user(id),
  reviewer_name text   NOT NULL,
  rating        smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text CHECK (char_length(comment) <= 1000),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  trust         numeric(3,2) NOT NULL DEFAULT 1 CHECK (trust BETWEEN 0 AND 1),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX review_business_idx ON review (business_id, status, created_at DESC);

CREATE FUNCTION refresh_business_rating() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  bid bigint := COALESCE(NEW.business_id, OLD.business_id);
BEGIN
  UPDATE business b SET
    rating = COALESCE((SELECT round(avg(r.rating)::numeric, 1)
                       FROM review r WHERE r.business_id = bid AND r.status = 'approved'), 0),
    review_count = (SELECT count(*) FROM review r
                    WHERE r.business_id = bid AND r.status = 'approved')
  WHERE b.id = bid;
  RETURN NULL;
END $$;

CREATE TRIGGER review_refresh_rating
  AFTER INSERT OR UPDATE OR DELETE ON review
  FOR EACH ROW EXECUTE FUNCTION refresh_business_rating();

-- ---------------------------------------------------------------------
-- 6. Creators, leads and payouts
-- ---------------------------------------------------------------------
CREATE TABLE creator (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                bigint NOT NULL UNIQUE REFERENCES app_user(id),
  code                   text   NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_-]{3,30}$'),
  display_name           text   NOT NULL,
  channel_url            text,
  commission_pct         numeric(4,1) NOT NULL DEFAULT 5 CHECK (commission_pct BETWEEN 0 AND 100),
  flat_fee_inr           numeric(10,2) CHECK (flat_fee_inr >= 0),
  status                 text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','active','suspended')),
  disclosure_accepted_at timestamptz,   -- agreed to label videos as ad/partnership
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payout (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id   bigint NOT NULL REFERENCES creator(id),
  period_month date   NOT NULL CHECK (extract(day FROM period_month) = 1),
  amount       numeric(10,2) NOT NULL CHECK (amount >= 0),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  paid_at      timestamptz,
  reference    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, period_month)
);

CREATE TABLE lead (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id       bigint NOT NULL REFERENCES business(id),
  creator_id        bigint REFERENCES creator(id),     -- NULL = organic lead
  customer_name     text,
  customer_phone    phone_in NOT NULL,
  message           text,
  service_date      date,
  guests            smallint CHECK (guests > 0),
  source            text NOT NULL DEFAULT 'web'
                    CHECK (source IN ('web','whatsapp','missed_call','phone','creator')),
  consent_to_share  boolean NOT NULL DEFAULT false,    -- customer agreed to share number
  status            text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','booked','lost','spam')),
  booking_value     numeric(10,2) CHECK (booking_value >= 0),
  commission_amount numeric(10,2) CHECK (commission_amount >= 0),
  payout_id         bigint REFERENCES payout(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_business_idx ON lead (business_id, status, created_at DESC);
CREATE INDEX lead_creator_idx  ON lead (creator_id, status) WHERE creator_id IS NOT NULL;
CREATE INDEX lead_phone_idx    ON lead (customer_phone);

CREATE TRIGGER lead_updated_at BEFORE UPDATE ON lead
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- 7. Search analytics
-- ---------------------------------------------------------------------
CREATE TABLE search_log (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id       text,
  raw_query        text NOT NULL,
  normalized_query text,
  parsed           jsonb,                       -- parser output (concepts, location, filters)
  parser_tier      text CHECK (parser_tier IN ('rules','fuzzy','llm')),
  city_id          int REFERENCES location(id),
  user_geom        geography(Point,4326),       -- only if user allowed location
  result_count     int,
  took_ms          int,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX search_log_created_idx ON search_log (created_at);
CREATE INDEX search_log_query_idx   ON search_log (normalized_query);
CREATE INDEX search_log_zero_idx    ON search_log (created_at) WHERE result_count = 0;

CREATE TABLE click_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  search_id   bigint REFERENCES search_log(id) ON DELETE SET NULL,  -- NULL = direct visit
  business_id bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  action      text NOT NULL
              CHECK (action IN ('view','call','whatsapp','direction','share','enquiry')),
  position    smallint,                         -- rank shown in the results list
  session_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX click_log_business_idx ON click_log (business_id, action, created_at);
CREATE INDEX click_log_search_idx   ON click_log (search_id);

COMMIT;
