BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX IF NOT EXISTS location_name_trgm ON public.location USING gin (LOWER(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS location_alias_trgm ON public.location_alias USING gin (LOWER(text) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS location_parent_idx ON public.location (parent_id);
CREATE INDEX IF NOT EXISTS location_alias_lower_trgm ON public.location_alias USING gin (LOWER(text) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS concept_alias_text_trgm ON public.concept_alias USING gin (text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS concept_parent_idx ON public.concept (parent_id);
CREATE INDEX IF NOT EXISTS concept_type_idx ON public.concept (type);

CREATE OR REPLACE FUNCTION public.trg_concept_alias_norm()
RETURNS trigger AS $$
BEGIN
  NEW.text := norm_text(NEW.text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS concept_alias_norm_trg ON public.concept_alias;
CREATE TRIGGER concept_alias_norm_trg
BEFORE INSERT OR UPDATE ON public.concept_alias
FOR EACH ROW EXECUTE FUNCTION public.trg_concept_alias_norm();

COMMIT;
