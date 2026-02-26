import type DateTime from '../date-time';
import {resumeMois as resumeMoisLang} from '../lang';
import Draw, {downloadImage} from './draw';

export type MonthlySummaryData = {
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

export async function renderMonthlySummaryImage(data: MonthlySummaryData) {
  const firstDay = data.date.firstDayOfMonth();
  const firstWeekDay = firstDay.weekDay();
  const prevDaysCount = firstWeekDay - 1;

  const currentMonthDays = data.days.slice(prevDaysCount);
  const filledDays = currentMonthDays.filter((d): d is number => d !== null);
  const total = filledDays.reduce((acc, val) => acc + val, 0);
  const average = filledDays.length > 0 ? total / filledDays.length : 0;
  const width = 1200;
  const height = 630;

  const draw = new Draw(width, height);

  const title = resumeMoisLang.image.title(data.date);

  draw.text(title, width / 2, 40, '#f8fafc', 42);

  const pad = 32;
  const topPad = 80;
  const rightMargin = 48;
  const bottomMargin = 48;

  const cardW = 360;
  const cardH = 200;
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

  draw.text(resumeMoisLang.embed.fieldTotal(total), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
  currentLine++;

  draw.text(resumeMoisLang.embed.fieldAverage(Math.floor(average)), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
  currentLine++;

  draw.text(resumeMoisLang.embed.fieldDaysEntered(data.countEntries), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
  currentLine++;

  if (data.goal !== null) {
    draw.text(resumeMoisLang.embed.fieldDaysSucceeded(data.countSuccesses), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
    currentLine++;

    draw.text(resumeMoisLang.embed.fieldBestStreak(data.bestStreak), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
    currentLine++;
  }

  const gapLeftToChart = 24;
  const chartX = pad + cardW + gapLeftToChart;
  const chartY = topPad;
  const chartW = width - chartX - rightMargin;
  const chartH = height - chartY - bottomMargin;
  const chartBg = draw.createLinearGradient(chartX, chartY, chartX + chartW, chartY + chartH, '#0b1220', '#0f172a');
  draw.roundedRectFill(chartX, chartY, chartW, chartH, 20, chartBg);

  const innerPad = 20;
  const innerX = chartX + innerPad;
  const innerY = chartY + innerPad;
  const innerW = chartW - innerPad * 2;
  const innerH = chartH - innerPad * 2;

  const cols = 7;
  const headerLabelHeight = 24;
  const barHeight = 8;
  const barGap = 6;
  const gapX = 12;
  const gapY = 10;

  const cellW = (innerW - gapX * (cols - 1)) / cols;

  const daysInMonth = data.days.length - prevDaysCount;
  const rowsNeeded = Math.ceil((prevDaysCount + daysInMonth) / cols);
  const rows = Math.max(4, Math.min(6, rowsNeeded));

  const fixedPerRow = barGap + barHeight;
  const cellH = (innerH - headerLabelHeight - fixedPerRow * rows - gapY * (rows - 1)) / rows;
  const rowTotalHeight = cellH + fixedPerRow;
  const maxRadius = Math.min(cellW, cellH) / 2;

  const hasDailyGoal = data.goal !== null && data.goal > 0;
  const weeklyGoalValid = data.weeklyGoal !== null && data.weeklyGoal > 0;

  type GridDay = {steps: number | null; dayNum: number; isCurrentMonth: boolean};
  const allGridDays: (GridDay | null)[] = [];
  const totalGridCells = rows * cols;

  for (let i = 0; i < data.days.length; i++) {
    const isCurrentMonth = i >= prevDaysCount;
    const dayDate = firstDay.addDay(i - prevDaysCount);
    allGridDays.push({
      steps: data.days[i],
      dayNum: dayDate.day(),
      isCurrentMonth
    });
  }

  while (allGridDays.length < totalGridCells) {
    allGridDays.push(null);
  }

  const weekTotals: number[] = [];
  const weeklySucceeded: boolean[] = [];
  const weekAllDailySucceeded: boolean[] = [];
  for (let row = 0; row < rows; row++) {
    let weekTotal = 0;
    let allDailyOk = true;
    let hasAnyEntry = false;
    for (let col = 0; col < cols; col++) {
      const gridIdx = row * cols + col;
      const day = allGridDays[gridIdx];
      if (day && day.steps !== null) {
        weekTotal += day.steps;
        hasAnyEntry = true;
        if (hasDailyGoal && day.steps < (data.goal as number)) {
          allDailyOk = false;
        }
      } else if (day?.isCurrentMonth) {
        allDailyOk = false;
      }
    }
    if (!hasAnyEntry) allDailyOk = false;
    weekTotals.push(weekTotal);
    weeklySucceeded.push(weeklyGoalValid && weekTotal >= (data.weeklyGoal as number));
    weekAllDailySucceeded.push(hasDailyGoal && allDailyOk);
  }

  for (let col = 0; col < cols; col++) {
    const x = innerX + col * (cellW + gapX) + cellW / 2;
    const y = innerY + 12;
    const dayLabel = resumeMoisLang.image.dayLetters[col] || '';
    draw.text(dayLabel, x, y, '#94a3b8', 16);
  }

  const ringWidth = Math.max(4, Math.min(10, maxRadius * 0.2));
  const circleRadius = maxRadius * 0.95;
  for (let gridIdx = 0; gridIdx < totalGridCells; gridIdx++) {
    const day = allGridDays[gridIdx];
    if (!day) continue;

    const col = gridIdx % cols;
    const row = Math.floor(gridIdx / cols);

    const x = innerX + col * (cellW + gapX) + cellW / 2;
    const rowTop = innerY + headerLabelHeight + row * (rowTotalHeight + gapY);
    const y = rowTop + cellH / 2;

    draw.drawCircle(x, y, circleRadius, ringWidth, '#1e293b');

    const isGoldWeek = weeklySucceeded[row] && weekAllDailySucceeded[row];

    if (day.steps !== null) {
      let topColor: string;
      let bottomColor: string;

      if (!hasDailyGoal) {
        if (!weeklyGoalValid) {
          topColor = '#60a5fa';
          bottomColor = '#c084fc';
        } else if (isGoldWeek) {
          topColor = '#eab308';
          bottomColor = '#f1dd89';
        } else {
          topColor = '#60a5fa';
          bottomColor = '#c084fc';
        }
      } else {
        if (day.steps >= (data.goal as number)) {
          if (isGoldWeek) {
            topColor = '#eab308';
            bottomColor = '#f1dd89';
          } else {
            topColor = '#22c55e';
            bottomColor = '#84cc16';
          }
        } else {
          topColor = '#60a5fa';
          bottomColor = '#c084fc';
        }
      }

      const grad = draw.createLinearGradient(x - circleRadius, y, x + circleRadius, y, topColor, bottomColor);

      if (hasDailyGoal) {
        const ratio = Math.min(1, day.steps / (data.goal as number));
        if (ratio >= 1) {
          draw.drawCircle(x, y, circleRadius, ringWidth, grad);
        } else {
          draw.drawArc(x, y, circleRadius, ringWidth, grad, -0.25, -0.25 + ratio);
        }
      } else {
        draw.drawCircle(x, y, circleRadius, ringWidth, grad);
      }

      const textColor = day.isCurrentMonth ? '#ffffff' : '#94a3b8';
      draw.text(`${day.dayNum}`, x, y - 8, textColor, 10);
      draw.text(`${day.steps}`, x, y + 8, textColor, 12);
    } else {
      const labelColor = day.isCurrentMonth ? '#64748b' : '#475569';
      draw.text(`${day.dayNum}`, x, y, labelColor, 10);
    }
  }

  const barRadius = barHeight / 2;
  const weeklyTotalFontSize = 14;
  const weeklyTotalGap = 8;
  const weeklyTotalWidth = 54;
  const barW = innerW - weeklyTotalWidth - weeklyTotalGap;
  for (let row = 0; row < rows; row++) {
    const rowTop = innerY + headerLabelHeight + row * (rowTotalHeight + gapY);
    const barY = rowTop + cellH + barGap;
    const barX = innerX;

    draw.roundedRectFill(barX, barY, barW, barHeight, barRadius, '#1e293b');

    const isGoldWeek = weeklySucceeded[row] && weekAllDailySucceeded[row];

    let topColor: string;
    let bottomColor: string;
    if (isGoldWeek) {
      topColor = '#eab308';
      bottomColor = '#f1dd89';
    } else if (weeklySucceeded[row] || weekAllDailySucceeded[row]) {
      topColor = '#22c55e';
      bottomColor = '#84cc16';
    } else {
      topColor = '#60a5fa';
      bottomColor = '#c084fc';
    }

    if (weeklyGoalValid) {
      const ratio = Math.min(1, weekTotals[row] / (data.weeklyGoal as number));
      const fillWidth = barHeight + Math.round((barW - barHeight) * ratio);
      if (fillWidth > 0 && weekTotals[row] > 0) {
        const g = draw.createLinearGradient(barX, barY, barX + barW, barY, topColor, bottomColor);
        draw.roundedRectFill(barX, barY, fillWidth, barHeight, barRadius, g);
      }
    } else if (weekTotals[row] > 0) {
      const g = draw.createLinearGradient(barX, barY, barX + barW, barY, topColor, bottomColor);
      draw.roundedRectFill(barX, barY, barW, barHeight, barRadius, g);
    }

    const totalX = barX + barW + weeklyTotalGap;
    const totalY = barY + barHeight / 2;
    draw.text(resumeMoisLang.image.weeklyTotal(weekTotals[row]), totalX, totalY, '#cbd5e1', weeklyTotalFontSize, 'left');
  }

  return draw.toBuffer();
}
