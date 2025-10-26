import {createCanvas, GlobalFonts, Image, loadImage, SKRSContext2D} from '@napi-rs/canvas';
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

const PI_2 = Math.PI * 2;
const PI_1_2 = Math.PI / 2;

export type WeeklySummaryProps = {
	avatarUrl: string;
	mondayISO: string;
	goal: number | null;
	days: (number | null)[];
	streak: number;
};

type BackgroundProps = {
	ctx: SKRSContext2D;
	s: { w: number; h: number };
	c1: { x: number; y: number; r: number };
	c2: { x: number; y: number; r: number };
}

function fillBackground({ctx, s, c1, c2}: BackgroundProps) {
	const grad = ctx.createLinearGradient(0, 0, s.w, s.h);
	grad.addColorStop(0, '#0a0f1f');
	grad.addColorStop(1, '#1f3b73');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, s.w, s.h);
	ctx.globalAlpha = 0.12;
	ctx.fillStyle = '#6ee7b7';
	ctx.beginPath();
	ctx.arc(c1.x, c1.y, c1.r, 0, PI_2);
	ctx.fill();
	ctx.fillStyle = '#93c5fd';
	ctx.beginPath();
	ctx.arc(c2.x, c2.y, c2.r, 0, PI_2);
	ctx.fill();
	ctx.globalAlpha = 1;
}

function drawBackgroundCircle(ctx: SKRSContext2D, x: number, y: number, radius: number) {
	const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
	grad.addColorStop(0, '#0b1220');
	grad.addColorStop(1, '#0f172a');
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, PI_2);
	ctx.fillStyle = grad;
	ctx.fill();
	ctx.save();
}

function drawAvatar(ctx: SKRSContext2D, x: number, y: number, radius: number, image: Image) {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, PI_2);
	ctx.clip();
	const scale = radius / Math.min(image.width, image.height);
	const w = image.width * scale;
	const h = image.height * scale;
	ctx.drawImage(image, x - w, y - h, w * 2, h * 2);
	ctx.restore();
}

function drawStepWidget(ctx: SKRSContext2D, x: number, y: number, radius: number, width: number, steps: number, goal: number, streak: number) {
	const progress = goal !== 0 && steps !== 0 ? goal > steps ? steps / goal * 0.96 + 0.2 : 1 : 0;

	ctx.strokeStyle = '#1f2937';
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, PI_2);
	ctx.stroke();

	if (progress === 1) {
		const prevCap = ctx.lineCap;
		const arcGrad = ctx.createLinearGradient(x - radius, y, x + radius, y);
		arcGrad.addColorStop(0, '#22c55e');
		arcGrad.addColorStop(1, '#84cc16');
		ctx.strokeStyle = arcGrad;
		ctx.lineCap = 'butt';
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, PI_2);
		ctx.stroke();
		ctx.lineCap = prevCap;
	} else if (progress !== 0) {
		const prevCap = ctx.lineCap;
		const arcGrad = ctx.createLinearGradient(x - radius, y, x + radius, y);
		arcGrad.addColorStop(0, '#60a5fa');
		arcGrad.addColorStop(1, '#c084fc');
		ctx.strokeStyle = arcGrad;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.arc(x, y, radius, -PI_1_2, progress * PI_2 - PI_1_2);
		ctx.stroke();
		ctx.lineCap = prevCap;
	}

	let mainY = y;
	if (goal !== null) {
		mainY = y - 45 + (80 - 34) / 2;
	}

	ctx.fillStyle = '#e5e7eb';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = 'bold 80px DejaVuSans';
	ctx.fillText(`${steps}`, x, mainY);

	if (goal !== 0) {
		ctx.font = 'bold 34px DejaVuSans';
		ctx.fillStyle = '#94a3b8';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(`/ ${goal}`, x, y + 45);
	}

	if (progress === 1 && streak !== 0) {
		const badgeX = x + radius - 36;
		const badgeY = y - radius + 36;
		ctx.fillStyle = '#16a34a';
		ctx.beginPath();
		ctx.roundRect(badgeX - 56, badgeY - 24, 112, 48, 14);
		ctx.fill();
		ctx.font = 'bold 24px DejaVuSans';
		ctx.fillStyle = '#f8fafc';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(saisir.image.streak(streak), badgeX, badgeY + 8);
	}

	ctx.restore();
}

