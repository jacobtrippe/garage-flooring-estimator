/*
  Warnings:

  - Added the required column `name` to the `EstimateItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EstimateItem" ADD COLUMN     "name" TEXT NOT NULL;
