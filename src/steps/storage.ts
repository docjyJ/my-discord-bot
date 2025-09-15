import { promises as fs } from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

export type StepData = {
  users: Record<string, {
    goal: number; // objectif quotidien en milliers de pas
    entries: Record<string, number>; // date ISO -> milliers de pas
  }>;
  meta?: {
    lastDailyPrompt?: string; // date ISO AAAA-MM-JJ
    lastWeeklySummaryMonday?: string; // date ISO du lundi
  }
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'steps.json');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readRaw(): Promise<StepData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw) as StepData;
  } catch (e) {
    return { users: {}, meta: {} };
  }
}

async function writeRaw(data: StepData) {
  await ensureDir();
  const tmp = DATA_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
}

export async function setGoal(userId: string, goal: number) {
  const data = await readRaw();
  const user = data.users[userId] || { goal: goal, entries: {} };
  user.goal = goal;
  data.users[userId] = user;
  await writeRaw(data);
}

export async function recordSteps(userId: string, dateISO: string, stepsThousands: number) {
  const data = await readRaw();
  if (!data.users[userId]) {
    data.users[userId] = { goal: 0, entries: {} };
  }
  data.users[userId].entries[dateISO] = stepsThousands;
  await writeRaw(data);
}

export async function getGoal(userId: string): Promise<number | undefined> {
  const data = await readRaw();
  return data.users[userId]?.goal;
}

export async function getEntry(userId: string, dateISO: string): Promise<number | undefined> {
  const data = await readRaw();
  return data.users[userId]?.entries[dateISO];
}

export async function listUsers(): Promise<string[]> {
  const data = await readRaw();
  return Object.keys(data.users);
}

export type WeekSummary = {
  goal: number | undefined;
  days: Array<{ date: string; value?: number }>;
  total: number;
  average: number;
  successDays: number; // jours où objectif atteint
};

export async function getWeekSummary(userId: string, mondayISO: string): Promise<WeekSummary> {
  const data = await readRaw();
  const user = data.users[userId];
  const goal = user?.goal;
  const monday = DateTime.fromISO(mondayISO, { zone: 'Europe/Paris' });
  const days: Array<{ date: string; value?: number }> = [];
  let total = 0;
  let successDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = monday.plus({ days: i });
    const key = d.toISODate() || d.toFormat('yyyy-MM-dd');
    const value = user?.entries[key];
    if (value !== undefined) {
      total += value;
      if (goal && value >= goal) successDays += 1;
    }
    days.push({ date: key, value });
  }
  const average = total / 7;
  return { goal, days, total, average, successDays };
}

export async function shouldSendDailyPrompt(dateISO: string): Promise<boolean> {
  const data = await readRaw();
  return data.meta?.lastDailyPrompt !== dateISO;
}

export async function markDailyPrompt(dateISO: string) {
  const data = await readRaw();
  data.meta = data.meta || {};
  data.meta.lastDailyPrompt = dateISO;
  await writeRaw(data);
}

export async function shouldSendWeeklySummary(mondayISO: string): Promise<boolean> {
  const data = await readRaw();
  return data.meta?.lastWeeklySummaryMonday !== mondayISO;
}

export async function markWeeklySummary(mondayISO: string) {
  const data = await readRaw();
  data.meta = data.meta || {};
  data.meta.lastWeeklySummaryMonday = mondayISO;
  await writeRaw(data);
}
