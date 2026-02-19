import type DateTime from '../date-time';
import {saisir} from '../lang';
import Draw, {downloadImage} from './draw';

export type PresentationOptions = {
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

export async function renderPresentationImage(opts: PresentationOptions) {
  console.log('Rendering presentation image with options:', opts);
  const numberFmt = new Intl.NumberFormat('fr-FR');
  const goal = opts.goal === null || opts.goal < 0 ? 0 : opts.goal;
  const steps = opts.steps < 0 ? 0 : opts.steps;
  const streak = opts.streak === null || opts.streak < 0 ? 0 : opts.streak;

  const width = 1200;
  const height = 630;

  const draw = new Draw(1200, 630);

  draw.text(saisir.image.dateTitle(opts.date), width / 2, 50, '#f8fafc', 44);

  const left_x = 0.3 * width;
  const right_x = 0.7 * width;
  const h_center = 0.52 * height;
  const radius = 0.35 * height;
  const padding = 6;
  const arcWidth = 20;
  const image = await downloadImage(opts.avatarUrl);

  draw.backgroundCircle(left_x, h_center, radius);
  draw.avatarCircle(left_x, h_center, radius - padding, image);

  draw.backgroundCircle(right_x, h_center, radius);

  const widget_radius = radius - padding - arcWidth / 2;

  const progress = goal !== 0 && steps !== 0 ? (goal > steps ? (steps / goal) * 0.98 : 1) : 0;

  const weeklySucceeded = opts.weeklyGoal !== null && opts.weeklySteps >= opts.weeklyGoal;

  // If there is no daily goal but there is a weekly goal, draw a yellow ring to indicate weekly tracking
  const hasDailyGoal = opts.goal !== null && opts.goal > 0;
  const dailySucceeded = hasDailyGoal && steps >= (opts.goal as number);
  if (hasDailyGoal) {
    draw.drawCircle(right_x, h_center, widget_radius, arcWidth, '#374151');
  }

  if (progress === 1) {
    if (weeklySucceeded) {
      const grad = draw.createLinearGradient(right_x - widget_radius, h_center, right_x + widget_radius, h_center, '#eab308', '#f1dd89');
      draw.drawCircle(right_x, h_center, widget_radius, arcWidth, grad);
    } else {
      const grad = draw.createLinearGradient(right_x - widget_radius, h_center, right_x + widget_radius, h_center, '#22c55e', '#84cc16');
      draw.drawCircle(right_x, h_center, widget_radius, arcWidth, grad);
    }
  } else if (progress !== 0) {
    const grad = draw.createLinearGradient(right_x - widget_radius, h_center, right_x + widget_radius, h_center, '#60a5fa', '#c084fc');
    draw.drawArc(right_x, h_center, widget_radius, arcWidth, grad, -0.25, progress - 0.25);
  }

  let mainY = h_center;
  if (goal !== 0) {
    mainY = h_center - 45 + (80 - 34) / 2;
  }

  draw.text(`${numberFmt.format(steps)}`, right_x, mainY, '#e5e7eb', 80);

  if (goal !== 0) {
    draw.text(`/ ${numberFmt.format(goal)}`, right_x, h_center + 45, '#94a3b8', 34);
  }

  if (progress === 1 && streak !== 0) {
    const badgeX = right_x + widget_radius - 36;
    const badgeY = h_center - widget_radius + 36;
    const badgeColor = weeklySucceeded ? '#eab308' : '#16a34a';
    draw.roundedRectFill(badgeX - 56, badgeY - 24, 112, 48, 14, badgeColor);
    draw.text(saisir.image.streak(streak), badgeX, badgeY, '#0b1120', 24);
  }

  // Barre hebdomadaire plein format en bas de carte
  const weeklyGoalValid = opts.weeklyGoal !== null && opts.weeklyGoal > 0;
  if (weeklyGoalValid) {
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

    let topColor: string;
    let bottomColor: string;
    if (weeklySucceeded && dailySucceeded) {
      topColor = '#eab308';
      bottomColor = '#f1dd89';
    } else if (weeklySucceeded) {
      topColor = '#22c55e';
      bottomColor = '#84cc16';
    } else {
      topColor = '#60a5fa';
      bottomColor = '#c084fc';
    }

    const fillWidth = arcWidth + Math.round((barWidth - padding * 2 - arcWidth) * ratio);
    if (fillWidth > 0) {
      const g = draw.createLinearGradient(barPadding, barY, barPadding + barWidth, barY, topColor, bottomColor);
      draw.roundedRectFill(barPadding + padding, barY + padding, fillWidth, barHeight - padding * 2, barRadius, g);
    }

    const labelParts: string[] = [];
    labelParts.push(`${numberFmt.format(weeklySteps)} / ${numberFmt.format(weeklyGoal)}`);
    if (!weeklySucceeded && remainingDays > 1) {
      labelParts.push(`Reste : ${numberFmt.format(perDay)} / jour`);
    }
    if (!weeklySucceeded && remainingDays === 1) {
      labelParts.push(`Reste : ${numberFmt.format(perDay)}`);
    }
    const label = labelParts.join('  ');
    draw.text(label, width / 2, barY - 16, '#e5e7eb', 22);
  }

  return draw.toBuffer();
}
