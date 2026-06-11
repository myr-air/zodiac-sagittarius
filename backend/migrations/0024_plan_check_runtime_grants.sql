DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sagittarius') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE plan_checks TO sagittarius;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE plan_suggestions TO sagittarius;
  END IF;
END
$$;
