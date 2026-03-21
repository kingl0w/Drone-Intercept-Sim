import { useEffect } from "react";
import { colors } from "../../config/theme";
import { SWEEP_PARAMS } from "../../config/sweep";
import { useCanvasResize } from "../../hooks/useCanvasResize";
import ActionButton from "../ui/ActionButton";
import SelectField from "../ui/SelectField";
import EmptyState from "../ui/EmptyState";
import type { SweepResult, SweepParamKey } from "../../types/simulation";

interface SweepPanelProps {
  sweepKey: SweepParamKey;
  setSweepKey: (v: string) => void;
  results: SweepResult[] | null;
  onRun: () => void;
  panelH: number;
  mode?: "inline" | "overlay";
}

export default function SweepPanel({ sweepKey, setSweepKey, results, onRun, panelH, mode = "inline" }: SweepPanelProps) {
  const { ref, cRef, w } = useCanvasResize();
  const chartH = mode === "overlay" ? 250 : Math.max(100, panelH - 100);

  useEffect(() => {
    const c = cRef.current;
    if (!c || !results) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const W = w;
    const H = chartH;
    ctx.clearRect(0, 0, W, H);

    const cfg = SWEEP_PARAMS[sweepKey];
    const okResults = results.filter((r) => r.intercepted);
    const maxTime = Math.max(
      ...okResults.map((r) => r.time).filter((t): t is number => t !== null),
      1
    );
    const PAD = 46;

    ctx.fillStyle = colors.bgCanvas;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i <= 4; i++) {
      const y = 12 + ((H - 28) * i) / 4;
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - 4, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.font = "12px JetBrains Mono,monospace";
    ctx.fillText(`${cfg.min}${cfg.unit}`, PAD, H - 2);
    ctx.textAlign = "right";
    ctx.fillText(`${cfg.max}${cfg.unit}`, W - 4, H - 2);
    ctx.textAlign = "left";
    ctx.fillText(`${maxTime.toFixed(0)}s`, 2, 14);
    ctx.fillText("0s", 2, H - 16);

    const barW = Math.max(3, (W - PAD - 10) / results.length - 1);
    results.forEach((r, i) => {
      const x = PAD + (i / results.length) * (W - PAD - 10);
      if (r.intercepted && r.time !== null) {
        const h = (r.time / maxTime) * (H - 24);
        const g = ctx.createLinearGradient(0, H - 16 - h, 0, H - 16);
        g.addColorStop(0, "rgba(22,163,74,0.7)");
        g.addColorStop(1, "rgba(22,163,74,0.3)");
        ctx.fillStyle = g;
        ctx.fillRect(x, H - 16 - h, barW, h);
      } else {
        ctx.fillStyle = "rgba(220,38,38,0.25)";
        ctx.fillRect(x, 8, barW, H - 24);
      }
    });

    const lastOk = results.reduce((acc, r, i) => (r.intercepted ? i : acc), -1);
    const firstFail = results.findIndex((r) => !r.intercepted);
    if (lastOk >= 0 && firstFail >= 0) {
      const boundary = Math.min(lastOk, firstFail);
      const bx = PAD + (boundary / results.length) * (W - PAD - 10);
      ctx.strokeStyle = "rgba(217,119,6,0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 13px JetBrains Mono,monospace";
      ctx.fillText(
        `~${results[boundary].value.toFixed(cfg.unit === "s" ? 1 : 0)}${cfg.unit}`,
        bx + 4,
        14
      );
    }
  }, [results, w, sweepKey, chartH]);

  const okCount = results ? results.filter((r) => r.intercepted).length : 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: colors.textDim, fontWeight: 600 }}>Sweep:</span>
        <SelectField value={sweepKey} onChange={setSweepKey} style={{ width: "auto" }}>
          {Object.entries(SWEEP_PARAMS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </SelectField>
        <ActionButton onClick={onRun}>Run Sweep</ActionButton>
        {results && (
          <span style={{ fontSize: 13, color: colors.textMuted }}>
            {okCount}/{results.length} intercepts
          </span>
        )}
      </div>
      <div ref={ref}>
        {results ? (
          <canvas
            ref={cRef}
            width={w}
            height={chartH}
            style={{
              display: "block",
              width: "100%",
              height: chartH,
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
            }}
          />
        ) : (
          <EmptyState text="Tests your scenario across a range of values to find the intercept envelope." hint="Pick a parameter above and hit Run Sweep." />
        )}
      </div>
    </div>
  );
}
