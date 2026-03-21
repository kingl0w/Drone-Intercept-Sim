import { TWO_PI } from "../../simulation/physics";
import type { CanvasPoint, SimulationStep } from "../../types/simulation";

export function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  font: string,
  align: CanvasTextAlign = "left"
): void {
  ctx.font = font;
  ctx.textAlign = align;

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const fontSize = parseInt(font) || 12;
  const paddingX = 3;
  const paddingY = 2;

  let rectX = x - paddingX;
  if (align === "center") {
    rectX = x - textWidth / 2 - paddingX;
  } else if (align === "right") {
    rectX = x - textWidth - paddingX;
  }

  const rectY = y - fontSize + 1 - paddingY;
  const rectWidth = textWidth + paddingX * 2;
  const rectHeight = fontSize + paddingY * 2;
  const cornerRadius = 3;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.moveTo(rectX + cornerRadius, rectY);
  ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
  ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
  ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
  ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
  ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
  ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
  ctx.lineTo(rectX, rectY + cornerRadius);
  ctx.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

export function drawTrail(
  ctx: CanvasRenderingContext2D,
  steps: SimulationStep[],
  frameIndex: number,
  getPoint: (step: SimulationStep) => CanvasPoint,
  color: string,
  lineWidth: number = 2.5
): void {
  const end = Math.min(frameIndex + 1, steps.length);
  if (end === 0) return;

  ctx.strokeStyle = color + "80";
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  const p0 = getPoint(steps[0]);
  ctx.moveTo(p0.cx, p0.cy);
  for (let i = 1; i < end; i++) {
    const p = getPoint(steps[i]);
    ctx.lineTo(p.cx, p.cy);
  }
  ctx.stroke();
}

export function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TWO_PI);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawPreviewTrail(
  ctx: CanvasRenderingContext2D,
  steps: SimulationStep[],
  getPoint: (step: SimulationStep) => CanvasPoint,
  color: string,
  lineWidth: number = 2
): void {
  ctx.strokeStyle = color + "50";
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([6, 4]);

  ctx.beginPath();
  steps.forEach((step, i) => {
    const point = getPoint(step);
    if (i === 0) {
      ctx.moveTo(point.cx, point.cy);
    } else {
      ctx.lineTo(point.cx, point.cy);
    }
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawPreviewDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TWO_PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}
