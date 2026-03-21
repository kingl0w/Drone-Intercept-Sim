import { useEffect, type MutableRefObject } from "react";
import type { SimulationStep } from "../types/simulation";

interface UseAnimationOptions {
  running: boolean;
  playbackSpeed: number;
  stepsRef: MutableRefObject<SimulationStep[]>;
  animRef: MutableRefObject<number | null>;
  set: (field: string, value: unknown) => void;
}

export function useAnimation({ running, playbackSpeed, stepsRef, animRef, set }: UseAnimationOptions): void {
  useEffect(() => {
    if (!running) return;

    let frame = 0;

    const tick = (): void => {
      frame += playbackSpeed;

      if (frame >= stepsRef.current.length) {
        set("running", false);
        set("animFrame", stepsRef.current.length - 1);
        return;
      }

      set("animFrame", Math.floor(frame));
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [running, playbackSpeed, stepsRef, animRef, set]);
}
