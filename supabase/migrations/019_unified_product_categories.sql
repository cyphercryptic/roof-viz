-- MANUAL SQL EDITOR ONLY: apply to the canonical RoofViz project after reviewing.
-- Adds WindowViz capabilities while preserving roof products, history and style.
-- This does not migrate users, billing, or storage from the separate Window project.
BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'roofing',
  ADD COLUMN IF NOT EXISTS line TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reference_image_url TEXT;

ALTER TABLE public.visualizations
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'roofing',
  ADD COLUMN IF NOT EXISTS perspective TEXT NOT NULL DEFAULT 'exterior';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_unified_category_check' AND conrelid = 'public.products'::regclass) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_unified_category_check
      CHECK (category IN ('roofing', 'window', 'sliding_glass_door', 'entry_door'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_attributes_object_check' AND conrelid = 'public.products'::regclass) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_attributes_object_check
      CHECK (jsonb_typeof(attributes) = 'object');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visualizations_unified_category_check' AND conrelid = 'public.visualizations'::regclass) THEN
    ALTER TABLE public.visualizations ADD CONSTRAINT visualizations_unified_category_check
      CHECK (category IN ('roofing', 'window', 'sliding_glass_door', 'entry_door'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visualizations_perspective_check' AND conrelid = 'public.visualizations'::regclass) THEN
    ALTER TABLE public.visualizations ADD CONSTRAINT visualizations_perspective_check
      CHECK (perspective IN ('exterior', 'interior') AND (category <> 'roofing' OR perspective = 'exterior'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON public.products (tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_visualizations_tenant_category ON public.visualizations (tenant_id, category);

COMMENT ON COLUMN public.products.category IS 'Unified catalog category; legacy products remain roofing.';
COMMENT ON COLUMN public.products.attributes IS 'Category-specific window and door configuration; empty object for roofing.';
COMMENT ON COLUMN public.products.reference_image_url IS 'Optional curated manufacturer style reference. Never fetched as an arbitrary URL.';
COMMENT ON COLUMN public.visualizations.perspective IS 'User-selected camera perspective; roofs require exterior.';

COMMIT;

-- Verification (read-only): confirms existing rows are retained under their category.
SELECT category, count(*) AS products FROM public.products GROUP BY category;
SELECT category, perspective, count(*) AS visualizations FROM public.visualizations GROUP BY category, perspective;
