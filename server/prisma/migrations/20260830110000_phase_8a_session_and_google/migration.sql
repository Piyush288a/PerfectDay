-- Phase 8A: Session model for Remember Me refresh tokens + Google OAuth groundwork

-- AlterTable: make passwordHash nullable, add googleId
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable: Session for persistent Remember Me sessions
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique token hash (so we can look up sessions)
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex: lookup sessions by user
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex: cleanup expired sessions
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex: unique Google sub claim per user
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey: sessions cascade-delete when user is deleted
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
