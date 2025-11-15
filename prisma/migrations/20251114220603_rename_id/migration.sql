/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyEntry" (
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "steps" INTEGER,

    PRIMARY KEY ("userId", "date"),
    CONSTRAINT "DailyEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyEntry" ("date", "steps", "userId") SELECT "date", "steps", "userId" FROM "DailyEntry";
DROP TABLE "DailyEntry";
ALTER TABLE "new_DailyEntry" RENAME TO "DailyEntry";
CREATE INDEX "DailyEntry_date_idx" ON "DailyEntry"("date");
CREATE TABLE "new_User" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "stepsGoal" INTEGER
);
INSERT INTO "new_User" ("stepsGoal", "userId") SELECT "stepsGoal", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