export async function renderPresentationImage(opts: PresentationOptions): Promise<Buffer> {

	const goal = opts.goal === null || opts.goal < 0 ? 0 : opts.goal;
	let steps = opts.steps < 0 ? 0 : opts.steps;
	let streak = opts.streak < 0 ? 0 : opts.streak;


	const s = {w: 1200, h: 630};

	const canvas = createCanvas(s.w, s.h);
	const ctx = canvas.getContext('2d');
	fillBackground({ctx, s, c1: {x: s.w * 0.1, y: s.h * 0.22, r: 160}, c2: {x: s.w * 0.9, y: s.h * 0.87, r: 200}});


	ctx.fillStyle = '#f8fafc';
	ctx.font = 'bold 44px DejaVuSans';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';
	ctx.fillText(saisir.image.dateTitle(opts.dateISO), s.w / 2, 72);

	const left_x = s.w * 0.3;
	const right_x = s.w * 0.7;
	const h_center = s.h * 0.52;
	const radius = s.h * 0.35;
	const padding = 6;
	const arcWidth = 20;


	drawBackgroundCircle(ctx, left_x, h_center, radius);
	drawAvatar(ctx, left_x, h_center, radius - padding, await loadImage(opts.avatarUrl));

	ctx.save();

	drawBackgroundCircle(ctx, right_x, h_center, radius);
	drawStepWidget(ctx, right_x, h_center, radius - padding - arcWidth / 2, arcWidth, steps, goal, streak);


	ctx.textAlign = 'center';
	ctx.font = '30px DejaVuSans';
	ctx.fillStyle = '#cbd5e1';
	ctx.textBaseline = 'alphabetic';
	if (goal !== 0) {
		const txt = steps >= goal ? saisir.image.reached : saisir.image.remaining(goal - steps);
		ctx.fillText(txt, s.w / 2, s.h - 36);
	}

	return canvas.toBuffer('image/png');
}

export async function renderWeeklySummaryImage(opts: WeeklySummaryProps): Promise<Buffer> {
	const filledDays = opts.days.filter(d => d !== null);
	const successDays = opts.goal !== null ? filledDays.filter(d => d >= opts.goal!).length : 0;
	const total = filledDays.reduce((acc, val) => acc + val, 0);
	const average = Math.ceil(total / filledDays.length);


	const s = {w: 1200, h: 630};

	const canvas = createCanvas(s.w, s.h);
	const ctx = canvas.getContext('2d');
	fillBackground({ctx, s, c1: {x: s.w * 0.86, y: s.h * 0.86, r: 180}, c2: {x: s.w * 0.16, y: s.h * 0.2, r: 140}});


	const title = resumeLang.image.title(opts.mondayISO);
	ctx.fillStyle = '#f8fafc';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';
	ctx.font = 'bold 42px DejaVuSans';
	ctx.fillText(title, s.w / 2, 64);

	const pad = 32;
	const topPad = 80;
	const rightMargin = 48;
	const bottomMargin = 48;

	const cardW = 360;
	const cardH = 184;
	const statsY = s.h - bottomMargin - cardH;

	const availableTop = Math.max(0, statsY - topPad);
	const avatarDiameter = Math.max(128, Math.min(320, availableTop - 16));
	const avatarRadius = Math.floor(avatarDiameter / 2);
	const leftAvatarPad = cardW / 2 - avatarRadius;

	ctx.save();

	const avatar = {
		x: pad + avatarRadius + leftAvatarPad,
		y: topPad + avatarRadius,
		r: avatarRadius
	}

	drawBackgroundCircle(ctx, avatar.x, avatar.y, avatar.r);
	drawAvatar(ctx, avatar.x, avatar.y, avatar.r - 6, await loadImage(opts.avatarUrl));


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
	const chartW = s.w - chartX - rightMargin;
	const chartH = s.h - chartY - bottomMargin;
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
