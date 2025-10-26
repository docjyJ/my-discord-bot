import {PrismaClient} from '@prisma/client';
import type DateTime from './date-time';

const prisma = new PrismaClient();

export const WEEKLY_SUMMARY_KEY = 'lastWeeklySummaryMonday';
export const DAILY_PROMPT_KEY = 'lastDailyPrompt';

export async function getMeta(key: string) {
  return prisma.meta.findUnique({where: {key}}).then(m => (m ? m.value : null));
}

export async function markMeta(key: string, value: string) {
  await prisma.meta.upsert({where: {key}, update: {value}, create: {key, value}});
}

export async function getGoal(userId: string) {
  return prisma.user
    .findUnique({
      where: {id: userId},
      select: {stepsGoal: true}
    })
    .then(u => (u ? u.stepsGoal : null));
}

export async function setGoal(id: string, stepsGoal: number | null) {
  await prisma.user.upsert({where: {id}, update: {stepsGoal}, create: {id, stepsGoal}});
}

export async function getEntry(userId: string, date: string) {
  return prisma.dailyEntry
    .findUnique({
      where: {userId_date: {userId, date}},
      select: {steps: true}
    })
    .then(e => (e ? e.steps : null));
}

export async function setEntry(userId: string, date: string, steps: number | null) {
  await prisma.dailyEntry.upsert({
    where: {userId_date: {userId, date}},
    update: {steps},
    create: {
      user: {
        connectOrCreate: {
          where: {id: userId},
          create: {id: userId, stepsGoal: null}
        }
      },
      date,
      steps
    }
  });
}

export async function cleanDatabase() {
  await prisma.dailyEntry.deleteMany({where: {steps: null}});
  await prisma.user.deleteMany({where: {stepsGoal: null, entries: {every: {steps: null}}}});
}

export async function listUsers(): Promise<string[]> {
  return prisma.user.findMany({select: {id: true}}).then(l => l.map(u => u.id));
}

export async function getWeekSummary(userId: string, monday: DateTime) {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(monday.addDay(i).toDateString());
  }

  const user = await prisma.user.findUnique({where: {id: userId}, select: {stepsGoal: true}});
  const entries = await prisma.dailyEntry.findMany({
    where: {userId, date: {in: dates}, steps: {not: null}},
    select: {date: true, steps: true}
  });
  const map = new Map<string, number>(entries.map(e => [e.date, e.steps as number]));

  const days = dates.map(date => map.get(date) ?? null);
  const goal = user?.stepsGoal ?? null;
  return {days, goal};
}

export async function getStreak(userId: string, end: DateTime): Promise<number> {
  const user = await prisma.user.findUnique({where: {id: userId}, select: {stepsGoal: true}});
  const goal = user?.stepsGoal ?? null;
  if (!goal || goal <= 0) return 0;
  const windowDays = 60;
  const start = end.addDay(1 - windowDays);
  const dates: string[] = [];
  for (let i = 0; i < windowDays; i++) {
    dates.push(start.addDay(i).toDateString());
  }
  const entries = await prisma.dailyEntry.findMany({
    where: {userId, date: {in: dates}, steps: {not: null}},
    select: {date: true, steps: true}
  });
  const map = new Map<string, number>(entries.map(e => [e.date, e.steps as number]));
  let streak = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = end.addDay(-i).toDateString();
    const val = map.get(d);
    if (val === undefined || val < goal) break;
    streak++;
  }
  return streak;
}
