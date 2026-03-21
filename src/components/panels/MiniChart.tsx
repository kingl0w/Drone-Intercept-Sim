import { useEffect } from "react";
import { colors } from "../../config/theme";
import { useCanvasResize } from "../../hooks/useCanvasResize";

interface MiniChartProps {
  data: number[];
  label: string;
  unit: string;
  color?: string;
  height?: number;
  danger?: number;
}

export default function MiniChart({ data, label, unit, color = colors.accent, height = 130, danger }: MiniChartProps) {
  const { ref, cRef, w } = useCanvasResize(200);

  useEffect(() => {
    const c = cRef.current;
    if (!c || !data.length) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const W = w;
    const H = height;
    ctx.clearRect(0, 0, W, H);

    const LPAD = 44;
    const TPAD = 4;
    const BPAD = 4;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const toX = (i: number) => LPAD + (i / (data.length - 1)) * (W - LPAD - 4);
    const toY = (v: number) => TPAD + (1 - (v - min) / range) * (H - TPAD - BPAD);

    const nGrid = 3;
    for (let i = 0; i <= nGrid; i++) {
      const val = min + (range * i) / nGrid;
      const y = toY(val);
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(LPAD, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = colors.textMuted;
      ctx.font = "11px JetBrains Mono,monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${val.toFixed(val > 99 ? 0 : val > 9 ? 0 : 1)}`, LPAD - 4, y + 3);
    }
    ctx.textAlign = "left";

    //area fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color + "20");
    grad.addColorStop(1, color + "03");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(toX(0), H);
    data.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
    ctx.lineTo(toX(data.length - 1), H);
    ctx.closePath();
    ctx.fill();

    //line
    ctx.strokeStyle = color + "bb";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = toX(i);
      const y = toY(v);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    //danger threshold
    if (danger !== undefined && danger >= min && danger <= max) {
      const dy = toY(danger);
      ctx.strokeStyle = "rgba(220,38,38,0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(LPAD, dy);
      ctx.lineTo(W, dy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(220,38,38,0.7)";
      ctx.font = "11px JetBrains Mono,monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${danger}`, LPAD - 4, dy + 3);
      ctx.textAlign = "left";
    }

    const lastVal = data[data.length - 1];
    ctx.fillStyle = color;
    ctx.font = "bold 14px JetBrains Mono,monospace";
    ctx.fillText(
      `${lastVal.toFixed(lastVal > 99 ? 0 : 1)}${unit}`,
      toX(data.length - 1) - 50,
      toY(lastVal) - 7
    );
  }, [data, w, height, color, unit, danger]);

  return (
    <div ref={ref} style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: colors.textMuted, marginBottom: 4 }}>
        {label}
      </div>
      <canvas
        ref={cRef}
        width={w}
        height={height}
        style={{
          display: "block",
          width: "100%",
          height,
          borderRadius: 6,
          background: colors.bgLight,
          border: `1px solid ${colors.border}`,
        }}
      />
    </div>
  );
}
