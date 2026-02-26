import {PrismaClient} from '@prisma/client';
import type {User} from 'discord.js';
import DateTime from './date-time';
import type {MonthlySummaryData} from './image/monthly-summary';
import type {WeeklySummaryData} from './image/weekly-summary';

class DataBase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private async getMeta(key: string) {
    const meta = await this.prisma.meta.findUnique({where: {key}, select: {value: true}});
    return meta?.value || null;
  }

  private async setMeta(key: string, value: string) {
    await this.prisma.meta.upsert({
      where: {key},
      update: {value},
      create: {key, value}
    });
  }

  async getLastDailyPrompt() {
    const value = await this.getMeta('lastDailyPrompt');
    return value ? DateTime.parse(value) : null;
  }

  async setLastDailyPrompt(date: DateTime) {
    return this.setMeta('lastDailyPrompt', date.toDateString());
  }

  async getDailyGoal(userId: string) {
    const user = await this.prisma.user.findUnique({where: {userId}, select: {dailyStepsGoal: true}});
    return user ? user.dailyStepsGoal : null;
  }

  async setDailyGoal(userId: string, dailyStepsGoal: number | null) {
    await this.prisma.user.upsert({
      where: {userId},
      update: {dailyStepsGoal},
      create: {userId, dailyStepsGoal, weeklyStepsGoal: null}
    });
  }

  async getWeeklyGoal(userId: string) {
    const user = await this.prisma.user.findUnique({where: {userId}, select: {weeklyStepsGoal: true}});
    return user ? user.weeklyStepsGoal : null;
  }

  async setWeeklyGoal(userId: string, weeklyStepsGoal: number | null) {
    await this.prisma.user.upsert({
      where: {userId},
      update: {weeklyStepsGoal},
      create: {userId, dailyStepsGoal: null, weeklyStepsGoal}
    });
  }

  async getEntry(userId: string, date: DateTime) {
    return this.prisma.dailyEntry
      .findUnique({
        where: {userId_date: {userId, date: date.toDateString()}},
        select: {steps: true}
      })
      .then(entry => (entry ? entry.steps : null));
  }

  async setEntry(userId: string, date: DateTime, steps: number | null) {
    await this.prisma.dailyEntry.upsert({
      where: {userId_date: {userId, date: date.toDateString()}},
      update: {steps},
      create: {
        user: {connectOrCreate: {where: {userId}, create: {userId, dailyStepsGoal: null, weeklyStepsGoal: null}}},
        date: date.toDateString(),
        steps
      }
    });
  }

  async listUsers() {
    return this.prisma.user
      .findMany({
        select: {userId: true},
        where: {OR: [{dailyStepsGoal: {not: null}}, {weeklyStepsGoal: {not: null}}]}
      })
      .then(users => users.map(u => u.userId));
  }

  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: {userId},
      select: {dailyStepsGoal: true, weeklyStepsGoal: true}
    });
  }

  async getUserWithEntries(userId: string, dates: DateTime[]) {
    return this.prisma.user
      .findUnique({
        where: {userId},
        select: {
          dailyStepsGoal: true,
          weeklyStepsGoal: true,
          entries: {where: {date: {in: dates.map(d => d.toDateString())}}, select: {date: true, steps: true}}
        }
      })
      .then(user =>
        !user
          ? null
          : {
              dailyStepsGoal: user.dailyStepsGoal,
              weeklyStepsGoal: user.weeklyStepsGoal,
              entries: new Map(dates.map(d => [d, user.entries.find(e => e.date === d.toDateString())?.steps ?? null]))
            }
      );
  }

  async getUserWithEntriesAndCount(userId: string, dates: DateTime[]) {
    return this.prisma.user
      .findUnique({
        where: {userId},
        select: {
          dailyStepsGoal: true,
          weeklyStepsGoal: true,
          entries: {where: {date: {in: dates.map(d => d.toDateString())}}, select: {date: true, steps: true}},
          _count: {select: {entries: {where: {date: {in: dates.map(d => d.toDateString())}, steps: {not: null}}}}}
        }
      })
      .then(user =>
        !user
          ? null
          : {
              dailyStepsGoal: user.dailyStepsGoal,
              weeklyStepsGoal: user.weeklyStepsGoal,
              entries: new Map(dates.map(d => [d, user.entries.find(e => e.date === d.toDateString())?.steps ?? null])),
              countEntries: user._count.entries
            }
      );
  }

  async cleanDatabase() {
    await this.prisma.user.deleteMany({
      where: {
        dailyStepsGoal: null,
        weeklyStepsGoal: null,
        entries: {every: {steps: null}}
      }
    });
    await this.prisma.dailyEntry.deleteMany({where: {steps: null}});
  }

  async getEntries(userId: string, dates: DateTime[]) {
    return this.prisma.dailyEntry
      .findMany({
        where: {userId, date: {in: dates.map(d => d.toDateString())}},
        select: {date: true, steps: true}
      })
      .then(entries => new Map(dates.map(d => [d, entries.find(e => e.date === d.toDateString())?.steps ?? null])));
  }

  async listAllEntriesGoal(userId: string, goal: number) {
    return this.prisma.dailyEntry
      .findMany({
        where: {userId, steps: {gte: goal}},
        select: {date: true},
        orderBy: {date: 'asc'}
      })
      .then(entries => entries.map(e => DateTime.parse(e.date)).filter((d): d is DateTime => d !== null));
  }
}

