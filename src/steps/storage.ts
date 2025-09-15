import { PrismaClient } from '@prisma/client';
import {DateTime} from "luxon";

const prisma = new PrismaClient();

// API directe sans migration JSON
export async function setGoal(userId: string, goal: number) {
  await prisma.user.upsert({
    where: { id: userId },
    update: { goal },
    create: { id: userId, goal }
  });
}

export async function recordSteps(userId: string, dateISO: string, stepsThousands: number) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, goal: 0 }
  });
  await prisma.stepEntry.upsert({
    where: { userId_date: { userId, date: dateISO } },
    update: { value: stepsThousands },
    create: { userId, date: dateISO, value: stepsThousands }
  });
}

export async function getGoal(userId: string): Promise<number | undefined> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { goal: true } });
  return u?.goal;
}

export async function getEntry(userId: string, dateISO: string): Promise<number | undefined> {
  const e = await prisma.stepEntry.findUnique({ where: { userId_date: { userId, date: dateISO } }, select: { value: true } });
  return e?.value;
}

export async function listUsers(): Promise<string[]> {
  const users = await prisma.user.findMany({ select: { id: true } });
  return users.map(u => u.id);
}

export type WeekSummary = {
  goal: number | undefined;
  days: Array<{ date: string; value?: number }>;
  total: number;
  average: number;
  successDays: number;
};

export async function getWeekSummary(userId: string, mondayISO: string): Promise<WeekSummary> {
  const monday = DateTime.fromISO(mondayISO, { zone: 'Europe/Paris' });
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push((monday.plus({ days: i }).toISODate())!);
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { goal: true } });
  const entries = await prisma.stepEntry.findMany({ where: { userId, date: { in: dates } }, select: { date: true, value: true } });
  const map = new Map(entries.map(e => [e.date, e.value]));
  let total = 0; let successDays = 0;
  const days = dates.map(date => {
    const value = map.get(date);
    if (value !== undefined) {
      total += value;
      if (user?.goal && value >= user.goal) successDays++;
    }
    return { date, value };
  });
  return { goal: user?.goal, days, total, average: total / 7, successDays };
}

export async function shouldSendDailyPrompt(dateISO: string): Promise<boolean> {
  const meta = await prisma.meta.findUnique({ where: { key: 'lastDailyPrompt' } });
  return meta?.value !== dateISO;
}

export async function markDailyPrompt(dateISO: string) {
  await prisma.meta.upsert({ where: { key: 'lastDailyPrompt' }, update: { value: dateISO }, create: { key: 'lastDailyPrompt', value: dateISO } });
}

export async function shouldSendWeeklySummary(mondayISO: string): Promise<boolean> {
  const meta = await prisma.meta.findUnique({ where: { key: 'lastWeeklySummaryMonday' } });
  return meta?.value !== mondayISO;
}

export async function markWeeklySummary(mondayISO: string) {
  await prisma.meta.upsert({ where: { key: 'lastWeeklySummaryMonday' }, update: { value: mondayISO }, create: { key: 'lastWeeklySummaryMonday', value: mondayISO } });
}
