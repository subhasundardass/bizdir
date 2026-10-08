-- =====================================================================
-- Siliguri Business Directory - Seed data v1
-- Run after 01_schema.sql.
--
-- IMPORTANT BEFORE LAUNCH
--  * Locality / landmark coordinates are APPROXIMATE (geom_verified = false).
--    Open each on a map, correct it, then set geom_verified = true.
--  * All businesses, phone numbers, reviews, leads and users here are FAKE demo data
--    (source = 'demo'). Never send SMS/WhatsApp to these numbers. To remove them:
--      DELETE FROM business WHERE source = 'demo';   (cascades to child rows)
--  * Local-language aliases (mistri, dokan, dawai ...) need review by a local person.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- Users (fake)
-- ---------------------------------------------------------------------
INSERT INTO app_user (name, phone, email, role) VALUES
  ('Demo Admin',   '+919000000001', 'admin@example.com',   'admin'),
  ('Demo Owner',   '+919000000002', 'owner@example.com',   'owner'),
  ('Demo Creator', '+919000000003', 'creator@example.com', 'creator');

-- ---------------------------------------------------------------------
-- Locations
-- ---------------------------------------------------------------------
INSERT INTO location (parent_id, level, name, slug) VALUES
  (NULL, 'state', 'West Bengal', 'west-bengal');

INSERT INTO location (parent_id, level, name, slug)
SELECT id, 'district', 'Darjeeling', 'darjeeling' FROM location WHERE slug = 'west-bengal';

INSERT INTO location (parent_id, level, name, slug, geom)
SELECT id, 'city', 'Siliguri', 'siliguri',
       ST_SetSRID(ST_MakePoint(88.3953, 26.7271), 4326)::geography
FROM location WHERE slug = 'darjeeling';

-- Localities (name, slug, lat, lng) - APPROXIMATE
INSERT INTO location (parent_id, level, name, slug, geom)
SELECT (SELECT id FROM location WHERE slug = 'siliguri'), 'locality', v.name, v.slug,
       ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography
FROM (VALUES
  ('Hakim Para',   'hakim-para',   26.7220, 88.4180),
  ('Pradhan Nagar','pradhan-nagar',26.7370, 88.4160),
  ('Sevoke Road',  'sevoke-road',  26.7300, 88.4300),
  ('Matigara',     'matigara',     26.7080, 88.3680),
  ('Champasari',   'champasari',   26.7000, 88.3900),
  ('Salugara',     'salugara',     26.7640, 88.4090),
  ('Khalpara',     'khalpara',     26.7230, 88.4050),
  ('Ashrampara',   'ashrampara',   26.7240, 88.4310),
  ('Bagdogra',     'bagdogra',     26.6800, 88.3250)
) AS v(name, slug, lat, lng);

-- Landmarks (name, slug, lat, lng) - APPROXIMATE
INSERT INTO location (parent_id, level, name, slug, geom)
SELECT (SELECT id FROM location WHERE slug = 'siliguri'), 'landmark', v.name, v.slug,
       ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography
FROM (VALUES
  ('ISKCON Mandir',         'iskcon-mandir',     26.7400, 88.4250),
  ('Siliguri Junction',     'siliguri-junction', 26.7100, 88.4320),
  ('New Jalpaiguri Station','njp-station',       26.6850, 88.4430),
  ('Bagdogra Airport',      'bagdogra-airport',  26.6812, 88.3286)
) AS v(name, slug, lat, lng);

INSERT INTO location_alias (location_id, text)
SELECT l.id, a.text
FROM (VALUES
  ('siliguri','siliguri'), ('siliguri','shiliguri'), ('siliguri','siliguri city'),
  ('hakim-para','hakim para'), ('hakim-para','hakimpara'),
  ('pradhan-nagar','pradhan nagar'), ('pradhan-nagar','pradhannagar'),
  ('sevoke-road','sevoke road'), ('sevoke-road','sevoke rd'), ('sevoke-road','sevok road'),
  ('matigara','matigara'), ('champasari','champasari'), ('salugara','salugara'),
  ('khalpara','khalpara'), ('ashrampara','ashrampara'), ('bagdogra','bagdogra'),
  ('iskcon-mandir','iskcon mandir'), ('iskcon-mandir','iskcon temple'),
  ('iskcon-mandir','iskcon siliguri'),
  ('siliguri-junction','siliguri junction'), ('siliguri-junction','siliguri station'),
  ('njp-station','njp'), ('njp-station','new jalpaiguri'), ('njp-station','njp station'),
  ('bagdogra-airport','bagdogra airport')
) AS a(slug, text)
JOIN location l ON l.slug = a.slug;

