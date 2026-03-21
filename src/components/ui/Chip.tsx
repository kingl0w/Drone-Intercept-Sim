import { colors } from "../../config/theme";
import type { ReactNode } from "react";

interface ChipProps {
  active: boolean;
  color: string;
  onClick: () => void;
  children: ReactNode;
}

export default function Chip({ active, color, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        marginBottom: 1,
        background: active ? color : "transparent",
        border: "none",
        borderBottom: active ? "none" : `1px solid ${colors.border}`,
        color: active ? "#ffffff" : colors.textDim,
        borderRadius: 6,
        cursor: "pointer",
        fontFamily: "inherit",
        gap: 2,
        transition: "background 0.15s, color 0.15s",
        overflow: "hidden",
        position: "relative" as const,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.03)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
