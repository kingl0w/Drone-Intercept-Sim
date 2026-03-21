import type { SweepParams } from "../types/simulation";

export const SWEEP_PARAMS: SweepParams = {
  launchDistance: {
    label: "Launch Distance",
    min: 100,
    max: 5000,
    n: 40,
    unit: "m",
  },
  detectionDelay: {
    label: "Detection Delay",
    min: 0,
    max: 30,
    n: 30,
    unit: "s",
  },
  targetAltitude: {
    label: "Target Altitude",
    min: 10,
    max: 500,
    n: 30,
    unit: "m",
  },
  launchAngle: {
    label: "Launch Angle",
    min: 5,
    max: 85,
    n: 16,
    unit: "\u00B0",
  },
  windSpeed: {
    label: "Wind Speed",
    min: 0,
    max: 20,
    n: 20,
    unit: "m/s",
  },
};