-- ---------------------------------------------------------------------
-- Taxonomy: top-level groups
-- ---------------------------------------------------------------------
INSERT INTO concept (slug, name, type, sort_order) VALUES
  ('home_services', 'Home Services',   'category', 1),
  ('electronics',   'Electronics',     'category', 2),
  ('food_stay',     'Food & Stay',     'category', 3),
  ('health',        'Health',          'category', 4),
  ('travel',        'Travel',          'category', 5);

-- Leaf categories
INSERT INTO concept (slug, name, type, parent_id, sort_order)
SELECT v.slug, v.name, 'category', p.id, v.ord
FROM (VALUES
  ('ac_repair',      'AC Repair',            'home_services', 1),
  ('plumber',        'Plumber',              'home_services', 2),
  ('electrician',    'Electrician',          'home_services', 3),
  ('pest_control',   'Pest Control',         'home_services', 4),
  ('water_supplier', 'Water Jar Supplier',   'home_services', 5),
  ('laptop_repair',  'Laptop Repair',        'electronics',   1),
  ('mobile_repair',  'Mobile Repair',        'electronics',   2),
  ('computer_shop',  'Computer Shop',        'electronics',   3),
  ('restaurant',     'Restaurant',           'food_stay',     1),
  ('hotel',          'Hotel',                'food_stay',     2),
  ('homestay',       'Homestay',             'food_stay',     3),
  ('pharmacy',       'Pharmacy',             'health',        1),
  ('dentist',        'Dentist',              'health',        2),
  ('cab_service',    'Cab & Taxi Service',   'travel',        1)
) AS v(slug, name, parent, ord)
JOIN concept p ON p.slug = v.parent;

-- Services (children of a category)
INSERT INTO concept (slug, name, type, parent_id, sort_order)
SELECT v.slug, v.name, 'service', p.id, v.ord
FROM (VALUES
  ('ac_gas_filling',      'AC Gas Filling',       'ac_repair',     1),
  ('ac_installation',     'AC Installation',      'ac_repair',     2),
  ('laptop_screen_repair','Laptop Screen Repair', 'laptop_repair', 1)
) AS v(slug, name, parent, ord)
JOIN concept p ON p.slug = v.parent;

