-- AlterTable: remove single jobPhotoUrl column from Estimate
ALTER TABLE "Estimate" DROP COLUMN IF EXISTS "jobPhotoUrl";

-- CreateTable: EstimatePhoto for multi-photo support
CREATE TABLE "EstimatePhoto" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimatePhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EstimatePhoto" ADD CONSTRAINT "EstimatePhoto_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
