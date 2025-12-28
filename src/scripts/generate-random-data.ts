import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import DateTime from '../date-time';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

const userId = required('USER_ID');
const goal = 10000;
const weeklyGoal = goal * 7;
const minEntry = 7000;
const maxEntry = 17000;
const emptyGoal = 0.1;

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: {userId},
    update: {dailyStepsGoal: goal, weeklyStepsGoal: weeklyGoal},
    create: {userId, dailyStepsGoal: goal, weeklyStepsGoal: weeklyGoal}
  });

  const today = DateTime.now();

  for (let i = 60; i >= 0; i--) {
    const date = today.addDay(-i).toDateString();
    const steps: number | null = Math.random() < emptyGoal ? null : Math.floor((Math.random() * (maxEntry - minEntry + 1)) / 10) * 10 + minEntry;

    await prisma.dailyEntry.upsert({
      where: {userId_date: {userId, date}},
      update: {steps},
      create: {userId, date, steps}
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
