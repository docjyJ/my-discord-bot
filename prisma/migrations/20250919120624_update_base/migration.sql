-- DropIndex
DROP INDEX "StepEntry_date_idx";



-- RedefineTables
PRAGMA defer_foreign_keys= ON;
PRAGMA foreign_keys= OFF;
CREATE TABLE "DailyEntry"
(
    "userId" TEXT NOT NULL,
    "date"   TEXT NOT NULL,
    "steps"  INTEGER,

    PRIMARY KEY ("userId", "date"),
    CONSTRAINT "DailyEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "DailyEntry" ("userId", "date", "steps")
SELECT "userId", "date", "value"
FROM "StepEntry";
DROP TABLE "StepEntry";
CREATE TABLE "new_User"
(
    "id"        TEXT NOT NULL PRIMARY KEY,
    "stepsGoal" INTEGER
);
INSERT INTO "new_User" ("id", "stepsGoal")
SELECT "id", "goal"
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User"
    RENAME TO "User";
PRAGMA foreign_keys= ON;
PRAGMA defer_foreign_keys= OFF;

-- CreateIndex
CREATE INDEX "DailyEntry_date_idx" ON "DailyEntry" ("date");
