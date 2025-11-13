import {PrismaClient} from '@prisma/client';
import DateTime from './date-time';

const prisma = new PrismaClient();

const WEEKLY_SUMMARY_KEY = 'lastWeeklySummaryMonday';
const DAILY_PROMPT_KEY = 'lastDailyPrompt';

function meta(key: string) {
  return {
    get: () => prisma.meta.findUnique({where: {key}}).then(m => (m ? m.value : null)),
    set: (value: string) => prisma.meta.upsert({where: {key}, update: {value}, create: {key, value}}).then(() => {})
  };
}

export default {
  lastWeeklySummary: meta(WEEKLY_SUMMARY_KEY),
  lastDailyPrompt: meta(DAILY_PROMPT_KEY),
  goal: {
    get: (id: string) =>
      prisma.user
        .findUnique({
          where: {id},
          select: {stepsGoal: true}
        })
        .then(u => (u ? u.stepsGoal : null)),
    set: (id: string, stepsGoal: number | null) =>
      prisma.user
        .upsert({
          where: {id},
          update: {stepsGoal},
          create: {id, stepsGoal}
        })
        .then(() => {})
  },
  entry: {
    get: (userId: string, date: string) =>
      prisma.dailyEntry
        .findUnique({
          where: {userId_date: {userId, date}},
          select: {steps: true}
        })
        .then(e => (e ? e.steps : null)),
    set: (userId: string, date: string, steps: number | null) =>
      prisma.dailyEntry
        .upsert({
          where: {userId_date: {userId, date}},
          update: {steps},
          create: {user: {connectOrCreate: {where: {id: userId}, create: {id: userId, stepsGoal: null}}}, date, steps}
        })
        .then(() => {})
  },
  entries: {
    count: async (userId: string) => {
      const user = await prisma.user.findUnique({where: {id: userId}, select: {stepsGoal: true}});
      const total = await prisma.dailyEntry.count({where: {userId, steps: {not: null}}});
      const goal = user?.stepsGoal ?? null;
      if (goal === null) return {succes: 0, total};
      const succes = await prisma.dailyEntry.count({where: {userId, steps: {gte: goal}}});
      return {succes, total};
    }
  },
  user: {
    list: () =>
      prisma.user
        .findMany({
          select: {id: true},
          where: {stepsGoal: {not: null}}
        })
        .then(users => users.map(u => u.id))
  },
  streak: {
    get: (userId: string, end: DateTime) => getStreak(userId, end),
    best: (userId: string) => getBestStreak(userId)
  }
};

export async function cleanDatabase() {
  await prisma.dailyEntry.deleteMany({where: {steps: null}});
  await prisma.user.deleteMany({where: {stepsGoal: null, entries: {every: {steps: null}}}});
}

async function getBestStreak(userId: string): Promise<number> {
  const gte = await prisma.user
    .findUnique({
      where: {id: userId},
      select: {stepsGoal: true}
    })
    .then(u => (u ? u.stepsGoal : null));
  if (gte === null) return 0;
  const entries = await prisma.dailyEntry
    .findMany({
      where: {userId, steps: {gte}},
      orderBy: {date: 'asc'}
    })
    .then(es => es.map(e => e.date));

  let bestStreak = 0;
  let currentStreak = 0;
  let prevDate: DateTime | null = null;

  for (const dateStr of entries) {
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
  return bestStreak;
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

async function getStreak(userId: string, end: DateTime): Promise<number> {
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
