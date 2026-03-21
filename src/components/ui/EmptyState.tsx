import { colors } from "../../config/theme";

interface EmptyStateProps {
  text: string;
  hint?: string;
}

export default function EmptyState({ text, hint }: EmptyStateProps) {
  return (
    <div style={{ padding: "24px 0", textAlign: "center" }}>
      <div style={{ color: colors.textDim, fontSize: 14, lineHeight: 1.5 }}>{text}</div>
      {hint && (
        <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}
