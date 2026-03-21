import { useState, useRef, useCallback } from "react";

interface UseResizablePanelReturn {
  size: number;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function useResizablePanel(
  initialSize: number,
  minS: number,
  maxS: number,
  axis: "x" | "y" = "y"
): UseResizablePanelReturn {
  const [size, setSize] = useState(initialSize);
  const dragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startPos.current = axis === "y" ? e.clientY : e.clientX;
    startSize.current = size;
    document.body.style.cursor = axis === "y" ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (e: MouseEvent): void => {
      if (!dragging.current) return;
      const pos = axis === "y" ? e.clientY : e.clientX;
      const delta = axis === "y" ? startPos.current - pos : pos - startPos.current;
      setSize(Math.max(minS, Math.min(maxS, startSize.current + delta)));
    };
    const onMouseUp = (): void => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [size, minS, maxS, axis]);

  return { size, onMouseDown };
}
