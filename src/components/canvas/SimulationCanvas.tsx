import { useEffect, useRef, useCallback, useMemo } from "react";
import { useSimulation } from "../../hooks/useSimulation";
import { colors } from "../../config/theme";
import { SWARM_COLORS } from "../../config/presets";
import { DEG2RAD, TWO_PI, airDensity } from "../../simulation/physics";
import { pill, drawTrail, drawDot, drawPreviewTrail, drawPreviewDot } from "./drawHelpers";
import type { SimulationStep, CanvasPoint } from "../../types/simulation";

export default function SimulationCanvas() {
  const {
    canvasRef,
    canvasBgRef,
    canvasSize,
    stepsRef,
    compareStepsRef,
    swarmStepsRef,
    previewStepsRef,
    previewResultRef,
    animFrame,
    result,
    compareResult,
    compareMode,
    swarmMode,
    swarmResults,
    swarmCount,
    target,
    targetAltitude,
    windSpeed,
    windAngle,
    temperature,
    killRadius,
    running,
    stepsVersion,
  } = useSimulation();

  const dirtyRef = useRef(true);
  const bgDirtyRef = useRef(true);
  const lastDrawnFrameRef = useRef(-1);
  const lastStepsVersionRef = useRef(-1);
  const rafRef = useRef<number | null>(null);

  //viewport transform
  const viewport = useMemo(() => {
    const steps = stepsRef.current;
    const cmpSteps = compareStepsRef.current;
    const swSteps = swarmStepsRef.current;
    const preview = previewStepsRef.current;
    const W = canvasSize.w;
    const H = canvasSize.h;

    //guard against 0-size canvas
    if (W < 1 || H < 1) return null;

    const groundY = H - 40;
    const PADDING = 56;

    //determine steps for bounds
    const hasSteps = steps.length > 0;
    const hasPreview = preview.length > 0;

    let dataSteps: SimulationStep[];
    if (hasSteps) {
      dataSteps = steps;
    } else if (hasPreview) {
      dataSteps = preview;
    } else {
      return null;
    }

    //single-pass bounds
    let rawMinX = Infinity, rawMaxX = -Infinity;
    let rawMinY = Infinity, rawMaxY = -Infinity;

    const updateBounds = (x: number, y: number) => {
      if (x < rawMinX) rawMinX = x;
      if (x > rawMaxX) rawMaxX = x;
      if (y < rawMinY) rawMinY = y;
      if (y > rawMaxY) rawMaxY = y;
    };

    for (let i = 0; i < dataSteps.length; i++) {
      const s = dataSteps[i];
      updateBounds(s.tx, s.ty);
      updateBounds(s.ix, s.iy);
    }
    if (hasSteps) {
      for (let i = 0; i < cmpSteps.length; i++) {
        updateBounds(cmpSteps[i].ix, cmpSteps[i].iy);
      }
      for (let j = 0; j < swSteps.length; j++) {
        const drone = swSteps[j];
        for (let i = 0; i < drone.length; i++) {
          updateBounds(drone[i].ix, drone[i].iy);
        }
      }
    }

    if (!isFinite(rawMinX) || !isFinite(rawMinY)) return null;

    //15% x padding
    const rawRangeX = rawMaxX - rawMinX;
    const marginX = Math.max(rawRangeX * 0.15, 150);

    //pixel regions
    const drawW = W - PADDING * 2;
    const drawH = groundY - 24;

    //x axis: fit with margins
    const rangeX = Math.max(rawRangeX + marginX * 2, 800);
    const dataCenterX = (rawMinX + rawMaxX) / 2;
    const minX = dataCenterX - rangeX / 2;

    //y axis: fit trajectory + target altitude with headroom
    const maxAlt = Math.max(rawMaxY * 1.25 + 30, targetAltitude * 1.3 + 30, 100);

    const toCanvas = (simX: number, simY: number): CanvasPoint => ({
      cx: ((simX - minX) / rangeX) * drawW + PADDING,
      cy: groundY - (simY / maxAlt) * drawH,
    });

    return { minX, rangeX, maxAlt, groundY, PADDING, toCanvas, W, H };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize, stepsVersion, targetAltitude]);

  //mark dirty on state changes
  useEffect(() => {
    dirtyRef.current = true;
  }, [animFrame, result, compareResult, compareMode, swarmMode, swarmResults, swarmCount, target, stepsVersion]);

  useEffect(() => {
    bgDirtyRef.current = true;
    dirtyRef.current = true;
  }, [canvasSize, targetAltitude, windSpeed, windAngle, temperature, viewport]);

  //background (static layer)
  const drawBackground = useCallback(() => {
    const canvas = canvasBgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvasSize.w;
    const H = canvasSize.h;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = colors.bgCanvas;
    ctx.fillRect(0, 0, W, H);

    //grid
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const groundY = H - 40;

    //ground line
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();
    ctx.setLineDash([]);
    pill(ctx, "GND", 4, groundY - 6, "rgba(0,0,0,0.5)", "bold 10px JetBrains Mono,monospace");

    //altitude markers
    if (viewport) {
      const { maxAlt, toCanvas, PADDING } = viewport;
      const altitudeStep = maxAlt > 600 ? 200 : 100;
      for (let alt = altitudeStep; alt <= maxAlt; alt += altitudeStep) {
        const { cy } = toCanvas(0, alt);
        if (cy < 18 || cy > groundY - 14) continue;

        ctx.strokeStyle = "rgba(0,0,0,0.06)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 10]);
        ctx.beginPath();
        ctx.moveTo(PADDING, cy);
        ctx.lineTo(W - 10, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        pill(ctx, `${alt}m`, 4, cy + 4, "rgba(0,0,0,0.5)", "10px JetBrains Mono,monospace");
      }

      //scale bar
      const { minX, rangeX } = viewport;
      const scaleLength = rangeX > 4000 ? 1000 : 500;
      const scaleStart = toCanvas(minX + 200, 0);
      const scaleEnd = toCanvas(minX + 200 + scaleLength, 0);
      const scaleY = groundY + 16;

      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(scaleStart.cx, scaleY);
      ctx.lineTo(scaleEnd.cx, scaleY);
      ctx.stroke();
      pill(
        ctx,
        `${scaleLength}m`,
        (scaleStart.cx + scaleEnd.cx) / 2,
        scaleY + 12,
        "rgba(0,0,0,0.5)",
        "10px JetBrains Mono,monospace",
        "center"
      );
    }

    //wind indicator
    {
      const windCenterX = W - 70;
      const windCenterY = 56;

      ctx.beginPath();
      ctx.arc(windCenterX, windCenterY, 22, 0, TWO_PI);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
      pill(ctx, "WIND", windCenterX, windCenterY - 28, "rgba(0,0,0,0.5)", "bold 10px JetBrains Mono,monospace", "center");

      if (windSpeed > 0) {
        const windRad = windAngle * DEG2RAD;
        const arrowLength = 18;
        const arrowEndX = Math.cos(windRad) * arrowLength;
        const arrowEndY = -Math.sin(windRad) * arrowLength;

        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(windCenterX, windCenterY);
        ctx.lineTo(windCenterX + arrowEndX, windCenterY + arrowEndY);
        ctx.stroke();

        const arrowAngle = Math.atan2(arrowEndY, arrowEndX);
        ctx.beginPath();
        ctx.moveTo(windCenterX + arrowEndX, windCenterY + arrowEndY);
        ctx.lineTo(
          windCenterX + arrowEndX - 7 * Math.cos(arrowAngle - 0.45),
          windCenterY + arrowEndY - 7 * Math.sin(arrowAngle - 0.45)
        );
        ctx.moveTo(windCenterX + arrowEndX, windCenterY + arrowEndY);
        ctx.lineTo(
          windCenterX + arrowEndX - 7 * Math.cos(arrowAngle + 0.45),
          windCenterY + arrowEndY - 7 * Math.sin(arrowAngle + 0.45)
        );
        ctx.stroke();

        pill(ctx, `${windSpeed} m/s`, windCenterX, windCenterY + 36, "#1a1a1a", "bold 11px JetBrains Mono,monospace", "center");
      } else {
        pill(ctx, "CALM", windCenterX, windCenterY + 4, "rgba(0,0,0,0.5)", "bold 11px JetBrains Mono,monospace", "center");
      }
    }

    bgDirtyRef.current = false;
  }, [canvasSize, canvasBgRef, viewport, windSpeed, windAngle]);

  //dynamic layer
  const drawDynamic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvasSize.w;
    const H = canvasSize.h;
    ctx.clearRect(0, 0, W, H);

    const steps = stepsRef.current;
    const cmpSteps = compareStepsRef.current;
    const swSteps = swarmStepsRef.current;
    const preview = previewStepsRef.current;
    const previewResult = previewResultRef.current;

    const hasSteps = steps.length > 0;

    //loading hint
    if (!hasSteps && preview.length === 0) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.font = "13px 'Space Grotesk',sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Computing preview\u2026", W / 2, H / 2);
      ctx.textAlign = "left";
      return;
    }

    if (!viewport) return;
    const { toCanvas } = viewport;

    //preview mode
    if (!hasSteps && preview.length > 0) {
      drawPreviewTrail(ctx, preview, (s: SimulationStep) => toCanvas(s.tx, s.ty), target.color);
      drawPreviewTrail(ctx, preview, (s: SimulationStep) => toCanvas(s.ix, s.iy), colors.accent);

      const lastStep = preview[preview.length - 1];
      const targetPos = toCanvas(lastStep.tx, lastStep.ty);
      const interceptorPos = toCanvas(lastStep.ix, lastStep.iy);

      drawPreviewDot(ctx, targetPos.cx, targetPos.cy, 6, target.color);
      drawPreviewDot(ctx, interceptorPos.cx, interceptorPos.cy, 6, colors.accent);

      //preview intercept marker
      if (previewResult?.intercepted && previewResult.interceptPoint) {
        const iPt = toCanvas(previewResult.interceptPoint.x, previewResult.interceptPoint.y);
        ctx.globalAlpha = 0.35;
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = colors.success;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(iPt.cx, iPt.cy, 14, 0, TWO_PI);
        ctx.stroke();
        ctx.setLineDash([]);
        //center dot
        ctx.beginPath();
        ctx.arc(iPt.cx, iPt.cy, 3, 0, TWO_PI);
        ctx.fillStyle = colors.success;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      //preview hud
      if (previewResult) {
        const hudLine1 = previewResult.intercepted
          ? `Intercept at T+${previewResult.interceptTime?.toFixed(1)}s`
          : "No intercept with current settings";
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.font = "bold 14px JetBrains Mono,monospace";
        ctx.textAlign = "center";
        ctx.fillText(hudLine1, W / 2, H / 2 - 8);
        //guidance for first-time users
        if (!result) {
          ctx.font = "12px 'Space Grotesk',sans-serif";
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fillText("Drag any slider to see changes \u2014 hit Run for animated playback", W / 2, H / 2 + 12);
        }
        ctx.textAlign = "left";
      }

      //legend
      drawLegend(ctx, W, H, false, false, 0);
      return;
    }

    //normal rendering
    const currentStep = steps[Math.min(animFrame, steps.length - 1)];

    drawTrail(ctx, steps, animFrame, (s: SimulationStep) => toCanvas(s.tx, s.ty), target.color);
    drawTrail(ctx, steps, animFrame, (s: SimulationStep) => toCanvas(s.ix, s.iy), colors.accent);

    const targetPos = toCanvas(currentStep.tx, currentStep.ty);
    const interceptorPos = toCanvas(currentStep.ix, currentStep.iy);

    //sight line
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    ctx.moveTo(targetPos.cx, targetPos.cy);
    ctx.lineTo(interceptorPos.cx, interceptorPos.cy);
    ctx.stroke();
    ctx.setLineDash([]);

    pill(
      ctx,
      `${Math.round(currentStep.dist)}m`,
      (targetPos.cx + interceptorPos.cx) / 2,
      (targetPos.cy + interceptorPos.cy) / 2 - 14,
      "#1a1a1a",
      "bold 12px JetBrains Mono,monospace",
      "center"
    );

    drawDot(ctx, targetPos.cx, targetPos.cy, 8, target.color);
    //target labels above
    pill(ctx, target.name.toUpperCase(), targetPos.cx + 14, targetPos.cy - 18, target.color, "bold 12px JetBrains Mono,monospace");
    pill(ctx, `${target.speed} m/s`, targetPos.cx + 14, targetPos.cy - 4, target.color, "11px JetBrains Mono,monospace");

    drawDot(ctx, interceptorPos.cx, interceptorPos.cy, 7, colors.accent);
    //flip labels below when close to target
    const tooClose = Math.abs(targetPos.cy - interceptorPos.cy) < 50;
    const iLabelY1 = tooClose ? interceptorPos.cy + 18 : interceptorPos.cy - 18;
    const iLabelY2 = tooClose ? interceptorPos.cy + 32 : interceptorPos.cy - 4;
    pill(
      ctx,
      compareMode ? "INTERCEPTOR A" : "INTERCEPTOR",
      interceptorPos.cx + 12,
      iLabelY1,
      colors.accent,
      "bold 12px JetBrains Mono,monospace"
    );
    pill(
      ctx,
      `${Math.round(currentStep.iSpeed || 0)} m/s`,
      interceptorPos.cx + 12,
      iLabelY2,
      colors.accent,
      "11px JetBrains Mono,monospace"
    );

    //compare mode
    if (cmpSteps.length && compareMode) {
      const compareColor = "#c084fc";

      drawTrail(ctx, cmpSteps, animFrame, (s: SimulationStep) => toCanvas(s.ix, s.iy), compareColor);

      const currentCompareStep = cmpSteps[Math.min(animFrame, cmpSteps.length - 1)];
      const comparePos = toCanvas(currentCompareStep.ix, currentCompareStep.iy);

      ctx.strokeStyle = "rgba(192,132,252,0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 9]);
      ctx.beginPath();
      ctx.moveTo(targetPos.cx, targetPos.cy);
      ctx.lineTo(comparePos.cx, comparePos.cy);
      ctx.stroke();
      ctx.setLineDash([]);

      drawDot(ctx, comparePos.cx, comparePos.cy, 7, compareColor);
      pill(ctx, "INTERCEPTOR B", comparePos.cx + 12, comparePos.cy + 14, compareColor, "bold 12px JetBrains Mono,monospace");
      pill(ctx, `${Math.round(currentCompareStep.iSpeed || 0)} m/s`, comparePos.cx + 12, comparePos.cy + 26, compareColor, "11px JetBrains Mono,monospace");

      if (compareResult?.intercepted && compareResult.interceptPoint && animFrame >= cmpSteps.length - 1) {
        const interceptPos2 = toCanvas(compareResult.interceptPoint.x, compareResult.interceptPoint.y);

        ctx.beginPath();
        ctx.arc(interceptPos2.cx, interceptPos2.cy, 22, 0, TWO_PI);
        ctx.fillStyle = "rgba(192,132,252,0.12)";
        ctx.fill();
        ctx.strokeStyle = compareColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        pill(ctx, "INTERCEPT B", interceptPos2.cx, interceptPos2.cy - 50, compareColor, "bold 12px JetBrains Mono,monospace", "center");
        pill(ctx, `T+${compareResult.interceptTime?.toFixed(1)}s`, interceptPos2.cx, interceptPos2.cy - 32, "#1a1a1a", "11px JetBrains Mono,monospace", "center");
      }
    }

    //swarm mode
    if (swSteps.length && swarmMode) {
      swSteps.forEach((swarmDroneSteps, droneIndex) => {
        if (!swarmDroneSteps.length) return;

        const swarmColor = SWARM_COLORS[droneIndex % SWARM_COLORS.length];

        ctx.strokeStyle = swarmColor + "70";
        ctx.lineWidth = 2;
        ctx.beginPath();
        swarmDroneSteps.slice(0, animFrame + 1).forEach((step, i) => {
          const point = toCanvas(step.ix, step.iy);
          if (i === 0) {
            ctx.moveTo(point.cx, point.cy);
          } else {
            ctx.lineTo(point.cx, point.cy);
          }
        });
        ctx.stroke();

        const currentSwarmStep = swarmDroneSteps[Math.min(animFrame, swarmDroneSteps.length - 1)];
        const swarmPos = toCanvas(currentSwarmStep.ix, currentSwarmStep.iy);

        ctx.beginPath();
        ctx.arc(swarmPos.cx, swarmPos.cy, 5, 0, TWO_PI);
        ctx.fillStyle = swarmColor;
        ctx.fill();

        pill(ctx, `S${droneIndex + 1}`, swarmPos.cx + 8, swarmPos.cy - 4, swarmColor, "bold 12px JetBrains Mono,monospace");
        pill(ctx, `${Math.round(currentSwarmStep.iSpeed || 0)}m/s`, swarmPos.cx + 8, swarmPos.cy + 9, "rgba(0,0,0,0.6)", "11px JetBrains Mono,monospace");

        const swarmResult = swarmResults[droneIndex];
        if (swarmResult?.intercepted && swarmResult.interceptPoint && animFrame >= swarmDroneSteps.length - 1) {
          const interceptPt = toCanvas(swarmResult.interceptPoint.x, swarmResult.interceptPoint.y);

          ctx.beginPath();
          ctx.arc(interceptPt.cx, interceptPt.cy, 16, 0, TWO_PI);
          ctx.fillStyle = swarmColor + "18";
          ctx.fill();
          ctx.strokeStyle = swarmColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          pill(ctx, `S${droneIndex + 1} T+${swarmResult.interceptTime?.toFixed(1)}s`, interceptPt.cx, interceptPt.cy - 22, swarmColor, "bold 12px JetBrains Mono,monospace", "center");
        }
      });
    }

    //hud
    pill(ctx, `T+${currentStep.t.toFixed(1)}s`, W - 16, 106, "rgba(0,0,0,0.5)", "bold 12px JetBrains Mono,monospace", "right");
    pill(
      ctx,
      `\u03C1 ${airDensity(targetAltitude, temperature).toFixed(3)} kg/m\u00B3 | ${temperature}\u00B0C`,
      W - 16,
      120,
      "rgba(0,0,0,0.4)",
      "11px JetBrains Mono,monospace",
      "right"
    );

    if (currentStep.batteryPct !== undefined) {
      const batteryColor =
        currentStep.batteryPct > 30
          ? "rgba(22,163,74,0.9)"
          : currentStep.batteryPct > 10
            ? "rgba(217,119,6,0.9)"
            : "rgba(220,38,38,0.9)";
      pill(ctx, `BAT ${Math.round(currentStep.batteryPct)}%`, W - 16, 134, batteryColor, "bold 11px JetBrains Mono,monospace", "right");
    }

    //structural failure marker
    if (result?.structuralFailure && result.structuralFailureTime !== null && animFrame >= steps.length - 1) {
      //closest step to failure
      const failStep = steps.reduce((best, s) =>
        Math.abs(s.t - result.structuralFailureTime!) < Math.abs(best.t - result.structuralFailureTime!) ? s : best
      );
      const failPt = toCanvas(failStep.ix, failStep.iy);

      ctx.beginPath();
      ctx.arc(failPt.cx, failPt.cy, 22, 0, TWO_PI);
      ctx.fillStyle = "rgba(220,38,38,0.12)";
      ctx.fill();
      ctx.strokeStyle = colors.danger;
      ctx.lineWidth = 2;
      ctx.stroke();

      //x mark
      const xSize = 8;
      ctx.strokeStyle = colors.danger;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(failPt.cx - xSize, failPt.cy - xSize);
      ctx.lineTo(failPt.cx + xSize, failPt.cy + xSize);
      ctx.moveTo(failPt.cx + xSize, failPt.cy - xSize);
      ctx.lineTo(failPt.cx - xSize, failPt.cy + xSize);
      ctx.stroke();

      pill(ctx, "STRUCTURAL FAILURE", failPt.cx, failPt.cy - 40, colors.danger, "bold 12px JetBrains Mono,monospace", "center");
      pill(ctx, `T+${result.structuralFailureTime.toFixed(1)}s | ${result.maxG.toFixed(1)}G`, failPt.cx, failPt.cy - 24, "#1a1a1a", "11px JetBrains Mono,monospace", "center");
    }

    //intercept marker
    if (result?.intercepted && result.interceptPoint && animFrame >= steps.length - 1) {
      const interceptPt = toCanvas(result.interceptPoint.x, result.interceptPoint.y);

      ctx.beginPath();
      ctx.arc(interceptPt.cx, interceptPt.cy, 26, 0, TWO_PI);
      ctx.fillStyle = "rgba(217,119,6,0.12)";
      ctx.fill();
      ctx.strokeStyle = colors.warn;
      ctx.lineWidth = 2;
      ctx.stroke();

      pill(ctx, "INTERCEPT", interceptPt.cx, interceptPt.cy - 50, colors.success, "bold 12px JetBrains Mono,monospace", "center");
      pill(
        ctx,
        `T+${result.interceptTime?.toFixed(1)}s | ${Math.round(result.closureSpeed)} m/s`,
        interceptPt.cx,
        interceptPt.cy - 32,
        "#1a1a1a",
        "11px JetBrains Mono,monospace",
        "center"
      );
    }

    //legend
    drawLegend(ctx, W, H, compareMode, swarmMode, swarmCount);

    lastDrawnFrameRef.current = animFrame;
    lastStepsVersionRef.current = stepsVersion;
    dirtyRef.current = false;
  }, [canvasSize, canvasRef, stepsRef, compareStepsRef, swarmStepsRef, previewStepsRef, previewResultRef, animFrame, result, compareResult, compareMode, swarmMode, swarmResults, swarmCount, target, targetAltitude, temperature, killRadius, running, viewport, stepsVersion]);

  //raf loop
  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      if (bgDirtyRef.current) drawBackground();
      if (dirtyRef.current) drawDynamic();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [drawBackground, drawDynamic]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasBgRef}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{ display: "block", width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{ display: "block", width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  _W: number,
  H: number,
  compareMode: boolean,
  swarmMode: boolean,
  swarmCount: number,
) {
  const legendX = 16;
  const legendY = H - 16;
  const items: { color: string; label: string }[] = [
    { color: "#ff6b6b", label: "Target" },
    { color: colors.accent, label: compareMode ? "Interceptor A" : "Interceptor" },
  ];
  if (compareMode) {
    items.push({ color: "#c084fc", label: "Interceptor B" });
  }
  if (swarmMode) {
    items.push({ color: colors.success, label: `Swarm (${swarmCount})` });
  }

  ctx.font = "11px JetBrains Mono,monospace";
  const dotRadius = 3;
  const dotGap = 5;
  const itemGap = 24;
  const losLineWidth = 12;

  let totalWidth = 0;
  items.forEach((item, i) => {
    totalWidth +=
      dotRadius * 2 +
      dotGap +
      ctx.measureText(item.label).width +
      (i < items.length ? itemGap : 0);
  });
  totalWidth += losLineWidth + dotGap + ctx.measureText("Sight line").width;

  const bgPadX = 6;
  const bgPadY = 4;
  const bgHeight = 14 + bgPadY * 2;
  const bgCorner = 4;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const bgX = legendX - bgPadX;
  const bgY = legendY - 14 - bgPadY;
  const bgW = totalWidth + bgPadX * 2;

  ctx.beginPath();
  ctx.moveTo(bgX + bgCorner, bgY);
  ctx.lineTo(bgX + bgW - bgCorner, bgY);
  ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + bgCorner);
  ctx.lineTo(bgX + bgW, bgY + bgHeight - bgCorner);
  ctx.quadraticCurveTo(bgX + bgW, bgY + bgHeight, bgX + bgW - bgCorner, bgY + bgHeight);
  ctx.lineTo(bgX + bgCorner, bgY + bgHeight);
  ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - bgCorner);
  ctx.lineTo(bgX, bgY + bgCorner);
  ctx.quadraticCurveTo(bgX, bgY, bgX + bgCorner, bgY);
  ctx.closePath();
  ctx.fill();

  let cursorX = legendX;
  items.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(cursorX + dotRadius, legendY - 7, dotRadius, 0, TWO_PI);
    ctx.fill();
    cursorX += dotRadius * 2 + dotGap;

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "11px JetBrains Mono,monospace";
    ctx.fillText(item.label, cursorX, legendY);
    cursorX += ctx.measureText(item.label).width + itemGap;
  });

  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cursorX, legendY - 6);
  ctx.lineTo(cursorX + losLineWidth, legendY - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  cursorX += losLineWidth + dotGap;

  ctx.fillStyle = "#1a1a1a";
  ctx.font = "11px JetBrains Mono,monospace";
  ctx.fillText("Sight line", cursorX, legendY);
}
