import { createContext, useReducer, useMemo, useCallback, useRef, useEffect, useState } from "react";
import { PRESETS, INTERCEPTOR_PRESETS } from "../config/presets";
import { SWEEP_PARAMS } from "../config/sweep";
import { computeCustom, calcTWR, radarRange } from "../utils/calculations";
import { encodeParams, decodeParams } from "../utils/sharing";
import { exportJSON } from "../utils/export";
import { runSimulation } from "../simulation/engine";
import { runSweep } from "../simulation/sweep";
import { runMonteCarlo } from "../simulation/montecarlo";
import type { SimulationState, SimulationAction, SimulationContextValue, HistoryEntry } from "../types/state";
import type { SimulationStep, SimulationResult } from "../types/simulation";
import type { TargetPresetKey, CustomInterceptorParams } from "../types/presets";
import type { ReactNode } from "react";

const initialState: SimulationState = {
  targetKey: "shahed136",
  interceptorKey: "racing5",
  customInterceptor: {
    frameType: "quad",
    mass: 500,
    thrust: 3000,
    propSize: 5,
    batteryCap: 1300,
    cells: 6,
    maxPower: 500,
  },
  launchDistance: 800,
  launchAngle: 45,
  detectionDelay: 5,
  targetAltitude: 100,
  evasion: "none",
  windSpeed: 0,
  windAngle: 180,
  temperature: 15,
  useRadarModel: false,
  radarClass: "medium",
  compareMode: false,
  compareKey: "heavy7",
  compareCustomInterceptor: {
    frameType: "quad",
    mass: 500,
    thrust: 3000,
    propSize: 5,
    batteryCap: 1300,
    cells: 6,
    maxPower: 500,
  },
  swarmMode: false,
  swarmCount: 3,
  swarmStagger: 2,
  swarmSpread: 15,
  playbackSpeed: 1,
  result: null,
  compareResult: null,
  swarmResults: [],
  sweepKey: "launchDistance",
  sweepResults: null,
  mcResults: null,
  runHistory: [],
  animFrame: 0,
  running: false,
  stepsVersion: 0,
};

function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };

    case "SET_MULTIPLE":
      return { ...state, ...action.fields };

    case "UPDATE_CUSTOM_INTERCEPTOR":
      return {
        ...state,
        customInterceptor: {
          ...state.customInterceptor,
          [action.field]: action.value,
        },
      };

    case "UPDATE_COMPARE_CUSTOM_INTERCEPTOR":
      return {
        ...state,
        compareCustomInterceptor: {
          ...state.compareCustomInterceptor,
          [action.field]: action.value,
        },
      };

    case "ADD_TO_HISTORY":
      return {
        ...state,
        runHistory: [...state.runHistory, action.entry],
      };

    case "SET_RESULTS":
      return {
        ...state,
        result: action.result,
        compareResult: action.compareResult,
        swarmResults: action.swarmResults,
        animFrame: 0,
        running: true,
        stepsVersion: state.stepsVersion + 1,
      };

    case "RESET":
      return { ...action.initialState };

    default:
      return state;
  }
}

