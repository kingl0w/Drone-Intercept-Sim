import { useState, type ReactNode } from "react";
import { colors } from "../../config/theme";

interface SectionProps {
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
  maxH?: number;
}

export default function Section({ title, children, defaultCollapsed = false, maxH }: SectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 6, overflow: "hidden" }}>
      <div onClick={() => setCollapsed(c => !c)}
        style={{ padding: "5px 10px", background: colors.bgLight, fontSize: 12, letterSpacing: 1, color: colors.textMuted, borderBottom: collapsed ? "none" : `1px solid ${colors.border}`, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}>
        {title}
        <span style={{ fontSize: 11, opacity: 0.5, transition: "transform 0.15s", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>{"\u25BC"}</span>
      </div>
      {!collapsed && <div className={maxH ? "section-scroll" : undefined} style={{ padding: "7px 8px", ...(maxH ? { maxHeight: maxH, overflowY: "auto" as const } : {}) }}>{children}</div>}
    </div>
  );
}
