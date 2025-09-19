-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goal" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "StepEntry" (
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "date"),
    CONSTRAINT "StepEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meta" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT
);

-- CreateIndex
CREATE INDEX "StepEntry_date_idx" ON "StepEntry"("date");
