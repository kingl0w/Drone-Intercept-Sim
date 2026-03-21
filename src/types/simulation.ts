import type { TargetPreset, InterceptorPreset, EvasionMode } from "./presets";

export interface SimulationParams {
  target: TargetPreset;
  interceptor: InterceptorPreset;
  launchDistance: number;
  launchAngle: number;
  detectionDelay: number;
  targetAltitude: number;
  windSpeed: number;
  windAngle: number;
  temperature: number;
  evasion: EvasionMode;
  seed?: number;
}

export interface SimulationStep {
  t: number;
  tx: number;
  ty: number;
  ix: number;
  iy: number;
  launched: boolean;
  dist: number;
  iSpeed: number;
  gLoad: number;
  batteryPct: number;
}

export interface InterceptPoint {
  x: number;
  y: number;
}

export interface SimulationResult {
  steps: SimulationStep[];
  intercepted: boolean;
  interceptTime: number | null;
  interceptPoint: InterceptPoint | null;
  closureSpeed: number;
  killRadius: number;
  maxG: number;
  peakSpeed: number;
  energyUsedJ: number;
  batteryJ: number;
  structuralFailure: boolean;
  structuralFailureTime: number | null;
}

export interface MonteCarloRunResult {
  intercepted: boolean;
  time: number | null;
  energy: number;
}

export interface MonteCarloResult {
  results: MonteCarloRunResult[];
  probability: number;
  mean: number | null;
  std: number;
  n: number;
}

export interface SweepResult {
  value: number;
  intercepted: boolean;
  time: number | null;
  batteryPct: number;
}

export interface SweepParamConfig {
  label: string;
  min: number;
  max: number;
  n: number;
  unit: string;
}

export type SweepParamKey =
  | "launchDistance"
  | "detectionDelay"
  | "targetAltitude"
  | "launchAngle"
  | "windSpeed";

export type SweepParams = Record<SweepParamKey, SweepParamConfig>;

export interface CanvasPoint {
  cx: number;
  cy: number;
}
