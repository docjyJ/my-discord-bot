import type DateTime from '../date-time';
import {resumeSemaine as resumeLang, resumeMois as resumeMoisLang, saisir} from '../lang';
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
);

export async function renderPresentationImage(opts: PresentationOptions) {
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
  draw.drawCircle(right_x, h_center, widget_radius, arcWidth, '#374151');
  if (progress === 1) {
    const grad = draw.createLinearGradient(right_x - widget_radius, h_center, right_x + widget_radius, h_center, '#22c55e', '#84cc16');
    draw.drawCircle(right_x, h_center, widget_radius, arcWidth, grad);
  } else if (progress !== 0) {
    const grad = draw.createLinearGradient(right_x - widget_radius, h_center, right_x + widget_radius, h_center, '#60a5fa', '#c084fc');
    draw.drawArc(right_x, h_center, widget_radius, arcWidth, grad, -0.25, progress - 0.25);
  }

  let mainY = h_center;
  if (goal !== 0) {
    mainY = h_center - 45 + (80 - 34) / 2;
  }

  draw.text(`${steps}`, right_x, mainY, '#e5e7eb', 80);

  if (goal !== 0) {
    draw.text(`/ ${goal}`, right_x, h_center + 45, '#94a3b8', 34);
  }

  if (progress === 1 && streak !== 0) {
    const badgeX = right_x + widget_radius - 36;
    const badgeY = h_center - widget_radius + 36;
    draw.roundedRectFill(badgeX - 56, badgeY - 24, 112, 48, 14, '#16a34a');
    draw.text(saisir.image.streak(streak), badgeX, badgeY, '#f8fafc', 24);
  }

  if (goal !== 0) {
    const txt = steps >= goal ? saisir.image.reached : saisir.image.remaining(goal - steps);
    draw.text(txt, width / 2, height - 36, '#cbd5e1', 30);
  }

  return draw.toBuffer();
}

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

  draw.text(resumeLang.embed.fieldTotal(total), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
  currentLine++;

  draw.text(resumeLang.embed.fieldAverage(Math.round(average)), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
  currentLine++;

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
      const topColor = data.goal && val >= data.goal ? '#22c55e' : '#60a5fa';
      const bottomColor = data.goal && val >= data.goal ? '#84cc16' : '#c084fc';
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
  return draw.toBuffer();
}

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
);

export async function renderMonthlySummaryImage(data: MonthlySummaryData) {
  const filledDays = data.days.filter((d): d is number => d !== null);
  const total = filledDays.reduce((acc, val) => acc + val, 0);
  const average = filledDays.length > 0 ? Math.ceil(total / filledDays.length) : 0;
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

  draw.text(resumeMoisLang.embed.fieldAverage(Math.round(average)), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
  currentLine++;

  draw.text(resumeMoisLang.embed.fieldDaysEntered(data.countEntries), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
  currentLine++;

  if (data.goal !== null) {
    draw.text(resumeMoisLang.embed.fieldDaysSucceeded(data.countSuccesses), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
    currentLine++;

    draw.text(resumeMoisLang.embed.fieldBestStreak(data.bestStreak), pad + 18, lineStart + currentLine * lineStep, '#cbd5e1', 26, 'left');
    currentLine++;
  }

  // Grille mensuelle 5×7
  const gapLeftToChart = 24;
  const chartX = pad + cardW + gapLeftToChart;
  const chartY = topPad;
  const chartW = width - chartX - rightMargin;
  const chartH = height - chartY - bottomMargin;
  const chartBg = draw.createLinearGradient(chartX, chartY, chartX + chartW, chartY + chartH, '#0b1220', '#0f172a');
  draw.roundedRectFill(chartX, chartY, chartW, chartH, 20, chartBg);

  const innerX = chartX + pad;
  const innerY = chartY + pad;
  const innerW = chartW - pad * 2;
  const innerH = chartH - pad * 2;

  const cols = 7;
  const labelHeight = 24; // espace réservé en haut pour les labels Lun..Dim
  const dayLabelHeight = 20; // non utilisé directement mais réservé dans le calcul de hauteur
  const gapX = 12;
  const gapY = 16;

  const cellW = (innerW - gapX * (cols - 1)) / cols;

  // Premier jour du mois + calcul dynamique du nombre de lignes (4..6)
  const firstDay = data.date.firstDayOfMonth();
  const firstWeekDay = firstDay.weekDay(); // 1 = lundi, 7 = dimanche
  const daysInMonth = data.days.length;
  const rowsNeeded = Math.ceil(((firstWeekDay - 1) + daysInMonth) / cols);
  const rows = Math.max(4, Math.min(6, rowsNeeded));

  const cellH = (innerH - labelHeight - dayLabelHeight - gapY * (rows - 1)) / rows;
  const maxRadius = Math.min(cellW, cellH) / 2;

  // Labels des jours de la semaine en haut
  for (let col = 0; col < cols; col++) {
    const x = innerX + col * (cellW + gapX) + cellW / 2;
    const y = innerY + 12;
    const dayLabel = resumeMoisLang.image.dayLetters[col] || '';
    draw.text(dayLabel, x, y, '#94a3b8', 16);
  }

  // Dessiner les cercles pour chaque jour
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dayIndex = dayNum - 1;
    const steps = data.days[dayIndex];

    // Calculer position dans la grille (0-indexed depuis lundi)
    const totalDays = firstWeekDay - 1 + dayNum;
    const col = (totalDays - 1) % 7;
    const row = Math.floor((totalDays - 1) / 7);

    if (row >= rows) continue; // sécurité si 6e semaine dépasse (ne devrait pas arriver)

    const x = innerX + col * (cellW + gapX) + cellW / 2;
    const y = innerY + labelHeight + row * (cellH + gapY) + cellH / 2;

    let radius = maxRadius * 0.8;
    let color: string | ReturnType<typeof draw.createLinearGradient>;

    if (steps !== null) {
      if (data.goal !== null && steps >= data.goal) {
        // Objectif atteint - cercle vert
        color = draw.createLinearGradient(x - radius, y, x + radius, y, '#22c55e', '#84cc16');
      } else if (data.goal !== null) {
        // Objectif non atteint - cercle bleu avec diamètre proportionnel (min 20%)
        const ratio = Math.max(0.2, steps / data.goal);
        radius = maxRadius * 0.8 * ratio;
        color = draw.createLinearGradient(x - radius, y, x + radius, y, '#60a5fa', '#c084fc');
      } else {
        // Pas d'objectif - cercle bleu plein
        color = draw.createLinearGradient(x - radius, y, x + radius, y, '#60a5fa', '#c084fc');
      }
      draw.fillCircle(x, y, radius, color);

      // Afficher le nombre de pas en format "X,Y k"
      const stepsK = steps / 1000;
      const stepsText = stepsK >= 10 ? `${Math.floor(stepsK)} k` : `${stepsK.toFixed(1).replace('.', ',')} k`;
      draw.text(stepsText, x, y, '#ffffff', 12);
    } else {
      // Pas de données - petit cercle gris
      radius = maxRadius * 0.3;
      draw.fillCircle(x, y, radius, '#374151');
    }

    // Label du numéro du jour en dessous
    const labelY = y + maxRadius * 0.8 + 14;
    draw.text(`${dayNum}`, x, labelY, '#64748b', 14);
  }

  return draw.toBuffer();
}
