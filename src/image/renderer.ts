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
      // Déterminer si l'utilisateur a un objectif hebdo valide
      const weeklyGoalValid = data.weeklyGoal !== null && data.weeklyGoal > 0;
      const weeklySucceeded = weeklyGoalValid && total >= (data.weeklyGoal as number);

      // L'utilisateur a-t-il un objectif journalier ?
      const hasDailyGoal = data.goal !== null && data.goal > 0;

      let topColor: string;
      let bottomColor: string;

      if (!hasDailyGoal) {
        // Cas: pas d'objectif journalier
        if (!weeklyGoalValid) {
          // Pas d'objectif jour ni hebdo => comportement par défaut : barres bleu
          topColor = '#60a5fa';
          bottomColor = '#c084fc';
        } else {
          // Pas d'objectif jour mais il y a un objectif hebdo
          if (weeklySucceeded) {
            // Semaine réussie => colorer en jaune seulement les jours où il y a des pas (>0)
            if ((val as number) > 0) {
              topColor = '#eab308';
              bottomColor = '#f1dd89';
            } else {
              // pas de pas enregistrés -> rester bleu
              topColor = '#60a5fa';
              bottomColor = '#c084fc';
            }
          } else {
            // Semaine échouée => barres bleues
            topColor = '#60a5fa';
            bottomColor = '#c084fc';
          }
        }
      } else {
        // Cas: il y a un objectif journalier
        if (val >= data.goal) {
          // Jour "réussi"
          if (weeklyGoalValid && weeklySucceeded) {
            // Si objectif hebdo présent et semaine réussie => jaune
            topColor = '#eab308';
            bottomColor = '#f1dd89';
          } else {
            // Sinon garder vert pour jours réussis
            topColor = '#22c55e';
            bottomColor = '#84cc16';
          }
        } else {
          // Jour non atteint => bleu
          topColor = '#60a5fa';
          bottomColor = '#c084fc';
        }
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
