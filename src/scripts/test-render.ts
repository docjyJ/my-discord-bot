import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import DateTime from '../date-time';
import {renderPresentationImage, renderWeeklySummaryImage} from '../image/renderer';

const OUT_DIR = path.resolve(process.cwd(), 'rendered');
mkdirSync(OUT_DIR, {recursive: true});

function writeOut(name: string, buf: Buffer) {
  const out = path.join(OUT_DIR, name);
  writeFileSync(out, buf);
  console.log('Wrote', out);
}

const DATE_MONDAY = DateTime.parse('2025-10-20')!;
const DATE_FRIDAY = DateTime.parse('2025-10-24')!;
const DATE_SATURDAY = DateTime.parse('2025-10-25')!;
const DATE_SUNDAY = DateTime.parse('2025-10-26')!;
const AVATAR_URL = 'https://www.slate.fr/uploads/store/drupal_slate/train_1.jpg';


function presentationBuildOneRun(name: string, date: DateTime, steps: number, dayly: {
  goal: number;
  streak: number
} | null, weekly: { weeklyGoal: number; weeklyRemainingSteps: number; weeklyRemainingDays: number } | null) {
  return {
    name,
    run: () => renderPresentationImage({
      avatarUrl: AVATAR_URL,
      date,
      steps,
      ...(dayly ? dayly : {goal: null, streak: null}),
      ...(weekly ? weekly : {
        weeklyGoal: null, weeklyRemainingSteps: null, weeklyRemainingDays: null
      })
    })
  }
}

function  weeklySummaryBuildOneRun(name: string, date: DateTime, days: (number | null)[], countEntries: number, dayly: {
  goal: number;
  bestStreak: number;
  countSuccesses: number
} | null, weekly: { weeklyGoal: number } | null) {
  return {
    name,
    run: () => renderWeeklySummaryImage({
      avatarUrl: AVATAR_URL,
      date,
      days,
      countEntries,
      ...(dayly ? dayly : {goal: null, bestStreak: null, countSuccesses: null}),
      ...(weekly ? weekly : { weeklyGoal: null })
    })
  }
}

function* presentationBuildGroup(prefix: string, date: DateTime, weekly: {
  weeklyGoal: number;
  weeklyRemainingSteps: number;
  weeklyRemainingDays: number
} | null) {
  yield presentationBuildOneRun(`${prefix}-0-no.png`, date, 6000, null, weekly);
  yield presentationBuildOneRun(`${prefix}-1-fail.png`, date, 3000, {goal: 8000, streak: 6000}, weekly);
  yield presentationBuildOneRun(`${prefix}-2-succes.png`, date, 9000, {goal: 8000, streak: 5}, weekly);
}

function* weeklySummaryBuildGroup(prefix: string, date: DateTime, days: (number | null)[], countEntries: number, weekly: { weeklyGoal: number } | null) {
  yield weeklySummaryBuildOneRun(`${prefix}-0-no.png`, date, days, countEntries, null, weekly);
  yield weeklySummaryBuildOneRun(`${prefix}-1-yes.png`, date, days, countEntries, {goal: 8000, bestStreak: 13, countSuccesses: 47}, weekly);
}

function* presentationBuildAll(prefix: string) {
  yield* presentationBuildGroup(`${prefix}-0-no`, DATE_FRIDAY, null);
  yield* presentationBuildGroup(`${prefix}-1-progress`, DATE_FRIDAY, {
    weeklyGoal: 20000,
    weeklyRemainingSteps: 12000,
    weeklyRemainingDays: 2
  });
  yield* presentationBuildGroup(`${prefix}-2-last`, DATE_SATURDAY, {
    weeklyGoal: 20000,
    weeklyRemainingSteps: 6000,
    weeklyRemainingDays: 1
  });
  yield* presentationBuildGroup(`${prefix}-3-fail`, DATE_SUNDAY, {
    weeklyGoal: 20000,
    weeklyRemainingSteps: 3000,
    weeklyRemainingDays: 0
  });
  yield* presentationBuildGroup(`${prefix}-4-success`, DATE_FRIDAY, {
    weeklyGoal: 20000,
    weeklyRemainingSteps: 0,
    weeklyRemainingDays: 2
  });
}

function* weeklySummaryBuildAll(prefix: string, date: DateTime, countEntries: number) {
  yield* weeklySummaryBuildGroup(`${prefix}-0-no`, date, [6000, 7000, 8000, null, 5000, 4000, null], countEntries, null);
  yield* weeklySummaryBuildGroup(`${prefix}-1-fail`, date, [6000, 7000, 8000, null, 5000, 4000, null], countEntries, { weeklyGoal: 40000 });
  yield* weeklySummaryBuildGroup(`${prefix}-2-success`, date, [11000, null, 8000, null, 10000, 12000, 7000], countEntries, { weeklyGoal: 40000 });
}

function* allBuilds() {
  yield* presentationBuildAll('presentation');
  yield* weeklySummaryBuildAll('weekly-summary', DATE_MONDAY, 53);
}


async function main() {
  const tasks = Array.from(allBuilds());

  await Promise.all(
    tasks.map(async t => {
      const buf = await t.run();
      writeOut(t.name, buf);
    })
  );

  console.log('All 21 presentation images rendered');
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
