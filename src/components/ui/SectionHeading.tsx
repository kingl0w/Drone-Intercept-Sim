import { colors } from "../../config/theme";
import type { ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: colors.textMuted,
        marginBottom: 4,
        marginTop: 8,
      }}
    >
      {children}
    </div>
  );
}

export function Divider() {
  return (
    <div
      style={{
        borderTop: `1px solid ${colors.border}`,
      }}
    />
  );
}
