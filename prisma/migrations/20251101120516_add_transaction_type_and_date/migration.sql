-- AlterTable
ALTER TABLE "SavingEntry" ADD COLUMN     "transactionDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" VARCHAR(20) NOT NULL DEFAULT 'deposit';

-- CreateIndex
CREATE INDEX "SavingEntry_transactionDate_idx" ON "SavingEntry"("transactionDate" DESC);
