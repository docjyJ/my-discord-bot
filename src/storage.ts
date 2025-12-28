import {type Prisma, PrismaClient} from '@prisma/client';
import type {User} from 'discord.js';
import DateTime from './date-time';
import type {MonthlySummaryData, WeeklySummaryData} from './image/renderer';

const prisma = new PrismaClient();

const WEEKLY_SUMMARY_KEY = 'lastWeeklySummaryMonday';
const DAILY_PROMPT_KEY = 'lastDailyPrompt';
const MONTHLY_SUMMARY_KEY = 'lastMonthlySummaryFirstDay';

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

export async function getLastMonthlySummary() {
  const value = await getMeta(MONTHLY_SUMMARY_KEY);
  return value ? DateTime.parse(value) : null;
}

export function setLastMonthlySummary(date: DateTime) {
  return setMeta(MONTHLY_SUMMARY_KEY, date.toDateString());
}

export async function getDailyGoal(userId: string) {
  const user = await prisma.user.findUnique({where: {userId}, select: {dailyStepsGoal: true}});
  return user ? user.dailyStepsGoal : null;
}

export async function setDailyGoal(userId: string, dailyStepsGoal: number | null) {
  await prisma.user.upsert({where: {userId}, update: {dailyStepsGoal}, create: {userId, dailyStepsGoal, weeklyStepsGoal: null}});
}

export async function getWeeklyGoal(userId: string) {
  const user = await prisma.user.findUnique({where: {userId}, select: {weeklyStepsGoal: true}});
  return user ? user.weeklyStepsGoal : null;
}

export async function setWeeklyGoal(userId: string, weeklyStepsGoal: number | null) {
  await prisma.user.upsert({where: {userId}, update: {weeklyStepsGoal}, create: {userId, dailyStepsGoal: null, weeklyStepsGoal}});
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
      user: {connectOrCreate: {where: {userId}, create: {userId, dailyStepsGoal: null, weeklyStepsGoal: null}}},
      date: date.toDateString(),
      steps
    }
  });
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: {userId: true},
    where: {dailyStepsGoal: {not: null}}
  });
  return users.map(u => u.userId);
}

export async function cleanDatabase() {
  await prisma.user.deleteMany({where: {dailyStepsGoal: null, entries: {every: {steps: null}}}});
  await prisma.dailyEntry.deleteMany({where: {steps: null}});
}

export async function getStreak(userId: string, end: DateTime) {
  const user = await prisma.user.findUnique({where: {userId}, select: {dailyStepsGoal: true}});
  const goal = user?.dailyStepsGoal ?? null;
  if (!goal || goal <= 0) return {streak: null, goal: null};
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

export async function getDataForWeeklySummary(user: User, date: DateTime) {
  const userId = user.id;
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(date.addDay(i).toDateString());
  }

  type WeeklyUserSelect = Prisma.UserGetPayload<{
    select: {
      dailyStepsGoal: true;
      weeklyStepsGoal: true;
      entries: {where: {date: {in: string[]}}};
      _count: {select: {entries: {where: {steps: {not: null}}}}};
    };
  }>;

  const u = (await prisma.user.findUnique({
    where: {userId},
    select: {
      dailyStepsGoal: true,
      weeklyStepsGoal: true,
      entries: {where: {date: {in: dates}}},
      _count: {select: {entries: {where: {steps: {not: null}}}}}
    }
  })) as WeeklyUserSelect | null;

  const filledEntries = u?.entries.filter(e => e.steps !== null) ?? [];
  const totalWeekSteps = filledEntries.reduce((acc, e) => acc + (e.steps as number), 0);

  const base = {
    date,
    days: dates.map(d => u?.entries.find(e => e.date === d)?.steps ?? null),
    countEntries: u?._count.entries ?? 0,
    avatarUrl: user.displayAvatarURL({extension: 'png', size: 512}),
    weeklyGoal: u?.weeklyStepsGoal ?? null,
    totalWeekSteps
  } satisfies Omit<WeeklySummaryData, 'goal' | 'bestStreak' | 'countSuccesses'> & {
    weeklyGoal: number | null;
    totalWeekSteps: number;
  };

  if (u && u.dailyStepsGoal !== null) {
    const entries = await prisma.dailyEntry.findMany({
      select: {date: true},
      where: {userId, steps: {gte: u.dailyStepsGoal}},
      orderBy: {date: 'asc'}
    });

    let currentStreak = 0;
    let prevDate: DateTime | null = null;
    let bestStreak = 0;

    for (const {date: dateStr} of entries) {
      const d = DateTime.parse(dateStr);
      if (d !== null) {
        // biome-ignore lint/complexity/useOptionalChain: TS2339 sur prevDate?.addDay
        if (prevDate !== null && prevDate.addDay(1).sameDay(d)) currentStreak++;
        else currentStreak = 1;

        bestStreak = Math.max(bestStreak, currentStreak);
        prevDate = d;
      }
    }

    return {
      ...base,
      goal: u.dailyStepsGoal,
      bestStreak,
      countSuccesses: entries.length
    } satisfies WeeklySummaryData & {weeklyGoal: number | null; totalWeekSteps: number};
  }

  return {
    ...base,
    goal: null,
    bestStreak: null,
    countSuccesses: null
  } satisfies WeeklySummaryData & {weeklyGoal: number | null; totalWeekSteps: number};
}

export async function getDataForMonthlySummary(user: User, date: DateTime) {
  const userId = user.id;
  const firstDay = date.firstDayOfMonth();
  const daysInMonth = firstDay.daysInMonth();

  const dates: string[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    dates.push(firstDay.addDay(i).toDateString());
  }

  type MonthlyUserSelect = Prisma.UserGetPayload<{
    select: {
      dailyStepsGoal: true;
      entries: {where: {date: {in: string[]}}};
      _count: {select: {entries: {where: {steps: {not: null}}}}};
    };
  }>;

  const u = (await prisma.user.findUnique({
    where: {userId},
    select: {
      dailyStepsGoal: true,
      entries: {where: {date: {in: dates}}},
      _count: {select: {entries: {where: {steps: {not: null}}}}}
    }
  })) as MonthlyUserSelect | null;

  const base: MonthlySummaryData = {
    date: firstDay,
    days: dates.map(dateStr => u?.entries.find(e => e.date === dateStr)?.steps ?? null),
    countEntries: u?._count.entries ?? 0,
    avatarUrl: user.displayAvatarURL({extension: 'png', size: 512}),
    goal: null,
    bestStreak: null,
    countSuccesses: null
  };

  if (u && u.dailyStepsGoal !== null) {
    const entries = await prisma.dailyEntry.findMany({
      select: {date: true},
      where: {userId, steps: {gte: u.dailyStepsGoal}},
      orderBy: {date: 'asc'}
    });

    let currentStreak = 0;
    let prevDate: DateTime | null = null;
    let bestStreak = 0;

    for (const {date: dateStr} of entries) {
      const d = DateTime.parse(dateStr);
      if (d !== null) {
        // biome-ignore lint/complexity/useOptionalChain: TS2339 sur prevDate?.addDay
        if (prevDate !== null && prevDate.addDay(1).sameDay(d)) currentStreak++;
        else currentStreak = 1;

        bestStreak = Math.max(bestStreak, currentStreak);
        prevDate = d;
      }
    }
    return {
      ...base,
      goal: u.dailyStepsGoal,
      bestStreak,
      countSuccesses: entries.length
    } satisfies MonthlySummaryData;
  }

  return base;
}
