-- =====================================================================
-- 05: Fixes from the schema review (run after 01, 02, 04)
-- A attributes | B categories | C locations | D leads & money
-- E logs & privacy | F imports & claims | G smaller fixes
-- Existing rows are not re-checked by the new triggers; run the checks at the
-- bottom of this file to find old rows that break the new rules.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- A. Attributes: make wrong data impossible
-- ---------------------------------------------------------------------

-- A1. An option must belong to the same attribute as the row that uses it.
ALTER TABLE attribute_option
  ADD CONSTRAINT attribute_option_id_attr_uq UNIQUE (id, attribute_id);
ALTER TABLE business_attribute
  ADD CONSTRAINT business_attribute_option_fk
  FOREIGN KEY (option_id, attribute_id) REFERENCES attribute_option (id, attribute_id);

-- A2. Value must match the attribute type; single-choice allows only one option.
CREATE FUNCTION check_business_attribute() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE a attribute%ROWTYPE;
BEGIN
  SELECT * INTO a FROM attribute WHERE id = NEW.attribute_id;
  IF a.value_type = 'bool' AND (NEW.value_number IS NOT NULL OR NEW.option_id IS NOT NULL) THEN
    RAISE EXCEPTION 'attribute % is yes/no: no number or option allowed', a.slug;
  ELSIF a.value_type = 'number' AND NEW.value_number IS NULL THEN
    RAISE EXCEPTION 'attribute % needs a number', a.slug;
  ELSIF a.value_type = 'choice' AND NEW.option_id IS NULL THEN
    RAISE EXCEPTION 'attribute % needs an option', a.slug;
  END IF;
  IF a.value_type = 'choice' AND NOT a.allow_multiple AND EXISTS (
       SELECT 1 FROM business_attribute x
       WHERE x.business_id = NEW.business_id AND x.attribute_id = NEW.attribute_id
         AND x.id IS DISTINCT FROM NEW.id) THEN
    RAISE EXCEPTION 'attribute % allows only one option per business', a.slug;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER business_attribute_check BEFORE INSERT OR UPDATE ON business_attribute
  FOR EACH ROW EXECUTE FUNCTION check_business_attribute();

-- ---------------------------------------------------------------------
-- B. Categories
-- ---------------------------------------------------------------------

-- B1. Descendant lookup: searching "Electronics" can now match laptop/mobile shops.
-- Use:  JOIN concept_tree t ON t.descendant_id = bc.concept_id WHERE t.ancestor_id = :id
CREATE VIEW concept_tree AS
WITH RECURSIVE t(ancestor_id, descendant_id, depth) AS (
  SELECT id, id, 0 FROM concept
  UNION ALL
  SELECT t.ancestor_id, c.id, t.depth + 1
  FROM t JOIN concept c ON c.parent_id = t.descendant_id
  WHERE t.depth < 10                       -- guard against loops
)
SELECT ancestor_id, descendant_id, depth FROM t;

-- B2. Inheritance: closest ancestor wins, so a child can override a parent's setting.
CREATE OR REPLACE VIEW concept_attribute_effective AS
SELECT DISTINCT ON (ct.descendant_id, ca.attribute_id)
       ct.descendant_id AS concept_id, ca.attribute_id, ca.is_required, ca.sort_order
FROM concept_tree ct
JOIN concept_attribute ca ON ca.concept_id = ct.ancestor_id
ORDER BY ct.descendant_id, ca.attribute_id, ct.depth;

ALTER TABLE concept ADD CONSTRAINT concept_not_own_parent CHECK (parent_id IS DISTINCT FROM id);

-- B3. Primary must be a category; a service tag needs its parent category tag too.
-- Deferred: checked at COMMIT, so tags can be inserted in any order.
CREATE FUNCTION check_business_concept() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE c concept%ROWTYPE;
BEGIN
  SELECT * INTO c FROM concept WHERE id = NEW.concept_id;
  IF NEW.is_primary AND c.type <> 'category' THEN
    RAISE EXCEPTION 'primary tag must be a category, % is a service', c.slug;
  END IF;
  IF c.type = 'service' AND c.parent_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM business_concept x
       WHERE x.business_id = NEW.business_id AND x.concept_id = c.parent_id) THEN
    RAISE EXCEPTION 'service % also needs its parent category on this business', c.slug;
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER business_concept_check AFTER INSERT OR UPDATE ON business_concept
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_business_concept();

