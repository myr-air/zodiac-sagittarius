ALTER TABLE plan_variants
  ADD COLUMN IF NOT EXISTS status text;

UPDATE plan_variants
SET status = CASE
  WHEN kind = 'split' THEN 'proposal'
  WHEN kind IN ('main', 'draft', 'backup') THEN kind
  ELSE 'draft'
END
WHERE status IS NULL;

ALTER TABLE plan_variants
  ADD CONSTRAINT plan_variants_status_check
  CHECK (status IS NULL OR status IN ('main', 'draft', 'proposal', 'backup')) NOT VALID;

ALTER TABLE plan_variants
  VALIDATE CONSTRAINT plan_variants_status_check;
