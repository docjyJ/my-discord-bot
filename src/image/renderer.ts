import {Canvas, CanvasGradient, createCanvas, GlobalFonts, Image, loadImage, SKRSContext2D} from '@napi-rs/canvas';
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
	avatarUrl: string;
	mondayISO: string;
	goal: number | null;
	days: (number | null)[];
	streak: number;
};

const PI_2 = Math.PI * 2;

class Draw {
	private ctx: SKRSContext2D;
	private canvas: Canvas;
	readonly width: number;
	readonly height: number;

	constructor(width: number, height: number) {
		this.canvas = createCanvas(width, height);
		this.ctx = this.canvas.getContext('2d');
		this.width = width;
		this.height = height;
		this.background();
	}

	public createLinearGradient(x0: number, y0: number, x1: number, y1: number, color0: string, color1: string) {
		const grad = this.ctx.createLinearGradient(x0, y0, x1, y1);
		grad.addColorStop(0, color0);
		grad.addColorStop(1, color1);
		return grad;
	}

	public background() {
		const key = Math.min(this.width, this.height);
		const c1x = key * 0.19;
		const c1y = key * 0.22;
		const c1r = key * 0.25;
		const c2x = this.width - key * 0.19;
		const c2y = this.height - key * 0.12;
		const c2r = key * 0.32;
		this.ctx.fillStyle = this.createLinearGradient(0, 0, this.width, this.height, '#0a0f1f', '#1f3b73');
		this.ctx.fillRect(0, 0, this.width, this.height);
		this.ctx.globalAlpha = 0.12;
		this.ctx.fillStyle = '#6ee7b7';
		this.ctx.beginPath();
		this.ctx.arc(c1x, c1y, c1r, 0, PI_2);
		this.ctx.fill();
		this.ctx.fillStyle = '#93c5fd';
		this.ctx.beginPath();
		this.ctx.arc(c2x, c2y, c2r, 0, PI_2);
		this.ctx.fill();
		this.ctx.globalAlpha = 1;
	}

	public backgroundCircle(x: number, y: number, radius: number) {
		this.ctx.fillStyle = this.createLinearGradient(x - radius, y - radius, x + radius, y + radius, '#0b1220', '#0f172a');
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, PI_2);
		this.ctx.fill();
	}

	public avatarCircle(x: number, y: number, radius: number, image: Image) {
		this.ctx.save();
		const scale = radius / Math.min(image.width, image.height);
		const w = image.width * scale;
		const h = image.height * scale;
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, PI_2);
		this.ctx.clip();
		this.ctx.drawImage(image, x - w, y - h, w * 2, h * 2);
		this.ctx.restore();
	}

	public text(text: string, x: number, y: number, color: string, fontSize: number, align: CanvasTextAlign = 'center') {
		this.ctx.fillStyle = color;
		this.ctx.font = `bold ${fontSize}px DejaVuSans`;
		this.ctx.textAlign = align;
		this.ctx.textBaseline = 'middle';
		this.ctx.fillText(text, x, y);
	}

	public drawCircle(x: number, y: number, radius: number, width: number, color: string | CanvasGradient) {
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = width;
		this.ctx.lineCap = 'butt';
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, PI_2);
		this.ctx.stroke();
	}

	public drawArc(x: number, y: number, radius: number, width: number, color: string | CanvasGradient, start: number, end: number) {
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = width;
		this.ctx.lineCap = 'round';
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, start * PI_2, end * PI_2);
		this.ctx.stroke();
	}

	public roundedRectFill(x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
		this.ctx.fillStyle = fill as any;
		this.ctx.beginPath();
		this.ctx.roundRect(x, y, w, h, r as any);
		this.ctx.fill();
	}

	public toBuffer() {
		return this.canvas.toBuffer('image/png');
	}
}


