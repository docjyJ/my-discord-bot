import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import DateTime from '../date-time';
import {renderDailySummaryImage} from '../image/daily-summary';
import {renderMonthlySummaryImage} from '../image/monthly-summary';
import {renderWeeklySummaryImage} from '../image/weekly-summary';

const OUT_DIR = path.resolve(process.cwd(), 'rendered');
mkdirSync(OUT_DIR, {recursive: true});

function writeOut(name: string, buf: Buffer) {
  const out = path.join(OUT_DIR, name);
  writeFileSync(out, buf);
  console.log('Wrote', out);
}

// biome-ignore lint/style/noNonNullAssertion: Test code
const DATE_MONDAY = DateTime.parse('2025-10-20')!;
// biome-ignore lint/style/noNonNullAssertion: Test code
const DATE_FRIDAY = DateTime.parse('2025-10-24')!;
// biome-ignore lint/style/noNonNullAssertion: Test code
const DATE_SATURDAY = DateTime.parse('2025-10-25')!;
// biome-ignore lint/style/noNonNullAssertion: Test code
const DATE_SUNDAY = DateTime.parse('2025-10-26')!;
// biome-ignore lint/style/noNonNullAssertion: Test code
const DATE_MONTH = DateTime.parse('2025-10-01')!;
const AVATAR_URL = 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg';

function presentationBuildOneRun(
  name: string,
  date: DateTime,
  steps: number,
  dayly: {
    goal: number;
    streak: number;
  } | null,
  weekly: {weeklyGoal: number; weeklySteps: number; weeklyRemainingDays: number} | null
) {
  return {
    name,
    run: () =>
      renderDailySummaryImage({
        avatarUrl: AVATAR_URL,
        date,
        steps,
        ...(dayly ? dayly : {goal: null, streak: null}),
        ...(weekly
          ? weekly
          : {
              weeklyGoal: null,
              weeklySteps: null,
              weeklyRemainingDays: null
            })
      })
  };
}

function weeklySummaryBuildOneRun(
  name: string,
  date: DateTime,
  days: (number | null)[],
  countEntries: number,
  dayly: {
    goal: number;
    bestStreak: number;
    countSuccesses: number;
  } | null,
  weekly: {weeklyGoal: number} | null
) {
  return {
    name,
    run: () =>
      renderWeeklySummaryImage({
        avatarUrl: AVATAR_URL,
        date,
        days,
        countEntries,
        ...(dayly ? dayly : {goal: null, bestStreak: null, countSuccesses: null}),
        ...(weekly ? weekly : {weeklyGoal: null})
      })
  };
}

function monthlySummaryBuildOneRun(
  name: string,
  date: DateTime,
  days: (number | null)[],
  countEntries: number,
  dayly: {
    goal: number;
    bestStreak: number;
    countSuccesses: number;
  } | null,
  weekly: {weeklyGoal: number} | null
) {
  return {
    name,
    run: () =>
      renderMonthlySummaryImage({
        avatarUrl: AVATAR_URL,
        date,
        days,
        countEntries,
        ...(dayly ? dayly : {goal: null, bestStreak: null, countSuccesses: null}),
        ...(weekly ? weekly : {weeklyGoal: null})
      })
  };
}

function* presentationBuildGroup(
  prefix: string,
  date: DateTime,
  weekly: {
    weeklyGoal: number;
    weeklySteps: number;
    weeklyRemainingDays: number;
  } | null
) {
  yield presentationBuildOneRun(`${prefix}-0-no.png`, date, 6000, null, weekly);
  yield presentationBuildOneRun(`${prefix}-1-fail.png`, date, 3000, {goal: 8000, streak: 6000}, weekly);
  yield presentationBuildOneRun(`${prefix}-2-succes.png`, date, 9000, {goal: 8000, streak: 5}, weekly);
}