-- B4. A business can go live only after it has a primary category.
-- Create it as 'pending', add tags, then set status = 'active'.
CREATE FUNCTION require_primary_before_active() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' AND NOT EXISTS (
       SELECT 1 FROM business_concept WHERE business_id = NEW.id AND is_primary) THEN
    RAISE EXCEPTION 'business % needs a primary category before it can be active', NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER business_require_primary BEFORE UPDATE OF status ON business
  FOR EACH ROW EXECUTE FUNCTION require_primary_before_active();

-- B5. An attribute can be saved only if one of the business's categories uses it.
CREATE FUNCTION check_attribute_applies() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM business_concept bc
       JOIN concept_attribute_effective e ON e.concept_id = bc.concept_id
       WHERE bc.business_id = NEW.business_id AND e.attribute_id = NEW.attribute_id) THEN
    RAISE EXCEPTION 'attribute % does not apply to this business''s categories', NEW.attribute_id;
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER business_attribute_applies AFTER INSERT OR UPDATE ON business_attribute
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_attribute_applies();

-- ---------------------------------------------------------------------
-- C. Locations
-- ---------------------------------------------------------------------

-- C1. Slugs unique per parent (two cities can both have a "civil-lines").
-- URLs should then include the city: /siliguri/hakim-para/ac-repair
ALTER TABLE location DROP CONSTRAINT location_slug_key;
CREATE UNIQUE INDEX location_slug_per_parent_idx ON location (COALESCE(parent_id, 0), slug);
ALTER TABLE location ADD CONSTRAINT location_not_own_parent CHECK (parent_id IS DISTINCT FROM id);

-- C2. Parent must be the right level (locality under city, and so on).
CREATE FUNCTION check_location_hierarchy() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE p_level text;
BEGIN
  IF NEW.parent_id IS NULL THEN
    IF NEW.level <> 'state' THEN
      RAISE EXCEPTION '% "%" needs a parent', NEW.level, NEW.name;
    END IF;
    RETURN NEW;
  END IF;
  SELECT level INTO p_level FROM location WHERE id = NEW.parent_id;
  IF NOT ( (NEW.level = 'district' AND p_level = 'state')
        OR (NEW.level = 'city'     AND p_level = 'district')
        OR (NEW.level = 'locality' AND p_level = 'city')
        OR (NEW.level = 'landmark' AND p_level IN ('city','locality')) ) THEN
    RAISE EXCEPTION '% "%" cannot sit under a %', NEW.level, NEW.name, p_level;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER location_hierarchy BEFORE INSERT OR UPDATE OF parent_id, level ON location
  FOR EACH ROW EXECUTE FUNCTION check_location_hierarchy();

-- C3. A business must point at a real city, and its locality must be inside that city.
CREATE FUNCTION check_business_location() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM location WHERE id = NEW.city_id AND level = 'city') THEN
    RAISE EXCEPTION 'city_id % is not a city', NEW.city_id;
  END IF;
  IF NEW.locality_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM location
       WHERE id = NEW.locality_id AND level = 'locality' AND parent_id = NEW.city_id) THEN
    RAISE EXCEPTION 'locality_id % is not a locality of city %', NEW.locality_id, NEW.city_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER business_location_check BEFORE INSERT OR UPDATE OF city_id, locality_id ON business
  FOR EACH ROW EXECUTE FUNCTION check_business_location();

-- C4. "In Hakim Para" needs an area, not just a centre point.
-- default_radius_m is the fallback; boundary (polygon) replaces it once you have one.
ALTER TABLE location
  ADD COLUMN default_radius_m int CHECK (default_radius_m > 0),
  ADD COLUMN boundary geography(MultiPolygon,4326),   -- add a GiST index once loaded
  ADD COLUMN name_local text;                          -- Bengali / Hindi display name
UPDATE location SET default_radius_m = CASE level
  WHEN 'city' THEN 8000 WHEN 'locality' THEN 1500 WHEN 'landmark' THEN 1000 END;

-- ---------------------------------------------------------------------
-- D. Leads and money
-- ---------------------------------------------------------------------

