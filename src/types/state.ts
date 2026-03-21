import type { EvasionMode, RadarClass, InterceptorPresetKey, TargetPresetKey, CustomInterceptorParams, TargetPreset, InterceptorPreset } from "./presets";
import type { SimulationResult, SimulationStep, SimulationParams, MonteCarloResult, SweepResult, SweepParamKey } from "./simulation";
import type { MutableRefObject, RefObject } from "react";

export interface SimulationState {
  targetKey: TargetPresetKey;
  interceptorKey: InterceptorPresetKey | "custom";
  customInterceptor: CustomInterceptorParams;
  launchDistance: number;
  launchAngle: number;
  detectionDelay: number;
  targetAltitude: number;
  evasion: EvasionMode;
  windSpeed: number;
  windAngle: number;
  temperature: number;
  useRadarModel: boolean;
  radarClass: RadarClass;
  compareMode: boolean;
  compareKey: InterceptorPresetKey | "custom";
  compareCustomInterceptor: CustomInterceptorParams;
  swarmMode: boolean;
  swarmCount: number;
  swarmStagger: number;
  swarmSpread: number;
  playbackSpeed: number;
  result: SimulationResult | null;
  compareResult: SimulationResult | null;
  swarmResults: SimulationResult[];
  sweepKey: SweepParamKey;
  sweepResults: SweepResult[] | null;
  mcResults: MonteCarloResult | null;
  runHistory: HistoryEntry[];
  animFrame: number;
  running: boolean;
  stepsVersion: number;
}

export interface HistoryEntryParams {
  target: string;
  interceptor: string;
  launchDistance: number;
  launchAngle: number;
  detectionDelay: number;
  targetAltitude: number;
  windSpeed: number;
  windAngle: number;
  temperature: number;
  evasion: EvasionMode;
}

export interface HistoryEntryResult {
  intercepted: boolean;
  interceptTime: number | null;
  closureSpeed: number;
  maxG: number;
  peakSpeed: number;
  energyUsedPct: number;
}

export interface HistoryEntryCompare {
  interceptor: string;
  result: HistoryEntryResult;
  steps: SimulationStep[];
}

export interface HistoryEntrySwarm {
  droneIndex: number;
  intercepted: boolean;
  interceptTime: number | null;
  maxG: number;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  params: HistoryEntryParams;
  result: HistoryEntryResult;
  steps: SimulationStep[];
  compare?: HistoryEntryCompare;
  swarm?: HistoryEntrySwarm[];
}

export type SimulationAction =
  | { type: "SET"; field: string; value: unknown }
  | { type: "SET_MULTIPLE"; fields: Partial<SimulationState> }
  | { type: "UPDATE_CUSTOM_INTERCEPTOR"; field: keyof CustomInterceptorParams; value: number }
  | { type: "UPDATE_COMPARE_CUSTOM_INTERCEPTOR"; field: keyof CustomInterceptorParams; value: number }
  | { type: "ADD_TO_HISTORY"; entry: HistoryEntry }
  | {
      type: "SET_RESULTS";
      result: SimulationResult;
      compareResult: SimulationResult | null;
      swarmResults: SimulationResult[];
    }
  | { type: "RESET"; initialState: SimulationState };

export interface SimulationContextValue extends SimulationState {
  target: TargetPreset;
  interceptor: InterceptorPreset;
  compareInterceptor: InterceptorPreset;
  twr: string;
  speedMargin: number;
  killRadius: number;
  batteryWh: string;
  detectionRange: number;
  simParams: SimulationParams;

  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasBgRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  animRef: MutableRefObject<number | null>;
  stepsRef: MutableRefObject<SimulationStep[]>;
  compareStepsRef: MutableRefObject<SimulationStep[]>;
  swarmStepsRef: MutableRefObject<SimulationStep[][]>;
  previewStepsRef: MutableRefObject<SimulationStep[]>;
  previewResultRef: MutableRefObject<SimulationResult | null>;
  canvasSize: { w: number; h: number };

  set: (field: string, value: unknown) => void;
  updateCustomInterceptor: (field: keyof CustomInterceptorParams, value: number) => void;
  updateCompareCustomInterceptor: (field: keyof CustomInterceptorParams, value: number) => void;
  simulate: () => void;
  reset: () => void;
  doSweep: () => void;
  doMonteCarlo: () => void;
  exportJSON: (mode?: string) => void;
  shareURL: () => void;
  shareCopied: boolean;
}

export type Breakpoint = "desktop" | "tablet" | "mobile";