function* weeklySummaryBuildGroup(
  prefix: string,
  date: DateTime,
  days: (number | null)[],
  countEntries: number,
  weekly: {
    weeklyGoal: number;
  } | null
) {
  yield weeklySummaryBuildOneRun(`${prefix}-0-no.png`, date, days, countEntries, null, weekly);
  yield weeklySummaryBuildOneRun(
    `${prefix}-1-yes.png`,
    date,
    days,
    countEntries,
    {
      goal: 8000,
      bestStreak: 13,
      countSuccesses: 47
    },
    weekly
  );
}

function* monthlySummaryBuildGroup(
  prefix: string,
  date: DateTime,
  days: (number | null)[],
  countEntries: number,
  weekly: {
    weeklyGoal: number;
  } | null
) {
  yield monthlySummaryBuildOneRun(`${prefix}-0-no.png`, date, days, countEntries, null, weekly);
  yield monthlySummaryBuildOneRun(
    `${prefix}-1-yes.png`,
    date,
    days,
    countEntries,
    {
      goal: 8000,
      bestStreak: 13,
      countSuccesses: 47
    },
    weekly
  );
}

function* presentationBuildAll(prefix: string) {
  yield* presentationBuildGroup(`${prefix}-0-no`, DATE_FRIDAY, null);
  yield* presentationBuildGroup(`${prefix}-1-progress`, DATE_FRIDAY, {
    weeklyGoal: 40000,
    weeklySteps: 28000,
    weeklyRemainingDays: 2
  });
  yield* presentationBuildGroup(`${prefix}-2-last`, DATE_SATURDAY, {
    weeklyGoal: 40000,
    weeklySteps: 34000,
    weeklyRemainingDays: 1
  });
  yield* presentationBuildGroup(`${prefix}-3-fail`, DATE_SUNDAY, {
    weeklyGoal: 40000,
    weeklySteps: 37000,
    weeklyRemainingDays: 0
  });
  yield* presentationBuildGroup(`${prefix}-4-success`, DATE_FRIDAY, {
    weeklyGoal: 40000,
    weeklySteps: 50000,
    weeklyRemainingDays: 2
  });
}

function* weeklySummaryBuildAll(prefix: string, date: DateTime, countEntries: number) {
  yield* weeklySummaryBuildGroup(`${prefix}-0-no`, date, [6000, 7000, 8000, null, 5000, 4000, null], countEntries, null);
  yield* weeklySummaryBuildGroup(`${prefix}-1-fail`, date, [6000, 7000, 8000, null, 5000, 4000, null], countEntries, {weeklyGoal: 40000});
  yield* weeklySummaryBuildGroup(`${prefix}-2-success`, date, [11000, null, 8000, null, 10000, 12000, 7000], countEntries, {weeklyGoal: 40000});
  yield* weeklySummaryBuildGroup(`${prefix}-3-success-full`, date, [11000, 9000, 8000, 8000, 10000, 12000, 9000], countEntries, {weeklyGoal: 40000});
}

function* monthlySummaryBuildTests(prefix: string, date: DateTime, days: (number | null)[], countEntries: number) {
  yield* monthlySummaryBuildGroup(`${prefix}-0-no`, date, days, countEntries, null);
  yield* monthlySummaryBuildGroup(`${prefix}-1-yes`, date, days, countEntries, {weeklyGoal: 40000});
}

function* allBuilds() {
  yield* presentationBuildAll('presentation');
  yield* weeklySummaryBuildAll('weekly-summary', DATE_MONDAY, 53);
  yield* monthlySummaryBuildTests(
    'monthly-summary',
    DATE_MONTH,
    [12000, null, 7000, 13000, 8000, 14000, 3000, 6000, null, 9000, 2000, 11000, 8000, 20000, 7500, 12000, null, 4000, 3000, 10000, 9000, 8000, 7000, 6000],
    53
  );
}

async function main() {
  const tasks = Array.from(allBuilds());

  await Promise.all(
    tasks.map(async t => {
      const buf = await t.run();
      writeOut(t.name, buf);
    })
  );

  console.log(`All ${tasks.length} images rendered`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
