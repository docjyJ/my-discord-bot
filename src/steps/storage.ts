import {PrismaClient} from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

export async function setGoal(userId: string, data: { stepsGoal: number | null }) {
	await prisma.user.upsert({
		where: {id: userId},
		update: data,
		create: {id: userId, ...data}
	});
}

export async function setEntry(userId: string, date: string, data: { steps: number | null }) {
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

export async function getEntry(userId: string, dateISO: string) {
	return prisma.dailyEntry.findUnique({
		where: {userId_date: {userId, date: dateISO}},
		select: {steps: true}
	}).then(e => (e ?? {steps: null}));
}

export async function listUsers(): Promise<string[]> {
	const users = await prisma.user.findMany({select: {id: true}});
	return users.map(u => u.id);
}


export async function getWeekSummary(userId: string, mondayISO: string) {
	const monday = dayjs(mondayISO).tz('Europe/Paris');
	const dates: string[] = [];
	for (let i = 0; i < 7; i++) {
		dates.push(monday.add(i, 'day').format('YYYY-MM-DD'));
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

export async function shouldSendDailyPrompt(dateISO: string): Promise<boolean> {
	const meta = await prisma.meta.findUnique({where: {key: 'lastDailyPrompt'}});
	return meta?.value !== dateISO;
}

export async function markDailyPrompt(dateISO: string) {
	await prisma.meta.upsert({
		where: {key: 'lastDailyPrompt'},
		update: {value: dateISO},
		create: {key: 'lastDailyPrompt', value: dateISO}
	});
}

export async function shouldSendWeeklySummary(mondayISO: string): Promise<boolean> {
	const meta = await prisma.meta.findUnique({where: {key: 'lastWeeklySummaryMonday'}});
	return meta?.value !== mondayISO;
}

export async function markWeeklySummary(mondayISO: string) {
	await prisma.meta.upsert({
		where: {key: 'lastWeeklySummaryMonday'},
		update: {value: mondayISO},
		create: {key: 'lastWeeklySummaryMonday', value: mondayISO}
	});
}

// Compute current success streak (consecutive days reaching goal) up to and including dateISO
export async function getStreak(userId: string, dateISO: string): Promise<number> {
	const user = await prisma.user.findUnique({where: {id: userId}, select: {stepsGoal: true}});
	const goal = user?.stepsGoal ?? null;
	if (!goal || goal <= 0) return 0;
	const zone = 'Europe/Paris';
	const end = dayjs.tz(dateISO, zone);
	if (!end.isValid()) return 0;
	const windowDays = 60; // reasonable window
	const start = end.subtract(windowDays - 1, 'day');
	const dates: string[] = [];
	for (let i = 0; i < windowDays; i++) {
		dates.push(start.add(i, 'day').format('YYYY-MM-DD'));
	}
	const entries = await prisma.dailyEntry.findMany({
		where: {userId, date: {in: dates}, steps: {not: null}},
		select: {date: true, steps: true}
	});
	const map = new Map<string, number>(entries.map(e => [e.date, e.steps as number]));
	let streak = 0;
	for (let i = 0; i < windowDays; i++) {
		const d = end.subtract(i, 'day').format('YYYY-MM-DD');
		const val = map.get(d);
		if (val === undefined || val < goal) break;
		streak++;
	}
	return streak;
}
