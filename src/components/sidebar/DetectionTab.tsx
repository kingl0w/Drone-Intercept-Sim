import { useSimulation } from "../../hooks/useSimulation";
import { colors } from "../../config/theme";
import ToggleButtons from "../ui/ToggleButtons";
import SelectField from "../ui/SelectField";
import { SectionHeading, Divider } from "../ui/SectionHeading";

export default function DetectionTab() {
  const {
    useRadarModel,
    radarClass,
    target,
    detectionRange,
    detectionDelay,
    set,
  } = useSimulation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <SectionHeading>Detection Mode</SectionHeading>

      <ToggleButtons
        options={[
          ["manual", "Manual", !useRadarModel],
          ["radar", "Radar", useRadarModel],
        ]}
        onSelect={(key) => set("useRadarModel", key === "radar")}
      />

      {useRadarModel && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <SelectField label="Radar Class" value={radarClass} onChange={(v) => set("radarClass", v)}>
            <option value="small">Small (portable)</option>
            <option value="medium">Medium (vehicle)</option>
            <option value="large">Large (fixed site)</option>
          </SelectField>

          <Divider />

          <SectionHeading>Computed from radar</SectionHeading>
          <div style={{ fontSize: 13, color: colors.textDim, lineHeight: 1.8 }}>
            Target cross-section:{" "}
            <span style={{ color: colors.text, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
              {target.rcs} m{"\u00B2"}
            </span>
            <br />
            Detection range:{" "}
            <span style={{ color: colors.accent, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.round(detectionRange)}m
            </span>
            <br />
            Detection delay:{" "}
            <span style={{ color: colors.text, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
              {detectionDelay}s
            </span>
          </div>
        </div>
      )}

      {!useRadarModel && (
        <div style={{ marginTop: 8, fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>
          Detection delay is set manually in the Scenario tab.
        </div>
      )}
    </div>
  );
}
