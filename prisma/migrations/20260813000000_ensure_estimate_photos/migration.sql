-- Idempotent safety net: create EstimatePhoto if the earlier migration was
-- never applied to this database instance.
CREATE TABLE IF NOT EXISTS "EstimatePhoto" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimatePhoto_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'EstimatePhoto_estimateId_fkey'
  ) THEN
    ALTER TABLE "EstimatePhoto" ADD CONSTRAINT "EstimatePhoto_estimateId_fkey"
      FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
