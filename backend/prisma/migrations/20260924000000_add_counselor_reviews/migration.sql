-- CreateTable
CREATE TABLE "counselor_reviews" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counselor_reviews_appointmentId_key" ON "counselor_reviews"("appointmentId");

-- CreateIndex
CREATE INDEX "counselor_reviews_counselorId_idx" ON "counselor_reviews"("counselorId");

-- CreateIndex
CREATE INDEX "counselor_reviews_clientId_idx" ON "counselor_reviews"("clientId");

-- AddForeignKey
ALTER TABLE "counselor_reviews" ADD CONSTRAINT "counselor_reviews_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselor_reviews" ADD CONSTRAINT "counselor_reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselor_reviews" ADD CONSTRAINT "counselor_reviews_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
