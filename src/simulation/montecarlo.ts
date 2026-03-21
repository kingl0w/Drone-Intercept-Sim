import { runSimulation } from "./engine";
import type { SimulationParams, MonteCarloResult, MonteCarloRunResult } from "../types/simulation";

export function runMonteCarlo(baseParams: SimulationParams, numberOfRuns: number = 200): MonteCarloResult {
  const results: MonteCarloRunResult[] = [];

  for (let i = 0; i < numberOfRuns; i++) {
    const perturbedParams: SimulationParams = {
      ...baseParams,
      windSpeed: Math.max(0, baseParams.windSpeed + (Math.random() - 0.5) * 8),
      windAngle: baseParams.windAngle + (Math.random() - 0.5) * 60,
      detectionDelay: Math.max(0, baseParams.detectionDelay + (Math.random() - 0.5) * 4),
      launchDistance: baseParams.launchDistance * (0.85 + Math.random() * 0.3),
      temperature: baseParams.temperature + (Math.random() - 0.5) * 10,
      seed: i,
    };

    const result = runSimulation(perturbedParams);
    results.push({
      intercepted: result.intercepted,
      time: result.interceptTime,
      energy: result.energyUsedJ / result.batteryJ,
    });
  }

  const successfulRuns = results.filter((r) => r.intercepted);
  const times = successfulRuns
    .map((r) => r.time)
    .filter((t): t is number => t !== null);

  const mean = times.length > 0
    ? times.reduce((sum, t) => sum + t, 0) / times.length
    : null;

  const standardDeviation =
    times.length > 1 && mean !== null
      ? Math.sqrt(
          times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / (times.length - 1)
        )
      : 0;

  return {
    results,
    probability: successfulRuns.length / numberOfRuns,
    mean,
    std: standardDeviation,
    n: numberOfRuns,
  };
}