export async function renderPresentationImage(opts: PresentationOptions) {

	const goal = opts.goal === null || opts.goal < 0 ? 0 : opts.goal;
	let steps = opts.steps < 0 ? 0 : opts.steps;
	let streak = opts.streak < 0 ? 0 : opts.streak;


	const width = 1200;
	const height = 630;

	const draw = new Draw(1200, 630);

	draw.text(saisir.image.dateTitle(opts.dateISO), width / 2, 50, '#f8fafc', 44);


	const left_x = 0.3 * width;
	const right_x = 0.7 * width;
	const h_center = 0.52 * height;
	const radius = 0.35 * height;
	const padding = 6;
	const arcWidth = 20;
	const image = await loadImage(opts.avatarUrl);

	draw.backgroundCircle(left_x, h_center, radius);
	draw.avatarCircle(left_x, h_center, radius - padding, image);

	draw.backgroundCircle(right_x, h_center, radius);

	const widget_radius = radius - padding - arcWidth / 2;

	const progress = goal !== 0 && steps !== 0 ? goal > steps ? steps / goal * 0.96 + 0.2 : 1 : 0;
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

export async function renderWeeklySummaryImage(opts: WeeklySummaryProps): Promise<Buffer> {
	const filledDays = opts.days.filter(d => d !== null);
	const successDays = opts.goal !== null ? filledDays.filter(d => d >= opts.goal!).length : 0;
	const total = filledDays.reduce((acc, val) => acc + val, 0);
	const average = Math.ceil(total / filledDays.length);


	const width = 1200;
	const height = 630;

	const draw = new Draw(width, height);

	const title = resumeLang.image.title(opts.mondayISO);

	draw.text(title, width / 2, 40, '#f8fafc', 42);

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

	const avatar = {
		x: pad + avatarRadius + leftAvatarPad,
		y: topPad + avatarRadius,
		radius: avatarRadius
	}

	draw.backgroundCircle(avatar.x, avatar.y, avatar.radius);
	draw.avatarCircle(avatar.x, avatar.y, avatar.radius - 6, await loadImage(opts.avatarUrl));

	const cardBg = draw.createLinearGradient(pad, statsY, pad + cardW, statsY + cardH, '#0b1220', '#0f172a');
	draw.roundedRectFill(pad, statsY, cardW, cardH, 18, cardBg);

	draw.text(resumeLang.embed.fieldTotal(total), pad + 18, statsY + 36, '#cbd5e1', 26, 'left');
	draw.text(resumeLang.embed.fieldAverage(Math.round(average)), pad + 18, statsY + 74, '#cbd5e1', 26, 'left');
	if (opts.goal) {
		draw.text(resumeLang.embed.fieldGoalReached(successDays), pad + 18, statsY + 112, '#cbd5e1', 26, 'left');
	}
	if (opts.streak > 0) {
		draw.text(resumeLang.embed.streak(opts.streak), pad + 18, statsY + 150, '#cbd5e1', 26, 'left');
	}

	const gapLeftToChart = 24;
	const chartX = pad + cardW + gapLeftToChart;
	const chartY = topPad;
	const chartW = width - chartX - rightMargin;
	const chartH = height - chartY - bottomMargin;
	const chartBg = draw.createLinearGradient(chartX, chartY, chartX + chartW, chartY + chartH, '#0b1220', '#0f172a');
	draw.roundedRectFill(chartX, chartY, chartW, chartH, 20, chartBg);

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

		draw.roundedRectFill(innerX + i * (barW + gap), innerY, barW, innerH, 10, '#111827');

		if (val) {
			const bx = innerX + i * (barW + gap);
			const h = Math.max(0, Math.round(innerH * ((val ?? 0) / maxVal)));
			const by = innerY + innerH - h;
			const topColor = opts.goal && val >= opts.goal ? '#22c55e' : '#60a5fa';
			const bottomColor = opts.goal && val >= opts.goal ? '#84cc16' : '#c084fc';
			const g = draw.createLinearGradient(bx, by, bx, innerY + innerH, topColor, bottomColor);
			draw.roundedRectFill(bx, by, barW, h, 10, g);
			draw.text(`${val}`, bx + barW / 2, by - 16, '#e5e7eb', 20);
		} else {
			const bx = innerX + i * (barW + gap);
			const h = 0;
			const by = innerY + innerH - h;
			draw.text('-', bx + barW / 2, by - 16, '#e5e7eb', 20);
		}

		const bx = innerX + i * (barW + gap);
		const dayLabel = resumeLang.image.dayLetters[i] || '';
		const yLabel = chartY + chartH - 20;
		draw.text(dayLabel, bx + barW / 2, yLabel, '#94a3b8', 20);
	}
	return draw.toBuffer();
}
