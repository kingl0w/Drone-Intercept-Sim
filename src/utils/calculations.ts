import { G } from "../simulation/physics";
import type { InterceptorPreset, CustomInterceptorParams, RadarClass, FrameType } from "../types/presets";

export function calcTWR(thrustGrams: number, massGrams: number): number {
  return thrustGrams / massGrams;
}

export interface FrameConfig {
  label: string;
  frameWeight: number;
  motorCount: number;
  defaultThrust: number;
  defaultPropSize: number;
  defaultBattery: number;
  defaultCells: number;
  defaultMaxPower: number;
  dragMultiplier: number;
  maxTurnRate: number;
  maxGLoad: number;
}

export const FRAME_CONFIGS: Record<FrameType, FrameConfig> = {
  quad: {
    label: "Quad",
    frameWeight: 80,
    motorCount: 4,
    defaultThrust: 3000,
    defaultPropSize: 5,
    defaultBattery: 1300,
    defaultCells: 6,
    defaultMaxPower: 500,
    dragMultiplier: 1.0,
    maxTurnRate: 540,
    maxGLoad: 8,
  },
  hex: {
    label: "Hex",
    frameWeight: 140,
    motorCount: 6,
    defaultThrust: 5000,
    defaultPropSize: 5,
    defaultBattery: 2200,
    defaultCells: 6,
    defaultMaxPower: 800,
    dragMultiplier: 1.3,
    maxTurnRate: 400,
    maxGLoad: 6,
  },
  octo: {
    label: "Octo",
    frameWeight: 220,
    motorCount: 8,
    defaultThrust: 7000,
    defaultPropSize: 5,
    defaultBattery: 4000,
    defaultCells: 6,
    defaultMaxPower: 1200,
    dragMultiplier: 1.6,
    maxTurnRate: 300,
    maxGLoad: 5,
  },
  fixedwing: {
    label: "Fixed Wing",
    frameWeight: 250,
    motorCount: 1,
    defaultThrust: 2000,
    defaultPropSize: 8,
    defaultBattery: 5000,
    defaultCells: 4,
    defaultMaxPower: 200,
    dragMultiplier: 0.5,
    maxTurnRate: 120,
    maxGLoad: 4,
  },
};

//compute minimum mass from components
export function computeMinMass(params: CustomInterceptorParams): number {
  const config = FRAME_CONFIGS[params.frameType];
  //battery: ~0.03g per mAh per cell
  const batteryWeight = params.batteryCap * params.cells * 0.03;
  //motors: ~0.07g per gram thrust
  const thrustPerMotor = params.thrust / config.motorCount;
  const motorWeight = thrustPerMotor * 0.07 * config.motorCount;
  //escs scale with power
  const escWeight = (params.maxPower / config.motorCount) * 0.15 * config.motorCount;

  return Math.round(config.frameWeight + batteryWeight + motorWeight + escWeight);
}

export function computeCustom({
  frameType,
  mass,
  thrust,
  propSize,
  batteryCap,
  cells,
  maxPower,
}: CustomInterceptorParams): InterceptorPreset {
  const config = FRAME_CONFIGS[frameType];
  const dragArea = 0.00015 * propSize * propSize * config.dragMultiplier;
  const thrustNewtons = (thrust / 1000) * G;
  const seaLevelDensity = 1.225;
  //top speed from thrust-drag equilibrium
  const topSpeed = Math.min(
    80,
    Math.sqrt((2 * thrustNewtons) / (seaLevelDensity * dragArea)) * 0.6
  );

  return {
    name: "Custom Build",
    mass,
    thrust,
    topSpeed: Math.round(topSpeed),
    payload: Math.round(mass * 0.15),
    dragArea: Math.round(dragArea * 100000) / 100000,
    battery: batteryCap,
    cells,
    maxPower,
    maxTurnRate: config.maxTurnRate,
    maxGLoad: config.maxGLoad,
  };
}

//simplified fourth-root radar range equation
export function radarRange(rcs: number, radarClass: RadarClass = "medium"): number {
  const radarConstant =
    radarClass === "small" ? 1800 : radarClass === "medium" ? 3000 : 5000;

  return radarConstant * Math.pow(Math.max(rcs, 0.001), 0.25);
}
