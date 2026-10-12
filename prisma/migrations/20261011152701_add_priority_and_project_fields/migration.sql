-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "priority" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "colorChosen" TEXT,
ADD COLUMN     "downPaymentReceived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "downPaymentReceivedAt" TIMESTAMP(3),
ADD COLUMN     "finalPaymentCollected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flakeType" TEXT,
ADD COLUMN     "projectCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectCompletedAt" TIMESTAMP(3),
ADD COLUMN     "sealerType" TEXT,
ADD COLUMN     "storageNotes" TEXT,
ADD COLUMN     "storageRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "topCoatType" TEXT;
