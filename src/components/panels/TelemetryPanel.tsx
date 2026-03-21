import { colors } from "../../config/theme";
import MiniChart from "./MiniChart";
import EmptyState from "../ui/EmptyState";
import type { SimulationStep, SimulationResult } from "../../types/simulation";

interface TelemetryPanelProps {
  steps: SimulationStep[];
  result: SimulationResult | null;
  panelH: number;
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: color || colors.text }}>{value}</span>
    </div>
  );
}

export default function TelemetryPanel({ steps, result, panelH }: TelemetryPanelProps) {
  if (!steps.length) return <EmptyState text="Distance, speed, altitude, G-load, and battery charts appear here after a run." hint="The preview on the canvas updates live as you change settings." />;
  const dist = steps.map(s => s.dist);
  const speed = steps.map(s => s.iSpeed || 0);
  const alt = steps.map(s => s.iy);
  const gLoad = steps.map(s => s.gLoad || 0);
  const battery = steps.map(s => s.batteryPct ?? 100);
  const chartH = Math.max(90, Math.min(180, (panelH - 90) / 2));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {result && (
        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            padding: "8px 12px",
            background: colors.bg,
            borderRadius: 6,
          }}
        >
          <StatItem label="Peak speed" value={`${result.peakSpeed.toFixed(1)} m/s`} />
          <StatItem
            label="Max G"
            value={`${result.maxG.toFixed(1)}G`}
            color={result.maxG > 5 ? colors.danger : undefined}
          />
          <StatItem
            label="Energy"
            value={`${(result.energyUsedJ / 3600).toFixed(1)} / ${(result.batteryJ / 3600).toFixed(0)} Wh`}
          />
          <StatItem
            label="Battery used"
            value={`${(result.energyUsedJ / result.batteryJ * 100).toFixed(0)}%`}
            color={result.energyUsedJ / result.batteryJ > 0.8 ? colors.danger : undefined}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <MiniChart data={dist} label="Distance" unit="m" color={colors.warn} height={chartH} />
        <MiniChart data={speed} label="Speed" unit=" m/s" color={colors.accent} height={chartH} />
        <MiniChart data={alt} label="Altitude" unit="m" color={colors.success} height={chartH} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <MiniChart data={gLoad} label="G-load" unit="G" color="#c084fc" height={chartH} danger={6} />
        <MiniChart data={battery} label="Battery" unit="%" color={colors.success} height={chartH} danger={20} />
      </div>
    </div>
  );
}
