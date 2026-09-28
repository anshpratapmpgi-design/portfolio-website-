-- CreateTable
CREATE TABLE "PortfolioQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PortfolioQuery_createdAt_idx" ON "PortfolioQuery"("createdAt");
