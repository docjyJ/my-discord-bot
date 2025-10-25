import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Simple font registration attempts common system fonts; fallback to built-in sans.
(() => {
  try {
    GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVuSans');
  } catch {}
})();

export type PresentationOptions = {
  username: string; // e.g., "@user"
  avatarUrl?: string; // discord avatar URL
  dateISO: string; // YYYY-MM-DD in Europe/Paris
  steps: number; // current steps
  goal?: number | null; // optional goal
};

export async function renderPresentationImage(opts: PresentationOptions): Promise<Buffer> {
  const width = 1200;
  const height = 630; // twitter card ratio
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0f2027');
  grad.addColorStop(1, '#203a43');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Title with date (top center)
  dayjs.locale('fr');
  const dateTitle = dayjs(opts.dateISO).format('dddd DD MMMM YYYY');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px DejaVuSans, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dateTitle, width / 2, 64);

  // Congratulation/courage message under title
  const hasGoal = !!opts.goal && opts.goal! > 0;
  const reached = hasGoal && opts.steps >= (opts.goal as number);
  const message = reached ? `Félicitations ${opts.username} !` : `Courage ${opts.username} !`;
  ctx.font = 'bold 36px DejaVuSans, sans-serif';
  ctx.fillStyle = reached ? '#a3e635' : '#60a5fa';
  ctx.fillText(message, width / 2, 110);

  // Layout: two circles side-by-side
  const circleRadius = 210;
  const leftCenter = { x: width * 0.3, y: height * 0.55 };
  const rightCenter = { x: width * 0.7, y: height * 0.55 };

  // Left circle: avatar mask
  ctx.save();
  ctx.beginPath();
  ctx.arc(leftCenter.x, leftCenter.y, circleRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  // background for avatar circle
  ctx.fillStyle = '#111827';
  ctx.fillRect(leftCenter.x - circleRadius, leftCenter.y - circleRadius, circleRadius * 2, circleRadius * 2);
  if (opts.avatarUrl) {
    try {
      const img = await loadImage(opts.avatarUrl);
      // cover fit
      const scale = Math.max(circleRadius * 2 / img.width, circleRadius * 2 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, leftCenter.x - w / 2, leftCenter.y - h / 2, w, h);
    } catch {}
  }
  ctx.restore();
  // Draw circle border
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(leftCenter.x, leftCenter.y, circleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Right circle: radial arc progress and numbers
  ctx.save();
  // base circle background
  ctx.beginPath();
  ctx.arc(rightCenter.x, rightCenter.y, circleRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#0b1220';
  ctx.fill();

  const goal = hasGoal ? Math.max(0, opts.goal as number) : 0;
  const progress = goal > 0 ? Math.min(1, Math.max(0, opts.steps / goal)) : 0;

  // draw track
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(rightCenter.x, rightCenter.y, circleRadius - 14, 0, Math.PI * 2);
  ctx.stroke();

  // draw progress arc (start at -90deg for top)
  if (progress > 0) {
    ctx.strokeStyle = reached ? '#a3e635' : '#3b82f6';
    ctx.lineCap = 'round';
    ctx.beginPath();
    const start = -Math.PI / 2;
    const end = start + progress * Math.PI * 2;
    ctx.arc(rightCenter.x, rightCenter.y, circleRadius - 14, start, end);
    ctx.stroke();
  }

  // center text: big steps number
  ctx.fillStyle = '#e5e7eb';
  ctx.textAlign = 'center';
  ctx.font = 'bold 72px DejaVuSans, sans-serif';
  ctx.fillText(`${opts.steps}`, rightCenter.x, rightCenter.y - 8);

  // second line with goal if defined
  if (hasGoal) {
    ctx.font = 'bold 32px DejaVuSans, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`/ ${goal}`, rightCenter.x, rightCenter.y + 32);
  }

  // If reached 100%, add fleur-de-lys icons around
  if (reached) {
    ctx.font = 'bold 46px DejaVuSans, sans-serif';
    ctx.fillStyle = '#fef3c7';
    const emojis = ['⚜️','⚜️','⚜️'];
    ctx.fillText(emojis.join('  '), rightCenter.x, rightCenter.y - circleRadius - 20 + 60);
  }

  ctx.restore();

  // Bottom text
  ctx.textAlign = 'center';
  ctx.font = '28px DejaVuSans, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  if (hasGoal && !reached) {
    const remaining = Math.max(0, goal - opts.steps);
    ctx.fillText(`Il te reste ${remaining} pas pour atteindre ton objectif.`, width / 2, height - 32);
  }

  return canvas.toBuffer('image/png');
}
