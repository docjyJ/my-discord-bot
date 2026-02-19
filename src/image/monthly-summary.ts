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
  const filledDays = data.days.filter((d): d is number => d !== null);
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

  // Grille mensuelle 5×7
  const gapLeftToChart = 24;
  const chartX = pad + cardW + gapLeftToChart;
  const chartY = topPad;
  const chartW = width - chartX - rightMargin;
  const chartH = height - chartY - bottomMargin;
  const chartBg = draw.createLinearGradient(chartX, chartY, chartX + chartW, chartY + chartH, '#0b1220', '#0f172a');
  draw.roundedRectFill(chartX, chartY, chartW, chartH, 20, chartBg);

  const innerPad = 20; // padding réduit pour plus d'espace
  const innerX = chartX + innerPad;
  const innerY = chartY + innerPad;
  const innerW = chartW - innerPad * 2;
  const innerH = chartH - innerPad * 2;

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
  const rowsNeeded = Math.ceil((firstWeekDay - 1 + daysInMonth) / cols);
  const rows = Math.max(4, Math.min(6, rowsNeeded));
  console.log(firstDay, firstWeekDay);

  const cellH = (innerH - labelHeight - dayLabelHeight - gapY * (rows - 1)) / rows;
  const maxRadius = Math.min(cellW, cellH) / 2;

  // Labels des jours de la semaine en haut
  for (let col = 0; col < cols; col++) {
    const x = innerX + col * (cellW + gapX) + cellW / 2;
    const y = innerY + 12;
    const dayLabel = resumeMoisLang.image.dayLetters[col] || '';
    draw.text(dayLabel, x, y, '#94a3b8', 16);
  }

  // Dessiner les anneaux pour chaque jour
  const ringWidth = Math.max(4, Math.min(10, maxRadius * 0.2)); // trait plus fin
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dayIndex = dayNum - 1;
    const steps = data.days[dayIndex];

    // Calculer position (0-index depuis lundi)
    const totalDays = firstWeekDay - 1 + dayNum;
    const col = (totalDays - 1) % cols;
    const row = Math.floor((totalDays - 1) / cols);
    if (row >= rows) continue;

    const x = innerX + col * (cellW + gapX) + cellW / 2;
    const y = innerY + labelHeight + row * (cellH + gapY) + cellH / 2;

    // Anneau de fond
    draw.drawCircle(x, y, maxRadius * 0.8, ringWidth, '#111827');

    let showSteps = false;
    if (steps !== null) {
      const hasDailyGoal = data.goal !== null && data.goal > 0;
      const weeklyGoalValid = data.weeklyGoal !== null && data.weeklyGoal > 0;

      // Calcul de la semaine (lun..dim) contenant ce jour, et de son total
      // row = index de la semaine dans la grille (0 = première semaine affichée)
      const startDayNumOfWeek = 1 - (firstWeekDay - 1) + row * 7; // peut être <= 0
      const endDayNumOfWeek = startDayNumOfWeek + 6;

      let weekTotal = 0;
      for (let d = startDayNumOfWeek; d <= endDayNumOfWeek; d++) {
        if (d < 1 || d > daysInMonth) continue;
        const v = data.days[d - 1];
        if (v !== null) weekTotal += v;
      }

      const weeklySucceeded = weeklyGoalValid && weekTotal >= (data.weeklyGoal as number);

      let topColor: string;
      let bottomColor: string;

      if (!hasDailyGoal) {
        // Pas d'objectif journalier
        if (!weeklyGoalValid) {
          // Pas d'objectif jour ni hebdo => bleu
          topColor = '#60a5fa';
          bottomColor = '#c084fc';
        } else if (weeklySucceeded) {
          // Objectif hebdo présent et semaine réussie => jaune
          topColor = '#eab308';
          bottomColor = '#f1dd89';
        } else {
          // Objectif hebdo présent mais semaine échouée => bleu
          topColor = '#60a5fa';
          bottomColor = '#c084fc';
        }
      } else {
        // Objectif journalier présent
        if (steps >= (data.goal as number)) {
          // jour réussi
          if (weeklyGoalValid && weeklySucceeded) {
            // si hebdo présent et semaine réussie => jaune
            topColor = '#eab308';
            bottomColor = '#f1dd89';
          } else {
            // sinon vert
            topColor = '#22c55e';
            bottomColor = '#84cc16';
          }
        } else {
          // jour non atteint => bleu
          topColor = '#60a5fa';
          bottomColor = '#c084fc';
        }
      }

      const grad = draw.createLinearGradient(x - maxRadius, y, x + maxRadius, y, topColor, bottomColor);
      draw.drawCircle(x, y, maxRadius * 0.8, ringWidth, grad);
      showSteps = true;
    } else {
      // Pas de données: anneau gris déjà là, pas de texte
    }

    // Texte des pas (valeur complète) si présent
    if (showSteps) {
      const val = steps as number;
      draw.text(`${val}`, x, y, '#ffffff', 14);
    }

    // Label du numéro du jour
    const labelY = y + maxRadius * 0.8 + 14;
    draw.text(`${dayNum}`, x, labelY, '#64748b', 14);
  }

  return draw.toBuffer();
}
