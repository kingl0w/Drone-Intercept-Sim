import { useEffect } from "react";
import { colors } from "../../config/theme";
import { useCanvasResize } from "../../hooks/useCanvasResize";
import ActionButton from "../ui/ActionButton";
import EmptyState from "../ui/EmptyState";
import type { MonteCarloResult } from "../../types/simulation";

interface MonteCarloPanelProps {
  results: MonteCarloResult | null;
  onRun: () => void;
  panelH: number;
  mode?: "inline" | "overlay";
}

export default function MonteCarloPanel({ results, onRun, panelH, mode = "inline" }: MonteCarloPanelProps) {
  const { ref, cRef, w } = useCanvasResize();
  const chartH = mode === "overlay" ? 250 : Math.max(80, panelH - 160);

  useEffect(() => {
    const c = cRef.current;
    if (!c || !results) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const W = w;
    const H = chartH;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = colors.bgCanvas;
    ctx.fillRect(0, 0, W, H);

    const times = results.results
      .filter((r) => r.intercepted)
      .map((r) => r.time)
      .filter((t): t is number => t !== null);

    if (!times.length) {
      ctx.fillStyle = "rgba(220,38,38,0.6)";
      ctx.font = "bold 16px JetBrains Mono,monospace";
      ctx.textAlign = "center";
      ctx.fillText("0% INTERCEPT PROBABILITY", W / 2, H / 2 + 5);
      ctx.textAlign = "left";
      return;
    }

    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const bins = 30;
    const binW = (maxT - minT) / bins || 1;
    const hist = Array(bins).fill(0) as number[];
    times.forEach((t) => {
      const b = Math.min(bins - 1, Math.floor((t - minT) / binW));
      hist[b]++;
    });
    const maxBin = Math.max(...hist, 1);

    const PAD = 40;
    const bW = Math.max(3, (W - PAD - 10) / bins - 1);
    hist.forEach((count, i) => {
      const x = PAD + (i / bins) * (W - PAD - 10);
      const h = (count / maxBin) * (H - 24);
      const g = ctx.createLinearGradient(0, H - 10 - h, 0, H - 10);
      g.addColorStop(0, "rgba(79,70,229,0.6)");
      g.addColorStop(1, "rgba(79,70,229,0.2)");
      ctx.fillStyle = g;
      ctx.fillRect(x, H - 10 - h, bW, h);
    });

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.font = "12px JetBrains Mono,monospace";
    ctx.fillText(`${minT.toFixed(1)}s`, PAD, H - 1);
    ctx.textAlign = "right";
    ctx.fillText(`${maxT.toFixed(1)}s`, W - 4, H - 1);
    ctx.textAlign = "left";

    if (results.mean !== null) {
      const mx = PAD + ((results.mean - minT) / (maxT - minT || 1)) * (W - PAD - 10);
      ctx.strokeStyle = "rgba(217,119,6,0.65)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mx, 0);
      ctx.lineTo(mx, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 12px JetBrains Mono,monospace";
      ctx.fillText(`\u03BC=${results.mean.toFixed(1)}s`, mx + 4, 14);
    }
  }, [results, w, chartH]);

  const pctColor = !results
    ? colors.textDim
    : results.probability >= 0.8
      ? colors.success
      : results.probability >= 0.5
        ? colors.warn
        : colors.danger;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <ActionButton onClick={onRun}>Run Monte Carlo</ActionButton>
        <span style={{ fontSize: 15, color: colors.textMuted }}>
{"200 runs with randomized conditions"}
        </span>
      </div>

      {results && (
        <div style={{ display: "flex", gap: 28, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
              P(Intercept)
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: pctColor, lineHeight: 1 }}>
              {(results.probability * 100).toFixed(0)}%
            </div>
          </div>
          {results.mean !== null && (
            <div>
              <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                Mean Time
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: colors.text, lineHeight: 1 }}>
                {results.mean.toFixed(1)}s{" "}
                <span style={{ fontSize: 15, color: colors.textDim }}>
                  {"\u00B1"} {results.std.toFixed(1)}s
                </span>
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
              Runs
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.text, lineHeight: 1 }}>
              {results.results.filter((r) => r.intercepted).length}
              <span style={{ color: colors.textDim, fontSize: 15 }}> / {results.n}</span>
            </div>
          </div>
        </div>
      )}

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
          <EmptyState text="Estimates intercept probability by randomizing conditions across 200 runs." hint="Hit Run Monte Carlo to see the distribution." />
        )}
      </div>
    </div>
  );
}
