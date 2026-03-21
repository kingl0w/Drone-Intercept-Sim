import { colors } from "../../config/theme";

type ToggleOption = [key: string, label: string, isActive: boolean];

interface ToggleButtonsProps {
  options: ToggleOption[];
  onSelect: (key: string) => void;
  activeColor?: string;
}

export default function ToggleButtons({ options, onSelect, activeColor }: ToggleButtonsProps) {
  const accentColor = activeColor || colors.accent;

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map(([key, label, active]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          style={{
            flex: 1,
            padding: "5px 0",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "inherit",
            background: active ? `${accentColor}15` : colors.bgLight,
            border: `1px solid ${active ? `${accentColor}55` : colors.border}`,
            color: active ? accentColor : colors.text,
            borderRadius: 4,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
