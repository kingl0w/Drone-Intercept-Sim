import { useSimulation } from "../../hooks/useSimulation";
import { EVASION_MODES } from "../../config/presets";
import Slider from "../ui/Slider";
import SelectField from "../ui/SelectField";
import { SectionHeading, Divider } from "../ui/SectionHeading";

export default function ScenarioTab() {
  const {
    launchDistance,
    launchAngle,
    detectionDelay,
    targetAltitude,
    evasion,
    windSpeed,
    windAngle,
    temperature,
    set,
  } = useSimulation();

  const windLabel =
    windAngle === 180 ? "Headwind"
    : windAngle === 0 ? "Tailwind"
    : windAngle === 90 ? "Updraft"
    : windAngle === 270 ? "Downdraft"
    : `${windAngle}\u00B0`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <SectionHeading>Launch</SectionHeading>

      <Slider label="Distance" value={launchDistance} min={100} max={5000} step={50} unit="m" onChange={(v) => set("launchDistance", v)} />
      <Slider label="Angle" value={launchAngle} min={5} max={85} step={5} unit={"\u00B0"} onChange={(v) => set("launchAngle", v)} />
      <Slider label="Detection delay" value={detectionDelay} min={0} max={30} step={0.5} unit="s" onChange={(v) => set("detectionDelay", v)} />
      <Slider label="Target altitude" value={targetAltitude} min={10} max={500} step={10} unit="m" onChange={(v) => set("targetAltitude", v)} />

      <SelectField label="Target evasion" value={evasion} onChange={(v) => set("evasion", v)}>
        {Object.entries(EVASION_MODES).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </SelectField>

      <Divider />

      <SectionHeading>Environment</SectionHeading>

      <Slider label="Wind speed" value={windSpeed} min={0} max={20} step={1} unit=" m/s" onChange={(v) => set("windSpeed", v)} />
      <Slider label={`Wind direction (${windLabel})`} value={windAngle} min={0} max={345} step={15} unit={"\u00B0"} onChange={(v) => set("windAngle", v)} />
      <Slider label="Temperature" value={temperature} min={-20} max={50} step={1} unit={"\u00B0C"} onChange={(v) => set("temperature", v)} />
    </div>
  );
}
