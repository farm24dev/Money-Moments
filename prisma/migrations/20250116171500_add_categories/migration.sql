-- AlterTable
ALTER TABLE "SavingEntry" ADD COLUMN     "categoryId" INTEGER;

-- CreateTable
CREATE TABLE "SavingCategory" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "description" VARCHAR(256),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingCategory_userId_idx" ON "SavingCategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavingCategory_userId_name_key" ON "SavingCategory"("userId", "name");

-- CreateIndex
CREATE INDEX "SavingEntry_categoryId_idx" ON "SavingEntry"("categoryId");

-- AddForeignKey
ALTER TABLE "SavingEntry" ADD CONSTRAINT "SavingEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SavingCategory"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SavingCategory" ADD CONSTRAINT "SavingCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

