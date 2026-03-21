import { colors } from "../../config/theme";
import type { ReactNode } from "react";

interface ActionButtonProps {
  onClick: () => void;
  children: ReactNode;
}

export default function ActionButton({ onClick, children }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        background: colors.accent,
        border: "none",
        color: "#ffffff",
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.accentHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = colors.accent; }}
    >
      {children}
    </button>
  );
}