-- ---------------------------------------------------------------------
-- Concept aliases (all lowercase; one phrase = one concept)
-- Do NOT put filters like "near me", "24 hour", "cheap" here: the parser handles them.
-- ---------------------------------------------------------------------
INSERT INTO concept_alias (concept_id, text, kind)
SELECT c.id, a.text, a.kind
FROM (VALUES
  ('ac_repair','ac repair','main'), ('ac_repair','ac repairing','synonym'),
  ('ac_repair','ac service','synonym'), ('ac_repair','ac servicing','synonym'),
  ('ac_repair','air conditioner repair','synonym'), ('ac_repair','air conditioning service','synonym'),
  ('ac_repair','a.c. repair','abbreviation'), ('ac_repair','ac mechanic','synonym'),
  ('ac_repair','ac mistri','local'), ('ac_repair','ac repiar','misspelling'),
  ('ac_gas_filling','ac gas filling','main'), ('ac_gas_filling','ac gas refill','synonym'),
  ('ac_installation','ac installation','main'), ('ac_installation','ac fitting','synonym'),
  ('ac_installation','ac installation service','synonym'),

  ('laptop_repair','laptop repair','main'), ('laptop_repair','laptop repairing','synonym'),
  ('laptop_repair','laptop service','synonym'), ('laptop_repair','notebook repair','synonym'),
  ('laptop_repair','laptop mistri','local'), ('laptop_repair','laptop reapir','misspelling'),
  ('laptop_screen_repair','laptop screen repair','main'),
  ('laptop_screen_repair','laptop screen replacement','synonym'),

  ('mobile_repair','mobile repair','main'), ('mobile_repair','mobile repairing','synonym'),
  ('mobile_repair','phone repair','synonym'), ('mobile_repair','cell phone repair','synonym'),
  ('mobile_repair','smartphone repair','synonym'),
  ('mobile_repair','mobile screen replacement','synonym'),
  ('mobile_repair','mobile mistri','local'),

  ('computer_shop','computer shop','main'), ('computer_shop','computer store','synonym'),
  ('computer_shop','computer dealer','synonym'), ('computer_shop','pc shop','synonym'),
  ('computer_shop','desktop shop','synonym'), ('computer_shop','computer showroom','synonym'),
  ('computer_shop','computer dokan','local'),

  ('restaurant','restaurant','main'), ('restaurant','restaurants','synonym'),
  ('restaurant','restro','abbreviation'), ('restaurant','eatery','synonym'),
  ('restaurant','dhaba','local'), ('restaurant','family restaurant','synonym'),
  ('restaurant','food place','synonym'), ('restaurant','where to eat','synonym'),

  ('hotel','hotel','main'), ('hotel','hotels','synonym'), ('hotel','lodge','synonym'),
  ('hotel','guest house','synonym'), ('hotel','budget hotel','synonym'),
  ('hotel','hotel booking','synonym'),

  ('homestay','homestay','main'), ('homestay','home stay','synonym'),
  ('homestay','homestays','synonym'), ('homestay','family stay','synonym'),
  ('homestay','village homestay','synonym'),

  ('pharmacy','pharmacy','main'), ('pharmacy','medical store','synonym'),
  ('pharmacy','medicine shop','synonym'), ('pharmacy','chemist','synonym'),
  ('pharmacy','drug store','synonym'), ('pharmacy','dawai dokan','local'),
  ('pharmacy','dawai dukan','local'),

  ('dentist','dentist','main'), ('dentist','dental clinic','synonym'),
  ('dentist','dental doctor','synonym'), ('dentist','tooth doctor','synonym'),
  ('dentist','teeth clinic','synonym'), ('dentist','dental surgeon','synonym'),
  ('dentist','dantist','misspelling'),

  ('plumber','plumber','main'), ('plumber','plumbing service','synonym'),
  ('plumber','plumbing repair','synonym'), ('plumber','pipe repair','synonym'),
  ('plumber','tap repair','synonym'), ('plumber','leakage repair','synonym'),
  ('plumber','nal mistri','local'),

  ('electrician','electrician','main'), ('electrician','electrical repair','synonym'),
  ('electrician','wiring service','synonym'), ('electrician','electric mistri','local'),
  ('electrician','bijli mistri','local'), ('electrician','electrican','misspelling'),

  ('pest_control','pest control','main'), ('pest_control','pest control service','synonym'),
  ('pest_control','termite control','synonym'), ('pest_control','cockroach control','synonym'),
  ('pest_control','bed bug treatment','synonym'),

  ('water_supplier','water jar supplier','main'), ('water_supplier','water jar delivery','synonym'),
  ('water_supplier','jar water','synonym'), ('water_supplier','drinking water supply','synonym'),
  ('water_supplier','mineral water supplier','synonym'),
  ('water_supplier','20 litre water jar','synonym'), ('water_supplier','pani jar','local'),

  ('cab_service','cab service','main'), ('cab_service','taxi service','synonym'),
  ('cab_service','taxi','synonym'), ('cab_service','cab','synonym'),
  ('cab_service','car rental','synonym'), ('cab_service','tour taxi','synonym'),
  ('cab_service','cab booking','synonym')
) AS a(slug, text, kind)
JOIN concept c ON c.slug = a.slug;

-- ---------------------------------------------------------------------
-- Attributes
-- ---------------------------------------------------------------------
INSERT INTO attribute (slug, name) VALUES
  ('home_service',   'Home service available'),
  ('vegetarian',     'Vegetarian'),
  ('parking',        'Parking available'),
  ('ac_rooms',       'Air-conditioned'),
  ('online_payment', 'Online payment accepted'),
  ('wifi',           'Wi-Fi'),
  ('pickup_drop',    'Pickup and drop'),
  ('warranty',       'Warranty on work'),
  ('family_friendly','Family friendly'),
  ('home_delivery',  'Home delivery');

