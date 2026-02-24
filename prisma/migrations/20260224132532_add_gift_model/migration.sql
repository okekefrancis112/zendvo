-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "message" TEXT,
    "template" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_otp',
    "otpHash" TEXT,
    "otpExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Gift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Gift_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Gift_senderId_idx" ON "Gift"("senderId");

-- CreateIndex
CREATE INDEX "Gift_recipientId_idx" ON "Gift"("recipientId");

-- CreateIndex
CREATE INDEX "Gift_status_idx" ON "Gift"("status");
