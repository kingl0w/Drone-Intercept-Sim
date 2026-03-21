import { useContext } from "react";
import { SimulationContext } from "../context/SimulationContext";
import type { SimulationContextValue } from "../types/state";

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