-- ---------------------------------------------------------------------
-- Demo businesses (FAKE). Placed near their locality centre using ST_Project.
-- ---------------------------------------------------------------------
WITH src(slug, name, locality, phone, dist_m, az_deg, is_24x7, verified, price_level, descr) AS (VALUES
  ('demo-cool-care-ac-service',   'Demo Cool Care AC Service',      'hakim-para',    '+919000000011', 250, 30,  false, true,  1,    'Demo listing. AC repair, servicing and gas filling at your home.'),
  ('demo-frost-air-solutions',    'Demo Frost Air Solutions',       'sevoke-road',   '+919000000012', 400, 120, false, false, 2,    'Demo listing. AC installation and annual service contracts.'),
  ('demo-metro-ac-mistri',        'Demo Metro AC Mistri',           'pradhan-nagar', '+919000000013', 300, 200, false, false, 1,    'Demo listing. Quick AC repair for homes and shops.'),
  ('demo-quickfix-laptop-care',   'Demo QuickFix Laptop Care',      'hakim-para',    '+919000000014', 500, 80,  false, true,  1,    'Demo listing. Laptop and desktop repair, screen replacement.'),
  ('demo-mobile-doctor',          'Demo Mobile Doctor',             'sevoke-road',   '+919000000015', 200, 300, false, false, 1,    'Demo listing. Mobile screen and battery replacement.'),
  ('demo-byte-world-computers',   'Demo Byte World Computers',      'pradhan-nagar', '+919000000016', 350, 60,  false, false, 2,    'Demo listing. Computers, laptops and accessories.'),
  ('demo-tea-leaf-restaurant',    'Demo Tea Leaf Restaurant',       'hakim-para',    '+919000000017', 150, 250, false, false, 2,    'Demo listing. Family restaurant with North Indian and Chinese dishes.'),
  ('demo-green-bowl-veg',         'Demo Green Bowl Veg Restaurant', 'matigara',      '+919000000018', 300, 10,  false, true,  2,    'Demo listing. Pure vegetarian meals and thali.'),
  ('demo-hill-view-hotel',        'Demo Hill View Hotel',           'sevoke-road',   '+919000000019', 600, 150, true,  true,  2,    'Demo listing. Mid-range rooms with 24-hour reception.'),
  ('demo-lifeline-medical',       'Demo Lifeline Medical Store',    'sevoke-road',   '+919000000020', 100, 45,  true,  true,  NULL, 'Demo listing. 24-hour pharmacy.'),
  ('demo-smile-dental-clinic',    'Demo Smile Dental Clinic',       'pradhan-nagar', '+919000000021', 450, 330, false, true,  2,    'Demo listing. Dental check-up, cleaning and root canal.'),
  ('demo-nal-mistri-plumbing',    'Demo Nal Mistri Plumbing',       'hakim-para',    '+919000000022', 350, 170, false, false, 1,    'Demo listing. Leakage, tap and pipe repair at home.'),
  ('demo-pure-drop-water',        'Demo Pure Drop Water Supply',    'salugara',      '+919000000023', 500, 270, false, false, 1,    'Demo listing. 20 litre jar delivery to homes and offices.'),
  ('demo-himalayan-homestay',     'Demo Himalayan Homestay',        'bagdogra',      '+919000000024', 700, 90,  false, true,  2,    'Demo listing. Family-run homestay near the airport, breakfast included.'),
  ('demo-siliguri-cab-service',   'Demo Siliguri Cab Service',      'pradhan-nagar', '+919000000025', 250, 100, true,  false, 2,    'Demo listing. Taxis to Darjeeling, Gangtok and Mirik from NJP and the airport.')
)
INSERT INTO business
  (slug, name, city_id, locality_id, geom, phone, whatsapp, description,
   price_level, is_24x7, verified, status, source, address)
SELECT s.slug, s.name, city.id, loc.id,
       ST_Project(loc.geom, s.dist_m::float8, radians(s.az_deg::float8))::geography,
       s.phone::phone_in, s.phone::phone_in, s.descr,
       s.price_level::smallint, s.is_24x7, s.verified, 'active', 'demo',
       'Demo address, ' || loc.name || ', Siliguri'
FROM src s
JOIN location loc  ON loc.slug = s.locality
JOIN location city ON city.slug = 'siliguri';

UPDATE business SET owner_user_id = (SELECT id FROM app_user WHERE email = 'owner@example.com')
WHERE slug = 'demo-cool-care-ac-service';

