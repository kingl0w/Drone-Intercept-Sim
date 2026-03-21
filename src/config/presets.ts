import type {
  TargetPreset,
  InterceptorPreset,
  TargetPresetKey,
  InterceptorPresetKey,
  EvasionMode,
} from "../types/presets";

export const PRESETS: Record<TargetPresetKey, TargetPreset> = {
  shahed136: {
    name: "Shahed-136",
    speed: 51,
    altitude: 100,
    wingspan: 2.5,
    color: "#ff4400",
    rcs: 0.5,
  },
  commercial: {
    name: "DJI Phantom",
    speed: 16,
    altitude: 50,
    wingspan: 0.35,
    color: "#6366f1",
    rcs: 0.01,
  },
  military: {
    name: "Military UAV",
    speed: 100,
    altitude: 300,
    wingspan: 1.2,
    color: "#c084fc",
    rcs: 0.1,
  },
};

export const INTERCEPTOR_PRESETS: Record<InterceptorPresetKey, InterceptorPreset> = {
  micro: {
    name: 'Micro 3"',
    mass: 175,
    thrust: 720,
    topSpeed: 25,
    payload: 50,
    dragArea: 0.0015,
    battery: 550,
    cells: 4,
    maxPower: 80,
    maxTurnRate: 720,
    maxGLoad: 10,
  },
  racing5: {
    name: '5" Racing',
    mass: 440,
    thrust: 3800,
    topSpeed: 45,
    payload: 150,
    dragArea: 0.004,
    battery: 1300,
    cells: 6,
    maxPower: 600,
    maxTurnRate: 540,
    maxGLoad: 8,
  },
  heavy7: {
    name: '7" Heavy',
    mass: 800,
    thrust: 5600,
    topSpeed: 38,
    payload: 300,
    dragArea: 0.008,
    battery: 2200,
    cells: 6,
    maxPower: 900,
    maxTurnRate: 360,
    maxGLoad: 6,
  },
  fixedwing: {
    name: "Fixed Wing",
    mass: 1200,
    thrust: 2000,
    topSpeed: 70,
    payload: 400,
    dragArea: 0.003,
    battery: 5000,
    cells: 4,
    maxPower: 200,
    maxTurnRate: 120,
    maxGLoad: 4,
  },
};

export const EVASION_MODES: Record<EvasionMode, string> = {
  none: "None",
  jinking: "Random Jinking",
  sturns: "S-Turns",
  dive: "Dive",
  climb: "Climb",
};

export const SWARM_COLORS: string[] = [
  "#22c55e",
  "#6366f1",
  "#06b6d4",
  "#f43f5e",
  "#c084fc",
];
