-- =====================================================================
-- Example queries against the seed data (starter versions, tune later)
-- Always use ST_DWithin / ST_Distance on geography: distances are in METRES.
-- Always filter status = 'active'.
-- =====================================================================

-- 1. "best ac repair near hakim para" : alias -> concept, alias -> location,
--    category match + distance gate, order by quality then distance.
WITH q AS (
  SELECT c.id AS concept_id, l.geom AS origin
  FROM concept_alias ca
  JOIN concept c ON c.id = ca.concept_id AND c.is_active
  CROSS JOIN LATERAL (
    SELECT la.location_id FROM location_alias la
    WHERE la.text = norm_text('Hakim Para') LIMIT 1
  ) x
  JOIN location l ON l.id = x.location_id
  WHERE ca.text = norm_text('ac mistri')
)
SELECT b.name, b.rating, b.review_count, b.verified,
       round(ST_Distance(b.geom, q.origin)) AS metres
FROM q
JOIN business_concept bc ON bc.concept_id = q.concept_id
JOIN business b ON b.id = bc.business_id
              AND b.status = 'active'
              AND ST_DWithin(b.geom, q.origin, 3000)
ORDER BY b.verified DESC, b.rating DESC, metres
LIMIT 20;

-- 2. "laptop repair siliguri" : city-wide, no distance gate.
SELECT b.name, b.rating, b.review_count
FROM concept_alias ca
JOIN business_concept bc ON bc.concept_id = ca.concept_id
JOIN business b ON b.id = bc.business_id AND b.status = 'active'
JOIN location city ON city.id = b.city_id
WHERE ca.text = norm_text('laptop repair')
  AND city.slug = 'siliguri'
ORDER BY b.verified DESC, b.rating DESC;

-- 3. "24 hour pharmacy near sevoke road"
SELECT b.name, round(ST_Distance(b.geom, l.geom)) AS metres
FROM location l
JOIN business b ON b.is_24x7 AND b.status = 'active' AND ST_DWithin(b.geom, l.geom, 5000)
JOIN business_concept bc ON bc.business_id = b.id
JOIN concept c ON c.id = bc.concept_id AND c.slug = 'pharmacy'
WHERE l.slug = 'sevoke-road'
ORDER BY metres;

-- 4. "open now" (India time). Add to any query as an extra condition.
SELECT b.name
FROM business b
WHERE b.status = 'active'
  AND ( b.is_24x7
        OR EXISTS (
             SELECT 1 FROM business_hours h
             WHERE h.business_id = b.id
               AND h.weekday = extract(dow FROM (now() AT TIME ZONE 'Asia/Kolkata'))
               AND (now() AT TIME ZONE 'Asia/Kolkata')::time BETWEEN h.open_time AND h.close_time
        ) );

-- 5. "good vegetarian restaurant" : attribute filter + rating.
SELECT b.name, b.rating
FROM business b
JOIN business_concept bc ON bc.business_id = b.id
JOIN concept c ON c.id = bc.concept_id AND c.slug = 'restaurant'
JOIN business_attribute ba ON ba.business_id = b.id
JOIN attribute a ON a.id = ba.attribute_id AND a.slug = 'vegetarian'
WHERE b.status = 'active'
ORDER BY b.rating DESC;

-- 6. "near me" : user's point (lng, lat). Expand radius 2 km -> 5 km -> 10 km in app code.
SELECT b.name, round(ST_Distance(b.geom, p.pt)) AS metres
FROM (SELECT ST_SetSRID(ST_MakePoint(88.4180, 26.7220), 4326)::geography AS pt) p
JOIN business b ON b.status = 'active' AND ST_DWithin(b.geom, p.pt, 2000)
ORDER BY metres
LIMIT 20;

-- 7. Typo fallback (pg_trgm): unknown word -> closest alias.
SELECT ca.text, c.slug, similarity(ca.text, 'laptp repar') AS sim
FROM concept_alias ca
JOIN concept c ON c.id = ca.concept_id
WHERE ca.text % 'laptp repar'
ORDER BY sim DESC
LIMIT 3;

-- 8. Weekly to-do: queries that returned nothing = missing aliases.
SELECT normalized_query, count(*) AS times
FROM search_log
WHERE result_count = 0 AND created_at > now() - interval '7 days'
GROUP BY normalized_query
ORDER BY times DESC;

-- 9. Creator earnings still unpaid.
SELECT cr.code, count(*) AS booked_leads, sum(l.commission_amount) AS owed
FROM lead l
JOIN creator cr ON cr.id = l.creator_id
WHERE l.status = 'booked' AND l.payout_id IS NULL
GROUP BY cr.code;