export const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasBgRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const stepsRef = useRef<SimulationStep[]>([]);
  const compareStepsRef = useRef<SimulationStep[]>([]);
  const swarmStepsRef = useRef<SimulationStep[][]>([]);
  const previewStepsRef = useRef<SimulationStep[]>([]);
  const previewResultRef = useRef<SimulationResult | null>(null);

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });

  const target = PRESETS[state.targetKey];

  const interceptor =
    state.interceptorKey === "custom"
      ? computeCustom(state.customInterceptor)
      : INTERCEPTOR_PRESETS[state.interceptorKey];

  const twr = calcTWR(interceptor.thrust, interceptor.mass).toFixed(2);
  const speedMargin = interceptor.topSpeed - target.speed;
  const killRadius = 2 + interceptor.payload / 50;
  const batteryWh = (
    (interceptor.cells * 3.7 * interceptor.battery) / 1000
  ).toFixed(0);

  const detectionRange = useMemo(
    () => radarRange(target.rcs, state.radarClass),
    [target.rcs, state.radarClass]
  );

  const compareInterceptor =
    state.compareKey === "custom"
      ? computeCustom(state.compareCustomInterceptor)
      : INTERCEPTOR_PRESETS[state.compareKey];

  const simParams = useMemo(
    () => ({
      target,
      interceptor,
      launchDistance: state.launchDistance,
      launchAngle: state.launchAngle,
      detectionDelay: state.detectionDelay,
      targetAltitude: state.targetAltitude,
      windSpeed: state.windSpeed,
      windAngle: state.windAngle,
      temperature: state.temperature,
      evasion: state.evasion,
    }),
    [
      target,
      interceptor,
      state.launchDistance,
      state.launchAngle,
      state.detectionDelay,
      state.targetAltitude,
      state.windSpeed,
      state.windAngle,
      state.temperature,
      state.evasion,
    ]
  );

  //debounced preview
  const previewVersionRef = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = runSimulation(simParams);
      previewStepsRef.current = result.steps;
      previewResultRef.current = result;
      //increment to trigger viewport recalc
      previewVersionRef.current += 1;
      dispatch({ type: "SET", field: "stepsVersion", value: previewVersionRef.current });
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simParams]);

  useEffect(() => {
    dispatch({
      type: "SET",
      field: "targetAltitude",
      value: PRESETS[state.targetKey].altitude,
    });
  }, [state.targetKey]);

  useEffect(() => {
    if (!state.useRadarModel) return;

    if (state.launchDistance <= detectionRange) {
      dispatch({ type: "SET", field: "detectionDelay", value: 1 });
    } else {
      const computedDelay = Math.min(
        30,
        Math.round(
          ((state.launchDistance - detectionRange) / Math.max(target.speed, 1)) * 2
        ) / 2
      );
      dispatch({ type: "SET", field: "detectionDelay", value: computedDelay });
    }
  }, [state.useRadarModel, detectionRange, state.launchDistance, target.speed]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const params = decodeParams(hash);
    if (!params) return;

    const fields: Partial<SimulationState> = {};
    if (params.t && PRESETS[params.t as TargetPresetKey]) fields.targetKey = params.t as TargetPresetKey;
    if (params.i) fields.interceptorKey = params.i as SimulationState["interceptorKey"];
    if (params.ld) fields.launchDistance = params.ld;
    if (params.la) fields.launchAngle = params.la;
    if (params.dd) fields.detectionDelay = params.dd;
    if (params.ta) fields.targetAltitude = params.ta;
    if (params.ws !== undefined) fields.windSpeed = params.ws;
    if (params.wa !== undefined) fields.windAngle = params.wa;
    if (params.tp !== undefined) fields.temperature = params.tp;
    if (params.ev) fields.evasion = params.ev;
    if (params.ci) fields.customInterceptor = params.ci;
    if (params.rm) fields.useRadarModel = true;
    if (params.cm) {
      fields.compareMode = true;
      if (params.ck) fields.compareKey = params.ck as SimulationState["compareKey"];
    }

    dispatch({ type: "SET_MULTIPLE", fields });
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          w: Math.floor(entry.contentRect.width),
          h: Math.floor(entry.contentRect.height),
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const set = useCallback((field: string, value: unknown) => {
    dispatch({ type: "SET", field, value });
  }, []);

  const updateCustomInterceptor = useCallback((field: keyof CustomInterceptorParams, value: number) => {
    dispatch({ type: "UPDATE_CUSTOM_INTERCEPTOR", field, value });
  }, []);

  const updateCompareCustomInterceptor = useCallback((field: keyof CustomInterceptorParams, value: number) => {
    dispatch({ type: "UPDATE_COMPARE_CUSTOM_INTERCEPTOR", field, value });
  }, []);

  const reset = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
    }
    stepsRef.current = [];
    compareStepsRef.current = [];
    swarmStepsRef.current = [];
    dispatch({ type: "RESET", initialState });
  }, []);

  const simulate = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
    }

    const result = runSimulation(simParams);
    stepsRef.current = result.steps;

    const entry: HistoryEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      params: {
        target: simParams.target.name,
        interceptor: simParams.interceptor.name,
        launchDistance: state.launchDistance,
        launchAngle: state.launchAngle,
        detectionDelay: state.detectionDelay,
        targetAltitude: state.targetAltitude,
        windSpeed: state.windSpeed,
        windAngle: state.windAngle,
        temperature: state.temperature,
        evasion: state.evasion,
      },
      result: {
        intercepted: result.intercepted,
        interceptTime: result.interceptTime,
        closureSpeed: result.closureSpeed,
        maxG: result.maxG,
        peakSpeed: result.peakSpeed,
        energyUsedPct: result.batteryJ
          ? (result.energyUsedJ / result.batteryJ) * 100
          : 0,
      },
      steps: result.steps,
    };

    let compareResult = null;
    if (state.compareMode && compareInterceptor) {
      const compareRes = runSimulation({
        ...simParams,
        interceptor: compareInterceptor,
      });
      compareStepsRef.current = compareRes.steps;
      compareResult = compareRes;

      entry.compare = {
        interceptor: compareInterceptor.name,
        result: {
          intercepted: compareRes.intercepted,
          interceptTime: compareRes.interceptTime,
          closureSpeed: compareRes.closureSpeed,
          maxG: compareRes.maxG,
          peakSpeed: compareRes.peakSpeed,
          energyUsedPct: compareRes.batteryJ
            ? (compareRes.energyUsedJ / compareRes.batteryJ) * 100
            : 0,
        },
        steps: compareRes.steps,
      };
    } else {
      compareStepsRef.current = [];
    }

    let swarmResults: SimulationResult[] = [];
    if (state.swarmMode && state.swarmCount > 1) {
      const swarmSteps: SimulationStep[][] = [];
      for (let i = 0; i < state.swarmCount; i++) {
        const angleOffset = (i - (state.swarmCount - 1) / 2) * state.swarmSpread;
        const delayOffset = i * state.swarmStagger;
        const swarmRes = runSimulation({
          ...simParams,
          launchAngle: state.launchAngle + angleOffset,
          detectionDelay: state.detectionDelay + delayOffset,
          seed: i + 1,
        });
        swarmResults.push(swarmRes);
        swarmSteps.push(swarmRes.steps);
      }
      swarmStepsRef.current = swarmSteps;

      entry.swarm = swarmResults.map((r, i) => ({
        droneIndex: i,
        intercepted: r.intercepted,
        interceptTime: r.interceptTime,
        maxG: r.maxG,
      }));
    } else {
      swarmStepsRef.current = [];
    }

    dispatch({ type: "SET_RESULTS", result, compareResult, swarmResults });
    dispatch({ type: "ADD_TO_HISTORY", entry });
  }, [
    simParams,
    state.compareMode,
    compareInterceptor,
    state.swarmMode,
    state.swarmCount,
    state.swarmStagger,
    state.swarmSpread,
    state.launchDistance,
    state.launchAngle,
    state.detectionDelay,
    state.targetAltitude,
    state.windSpeed,
    state.windAngle,
    state.temperature,
    state.evasion,
    state.result,
  ]);

  const doSweep = useCallback(() => {
    const results = runSweep(simParams, state.sweepKey, SWEEP_PARAMS);
    dispatch({ type: "SET", field: "sweepResults", value: results });
  }, [simParams, state.sweepKey]);

  const doMonteCarlo = useCallback(() => {
    const results = runMonteCarlo(simParams, 200);
    dispatch({ type: "SET", field: "mcResults", value: results });
  }, [simParams]);

  const handleExportJSON = useCallback(
    (mode: string = "current") => {
      exportJSON({
        mode,
        simParams,
        result: state.result,
        runHistory: state.runHistory,
      });
    },
    [simParams, state.result, state.runHistory]
  );

  const [shareCopied, setShareCopied] = useState(false);
  const shareURL = useCallback(() => {
    const hash = encodeParams({
      targetKey: state.targetKey,
      interceptorKey: state.interceptorKey,
      launchDistance: state.launchDistance,
      launchAngle: state.launchAngle,
      detectionDelay: state.detectionDelay,
      targetAltitude: state.targetAltitude,
      windSpeed: state.windSpeed,
      windAngle: state.windAngle,
      temperature: state.temperature,
      evasion: state.evasion,
      customInterceptor: state.customInterceptor,
      useRadarModel: state.useRadarModel,
      compareMode: state.compareMode,
      compareKey: state.compareKey,
    });
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }, [
    state.targetKey,
    state.interceptorKey,
    state.launchDistance,
    state.launchAngle,
    state.detectionDelay,
    state.targetAltitude,
    state.windSpeed,
    state.windAngle,
    state.temperature,
    state.evasion,
    state.customInterceptor,
    state.useRadarModel,
    state.compareMode,
    state.compareKey,
  ]);

  const contextValue = useMemo(
    (): SimulationContextValue => ({
      ...state,
      target,
      interceptor,
      compareInterceptor,
      twr,
      speedMargin,
      killRadius,
      batteryWh,
      detectionRange,
      simParams,
      canvasRef,
      canvasBgRef,
      containerRef,
      animRef,
      stepsRef,
      compareStepsRef,
      swarmStepsRef,
      previewStepsRef,
      previewResultRef,
      canvasSize,
      set,
      updateCustomInterceptor,
      updateCompareCustomInterceptor,
      simulate,
      reset,
      doSweep,
      doMonteCarlo,
      exportJSON: handleExportJSON,
      shareURL,
      shareCopied,
    }),
    [
      state,
      target,
      interceptor,
      compareInterceptor,
      twr,
      speedMargin,
      killRadius,
      batteryWh,
      detectionRange,
      simParams,
      canvasSize,
      set,
      updateCustomInterceptor,
      updateCompareCustomInterceptor,
      simulate,
      reset,
      doSweep,
      doMonteCarlo,
      handleExportJSON,
      shareURL,
      shareCopied,
    ]
  );

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
}
