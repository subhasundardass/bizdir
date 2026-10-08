-- =====================================================================
-- 04: Category-specific attributes (run after 01 and 02)
-- Idea: an attribute exists once; concept_attribute says WHICH categories use it.
-- Attributes set on a parent concept (e.g. Food & Stay) are inherited by its children.
-- NOT TESTED against a live database yet: run on a test copy first.
-- =====================================================================
BEGIN;

-- 1. Attributes can now be yes/no, a number, or a pick from a list
ALTER TABLE attribute
  ADD COLUMN value_type     text    NOT NULL DEFAULT 'bool'
                            CHECK (value_type IN ('bool','number','choice')),
  ADD COLUMN allow_multiple boolean NOT NULL DEFAULT false,  -- choice: pick many (cuisine)
  ADD COLUMN unit           text,                            -- 'rooms', 'INR'
  ADD COLUMN is_filterable  boolean NOT NULL DEFAULT true,   -- show as a search filter
  ADD COLUMN sort_order     int     NOT NULL DEFAULT 0;

CREATE TABLE attribute_option (
  id           int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attribute_id int  NOT NULL REFERENCES attribute(id) ON DELETE CASCADE,
  slug         text NOT NULL CHECK (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name         text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0,
  UNIQUE (attribute_id, slug)
);

-- Words people type for an attribute ("veg" -> vegetarian). Parser applies it only
-- if the attribute is valid for the category it already found.
CREATE TABLE attribute_alias (
  attribute_id int  NOT NULL REFERENCES attribute(id) ON DELETE CASCADE,
  text         text NOT NULL UNIQUE CHECK (text = norm_text(text))
);

-- 2. Which category uses which attribute
CREATE TABLE concept_attribute (
  concept_id   int NOT NULL REFERENCES concept(id)   ON DELETE CASCADE,
  attribute_id int NOT NULL REFERENCES attribute(id) ON DELETE CASCADE,
  is_required  boolean NOT NULL DEFAULT false,
  sort_order   int NOT NULL DEFAULT 0,
  PRIMARY KEY (concept_id, attribute_id)
);
CREATE INDEX concept_attribute_attr_idx ON concept_attribute (attribute_id);

-- Expands inheritance: every concept with the attributes of itself and all its ancestors
CREATE VIEW concept_attribute_effective AS
WITH RECURSIVE tree(concept_id, ancestor_id) AS (
  SELECT id, id FROM concept
  UNION ALL
  SELECT t.concept_id, c.parent_id
  FROM tree t JOIN concept c ON c.id = t.ancestor_id
  WHERE c.parent_id IS NOT NULL
)
SELECT DISTINCT t.concept_id, ca.attribute_id, ca.is_required, ca.sort_order
FROM tree t
JOIN concept_attribute ca ON ca.concept_id = t.ancestor_id;

-- 3. Business values. A bool attribute = row present means "yes"; no row means "not stated".
ALTER TABLE business_attribute DROP CONSTRAINT business_attribute_pkey;
ALTER TABLE business_attribute
  ADD COLUMN id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ADD COLUMN value_number numeric,
  ADD COLUMN option_id    int REFERENCES attribute_option(id),
  ADD CONSTRAINT business_attribute_one_value
      CHECK (value_number IS NULL OR option_id IS NULL);

-- one row per (business, attribute), or per chosen option for multi-choice
CREATE UNIQUE INDEX business_attribute_unique_idx
  ON business_attribute (business_id, attribute_id, COALESCE(option_id, 0));
CREATE INDEX business_attribute_option_idx
  ON business_attribute (option_id) WHERE option_id IS NOT NULL;
CREATE INDEX business_attribute_number_idx
  ON business_attribute (attribute_id, value_number) WHERE value_number IS NOT NULL;

-- ---------------------------------------------------------------------
-- Seed: new typed attributes
-- ---------------------------------------------------------------------
INSERT INTO attribute (slug, name, value_type, allow_multiple, unit, is_filterable, sort_order) VALUES
  ('hotel_rooms',   'Number of rooms',    'number', false, 'rooms', false, 20),
  ('cuisine',       'Cuisine',            'choice', true,  NULL,    true,  21),
  ('ac_brands',     'AC brands serviced', 'choice', true,  NULL,    true,  22),
  ('visit_charge',  'Visit charge from',  'number', false, 'INR',   true,  23),
  ('vehicle_types', 'Vehicle types',      'choice', true,  NULL,    true,  24);

INSERT INTO attribute_option (attribute_id, slug, name, sort_order)
SELECT a.id, o.slug, o.name, o.ord
FROM (VALUES
  ('cuisine','north_indian','North Indian',1), ('cuisine','chinese','Chinese',2),
  ('cuisine','south_indian','South Indian',3), ('cuisine','bengali','Bengali',4),
  ('cuisine','momo_tibetan','Momo & Tibetan',5),
  ('ac_brands','daikin','Daikin',1), ('ac_brands','voltas','Voltas',2),
  ('ac_brands','lg','LG',3), ('ac_brands','samsung','Samsung',4),
  ('ac_brands','blue_star','Blue Star',5), ('ac_brands','carrier','Carrier',6),
  ('vehicle_types','sedan','Sedan',1), ('vehicle_types','suv','SUV',2),
  ('vehicle_types','tempo_traveller','Tempo Traveller',3)
) AS o(aslug, slug, name, ord)
JOIN attribute a ON a.slug = o.aslug;

INSERT INTO attribute_alias (attribute_id, text)
SELECT a.id, v.text
FROM (VALUES
  ('vegetarian','vegetarian'), ('vegetarian','veg'), ('vegetarian','pure veg'),
  ('parking','parking'), ('parking','car parking'),
  ('wifi','wifi'), ('wifi','wi-fi'),
  ('home_service','home service'), ('home_service','doorstep service'),
  ('home_delivery','home delivery')
) AS v(aslug, text)
JOIN attribute a ON a.slug = v.aslug;

-- ---------------------------------------------------------------------
-- Seed: which category uses which attribute (parent rows are inherited by children)
-- (concept, attribute, required, order)
-- ---------------------------------------------------------------------
INSERT INTO concept_attribute (concept_id, attribute_id, is_required, sort_order)
SELECT c.id, a.id, m.req, m.ord
FROM (VALUES
  -- groups
  ('home_services','home_service',   false, 1),
  ('home_services','visit_charge',   false, 2),
  ('home_services','warranty',       false, 3),
  ('home_services','online_payment', false, 4),
  ('electronics',  'warranty',       false, 1),
  ('electronics',  'online_payment', false, 2),
  ('food_stay',    'parking',        false, 1),
  ('food_stay',    'wifi',           false, 2),
  ('food_stay',    'family_friendly',false, 3),
  ('food_stay',    'online_payment', false, 4),
  ('health',       'online_payment', false, 1),
  ('travel',       'online_payment', false, 1),
  -- categories
  ('restaurant',   'vegetarian',     false, 10),
  ('restaurant',   'cuisine',        false, 11),
  ('restaurant',   'home_delivery',  false, 12),
  ('hotel',        'hotel_rooms',    false, 10),
  ('hotel',        'ac_rooms',       false, 11),
  ('homestay',     'hotel_rooms',    false, 10),
  ('homestay',     'ac_rooms',       false, 11),
  ('homestay',     'pickup_drop',    false, 12),
  ('ac_repair',    'ac_brands',      false, 10),
  ('laptop_repair','pickup_drop',    false, 10),
  ('pharmacy',     'home_delivery',  false, 10),
  ('water_supplier','home_delivery', false, 10),
  ('cab_service',  'vehicle_types',  false, 10),
  ('cab_service',  'pickup_drop',    false, 11)
) AS m(cslug, aslug, req, ord)
JOIN concept   c ON c.slug = m.cslug
JOIN attribute a ON a.slug = m.aslug;

-- ---------------------------------------------------------------------
-- Seed: typed values for the demo businesses (FAKE)
-- ---------------------------------------------------------------------
INSERT INTO business_attribute (business_id, attribute_id, value_number)
SELECT b.id, a.id, v.val
FROM (VALUES
  ('demo-hill-view-hotel',       'hotel_rooms',  24),
  ('demo-himalayan-homestay',    'hotel_rooms',  6),
  ('demo-cool-care-ac-service',  'visit_charge', 300),
  ('demo-frost-air-solutions',   'visit_charge', 500),
  ('demo-metro-ac-mistri',       'visit_charge', 250)
) AS v(bslug, aslug, val)
JOIN business  b ON b.slug = v.bslug
JOIN attribute a ON a.slug = v.aslug;

INSERT INTO business_attribute (business_id, attribute_id, option_id)
SELECT b.id, a.id, o.id
FROM (VALUES
  ('demo-tea-leaf-restaurant',  'cuisine',       'north_indian'),
  ('demo-tea-leaf-restaurant',  'cuisine',       'chinese'),
  ('demo-green-bowl-veg',       'cuisine',       'north_indian'),
  ('demo-green-bowl-veg',       'cuisine',       'south_indian'),
  ('demo-cool-care-ac-service', 'ac_brands',     'daikin'),
  ('demo-cool-care-ac-service', 'ac_brands',     'voltas'),
  ('demo-cool-care-ac-service', 'ac_brands',     'lg'),
  ('demo-metro-ac-mistri',      'ac_brands',     'voltas'),
  ('demo-siliguri-cab-service', 'vehicle_types', 'sedan'),
  ('demo-siliguri-cab-service', 'vehicle_types', 'suv')
) AS v(bslug, aslug, oslug)
JOIN business         b ON b.slug = v.bslug
JOIN attribute        a ON a.slug = v.aslug
JOIN attribute_option o ON o.attribute_id = a.id AND o.slug = v.oslug;

COMMIT;

-- =====================================================================
-- Useful queries
-- =====================================================================

-- A. Fields to show on the "add business" form once a category is chosen
SELECT a.slug, a.name, a.value_type, a.allow_multiple, a.unit, e.is_required
FROM concept c
JOIN concept_attribute_effective e ON e.concept_id = c.id
JOIN attribute a ON a.id = e.attribute_id AND a.is_active
WHERE c.slug = 'hotel'
ORDER BY e.sort_order, a.sort_order;
-- Change 'hotel' to 'ac_repair': no parking, but AC brands and visit charge.

-- B. "AC service under 1000" that also services Daikin
SELECT b.name, v.value_number AS visit_charge
FROM business b
JOIN business_concept bc ON bc.business_id = b.id
     AND bc.concept_id = (SELECT id FROM concept WHERE slug = 'ac_repair')
JOIN business_attribute v ON v.business_id = b.id
     AND v.attribute_id = (SELECT id FROM attribute WHERE slug = 'visit_charge')
     AND v.value_number <= 1000
WHERE b.status = 'active'
  AND EXISTS (SELECT 1 FROM business_attribute x
              JOIN attribute_option o ON o.id = x.option_id
              WHERE x.business_id = b.id AND o.slug = 'daikin')
ORDER BY v.value_number;

-- C. Data check: attributes saved on a business whose category does not use them (expect 0 rows)
SELECT ba.business_id, ba.attribute_id
FROM business_attribute ba
WHERE NOT EXISTS (
  SELECT 1 FROM business_concept bc
  JOIN concept_attribute_effective e ON e.concept_id = bc.concept_id
  WHERE bc.business_id = ba.business_id AND e.attribute_id = ba.attribute_id);
