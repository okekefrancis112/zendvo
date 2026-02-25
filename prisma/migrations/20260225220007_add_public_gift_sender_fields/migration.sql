-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Gift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT,
    "recipientId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "message" TEXT,
    "template" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_otp',
    "otpHash" TEXT,
    "otpExpiresAt" DATETIME,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "transactionId" TEXT,
    "hideAmount" BOOLEAN NOT NULL DEFAULT false,
    "hideSender" BOOLEAN NOT NULL DEFAULT false,
    "unlockDatetime" DATETIME,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "senderAvatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Gift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Gift_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Gift" ("amount", "createdAt", "currency", "hideAmount", "hideSender", "id", "message", "otpAttempts", "otpExpiresAt", "otpHash", "recipientId", "senderId", "status", "template", "transactionId", "unlockDatetime", "updatedAt") SELECT "amount", "createdAt", "currency", "hideAmount", "hideSender", "id", "message", "otpAttempts", "otpExpiresAt", "otpHash", "recipientId", "senderId", "status", "template", "transactionId", "unlockDatetime", "updatedAt" FROM "Gift";
DROP TABLE "Gift";
ALTER TABLE "new_Gift" RENAME TO "Gift";
CREATE UNIQUE INDEX "Gift_transactionId_key" ON "Gift"("transactionId");
CREATE INDEX "Gift_senderId_idx" ON "Gift"("senderId");
CREATE INDEX "Gift_recipientId_idx" ON "Gift"("recipientId");
CREATE INDEX "Gift_status_idx" ON "Gift"("status");
CREATE INDEX "Gift_senderEmail_recipientId_idx" ON "Gift"("senderEmail", "recipientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
