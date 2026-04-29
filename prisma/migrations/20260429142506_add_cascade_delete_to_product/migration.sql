-- DropForeignKey
ALTER TABLE "EstimateItem" DROP CONSTRAINT "EstimateItem_productId_fkey";

-- AddForeignKey
ALTER TABLE "EstimateItem" ADD CONSTRAINT "EstimateItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
