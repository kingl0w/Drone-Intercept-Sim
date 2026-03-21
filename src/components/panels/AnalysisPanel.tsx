import { useState, useEffect, useRef } from "react";
import { useSimulation } from "../../hooks/useSimulation";
import { colors } from "../../config/theme";
import TelemetryPanel from "./TelemetryPanel";

interface AnalysisPanelProps {
  panelH: number;
  onBottomDrag: (e: React.MouseEvent) => void;
}

export default function AnalysisPanel({ panelH, onBottomDrag }: AnalysisPanelProps) {
  const { stepsRef, result } = useSimulation();
  const steps = stepsRef.current;
  const [expanded, setExpanded] = useState(false);
  const hasAutoExpanded = useRef(false);

  //auto-expand on first run
  useEffect(() => {
    if (result && !hasAutoExpanded.current) {
      setExpanded(true);
      hasAutoExpanded.current = true;
    }
  }, [result]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          height: 32,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          background: colors.bgPanel,
          borderTop: `1px solid ${colors.border}`,
          border: "none",
          borderTopStyle: "solid",
          borderTopWidth: 1,
          borderTopColor: colors.border,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: 500,
          color: colors.textMuted,
          width: "100%",
          textAlign: "left",
          gap: 6,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = colors.textDim; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
      >
        <span style={{ fontSize: 10, transition: "transform 0.15s", display: "inline-block" }}>{"\u25B6"}</span>
        Telemetry
        {result && (
          <span style={{ color: colors.textMuted, fontWeight: 400 }}>
            — click to expand
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <div
        onMouseDown={onBottomDrag}
        style={{
          height: 7,
          flexShrink: 0,
          cursor: "row-resize",
          background: colors.bgPanel,
          borderTop: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 3,
            borderRadius: 2,
            background: colors.border,
          }}
        />
      </div>
      <div
        style={{
          height: panelH,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: colors.bgPanel,
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => setExpanded(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            background: "none",
            border: "none",
            borderBottom: `1px solid ${colors.border}`,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            color: colors.textDim,
            flexShrink: 0,
            width: "100%",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 10, display: "inline-block", transform: "rotate(90deg)" }}>{"\u25B6"}</span>
          Telemetry
        </button>
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
          <TelemetryPanel steps={steps} result={result} panelH={panelH - 32} />
        </div>
      </div>
    </>
  );
}
