export interface TargetPreset {
  name: string;
  speed: number;
  altitude: number;
  wingspan: number;
  color: string;
  rcs: number;
}

export interface InterceptorPreset {
  name: string;
  mass: number;
  thrust: number;
  topSpeed: number;
  payload: number;
  dragArea: number;
  battery: number;
  cells: number;
  maxPower: number;
  maxTurnRate: number;
  maxGLoad: number;
}

export type EvasionMode = "none" | "jinking" | "sturns" | "dive" | "climb";

export type TargetPresetKey = "shahed136" | "commercial" | "military";
export type InterceptorPresetKey = "micro" | "racing5" | "heavy7" | "fixedwing";

export type RadarClass = "small" | "medium" | "large";

export type FrameType = "quad" | "hex" | "octo" | "fixedwing";

export interface CustomInterceptorParams {
  frameType: FrameType;
  mass: number;
  thrust: number;
  propSize: number;
  batteryCap: number;
  cells: number;
  maxPower: number;
}
