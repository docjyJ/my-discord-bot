import {PrismaClient} from '@prisma/client';
import DateTime from "./date-time";

const prisma = new PrismaClient();

function upsertMeta(key: string, value: string) {
	return prisma.meta.upsert({where: {key}, update: {value}, create: {key, value}});
}

export async function setGoal(userId: string, data: { stepsGoal: number | null }) {
	await prisma.user.upsert({
		where: {id: userId},
		update: data,
		create: {id: userId, ...data}
	});
}

export async function setEntry(userId: string, dateObj: DateTime, data: { steps: number | null }) {
	const date = dateObj.toDateString();
	await prisma.dailyEntry.upsert({
		where: {userId_date: {userId, date}},
		update: data,
		create: {
			user: {
				connectOrCreate: {
					where: {id: userId},
					create: {id: userId, stepsGoal: null}
				}
			}, date, ...data
		}
	});
}

export async function cleanDatabase() {
	await prisma.dailyEntry.deleteMany({where: {steps: null}});
	await prisma.user.deleteMany({where: {stepsGoal: null, entries: {every: {steps: null}}}});
}

export async function getGoal(userId: string) {
	return prisma.user.findUnique({where: {id: userId}, select: {stepsGoal: true}}).then(
		u => (u ?? {stepsGoal: null})
	)
}

export async function getEntry(userId: string, date: DateTime) {
	return prisma.dailyEntry.findUnique({
		where: {userId_date: {userId, date: date.toDateString()}},
		select: {steps: true}
	}).then(e => (e ?? {steps: null}));
}

export async function listUsers(): Promise<string[]> {
	const users = await prisma.user.findMany({select: {id: true}});
	return users.map(u => u.id);
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

export async function shouldSendDailyPrompt(date: DateTime): Promise<boolean> {
	const meta = await prisma.meta.findUnique({where: {key: 'lastDailyPrompt'}});
	return meta?.value !== date.toDateString();
}

export async function markDailyPrompt(date: DateTime) {
	await upsertMeta('lastDailyPrompt', date.toDateString());
}

export async function shouldSendWeeklySummary(monday: DateTime): Promise<boolean> {
	const meta = await prisma.meta.findUnique({where: {key: 'lastWeeklySummaryMonday'}});
	return meta?.value !== monday.toDateString();
}

export async function markWeeklySummary(monday: DateTime) {
	await upsertMeta('lastWeeklySummaryMonday', monday.toDateString());
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
