-- AlterTable
ALTER TABLE "recruit" ADD COLUMN "button_message_id" TEXT;
ALTER TABLE "recruit" ADD COLUMN "close_at" DATETIME;

-- CreateIndex
CREATE INDEX "recruit_close_at_idx" ON "recruit"("close_at");
