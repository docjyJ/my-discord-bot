import type DateTime from '../date-time';
import {resumeSemaine as resumeLang} from '../lang';
import Draw, {downloadImage} from './draw';

export type WeeklySummaryData = {
  date: DateTime;
  days: (number | null)[];
  countEntries: number;
  avatarUrl: string;
} & (
  | {
      goal: number;
      bestStreak: number;
      countSuccesses: number;
    }
  | {
      goal: null;
      bestStreak: null;
      countSuccesses: null;
    }
) &
  (
    | {
        weeklyGoal: null;
      }
    | {
        weeklyGoal: number;
      }
  );

export async function renderWeeklySummaryImage(data: WeeklySummaryData) {
  const filledDays = data.days.filter((d): d is number => d !== null);
  const total = filledDays.reduce((acc, val) => acc + val, 0);
  const average = filledDays.length > 0 ? Math.ceil(total / filledDays.length) : 0;
  const width = 1200;
  const height = 630;

  const draw = new Draw(width, height);

  const title = resumeLang.image.title(data.date);

  draw.text(title, width / 2, 40, '#f8fafc', 42);

  const pad = 32;
  const topPad = 80;
  const rightMargin = 48;

  const weeklyGoalValid = data.weeklyGoal !== null && data.weeklyGoal > 0;
  const weeklySucceeded = weeklyGoalValid && total >= (data.weeklyGoal as number);
  const hasDailyGoal = data.goal !== null && data.goal > 0;
  const allDailySucceeded = hasDailyGoal && filledDays.length > 0 && filledDays.every(d => d >= (data.goal as number));
  const isGoldTheme = weeklySucceeded && allDailySucceeded;

  const barAreaHeight = 52;
  const bottomMargin = 28 + barAreaHeight;

  const cardW = 360;
  const cardH = 210;
  const statsY = height - bottomMargin - cardH;

  const availableTop = Math.max(0, statsY - topPad);
  const avatarDiameter = Math.max(128, Math.min(320, availableTop - 16));
  const avatarRadius = Math.floor(avatarDiameter / 2);
  const leftAvatarPad = cardW / 2 - avatarRadius;

  const avatar = {x: pad + avatarRadius + leftAvatarPad, y: topPad + avatarRadius, radius: avatarRadius};

  draw.backgroundCircle(avatar.x, avatar.y, avatar.radius);
  draw.avatarCircle(avatar.x, avatar.y, avatar.radius - 6, await downloadImage(data.avatarUrl));

  const cardBg = draw.createLinearGradient(pad, statsY, pad + cardW, statsY + cardH, '#0b1220', '#0f172a');
  draw.roundedRectFill(pad, statsY, cardW, cardH, 18, cardBg);

  const lineStart = statsY + 24;
  const lineStep = 38;
  let currentLine = 0;

  draw.text(resumeLang.embed.fieldDaysEntered(data.countEntries), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
  currentLine++;

  if (data.goal !== null) {
    draw.text(resumeLang.embed.fieldDaysSucceeded(data.countSuccesses), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
    currentLine++;

    draw.text(resumeLang.embed.fieldBestStreak(data.bestStreak), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
    currentLine++;
  }

  const gapLeftToChart = 24;
  const chartX = pad + cardW + gapLeftToChart;
  const chartY = topPad;
  const chartW = width - chartX - rightMargin;
  const chartH = height - chartY - bottomMargin;
  const chartBg = draw.createLinearGradient(chartX, chartY, chartX + chartW, chartY + chartH, '#0b1220', '#0f172a');
  draw.roundedRectFill(chartX, chartY, chartW, chartH, 20, chartBg);

  const maxVal = Math.max(data.goal ?? 0, ...filledDays, 1);
  const innerX = chartX + pad;
  const innerY = chartY + pad;
  const innerW = chartW - pad * 2;
  const innerH = chartH - pad * 2;

  const n = 7;
  const gap = 18;
  const barW = Math.floor((innerW - gap * (n - 1)) / n);
  for (let i = 0; i < n; i++) {
    const val = data.days[i];

    draw.roundedRectFill(innerX + i * (barW + gap), innerY, barW, innerH, 10, '#111827');

    const bx = innerX + i * (barW + gap);
    const h = Math.max(0, Math.round(innerH * ((val ?? 0) / maxVal)));
    const by = innerY + innerH - h;
    if (val !== null) {
      let topColor: string;
      let bottomColor: string;

      if (isGoldTheme) {
        topColor = '#eab308';
        bottomColor = '#f1dd89';
      } else if (hasDailyGoal && val >= (data.goal as number)) {
        topColor = '#22c55e';
        bottomColor = '#84cc16';
      } else {
        topColor = '#60a5fa';
        bottomColor = '#c084fc';
      }

      const g = draw.createLinearGradient(bx, by, bx, innerY + innerH, topColor, bottomColor);
      draw.roundedRectFill(bx, by, barW, h, 10, g);
      draw.text(`${val}`, bx + barW / 2, by - 16, '#e5e7eb', 20);
    } else {
      draw.text('-', bx + barW / 2, by - 16, '#e5e7eb', 20);
    }

    const dayLabel = resumeLang.image.dayLetters[i] || '';
    const yLabel = chartY + chartH - 20;
    draw.text(dayLabel, bx + barW / 2, yLabel, '#94a3b8', 20);
  }

  if (data.goal !== null && data.goal > 0) {
    const goalY = innerY + innerH - Math.round(innerH * (data.goal / maxVal));
    draw.drawHorizontalDashedLine(chartX, chartX + chartW, goalY, 2, '#94a3b8');
  }

  const barPadding = 12;
  const innerBarPad = 6;
  const barHeight = 32;
  const barRadius = barHeight / 2;
  const barWidth = width - barPadding * 2;
  const barY = height - barPadding - barHeight;

  const barBg = draw.createLinearGradient(barPadding, barY, barPadding, barY + barHeight, '#0b1220', '#0f172a');
  draw.roundedRectFill(barPadding, barY, barWidth, barHeight, barRadius, barBg);
  draw.roundedRectFill(barPadding + innerBarPad, barY + innerBarPad, barWidth - innerBarPad * 2, barHeight - innerBarPad * 2, barRadius, '#374151');

  let topColor: string;
  let bottomColor: string;
  if (isGoldTheme) {
    topColor = '#eab308';
    bottomColor = '#f1dd89';
  } else if (weeklySucceeded) {
    topColor = '#22c55e';
    bottomColor = '#84cc16';
  } else {
    topColor = '#60a5fa';
    bottomColor = '#c084fc';
  }

  const minFillWidth = barHeight - innerBarPad * 2;
  if (weeklyGoalValid) {
    const weeklyGoal = data.weeklyGoal as number;
    const ratio = Math.min(1, total / weeklyGoal);
    const fillWidth = minFillWidth + Math.round((barWidth - innerBarPad * 2 - minFillWidth) * ratio);
    if (fillWidth > 0) {
      const g = draw.createLinearGradient(barPadding, barY, barPadding + barWidth, barY, topColor, bottomColor);
      draw.roundedRectFill(barPadding + innerBarPad, barY + innerBarPad, fillWidth, barHeight - innerBarPad * 2, barRadius, g);
    }
  }
  const label = resumeLang.image.barLabel(total, average);
  draw.text(label, width / 2, barY - 14, '#e5e7eb', 20);

  return draw.toBuffer();
}