-- D1. Tourists may have non-Indian numbers: allow international format on leads.
CREATE DOMAIN phone_intl AS text CHECK (VALUE ~ '^\+[1-9][0-9]{7,14}$');
ALTER TABLE lead ALTER COLUMN customer_phone TYPE phone_intl USING customer_phone::text;

-- D2. Booked needs a value; a payout needs a confirmed guest.
ALTER TABLE lead
  ADD COLUMN contacted_at       timestamptz,
  ADD COLUMN guest_confirmed_at timestamptz;   -- guest replied "yes, I stayed / used it"
ALTER TABLE lead
  ADD CONSTRAINT lead_booked_needs_value
      CHECK (status <> 'booked' OR booking_value IS NOT NULL),
  ADD CONSTRAINT lead_commission_only_booked
      CHECK (commission_amount IS NULL OR status = 'booked'),
  ADD CONSTRAINT lead_payout_needs_confirmation
      CHECK (payout_id IS NULL OR (status = 'booked' AND commission_amount IS NOT NULL
                                   AND guest_confirmed_at IS NOT NULL));

-- D3. Same phone, same business, same day (India time) = one lead, unless marked spam.
CREATE UNIQUE INDEX lead_daily_dup_idx
  ON lead (business_id, customer_phone, ((created_at AT TIME ZONE 'Asia/Kolkata')::date))
  WHERE status <> 'spam';

