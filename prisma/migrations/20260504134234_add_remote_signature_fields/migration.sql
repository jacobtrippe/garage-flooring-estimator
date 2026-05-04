-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN "signatureToken" TEXT,
ADD COLUMN "signatureTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "customerSignedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_signatureToken_key" ON "Estimate"("signatureToken");