-- Category / service tags (exactly one primary per business)
INSERT INTO business_concept (business_id, concept_id, is_primary)
SELECT b.id, c.id, t.is_primary
FROM (VALUES
  ('demo-cool-care-ac-service','ac_repair',true),
  ('demo-cool-care-ac-service','ac_gas_filling',false),
  ('demo-frost-air-solutions','ac_repair',true),
  ('demo-frost-air-solutions','ac_installation',false),
  ('demo-metro-ac-mistri','ac_repair',true),
  ('demo-quickfix-laptop-care','laptop_repair',true),
  ('demo-quickfix-laptop-care','laptop_screen_repair',false),
  ('demo-mobile-doctor','mobile_repair',true),
  ('demo-byte-world-computers','computer_shop',true),
  ('demo-tea-leaf-restaurant','restaurant',true),
  ('demo-green-bowl-veg','restaurant',true),
  ('demo-hill-view-hotel','hotel',true),
  ('demo-lifeline-medical','pharmacy',true),
  ('demo-smile-dental-clinic','dentist',true),
  ('demo-nal-mistri-plumbing','plumber',true),
  ('demo-pure-drop-water','water_supplier',true),
  ('demo-himalayan-homestay','homestay',true),
  ('demo-siliguri-cab-service','cab_service',true)
) AS t(bslug, cslug, is_primary)
JOIN business b ON b.slug = t.bslug
JOIN concept  c ON c.slug = t.cslug;

INSERT INTO business_attribute (business_id, attribute_id)
SELECT b.id, a.id
FROM (VALUES
  ('demo-cool-care-ac-service','home_service'), ('demo-cool-care-ac-service','warranty'),
  ('demo-frost-air-solutions','home_service'),
  ('demo-metro-ac-mistri','home_service'),
  ('demo-quickfix-laptop-care','pickup_drop'), ('demo-quickfix-laptop-care','warranty'),
  ('demo-tea-leaf-restaurant','parking'), ('demo-tea-leaf-restaurant','online_payment'),
  ('demo-tea-leaf-restaurant','family_friendly'),
  ('demo-green-bowl-veg','vegetarian'), ('demo-green-bowl-veg','family_friendly'),
  ('demo-green-bowl-veg','home_delivery'),
  ('demo-hill-view-hotel','parking'), ('demo-hill-view-hotel','wifi'),
  ('demo-hill-view-hotel','ac_rooms'),
  ('demo-lifeline-medical','home_delivery'), ('demo-lifeline-medical','online_payment'),
  ('demo-nal-mistri-plumbing','home_service'),
  ('demo-pure-drop-water','home_delivery'),
  ('demo-himalayan-homestay','wifi'), ('demo-himalayan-homestay','family_friendly'),
  ('demo-himalayan-homestay','pickup_drop'),
  ('demo-siliguri-cab-service','pickup_drop'), ('demo-siliguri-cab-service','online_payment')
) AS t(bslug, aslug)
JOIN business  b ON b.slug = t.bslug
JOIN attribute a ON a.slug = t.aslug;

-- Opening hours: restaurants every day 11:00-22:30, others Mon-Sat 10:00-19:00.
-- 24x7 businesses (is_24x7 = true) get no hour rows.
INSERT INTO business_hours (business_id, weekday, open_time, close_time)
SELECT b.id, d,
       CASE WHEN c.slug = 'restaurant' THEN time '11:00' ELSE time '10:00' END,
       CASE WHEN c.slug = 'restaurant' THEN time '22:30' ELSE time '19:00' END
FROM business b
JOIN business_concept bc ON bc.business_id = b.id AND bc.is_primary
JOIN concept c ON c.id = bc.concept_id
CROSS JOIN generate_series(0, 6) AS d
WHERE b.source = 'demo' AND NOT b.is_24x7
  AND (c.slug = 'restaurant' OR d BETWEEN 1 AND 6);

-- Paid plans
INSERT INTO business_subscription (business_id, plan, starts_on, ends_on, amount_paid, payment_ref)
SELECT id, v.plan, current_date, current_date + 365, v.amount, 'DEMO-' || b.slug
FROM (VALUES
  ('demo-cool-care-ac-service', 'verified', 600),
  ('demo-quickfix-laptop-care', 'verified', 600),
  ('demo-metro-ac-mistri',      'featured', 6000)
) AS v(bslug, plan, amount)
JOIN business b ON b.slug = v.bslug;

