import { useState, useEffect } from "react";
import type { Breakpoint } from "../types/state";

export function useBreakpoint(): Breakpoint {
  const getBreakpoint = (): Breakpoint => {
    const w = window.innerWidth;
    if (w >= 1200) return "desktop";
    if (w >= 768) return "tablet";
    return "mobile";
  };

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    const onResize = (): void => setBreakpoint(getBreakpoint());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return breakpoint;
}
