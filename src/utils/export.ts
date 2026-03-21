import type { SimulationParams, SimulationResult } from "../types/simulation";
import type { HistoryEntry } from "../types/state";

interface ExportOptions {
  mode?: string;
  simParams: SimulationParams;
  result: SimulationResult | null;
  runHistory: HistoryEntry[];
}

export function exportJSON({ mode = "current", simParams, result, runHistory }: ExportOptions): void {
  let data: Record<string, unknown>;
  let filename: string;

  if (mode === "history") {
    data = {
      type: "run_history",
      runs: runHistory,
      exportedAt: new Date().toISOString(),
    };
    filename = `intercept-history-${Date.now()}.json`;
  } else {
    const latest = runHistory[runHistory.length - 1];
    data = {
      type: "single_run",
      ...(latest || { params: simParams, result }),
      exportedAt: new Date().toISOString(),
    };
    filename = `intercept-run-${Date.now()}.json`;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
