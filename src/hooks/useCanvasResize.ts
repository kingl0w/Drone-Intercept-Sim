import { useState, useEffect, useRef } from "react";

export function useCanvasResize(initialWidth = 600) {
  const ref = useRef<HTMLDivElement>(null);
  const cRef = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(initialWidth);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.floor(e.contentRect.width));
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return { ref, cRef, w };
}
