/*
  Warnings:

  - You are about to drop the column `stepsGoal` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "dailyStepsGoal" INTEGER,
    "weeklyStepsGoal" INTEGER
);
INSERT INTO "new_User" ("dailyStepsGoal", "userId") SELECT "stepsGoal", "userId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
