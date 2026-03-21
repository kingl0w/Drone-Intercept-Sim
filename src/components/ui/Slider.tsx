import { colors } from "../../config/theme";
import type { ChangeEvent } from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  compact?: boolean;
}

export default function Slider({ label, value, min, max, step, unit, onChange, compact = false }: SliderProps) {
  return (
    <div style={compact ? undefined : { marginBottom: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.text, marginBottom: 2 }}>
        <span style={{ fontWeight: 400 }}>{label}</span>
        <span style={{ color: colors.accent, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#4f46e5" }}
      />
    </div>
  );
}

//compact slider alias
export function CustomSlider(props: Omit<SliderProps, "compact">) {
  return <Slider {...props} compact />;
}
