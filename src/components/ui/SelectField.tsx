import { colors } from "../../config/theme";
import type { ChangeEvent, ReactNode, CSSProperties } from "react";

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  label?: string;
  style?: CSSProperties;
}

export default function SelectField({ value, onChange, children, label, style }: SelectFieldProps) {
  return (
    <div style={label ? { marginBottom: 4 } : undefined}>
      {label && (
        <div style={{ fontSize: 13, color: colors.text, marginBottom: 3, fontWeight: 400 }}>
          {label}
        </div>
      )}
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "6px 28px 6px 8px",
          background: colors.bgLight,
          border: `1px solid ${colors.border}`,
          color: colors.text,
          borderRadius: 6,
          fontSize: 13,
          fontFamily: "inherit",
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          cursor: "pointer",
          ...style,
        }}
      >
        {children}
      </select>
    </div>
  );
}