export const db = new DataBase();

export async function getStreak(userId: string, end: DateTime) {
  const user = await db.getUser(userId);
  const goal = user?.dailyStepsGoal ?? null;
  if (!goal || goal <= 0) return {streak: null, goal: null};
  const entries = await db.listAllEntriesGoal(userId, goal);
  let start = entries.length - 1;
  while (start >= 0 && entries[start].isAfter(end)) {
    start--;
  }
  let streak = 0;
  for (let i = start; i >= 0; i--) {
    const expected = end.addDay(-streak);
    if (entries[i].sameDay(expected)) streak++;
    else break;
  }
  return {streak, goal};
}

export type WeeklyProgress =
  | {
      weeklyGoal: null;
      weeklySteps: null;
      weeklyRemainingDays: null;
    }
  | {
      weeklyGoal: number;
      weeklySteps: number;
      weeklyRemainingDays: number;
    };

export async function getWeeklyProgress(userId: string, date: DateTime): Promise<WeeklyProgress> {
  const monday = date.getMonday();
  const dates: DateTime[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(monday.addDay(i));
  }

  const u = await db.getUserWithEntries(userId, dates);

  if (u === null || u.weeklyStepsGoal === null || u.weeklyStepsGoal <= 0) {
    return {weeklyGoal: null, weeklySteps: null, weeklyRemainingDays: null};
  }

  const totalWeekSteps = Array.from(u.entries.values()).reduce((acc: number, e) => acc + (e ?? 0), 0);

  return {
    weeklyGoal: u.weeklyStepsGoal,
    weeklySteps: totalWeekSteps,
    weeklyRemainingDays: 7 - date.weekDay()
  };
}

export async function getDataForWeeklySummary(user: User, date: DateTime) {
  const userId = user.id;
  const dates: DateTime[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(date.addDay(i));
  }

  const u = await db.getUserWithEntriesAndCount(userId, dates);

  const totalWeekSteps = Array.from(u?.entries.values() ?? []).reduce((acc: number, e) => acc + (e ?? 0), 0);

  const base = {
    date,
    days: Array.from(u?.entries.values() ?? []),
    countEntries: u?.countEntries ?? 0,
    avatarUrl: user.displayAvatarURL({extension: 'png', size: 512}),
    weeklyGoal: u?.weeklyStepsGoal ?? null,
    totalWeekSteps
  } satisfies Omit<WeeklySummaryData, 'goal' | 'bestStreak' | 'countSuccesses'> & {
    weeklyGoal: number | null;
    totalWeekSteps: number;
  };

  if (u && u.dailyStepsGoal !== null) {
    const entries = await db.listAllEntriesGoal(userId, u.dailyStepsGoal);

    let currentStreak = 0;
    let prevDate: DateTime | null = null;
    let bestStreak = 0;

    for (const d of entries) {
      // biome-ignore lint/complexity/useOptionalChain: TS2339 sur prevDate?.addDay
      if (prevDate !== null && prevDate.addDay(1).sameDay(d)) currentStreak++;
      else currentStreak = 1;

      bestStreak = Math.max(bestStreak, currentStreak);
      prevDate = d;
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
  const firstWeekDay = firstDay.weekDay();

  const prevDaysNeeded = firstWeekDay - 1;
  const allDates: DateTime[] = [];
  for (let i = -prevDaysNeeded; i < daysInMonth; i++) {
    allDates.push(firstDay.addDay(i));
  }

  const u = await db.getUserWithEntriesAndCount(userId, allDates);

  const base: MonthlySummaryData = {
    date: firstDay,
    days: Array.from(u?.entries.values() ?? []),
    countEntries: u?.countEntries ?? 0,
    avatarUrl: user.displayAvatarURL({extension: 'png', size: 512}),
    goal: null,
    bestStreak: null,
    countSuccesses: null,
    weeklyGoal: u?.weeklyStepsGoal ?? null
  };

  if (u && u.dailyStepsGoal !== null) {
    const entries = await db.listAllEntriesGoal(userId, u.dailyStepsGoal);

    let currentStreak = 0;
    let prevDate: DateTime | null = null;
    let bestStreak = 0;

    for (const d of entries) {
      // biome-ignore lint/complexity/useOptionalChain: TS2339 sur prevDate?.addDay
      if (prevDate !== null && prevDate.addDay(1).sameDay(d)) currentStreak++;
      else currentStreak = 1;

      bestStreak = Math.max(bestStreak, currentStreak);
      prevDate = d;
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

export async function isWeekComplete(userId: string, date: DateTime) {
  const monday = date.getMonday();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(monday.addDay(i));
  }

  const entries = await db.getEntries(userId, dates);
  return Array.from(entries.values()).every(v => v !== null);
}

export async function isMonthComplete(userId: string, date: DateTime) {
  const firstDay = date.firstDayOfMonth();
  const daysInMonth = firstDay.daysInMonth();
  const dates = [];
  for (let i = 0; i < daysInMonth; i++) {
    dates.push(firstDay.addDay(i));
  }

  const entries = await db.getEntries(userId, dates);
  return Array.from(entries.values()).every(v => v !== null);
}
