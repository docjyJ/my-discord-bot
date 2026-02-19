import type DateTime from '../date-time';
import {saisir} from '../lang';
import Draw, {downloadImage} from './draw';

export type DailySummaryData = {
  date: DateTime;
  steps: number;
  avatarUrl: string;
} & (
  | {
      goal: number;
      streak: number;
    }
  | {
      goal: null;
      streak: null;
    }
) &
  (
    | {
        weeklyGoal: null;
        weeklySteps: null;
        weeklyRemainingDays: null;
      }
    | {
        weeklyGoal: number;
        weeklySteps: number;
        weeklyRemainingDays: number;
      }
  );

export async function renderDailySummaryImage(opts: DailySummaryData) {
  const goal = opts.goal === null || opts.goal < 0 ? 0 : opts.goal;
  const steps = opts.steps < 0 ? 0 : opts.steps;
  const streak = opts.streak === null || opts.streak < 0 ? 0 : opts.streak;

  const width = 1200;
  const height = 630;

  const draw = new Draw(width, height);

  draw.text(saisir.image.dateTitle(opts.date), width / 2, 50, '#f8fafc', 44);

  const leftX = 0.3 * width;
  const rightX = 0.7 * width;
  const centerY = 0.52 * height;
  const radius = 0.35 * height;
  const padding = 6;
  const arcWidth = 20;
  const image = await downloadImage(opts.avatarUrl);

  draw.backgroundCircle(leftX, centerY, radius);
  draw.avatarCircle(leftX, centerY, radius - padding, image);

  draw.backgroundCircle(rightX, centerY, radius);

  const widgetRadius = radius - padding - arcWidth / 2;

  const progress = goal !== 0 && steps !== 0 ? (goal > steps ? (steps / goal) * 0.98 : 1) : 0;

  const weeklySucceeded = opts.weeklyGoal !== null && opts.weeklySteps >= opts.weeklyGoal;

  if (goal > 0) {
    draw.drawCircle(rightX, centerY, widgetRadius, arcWidth, '#374151');
  }

  if (progress > 0) {
    const [color0, color1] = progress === 1 ? (weeklySucceeded ? ['#eab308', '#f1dd89'] : ['#22c55e', '#84cc16']) : ['#60a5fa', '#c084fc'];
    const grad = draw.createLinearGradient(rightX - widgetRadius, centerY, rightX + widgetRadius, centerY, color0, color1);
    if (progress === 1) {
      draw.drawCircle(rightX, centerY, widgetRadius, arcWidth, grad);
    } else {
      draw.drawArc(rightX, centerY, widgetRadius, arcWidth, grad, -0.25, progress - 0.25);
    }
  }

  const mainY = goal !== 0 ? centerY - 22 : centerY;

  draw.text(saisir.image.stepsLabel(steps), rightX, mainY, '#e5e7eb', 80);

  if (goal !== 0) {
    draw.text(saisir.image.goalLabel(goal), rightX, centerY + 45, '#94a3b8', 34);
  }

  if (progress === 1 && streak !== 0) {
    const badgeX = rightX + widgetRadius - 36;
    const badgeY = centerY - widgetRadius + 36;
    const badgeColor = weeklySucceeded ? '#eab308' : '#16a34a';
    draw.roundedRectFill(badgeX - 56, badgeY - 24, 112, 48, 14, badgeColor);
    draw.text(saisir.image.streak(streak), badgeX, badgeY, '#0b1120', 24);
  }

  if (opts.weeklyGoal !== null && opts.weeklyGoal > 0) {
    const weeklyGoal = opts.weeklyGoal;
    const weeklySteps = opts.weeklySteps;
    const weeklyRemaining = Math.max(0, weeklyGoal - weeklySteps);
    const ratio = weeklyGoal === 0 ? 0 : Math.min(1, weeklySteps / weeklyGoal);
    const remainingDays = Math.max(0, opts.weeklyRemainingDays);
    const perDay = remainingDays > 0 ? Math.ceil(weeklyRemaining / remainingDays) : weeklyRemaining;

    const barPadding = 12;
    const barHeight = arcWidth + padding * 2;
    const barRadius = barHeight / 2;
    const barWidth = width - barPadding * 2;
    const barY = height - barPadding - barHeight;

    const barBg = draw.createLinearGradient(barPadding, barY, barPadding, barY + barHeight, '#0b1220', '#0f172a');
    draw.roundedRectFill(barPadding, barY, barWidth, barHeight, barRadius, barBg);
    draw.roundedRectFill(barPadding + padding, barY + padding, barWidth - padding * 2, barHeight - padding * 2, barRadius, '#374151');

    const [topColor, bottomColor] = weeklySucceeded && progress === 1 ? ['#eab308', '#f1dd89'] : weeklySucceeded ? ['#22c55e', '#84cc16'] : ['#60a5fa', '#c084fc'];

    const fillWidth = arcWidth + Math.round((barWidth - padding * 2 - arcWidth) * ratio);
    if (fillWidth > 0) {
      const g = draw.createLinearGradient(barPadding, barY, barPadding + barWidth, barY, topColor, bottomColor);
      draw.roundedRectFill(barPadding + padding, barY + padding, fillWidth, barHeight - padding * 2, barRadius, g);
    }

    let label = saisir.image.weeklyProgress(weeklySteps, weeklyGoal);
    if (!weeklySucceeded && remainingDays >= 1) {
      label += remainingDays > 1 ? saisir.image.weeklyRemainingPerDay(perDay) : saisir.image.weeklyRemainingLast(perDay);
    }
    draw.text(label, width / 2, barY - 16, '#e5e7eb', 22);
  }

  return draw.toBuffer();
}
