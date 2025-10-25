import {createCanvas, GlobalFonts, loadImage} from '@napi-rs/canvas';
import {presentation} from '../lang';

GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVuSans');

export type PresentationOptions = {
	username: string;
	avatarUrl?: string;
	dateISO: string;
	steps: number;
	goal: number | null;
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
	ctx.fillText(presentation.dateTitle(opts.dateISO), width / 2, 72);

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
	if (opts.avatarUrl) {
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
	}

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
		ctx.fillText(presentation.streak(opts.streak), badgeX, badgeY + 8);
	}

	ctx.restore();

	ctx.textAlign = 'center';
	ctx.font = '30px DejaVuSans';
	ctx.fillStyle = '#cbd5e1';
	ctx.textBaseline = 'alphabetic';
	if (hasGoal && reached) {
		ctx.fillText(presentation.footer.reached, width / 2, height - 36);
	} else if (hasGoal && !reached) {
		const remaining = Math.max(0, goal - opts.steps);
		ctx.fillText(presentation.footer.remaining(remaining), width / 2, height - 36);
	}

	return canvas.toBuffer('image/png');
}
