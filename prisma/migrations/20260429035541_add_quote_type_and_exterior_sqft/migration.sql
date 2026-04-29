-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "exteriorSqft" DOUBLE PRECISION,
ADD COLUMN     "quoteType" TEXT NOT NULL DEFAULT 'interior';

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'interior';
