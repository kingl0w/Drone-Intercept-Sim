import { useSimulation } from "../../hooks/useSimulation";
import { colors } from "../../config/theme";
import { INTERCEPTOR_PRESETS, SWARM_COLORS } from "../../config/presets";
import { calcTWR } from "../../utils/calculations";
import Chip from "../ui/Chip";
import Slider from "../ui/Slider";
import ToggleButtons from "../ui/ToggleButtons";
import { SectionHeading, Divider } from "../ui/SectionHeading";
import CustomBuilder from "./CustomBuilder";

export default function AdvancedTab() {
  const {
    compareMode,
    compareKey,
    compareCustomInterceptor,
    compareInterceptor,
    swarmMode,
    swarmCount,
    swarmStagger,
    swarmSpread,
    swarmResults,
    playbackSpeed,
    set,
    updateCompareCustomInterceptor,
  } = useSimulation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <SectionHeading>Comparison</SectionHeading>

      <ToggleButtons
        options={[
          ["off", "Off", !compareMode],
          ["ab", "A vs B", compareMode],
        ]}
        onSelect={(key) => set("compareMode", key === "ab")}
        activeColor={compareMode ? "#c084fc" : undefined}
      />

      {compareMode && (
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 2, fontWeight: 500 }}>
            Interceptor B
          </div>
          {Object.entries(INTERCEPTOR_PRESETS).map(([key, preset]) => {
            const active = compareKey === key;
            return (
              <Chip
                key={key}
                active={active}
                color="#c084fc"
                onClick={() => set("compareKey", key)}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {preset.name}
                </span>
                <span style={{ fontSize: 12, opacity: active ? 0.8 : 0.7 }}>
                  {preset.mass}g · TWR {calcTWR(preset.thrust, preset.mass).toFixed(1)} · {preset.maxTurnRate}°/s · {preset.maxGLoad}G
                </span>
              </Chip>
            );
          })}

          <Chip
            active={compareKey === "custom"}
            color="#c084fc"
            onClick={() => set("compareKey", "custom")}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              Custom Build
            </span>
            <span style={{ fontSize: 12, opacity: compareKey === "custom" ? 0.8 : 0.7 }}>
              Design a custom interceptor for B
            </span>
          </Chip>

          {compareKey === "custom" && (
            <CustomBuilder
              params={compareCustomInterceptor}
              interceptor={compareInterceptor}
              accentColor="#c084fc"
              onParamChange={updateCompareCustomInterceptor}
              onSetAll={(params) => set("compareCustomInterceptor", params)}
            />
          )}
        </div>
      )}

      <Divider />

      <SectionHeading>Swarm</SectionHeading>

      <ToggleButtons
        options={[
          ["off", "Off", !swarmMode],
          ["swarm", "Swarm", swarmMode],
        ]}
        onSelect={(key) => set("swarmMode", key === "swarm")}
        activeColor={swarmMode ? colors.success : undefined}
      />

      {swarmMode && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
          <Slider label="Drones" value={swarmCount} min={2} max={5} step={1} unit="" onChange={(v) => set("swarmCount", v)} />
          <Slider label="Stagger" value={swarmStagger} min={0} max={10} step={0.5} unit="s" onChange={(v) => set("swarmStagger", v)} />
          <Slider label="Angle Spread" value={swarmSpread} min={5} max={45} step={5} unit={"\u00B0"} onChange={(v) => set("swarmSpread", v)} />

          <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
            Launches {swarmCount} interceptors with {swarmStagger}s stagger and
            {" \u00B1"}{(((swarmCount - 1) / 2) * swarmSpread).toFixed(0)}{"\u00B0"}
            {" "}spread
          </div>

          {swarmResults.length > 0 && (
            <div
              style={{
                fontSize: 12,
                color: colors.textDim,
                borderTop: `1px solid ${colors.border}`,
                paddingTop: 4,
                lineHeight: 1.6,
              }}
            >
              {swarmResults.map((result, i) => (
                <div key={i}>
                  <span style={{ color: SWARM_COLORS[i % SWARM_COLORS.length], fontWeight: 700 }}>
                    S{i + 1}
                  </span>{" "}
                  {result.intercepted ? (
                    <span style={{ color: colors.success }}>
                      T+{result.interceptTime!.toFixed(1)}s ·{" "}
                      {result.maxG.toFixed(1)}G
                    </span>
                  ) : (
                    <span style={{ color: colors.danger }}>Miss</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Divider />

      <SectionHeading>Playback</SectionHeading>

      <ToggleButtons
        options={[
          ["1", "1x", playbackSpeed === 1],
          ["2", "2x", playbackSpeed === 2],
          ["4", "4x", playbackSpeed === 4],
          ["6", "6x", playbackSpeed === 6],
        ]}
        onSelect={(key) => set("playbackSpeed", Number(key))}
      />
    </div>
  );
}
