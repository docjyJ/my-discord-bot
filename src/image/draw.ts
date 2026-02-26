import {type Canvas, createCanvas, GlobalFonts, type Image, loadImage, type SKRSContext2D} from '@napi-rs/canvas';

GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVuSans');

const PI_2 = Math.PI * 2;

export default class Draw {
  readonly width: number;
  readonly height: number;
  private ctx: SKRSContext2D;
  private canvas: Canvas;

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
    // Support multi-line text by splitting on '\n' and vertically centering the block
    const lines = String(text).split('\n');
    if (lines.length === 1) {
      this.ctx.fillText(text, x, y);
      return;
    }

    const lineHeight = Math.round(fontSize * 1.2);
    // center the block at y: compute offset for each line
    const midIndex = (lines.length - 1) / 2;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const offset = (i - midIndex) * lineHeight;
      this.ctx.fillText(line, x, y + offset);
    }
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
    this.ctx.fillStyle = fill;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, r);
    this.ctx.fill();
  }

  public drawHorizontalDashedLine(x1: number, x2: number, y: number, lineWidth: number, color: string | CanvasGradient, dash: number[] = [10, 6]) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.setLineDash(dash);
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y);
    this.ctx.lineTo(x2, y);
    this.ctx.stroke();
    this.ctx.restore();
  }

  public toBuffer() {
    return this.canvas.toBuffer('image/png');
  }
}

export function downloadImage(url: string) {
  return loadImage(url);
}
