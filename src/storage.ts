import {PrismaClient} from '@prisma/client';
import type {User} from 'discord.js';
import DateTime from './date-time';
import type {WeeklySummaryData} from './image/renderer';

const prisma = new PrismaClient();

const WEEKLY_SUMMARY_KEY = 'lastWeeklySummaryMonday';
const DAILY_PROMPT_KEY = 'lastDailyPrompt';

async function getMeta(key: string) {
  const meta = await prisma.meta.findUnique({where: {key}, select: {value: true}});
  return meta?.value || null;
}

async function setMeta(key: string, value: string) {
  await prisma.meta.upsert({
    where: {key},
    update: {value},
    create: {key, value}
  });
}

export async function getLastWeeklySummary() {
  const value = await getMeta(WEEKLY_SUMMARY_KEY);
  return value ? DateTime.parse(value) : null;
}

export function setLastWeeklySummary(date: DateTime) {
  return setMeta(WEEKLY_SUMMARY_KEY, date.toDateString());
}

export async function getLastDailyPrompt() {
  const value = await getMeta(DAILY_PROMPT_KEY);
  return value ? DateTime.parse(value) : null;
}

export function setLastDailyPrompt(date: DateTime) {
  return setMeta(DAILY_PROMPT_KEY, date.toDateString());
}

export async function getGoal(userId: string) {
  const user = await prisma.user.findUnique({where: {userId}, select: {stepsGoal: true}});
  return user ? user.stepsGoal : null;
}

export async function setGoal(userId: string, stepsGoal: number | null) {
  await prisma.user.upsert({where: {userId}, update: {stepsGoal}, create: {userId, stepsGoal}});
}

export async function getEntry(userId: string, date: DateTime) {
  const entry = await prisma.dailyEntry.findUnique({
    where: {userId_date: {userId, date: date.toDateString()}},
    select: {steps: true}
  });
  return entry ? entry.steps : null;
}

export async function setEntry(userId: string, date: DateTime, steps: number | null) {
  await prisma.dailyEntry.upsert({
    where: {userId_date: {userId, date: date.toDateString()}},
    update: {steps},
    create: {
      user: {connectOrCreate: {where: {userId}, create: {userId, stepsGoal: null}}},
      date: date.toDateString(),
      steps
    }
  });
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: {userId: true},
    where: {stepsGoal: {not: null}}
  });
  return users.map(u => u.userId);
}

export async function cleanDatabase() {
  await prisma.user.deleteMany({where: {stepsGoal: null, entries: {every: {steps: null}}}});
  await prisma.dailyEntry.deleteMany({where: {steps: null}});
}

export async function getStreak(userId: string, end: DateTime) {
  const user = await prisma.user.findUnique({where: {userId}, select: {stepsGoal: true}});
  const goal = user?.stepsGoal ?? null;
  if (!goal || goal <= 0) return {streak: 0, goal: null};
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
  return {streak, goal};
}

export async function getDataForWeeklySummary(user: User, monday: DateTime) {
  const userId = user.id;

  async function getStreakAndSuccesses(gte: number) {
    const entries = await prisma.dailyEntry.findMany({
      select: {date: true},
      where: {userId, steps: {gte}},
      orderBy: {date: 'asc'}
    });

    let currentStreak = 0;
    let prevDate: DateTime | null = null;
    let bestStreak = 0;

    for (const {date: dateStr} of entries) {
      const date = DateTime.parse(dateStr);
      if (date !== null) {
        if (prevDate !== null && prevDate.addDay(1).toDateString() === dateStr) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        bestStreak = Math.max(bestStreak, currentStreak);
        prevDate = date;
      }
    }
    return [bestStreak, entries.length] as const;
  }

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(monday.addDay(i).toDateString());
  }

  const u = await prisma.user.findUnique({
    where: {userId},
    select: {
      stepsGoal: true,
      entries: {where: {date: {in: dates}}},
      _count: {select: {entries: {where: {steps: {not: null}}}}}
    }
  });

  const [bestStreak, countSuccesses] = u && u.stepsGoal !== null ? await getStreakAndSuccesses(u.stepsGoal) : [0, 0];

  return {
    week: {
      monday,
      days: dates.map(date => u?.entries.find(e => e.date === date)?.steps ?? null)
    },
    allTime: {
      bestStreak,
      countEntries: u?._count.entries ?? 0,
      countSuccesses
    },
    user: {
      avatarUrl: user.displayAvatarURL({extension: 'png', size: 128}),
      goal: u?.stepsGoal ?? null
    }
  } as WeeklySummaryData;
}
