import { useSimulation } from "../../hooks/useSimulation";
import { colors } from "../../config/theme";
import { PRESETS, INTERCEPTOR_PRESETS } from "../../config/presets";
import { calcTWR } from "../../utils/calculations";
import Chip from "../ui/Chip";
import { SectionHeading, Divider } from "../ui/SectionHeading";
import CustomBuilder from "./CustomBuilder";
import type { InterceptorPreset } from "../../types/presets";

//intercept arc sparkline
function TrajectorySparkline({ preset }: { preset: InterceptorPreset }) {
  //arc tightness from turn rate
  const turnFactor = Math.min(preset.maxTurnRate / 720, 1);
  //steepness from twr
  const thrustFactor = Math.min(calcTWR(preset.thrust, preset.mass) / 6, 1);

  //bezier control points
  const w = 48;
  const h = 28;
  const startX = 2;
  const startY = h - 2;
  const endX = w - 4;
  const endY = 6 + (1 - thrustFactor) * 8;
  //tighter turn = closer control points
  const cp1x = startX + 6 + (1 - turnFactor) * 12;
  const cp1y = startY - thrustFactor * (h * 0.8);
  const cp2x = endX - 10 - (1 - turnFactor) * 8;
  const cp2y = endY + 4;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{
        position: "absolute",
        right: 6,
        top: "50%",
        transform: "translateY(-50%)",
        opacity: 0.25,
        pointerEvents: "none",
      }}
    >
      {/* Interceptor arc */}
      <path
        d={`M${startX},${startY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Target line (straight, slight descent) */}
      <line
        x1={w - 2}
        y1={endY - 2}
        x2={endX - 16}
        y2={endY + 1}
        stroke="#ffffff"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity="0.6"
      />
      {/* Intercept dot */}
      <circle cx={endX} cy={endY} r="2" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}

export default function AssetsTab() {
  const {
    targetKey,
    interceptorKey,
    customInterceptor,
    interceptor,
    twr,
    speedMargin,
    killRadius,
    batteryWh,
    set,
    updateCustomInterceptor,
  } = useSimulation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SectionHeading>Target</SectionHeading>
      {Object.entries(PRESETS).map(([key, preset]) => {
        const active = targetKey === key;
        return (
          <Chip
            key={key}
            active={active}
            color={preset.color}
            onClick={() => set("targetKey", key)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%" }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {preset.name}
              </span>
              <span style={{ fontSize: 12, opacity: active ? 0.8 : 0.7 }}>
                {preset.speed} m/s · {preset.altitude}m
              </span>
            </div>
          </Chip>
        );
      })}

      <Divider />

      <SectionHeading>Interceptor</SectionHeading>
      {Object.entries(INTERCEPTOR_PRESETS).map(([key, preset]) => {
        const active = interceptorKey === key;
        return (
          <Chip
            key={key}
            active={active}
            color={colors.accent}
            onClick={() => set("interceptorKey", key)}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {preset.name}
            </span>
            <span style={{ fontSize: 12, opacity: active ? 0.8 : 0.7 }}>
              {preset.mass}g · TWR {calcTWR(preset.thrust, preset.mass).toFixed(1)} · {preset.topSpeed}m/s
            </span>
            {active && <TrajectorySparkline preset={preset} />}
          </Chip>
        );
      })}

      <Chip
        active={interceptorKey === "custom"}
        color={colors.accent}
        onClick={() => set("interceptorKey", "custom")}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          Custom Build
        </span>
        <span style={{ fontSize: 12, opacity: interceptorKey === "custom" ? 0.8 : 0.7 }}>
          Design your own interceptor
        </span>
        {interceptorKey === "custom" && <TrajectorySparkline preset={interceptor} />}
      </Chip>

      {interceptorKey === "custom" && (
        <CustomBuilder
          params={customInterceptor}
          interceptor={interceptor}
          onParamChange={updateCustomInterceptor}
          onSetAll={(params) => set("customInterceptor", params)}
        />
      )}

      {/* Matchup summary — always visible */}
      <div
        style={{
          marginTop: 8,
          padding: "8px 10px",
          background: colors.bg,
          borderRadius: 6,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px 16px",
          fontSize: 12,
          color: colors.textDim,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>TWR</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: parseFloat(twr) >= 2 ? colors.success : colors.danger }}>{twr}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Speed margin</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: speedMargin > 0 ? colors.success : colors.danger }}>{speedMargin > 0 ? "+" : ""}{speedMargin}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Kill radius</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: colors.text }}>{killRadius.toFixed(0)}m</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Battery</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: colors.text }}>{batteryWh}Wh</span>
        </div>
      </div>
    </div>
  );
}
