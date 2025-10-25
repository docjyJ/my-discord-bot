import {createCanvas, GlobalFonts, loadImage} from '@napi-rs/canvas';
import 'dayjs/locale/fr';
import {resumeSemaine as resumeLang, saisir} from '../lang';

GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVuSans');

export type PresentationOptions = {
	username: string;
	avatarUrl: string;
	dateISO: string;
	steps: number;
	goal: number | null;
	streak: number;
};

export type WeeklySummaryProps = {
	username: string;
	avatarUrl: string;
	mondayISO: string;
	goal: number | null;
	days: (number | null)[];
	streak: number;
};

export async function renderPresentationImage(opts: PresentationOptions): Promise<Buffer> {

	const hasGoal = opts.goal !== null && opts.goal > 0;
	const goal = hasGoal ? Math.max(0, opts.goal as number) : 0;
	const progress = hasGoal ? Math.min(0.98, Math.max(0, opts.steps / goal)) : 0;
	const reached = hasGoal && opts.steps >= goal;

	const width = 1200;
	const height = 630;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	const grad = ctx.createLinearGradient(0, 0, width, height);
	grad.addColorStop(0, '#0a0f1f');
	grad.addColorStop(1, '#1f3b73');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, width, height);

	ctx.globalAlpha = 0.12;
	ctx.fillStyle = '#6ee7b7';
	ctx.beginPath();
	ctx.arc(width * 0.1, height * 0.22, 160, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#93c5fd';
	ctx.beginPath();
	ctx.arc(width * 0.9, height * 0.87, 200, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;

	ctx.fillStyle = '#f8fafc';
	ctx.font = 'bold 44px DejaVuSans';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';
	ctx.fillText(saisir.image.dateTitle(opts.dateISO), width / 2, 72);

	const circleRadius = 210;
	const leftCenter = {x: width * 0.3, y: height * 0.52};
	const rightCenter = {x: width * 0.7, y: height * 0.52};

	const ARC_OFFSET = 16;
	const ARC_WIDTH = 22;
	const PROGRESS_BG_INNER = '#0b1220';
	const PROGRESS_BG_OUTER = '#0f172a';


	const avatarBgGrad = ctx.createLinearGradient(
		leftCenter.x - circleRadius,
		leftCenter.y - circleRadius,
		leftCenter.x + circleRadius,
		leftCenter.y + circleRadius
	);
	avatarBgGrad.addColorStop(0, PROGRESS_BG_INNER);
	avatarBgGrad.addColorStop(1, PROGRESS_BG_OUTER);
	ctx.beginPath();
	ctx.arc(leftCenter.x, leftCenter.y, circleRadius, 0, Math.PI * 2);
	ctx.closePath();
	ctx.fillStyle = avatarBgGrad;
	ctx.fill();

	const INNER_PADDING = 5;
	const innerRadius = circleRadius - INNER_PADDING;
	const img = await loadImage(opts.avatarUrl);
	ctx.save();
	ctx.beginPath();
	ctx.arc(leftCenter.x, leftCenter.y, innerRadius, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();

	const scale = Math.max((innerRadius * 2) / img.width, (innerRadius * 2) / img.height);
	const w = img.width * scale;
	const h = img.height * scale;
	ctx.drawImage(img, leftCenter.x - w / 2, leftCenter.y - h / 2, w, h);

	ctx.restore();

	ctx.save();
	const progressBgGrad = ctx.createLinearGradient(
		rightCenter.x - circleRadius,
		rightCenter.y - circleRadius,
		rightCenter.x + circleRadius,
		rightCenter.y + circleRadius
	);
	progressBgGrad.addColorStop(0, PROGRESS_BG_INNER);
	progressBgGrad.addColorStop(1, PROGRESS_BG_OUTER);
	ctx.beginPath();
	ctx.arc(rightCenter.x, rightCenter.y, circleRadius, 0, Math.PI * 2);
	ctx.closePath();
	ctx.fillStyle = progressBgGrad;
	ctx.fill();

	ctx.strokeStyle = '#1f2937';
	ctx.lineWidth = ARC_WIDTH;
	ctx.beginPath();
	ctx.arc(rightCenter.x, rightCenter.y, circleRadius - ARC_OFFSET, 0, Math.PI * 2);
	ctx.stroke();

	if (reached) {
		const arcGrad = ctx.createLinearGradient(rightCenter.x - circleRadius, rightCenter.y, rightCenter.x + circleRadius, rightCenter.y);
		arcGrad.addColorStop(0, '#22c55e');
		arcGrad.addColorStop(1, '#84cc16');
		ctx.strokeStyle = arcGrad;
		const prevCap = ctx.lineCap;
		ctx.lineCap = 'butt';
		ctx.beginPath();
		ctx.arc(rightCenter.x, rightCenter.y, circleRadius - ARC_OFFSET, 0, Math.PI * 2);
		ctx.stroke();
		ctx.lineCap = prevCap;
	} else if (progress > 0) {
		const arcGrad = ctx.createLinearGradient(rightCenter.x - circleRadius, rightCenter.y, rightCenter.x + circleRadius, rightCenter.y);
		arcGrad.addColorStop(0, '#60a5fa');
		arcGrad.addColorStop(1, '#c084fc');
		ctx.strokeStyle = arcGrad;
		const prevCap = ctx.lineCap;
		ctx.lineCap = 'round';
		ctx.beginPath();
		const start = -Math.PI / 2;
		const end = start + progress * Math.PI * 2;
		ctx.arc(rightCenter.x, rightCenter.y, circleRadius - ARC_OFFSET, start, end);
		ctx.stroke();
		ctx.lineCap = prevCap;
	}

	const GOAL_LINE_OFFSET = 45;
	let mainY = rightCenter.y;
	if (hasGoal) {
		mainY = rightCenter.y - GOAL_LINE_OFFSET + (80 - 34) / 2;
	}

	ctx.fillStyle = '#e5e7eb';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = 'bold 80px DejaVuSans';
	ctx.fillText(`${opts.steps}`, rightCenter.x, mainY);

	if (hasGoal) {
		ctx.font = 'bold 34px DejaVuSans';
		ctx.fillStyle = '#94a3b8';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(`/ ${goal}`, rightCenter.x, rightCenter.y + GOAL_LINE_OFFSET);
	}

	if (reached && opts.streak > 0) {
		const badgeX = rightCenter.x + circleRadius - 36;
		const badgeY = rightCenter.y - circleRadius + 36;
		ctx.fillStyle = '#16a34a';
		ctx.beginPath();
		ctx.roundRect(badgeX - 56, badgeY - 24, 112, 48, 14);
		ctx.fill();
		ctx.font = 'bold 24px DejaVuSans';
		ctx.fillStyle = '#f8fafc';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(saisir.image.streak(opts.streak), badgeX, badgeY + 8);
	}

	ctx.restore();

	ctx.textAlign = 'center';
	ctx.font = '30px DejaVuSans';
	ctx.fillStyle = '#cbd5e1';
	ctx.textBaseline = 'alphabetic';
	if (hasGoal && reached) {
		ctx.fillText(saisir.image.reached, width / 2, height - 36);
	} else if (hasGoal && !reached) {
		const remaining = Math.max(0, goal - opts.steps);
		ctx.fillText(saisir.image.remaining(remaining), width / 2, height - 36);
	}

	return canvas.toBuffer('image/png');
}

export async function renderWeeklySummaryImage(opts: WeeklySummaryProps): Promise<Buffer> {
	const filledDays = opts.days.filter(d => d !== null);
	const successDays = opts.goal !== null ? filledDays.filter(d => d >= opts.goal!).length : 0;
	const total = filledDays.reduce((acc, val) => acc + val, 0);
	const average = Math.ceil(total / filledDays.length);


	const width = 1200;
	const height = 630;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	const grad = ctx.createLinearGradient(0, 0, width, height);
	grad.addColorStop(0, '#0a0f1f');
	grad.addColorStop(1, '#1f3b73');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, width, height);
	ctx.globalAlpha = 0.12;
	ctx.fillStyle = '#93c5fd';
	ctx.beginPath();
	ctx.arc(width * 0.18, height * 0.2, 140, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#6ee7b7';
	ctx.beginPath();
	ctx.arc(width * 0.86, height * 0.86, 180, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;

	const title = resumeLang.image.title(opts.mondayISO);
	ctx.fillStyle = '#f8fafc';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';
	ctx.font = 'bold 42px DejaVuSans';
	ctx.fillText(title, width / 2, 64);

	const pad = 32;
	const topPad = 80;
	const rightMargin = 48;
	const bottomMargin = 48;

	const cardW = 360;
	const cardH = 184;
	const statsY = height - bottomMargin - cardH;

	const availableTop = Math.max(0, statsY - topPad);
	const avatarDiameter = Math.max(128, Math.min(320, availableTop - 16));
	const avatarRadius = Math.floor(avatarDiameter / 2);
	const leftAvatarPad = cardW / 2 - avatarRadius;

	ctx.save();
	const avatarBg = ctx.createLinearGradient(pad, topPad, pad + leftAvatarPad + avatarRadius * 2, topPad + avatarRadius * 2);
	avatarBg.addColorStop(0, '#0b1220');
	avatarBg.addColorStop(1, '#0f172a');
	ctx.beginPath();
	ctx.arc(pad + avatarRadius + leftAvatarPad, topPad + avatarRadius, avatarRadius, 0, Math.PI * 2);
	ctx.fillStyle = avatarBg;
	ctx.fill();
	const img = await loadImage(opts.avatarUrl);
	ctx.save();
	ctx.beginPath();
	ctx.arc(pad + avatarRadius + leftAvatarPad, topPad + avatarRadius, Math.max(avatarRadius - 6, 8), 0, Math.PI * 2);
	ctx.clip();
	const scale = Math.max(((avatarRadius * 2) - 12) / img.width, ((avatarRadius * 2) - 12) / img.height);
	const w = img.width * scale, h = img.height * scale;
	ctx.drawImage(img, pad + leftAvatarPad + avatarRadius - w / 2, topPad + avatarRadius - h / 2, w, h);
	ctx.restore();
	ctx.restore();

	ctx.beginPath();
	ctx.roundRect(pad, statsY, cardW, cardH, 18);
	const cardBg = ctx.createLinearGradient(pad, statsY, pad + cardW, statsY + cardH);
	cardBg.addColorStop(0, '#0b1220');
	cardBg.addColorStop(1, '#0f172a');
	ctx.fillStyle = cardBg;
	ctx.fill();
	ctx.textAlign = 'left';
	ctx.textBaseline = 'alphabetic';
	ctx.font = 'bold 26px DejaVuSans';
	ctx.fillStyle = '#cbd5e1';
	ctx.fillText(resumeLang.embed.fieldTotal(total), pad + 18, statsY + 40);
	ctx.fillText(resumeLang.embed.fieldAverage(Math.round(average)), pad + 18, statsY + 78);
	if (opts.goal) {
		ctx.fillText(resumeLang.embed.fieldGoalReached(successDays), pad + 18, statsY + 116);
	}
	if (opts.streak > 0) {
		ctx.fillText(resumeLang.embed.streak(opts.streak), pad + 18, statsY + 154);
	}

	const gapLeftToChart = 24;
	const chartX = pad + cardW + gapLeftToChart;
	const chartY = topPad;
	const chartW = width - chartX - rightMargin;
	const chartH = height - chartY - bottomMargin;
	ctx.beginPath();
	ctx.roundRect(chartX, chartY, chartW, chartH, 20);
	const chartBg = ctx.createLinearGradient(chartX, chartY, chartX + chartW, chartY + chartH);
	chartBg.addColorStop(0, '#0b1220');
	chartBg.addColorStop(1, '#0f172a');
	ctx.fillStyle = chartBg;
	ctx.fill();

	const maxVal = Math.max(
		opts.goal ?? 0,
		...opts.days.map(d => d ?? 0),
		1
	);
	const innerX = chartX + pad;
	const innerY = chartY + pad;
	const innerW = chartW - pad * 2;
	const innerH = chartH - pad * 2;

	const n = 7;
	const gap = 18;
	const barW = Math.floor((innerW - gap * (n - 1)) / n);
	for (let i = 0; i < n; i++) {
		const val = opts.days[i];

		ctx.fillStyle = '#111827';
		const h = Math.max(0, Math.round(innerH * ((val ?? 0) / maxVal)));
		const by = innerY + innerH - h;
		const bx = innerX + i * (barW + gap);
		ctx.beginPath();
		ctx.roundRect(bx, innerY, barW, innerH, 10);
		ctx.fill();

		if (val) {
			let g = ctx.createLinearGradient(bx, by, bx, innerY + innerH);
			if (opts.goal && val >= opts.goal) {
				g.addColorStop(0, '#22c55e');
				g.addColorStop(1, '#84cc16');
			} else {
				g.addColorStop(0, '#60a5fa');
				g.addColorStop(1, '#c084fc');
			}
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.roundRect(bx, by, barW, h, 10);
			ctx.fill();
		}
		ctx.fillStyle = '#e5e7eb';
		ctx.font = 'bold 20px DejaVuSans';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(val !== null ? String(val) : '-', bx + barW / 2, by - 6);
		const dayLabel = resumeLang.image.dayLetters[i] || '';
		ctx.fillStyle = '#94a3b8';
		ctx.font = '20px DejaVuSans';
		ctx.textBaseline = 'alphabetic';
		const yLabel = chartY + chartH - 10;
		ctx.fillText(dayLabel, bx + barW / 2, yLabel);
	}
	return canvas.toBuffer('image/png');
}
