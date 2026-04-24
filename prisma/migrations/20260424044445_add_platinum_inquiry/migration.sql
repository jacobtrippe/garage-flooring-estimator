-- CreateTable
CREATE TABLE "PlatinumInquiry" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "garageSize" TEXT NOT NULL,
    "coatingSystem" TEXT,
    "projectDetails" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatinumInquiry_pkey" PRIMARY KEY ("id")
);
