import { colors } from "../../config/theme";
import type { ReactNode } from "react";

interface OverlayPanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function OverlayPanel({ title, onClose, children }: OverlayPanelProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 50,
        maxWidth: 600,
        width: "calc(100% - 24px)",
        maxHeight: "calc(100% - 24px)",
        background: colors.bgPanel,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)",
        border: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{title}</span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            color: colors.textDim,
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 4,
            lineHeight: 1,
          }}
        >
          {"\u2715"}
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px" }}>
        {children}
      </div>
    </div>
  );
}
