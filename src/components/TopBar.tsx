import { useSimulation } from "../hooks/useSimulation";
import { colors } from "../config/theme";
import type { Breakpoint } from "../types/state";

interface TopBarProps {
  breakpoint: Breakpoint;
}

export default function TopBar({ breakpoint }: TopBarProps) {
  const {
    result,
    compareMode,
    compareResult,
    swarmMode,
    swarmResults,
    running,
    simulate,
  } = useSimulation();

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "8px 12px" : "8px 24px",
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
        background: colors.bgLight,
        gap: 12,
        minHeight: 44,
      }}
    >
      <div
        style={{
          fontSize: isMobile ? 15 : 16,
          fontWeight: 700,
          color: colors.text,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Intercept Sim
      </div>

      {isMobile && (
        <button
          onClick={simulate}
          disabled={running}
          style={{
            padding: "6px 14px",
            background: running ? colors.textMuted : colors.accent,
            border: "none",
            color: "#ffffff",
            borderRadius: 6,
            cursor: running ? "default" : "pointer",
            fontSize: 13,
            fontFamily: "inherit",
            fontWeight: 600,
            flexShrink: 0,
            opacity: running ? 0.7 : 1,
          }}
        >
          {running ? "Running\u2026" : "Run"}
        </button>
      )}

      {!isMobile && result && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <ResultBadge
            intercepted={result.intercepted}
            label={compareMode ? "A: " : ""}
            time={result.interceptTime}
            closureSpeed={result.closureSpeed}
            maxG={result.maxG}
            structuralFailure={result.structuralFailure}
            color={result.intercepted ? colors.success : colors.danger}
            bgColor={result.intercepted ? "rgba(22,163,74" : "rgba(220,38,38"}
          />

          {compareMode && compareResult && !isTablet && (
            <ResultBadge
              intercepted={compareResult.intercepted}
              label="B: "
              time={compareResult.interceptTime}
              closureSpeed={compareResult.closureSpeed}
              maxG={compareResult.maxG}
              color={compareResult.intercepted ? "#c084fc" : colors.danger}
              bgColor={compareResult.intercepted ? "rgba(192,132,252" : "rgba(220,38,38"}
            />
          )}

          {swarmMode && swarmResults.length > 0 && !isTablet && (
            <div
              style={{
                padding: "5px 12px",
                background: "rgba(22,163,74,0.06)",
                border: "1px solid rgba(22,163,74,0.2)",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: colors.success,
              }}
            >
              Swarm: {swarmResults.filter((r) => r.intercepted).length}/{swarmResults.length}
              {swarmResults.some((r) => r.intercepted) &&
                ` · T+${Math.min(
                  ...swarmResults
                    .filter((r) => r.intercepted)
                    .map((r) => r.interceptTime!)
                ).toFixed(1)}s`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ResultBadgeProps {
  intercepted: boolean;
  label: string;
  time: number | null;
  closureSpeed: number;
  maxG: number;
  structuralFailure?: boolean;
  color: string;
  bgColor: string;
}

function ResultBadge({ intercepted, label, time, closureSpeed, maxG, structuralFailure, color, bgColor }: ResultBadgeProps) {
  const displayColor = structuralFailure ? colors.danger : color;
  const displayBg = structuralFailure ? "rgba(220,38,38" : bgColor;
  return (
    <div
      style={{
        padding: "5px 12px",
        background: `${displayBg},0.08)`,
        border: `1px solid ${displayBg},0.25)`,
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 600,
        color: displayColor,
      }}
    >
      {label}
      {structuralFailure
        ? `Structural failure · ${maxG.toFixed(1)}G`
        : intercepted
          ? `Intercept T+${time?.toFixed(1)}s · ${Math.round(closureSpeed)} m/s · ${maxG.toFixed(1)}G`
          : "No intercept"}
    </div>
  );
}
