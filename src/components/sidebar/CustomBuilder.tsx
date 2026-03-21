import { useMemo } from "react";
import { colors } from "../../config/theme";
import { calcTWR, FRAME_CONFIGS, computeMinMass } from "../../utils/calculations";
import { CustomSlider } from "../ui/Slider";
import { Divider } from "../ui/SectionHeading";
import type { FrameType, CustomInterceptorParams, InterceptorPreset } from "../../types/presets";

interface CustomBuilderProps {
  params: CustomInterceptorParams;
  interceptor: InterceptorPreset;
  accentColor?: string;
  onParamChange: (field: keyof CustomInterceptorParams, value: number) => void;
  onSetAll: (params: CustomInterceptorParams) => void;
}

export default function CustomBuilder({ params, interceptor, accentColor = colors.accent, onParamChange, onSetAll }: CustomBuilderProps) {
  const frameConfig = FRAME_CONFIGS[params.frameType];
  const minMass = useMemo(() => computeMinMass(params), [params]);
  //hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };
  const accentDim = hexToRgba(accentColor, 0.08);

  const handleFrameChange = (frameType: FrameType) => {
    const config = FRAME_CONFIGS[frameType];
    const newParams: CustomInterceptorParams = {
      frameType,
      mass: 0,
      thrust: config.defaultThrust,
      propSize: config.defaultPropSize,
      batteryCap: config.defaultBattery,
      cells: config.defaultCells,
      maxPower: config.defaultMaxPower,
    };
    newParams.mass = computeMinMass(newParams);
    onSetAll(newParams);
  };

  const handleSliderChange = (field: keyof CustomInterceptorParams, value: number) => {
    onParamChange(field, value);
    const updated = { ...params, [field]: value };
    const newMin = computeMinMass(updated);
    if (updated.mass < newMin) {
      onParamChange("mass", newMin);
    }
  };

  return (
    <div
      style={{
        padding: "6px 4px",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        borderTop: `1px solid ${colors.border}`,
        marginTop: 4,
      }}
    >
      <div style={{ marginBottom: 2 }}>
        <div style={{ fontSize: 14, color: colors.text, marginBottom: 4, fontWeight: 500 }}>
          Frame Type
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {(Object.keys(FRAME_CONFIGS) as FrameType[]).map((ft) => {
            const cfg = FRAME_CONFIGS[ft];
            const isActive = params.frameType === ft;
            return (
              <button
                key={ft}
                onClick={() => handleFrameChange(ft)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  background: isActive ? accentDim : colors.bgLight,
                  border: `1px solid ${isActive ? accentColor : colors.border}`,
                  color: isActive ? accentColor : colors.text,
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{cfg.label}</span>
                <span style={{ fontSize: 11, color: isActive ? accentColor : colors.textMuted, fontWeight: 400, whiteSpace: "nowrap" }}>
                  {cfg.motorCount} motor{cfg.motorCount > 1 ? "s" : ""} · {cfg.frameWeight}g
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <CustomSlider label="Thrust" value={params.thrust} min={200} max={8000} step={50} unit="g" onChange={(v) => handleSliderChange("thrust", v)} />
      <CustomSlider label="Prop size" value={params.propSize} min={2} max={10} step={0.5} unit='"' onChange={(v) => handleSliderChange("propSize", v)} />
      <CustomSlider label="Battery" value={params.batteryCap} min={300} max={8000} step={50} unit="mAh" onChange={(v) => handleSliderChange("batteryCap", v)} />
      <CustomSlider label="Cells" value={params.cells} min={2} max={8} step={1} unit="S" onChange={(v) => handleSliderChange("cells", v)} />
      <CustomSlider label="Max power" value={params.maxPower} min={50} max={1500} step={10} unit="W" onChange={(v) => handleSliderChange("maxPower", v)} />

      <Divider />

      <div style={{ fontSize: 13, color: colors.text, fontWeight: 500, marginBottom: 2 }}>
        Mass
      </div>
      <div
        style={{
          fontSize: 12,
          color: colors.textDim,
          lineHeight: 1.6,
          background: accentDim,
          padding: "6px 8px",
          borderRadius: 4,
          border: `1px solid ${colors.border}`,
          marginBottom: 2,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Frame</span><span>{frameConfig.frameWeight}g</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Battery ({params.cells}S {params.batteryCap}mAh)</span>
          <span>{Math.round(params.batteryCap * params.cells * 0.03)}g</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Motors + ESCs</span>
          <span>{Math.round((params.thrust / frameConfig.motorCount) * 0.07 * frameConfig.motorCount + (params.maxPower / frameConfig.motorCount) * 0.15 * frameConfig.motorCount)}g</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${colors.border}`, marginTop: 3, paddingTop: 3, fontWeight: 700, color: colors.text }}>
          <span>Min total</span><span>{minMass}g</span>
        </div>
      </div>
      <CustomSlider label="Total Mass" value={params.mass} min={minMass} max={Math.max(minMass + 100, 3000)} step={10} unit="g" onChange={(v) => onParamChange("mass", v)} />

      <div
        style={{
          fontSize: 12,
          color: colors.textMuted,
          lineHeight: 1.5,
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 4,
          marginTop: 2,
        }}
      >
        TWR {calcTWR(interceptor.thrust, interceptor.mass).toFixed(1)} · Top{" "}
        {interceptor.topSpeed}m/s · {frameConfig.maxTurnRate}°/s · {frameConfig.maxGLoad}G max
      </div>
    </div>
  );
}