-- D4. Status history, for disputes between owners and creators.
CREATE TABLE lead_status_history (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id    bigint NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  changed_by  bigint REFERENCES app_user(id),   -- set by the app when known
  note        text,
  changed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_status_history_idx ON lead_status_history (lead_id, changed_at);

CREATE FUNCTION log_lead_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO lead_status_history (lead_id, from_status, to_status) VALUES (NEW.id, NULL, NEW.status);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO lead_status_history (lead_id, from_status, to_status) VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER lead_status_history_trg AFTER INSERT OR UPDATE OF status ON lead
  FOR EACH ROW EXECUTE FUNCTION log_lead_status();

INSERT INTO lead_status_history (lead_id, from_status, to_status, changed_at)
SELECT id, NULL, status, created_at FROM lead;      -- backfill existing leads

-- D5. Payout amount vs the leads it covers. Any non-zero difference needs a look.
CREATE VIEW payout_reconciliation AS
SELECT p.id AS payout_id, p.creator_id, p.period_month, p.amount,
       COALESCE(sum(l.commission_amount), 0) AS leads_total,
       p.amount - COALESCE(sum(l.commission_amount), 0) AS difference
FROM payout p
LEFT JOIN lead l ON l.payout_id = p.id
GROUP BY p.id;

-- ---------------------------------------------------------------------
-- E. Logs and privacy
-- ---------------------------------------------------------------------

-- E1. What was shown, so click-through rate and position bias can be computed.
CREATE TABLE search_impression (
  search_id   bigint   NOT NULL REFERENCES search_log(id) ON DELETE CASCADE,
  position    smallint NOT NULL,
  business_id bigint   NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  layer       text     NOT NULL DEFAULT 'organic'
              CHECK (layer IN ('organic','sponsored','featured')),
  PRIMARY KEY (search_id, position)
);
CREATE INDEX search_impression_business_idx ON search_impression (business_id);

-- E2. Do not store a precise user location. Keep roughly 1 km accuracy (2 decimals).
ALTER TABLE search_log DROP COLUMN user_geom;
ALTER TABLE search_log
  ADD COLUMN user_lat numeric(5,2),
  ADD COLUMN user_lng numeric(5,2);
COMMENT ON COLUMN search_log.user_lat IS 'Rounded to 2 decimals (about 1 km). Never store exact coordinates.';

-- Partitioning later: a partitioned table needs created_at inside the primary key
-- and cannot be the target of foreign keys. Plan that change before logs get large.

-- ---------------------------------------------------------------------
-- F. Imports, verification and claims
-- ---------------------------------------------------------------------
ALTER TABLE business
  ADD COLUMN source_ref        text,          -- e.g. OpenStreetMap id, so re-imports do not duplicate
  ADD COLUMN phone_verified_at timestamptz,   -- set when the owner passed OTP
  ADD COLUMN name_local        text;          -- Bengali / Hindi display name
CREATE UNIQUE INDEX business_source_ref_idx ON business (source, source_ref) WHERE source_ref IS NOT NULL;

ALTER TABLE app_user ADD COLUMN phone_verified_at timestamptz;

-- Owners taking over a listing your team created
CREATE TABLE business_claim (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id  bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  user_id      bigint NOT NULL REFERENCES app_user(id),
  status       text   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  evidence_note text,
  reviewed_by  bigint REFERENCES app_user(id),
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX business_claim_pending_idx ON business_claim (business_id, user_id) WHERE status = 'pending';

-- ---------------------------------------------------------------------
-- G. Smaller fixes
-- ---------------------------------------------------------------------

-- G1. Text matching: also normalise Unicode (Bengali/Hindi characters can be typed two ways).
-- Needs a UTF8 database. Existing stored values are not rewritten (ASCII is unchanged).
CREATE OR REPLACE FUNCTION norm_text(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$ SELECT lower(btrim(regexp_replace(normalize(t, NFC), '\s+', ' ', 'g'))) $$;

ALTER TABLE concept ADD COLUMN name_local text;

-- G2. Other names a shop is known by ("Sharma Electronics" / "Sharma Store")
CREATE TABLE business_alias (
  business_id bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  text        text   NOT NULL CHECK (text = norm_text(text)),
  kind        text   NOT NULL DEFAULT 'other'
              CHECK (kind IN ('former_name','short_name','local_spelling','other')),
  PRIMARY KEY (business_id, text)
);
CREATE INDEX business_alias_trgm_idx ON business_alias USING gin (text gin_trgm_ops);

-- G3. One review per user per business
CREATE UNIQUE INDEX review_one_per_user_idx ON review (business_id, user_id) WHERE user_id IS NOT NULL;

-- G4. Holidays and one-off closures
CREATE TABLE business_closure (
  business_id bigint NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  closed_on   date   NOT NULL,
  reason      text,
  PRIMARY KEY (business_id, closed_on)
);

-- G5. Notes for future you
COMMENT ON COLUMN app_user.role IS 'Main role only. A user is also a creator if a creator row exists, and an owner if business.owner_user_id points to them.';
COMMENT ON COLUMN business.price_level IS 'Rough price tier (1-3) for "cheap/premium" searches. Exact amounts live in attributes such as visit_charge.';
COMMENT ON TABLE business_hours IS 'Use 24:00 as close_time for midnight. A window past midnight is two rows. Holidays go in business_closure.';

-- BEGIN-UNTESTED (needs the btree_gist extension, not available in the test server)
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- G6. A business cannot hold two overlapping periods of the same plan
ALTER TABLE business_subscription
  ADD CONSTRAINT business_subscription_no_overlap
  EXCLUDE USING gist (business_id WITH =, plan WITH =, daterange(starts_on, ends_on, '[]') WITH &&);
-- END-UNTESTED

COMMIT;

-- =====================================================================
-- Checks: each should return 0 rows after the migration
-- =====================================================================

-- Attributes saved on a business whose categories do not use them
SELECT ba.id FROM business_attribute ba
WHERE NOT EXISTS (
  SELECT 1 FROM business_concept bc
  JOIN concept_attribute_effective e ON e.concept_id = bc.concept_id
  WHERE bc.business_id = ba.business_id AND e.attribute_id = ba.attribute_id);

-- Active businesses with no primary category
SELECT b.id, b.name FROM business b
WHERE b.status = 'active'
  AND NOT EXISTS (SELECT 1 FROM business_concept bc WHERE bc.business_id = b.id AND bc.is_primary);

-- Service tags missing their parent category
SELECT bc.business_id, c.slug FROM business_concept bc
JOIN concept c ON c.id = bc.concept_id AND c.type = 'service'
WHERE NOT EXISTS (SELECT 1 FROM business_concept x
                  WHERE x.business_id = bc.business_id AND x.concept_id = c.parent_id);

-- Businesses whose city/locality combination is wrong
SELECT b.id, b.name FROM business b
JOIN location city ON city.id = b.city_id
LEFT JOIN location loc ON loc.id = b.locality_id
WHERE city.level <> 'city' OR (b.locality_id IS NOT NULL AND (loc.level <> 'locality' OR loc.parent_id <> b.city_id));

-- Payouts that do not match their leads
SELECT * FROM payout_reconciliation WHERE difference <> 0;