-- ---------------------------------------------------------------------
-- Reviews (FAKE). The trigger updates business.rating and review_count.
-- ---------------------------------------------------------------------
INSERT INTO review (business_id, reviewer_name, rating, comment, status)
SELECT b.id, v.reviewer, v.rating, v.comment, 'approved'
FROM (VALUES
  ('demo-cool-care-ac-service','Demo Customer A',5,'Came on time and fixed the cooling the same day.'),
  ('demo-cool-care-ac-service','Demo Customer B',4,'Good work, price was fair.'),
  ('demo-cool-care-ac-service','Demo Customer C',5,'Explained the problem clearly before starting.'),
  ('demo-frost-air-solutions','Demo Customer D',4,'Neat installation.'),
  ('demo-metro-ac-mistri','Demo Customer E',3,'Fixed it but arrived late.'),
  ('demo-metro-ac-mistri','Demo Customer F',4,'Quick service.'),
  ('demo-quickfix-laptop-care','Demo Customer G',5,'Replaced my screen in two days.'),
  ('demo-green-bowl-veg','Demo Customer H',5,'Tasty vegetarian food.'),
  ('demo-green-bowl-veg','Demo Customer I',4,'Clean place, good thali.'),
  ('demo-hill-view-hotel','Demo Customer J',4,'Clean rooms, helpful staff.'),
  ('demo-smile-dental-clinic','Demo Customer K',5,'Painless treatment.'),
  ('demo-himalayan-homestay','Demo Customer L',5,'Warm hosts and a great breakfast.')
) AS v(bslug, reviewer, rating, comment)
JOIN business b ON b.slug = v.bslug;

-- ---------------------------------------------------------------------
-- Creator + leads (FAKE)
-- ---------------------------------------------------------------------
INSERT INTO creator (user_id, code, display_name, channel_url, commission_pct, status, disclosure_accepted_at)
SELECT id, 'demotravels', 'Demo Travel Vlogs', 'https://example.com/demo-channel', 5, 'active', now()
FROM app_user WHERE email = 'creator@example.com';

INSERT INTO lead
  (business_id, creator_id, customer_name, customer_phone, message, service_date, guests,
   source, consent_to_share, status, booking_value, commission_amount)
SELECT b.id, cr.id, v.cname, v.cphone::phone_in, v.msg, current_date + v.days, v.guests,
       v.src, true, v.status, v.value, v.comm
FROM (VALUES
  ('demo-himalayan-homestay','Demo Guest 1','+919000000031','2 nights for a family trip',20,4,'creator','booked',12000::numeric,600::numeric),
  ('demo-himalayan-homestay','Demo Guest 2','+919000000032','Is breakfast included?',30,2,'creator','new',NULL::numeric,NULL::numeric)
) AS v(bslug, cname, cphone, msg, days, guests, src, status, value, comm)
JOIN business b  ON b.slug = v.bslug
JOIN creator  cr ON cr.code = 'demotravels';

-- ---------------------------------------------------------------------
-- Search + click logs (FAKE sample rows)
-- ---------------------------------------------------------------------
INSERT INTO search_log (session_id, raw_query, normalized_query, parsed, parser_tier, city_id, result_count, took_ms)
SELECT v.sess, v.raw, norm_text(v.raw), v.parsed::jsonb, v.tier, (SELECT id FROM location WHERE slug = 'siliguri'), v.cnt, v.ms
FROM (VALUES
  ('s1','best AC repair shop near Hakim Para Siliguri','{"concept":"ac_repair","location":"hakim-para","modifier":"best"}','rules',3,14),
  ('s2','ac mistri','{"concept":"ac_repair"}','rules',3,9),
  ('s3','laptop repair siliguri','{"concept":"laptop_repair","location":"siliguri"}','rules',1,11),
  ('s4','24 hour pharmacy near Sevoke Road','{"concept":"pharmacy","open24x7":true,"location":"sevoke-road"}','rules',1,12),
  ('s5','tyre puncture shop','{}','rules',0,6)
) AS v(sess, raw, parsed, tier, cnt, ms);

INSERT INTO click_log (search_id, business_id, action, position, session_id)
SELECT sl.id, b.id, v.action, v.pos, sl.session_id
FROM (VALUES
  ('s1','demo-cool-care-ac-service','view',1),
  ('s1','demo-cool-care-ac-service','call',1),
  ('s1','demo-metro-ac-mistri','view',2),
  ('s4','demo-lifeline-medical','whatsapp',1)
) AS v(sess, bslug, action, pos)
JOIN search_log sl ON sl.session_id = v.sess
JOIN business b ON b.slug = v.bslug;

COMMIT;
