import { runSimulation } from "./engine";
import type { SimulationParams, SweepResult, SweepParams, SweepParamKey } from "../types/simulation";

export function runSweep(baseParams: SimulationParams, parameterKey: SweepParamKey, sweepConfig: SweepParams): SweepResult[] {
  const config = sweepConfig[parameterKey];
  const results: SweepResult[] = [];

  for (let i = 0; i <= config.n; i++) {
    const value = config.min + ((config.max - config.min) * i) / config.n;
    const result = runSimulation({ ...baseParams, [parameterKey]: value });

    results.push({
      value,
      intercepted: result.intercepted,
      time: result.interceptTime,
      batteryPct: result.intercepted
        ? Math.max(0, (1 - result.energyUsedJ / result.batteryJ) * 100)
        : 0,
    });
  }

  return results;
}
