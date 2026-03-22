import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SimulationProvider } from "./context/SimulationContext";
import { useSimulation } from "./hooks/useSimulation";
import { useAnimation } from "./hooks/useAnimation";
import { useResizablePanel } from "./hooks/useResizablePanel";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { colors } from "./config/theme";
import TopBar from "./components/TopBar";
import Sidebar from "./components/sidebar/Sidebar";
import SimulationCanvas from "./components/canvas/SimulationCanvas";
import AnalysisPanel from "./components/panels/AnalysisPanel";
import OverlayPanel from "./components/panels/OverlayPanel";
import SweepPanel from "./components/panels/SweepPanel";
import MonteCarloPanel from "./components/panels/MonteCarloPanel";

function AppLayout() {
  const {
    containerRef,
    running,
    playbackSpeed,
    stepsRef,
    animRef,
    set,
    sweepKey,
    sweepResults,
    mcResults,
    doSweep,
    doMonteCarlo,
  } = useSimulation();

  useAnimation({ running, playbackSpeed, stepsRef, animRef, set });

  const { size: panelH, onMouseDown: onBottomDrag } = useResizablePanel(200, 120, 500, "y");
  const { size: sidebarW, onMouseDown: onSidebarDrag } = useResizablePanel(360, 280, 520, "x");

  const breakpoint = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState<string | false>(false);
  const [overlayPanel, setOverlayPanel] = useState<"sweep" | "montecarlo" | null>(null);

  useEffect(() => {
    setDrawerOpen(false);
  }, [breakpoint]);

  const isDesktop = breakpoint === "desktop";
  const isTablet = breakpoint === "tablet";
  const isMobile = breakpoint === "mobile";

  return (
    <div
      style={{
        background: colors.bg,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        color: colors.text,
        fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif",
        overflow: "hidden",
      }}
    >
      <TopBar breakpoint={breakpoint} />

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {isDesktop && (
          <>
            <Sidebar sidebarW={sidebarW} mode="full" />
            <div
              onMouseDown={onSidebarDrag}
              style={{
                width: 7,
                flexShrink: 0,
                cursor: "col-resize",
                background: colors.bgPanel,
                borderLeft: `1px solid ${colors.border}`,
                borderRight: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 40,
                  borderRadius: 2,
                  background: colors.border,
                }}
              />
            </div>
          </>
        )}

        {isTablet && (
          <>
            <Sidebar
              sidebarW={280}
              mode="collapsed"
              drawerOpen={drawerOpen}
              onTabClick={(tab) =>
                setDrawerOpen((prev) => (prev === tab ? false : tab))
              }
            />
            {drawerOpen && (
              <div
                className="drawer-backdrop"
                onClick={() => setDrawerOpen(false)}
              />
            )}
          </>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            ref={containerRef}
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              minHeight: 180,
            }}
          >
            <SimulationCanvas />

            {/* Canvas toolbar for overlay panels */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 60,
                display: "flex",
                gap: 6,
                zIndex: 40,
              }}
            >
              <button
                onClick={() => setOverlayPanel(overlayPanel === "sweep" ? null : "sweep")}
                style={{
                  padding: "6px 12px",
                  background: overlayPanel === "sweep" ? colors.accent : "#ffffff",
                  border: `1px solid ${overlayPanel === "sweep" ? colors.accent : colors.border}`,
                  color: overlayPanel === "sweep" ? "#ffffff" : colors.text,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                Sweep
              </button>
              <button
                onClick={() => setOverlayPanel(overlayPanel === "montecarlo" ? null : "montecarlo")}
                style={{
                  padding: "6px 12px",
                  background: overlayPanel === "montecarlo" ? colors.accent : "#ffffff",
                  border: `1px solid ${overlayPanel === "montecarlo" ? colors.accent : colors.border}`,
                  color: overlayPanel === "montecarlo" ? "#ffffff" : colors.text,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                Monte Carlo
              </button>
            </div>

            {/* Overlay panels */}
            {overlayPanel === "sweep" && (
              <OverlayPanel title="Parameter Sweep" onClose={() => setOverlayPanel(null)}>
                <SweepPanel
                  sweepKey={sweepKey}
                  setSweepKey={(v) => set("sweepKey", v)}
                  results={sweepResults}
                  onRun={doSweep}
                  panelH={250}
                  mode="overlay"
                />
              </OverlayPanel>
            )}
            {overlayPanel === "montecarlo" && (
              <OverlayPanel title="Monte Carlo Analysis" onClose={() => setOverlayPanel(null)}>
                <MonteCarloPanel results={mcResults} onRun={doMonteCarlo} panelH={250} mode="overlay" />
              </OverlayPanel>
            )}
          </div>

          {!isMobile && <AnalysisPanel panelH={panelH} onBottomDrag={onBottomDrag} />}
        </div>

        {isMobile && !drawerOpen && (
          <button
            className="mobile-fab"
            onClick={() => setDrawerOpen("drawer")}
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              width: 56,
              height: 56,
              borderRadius: 28,
              background: colors.accent,
              border: "none",
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
              <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
            </svg>
          </button>
        )}

        {isMobile && drawerOpen && (
          <>
            <div
              className="drawer-backdrop"
              onClick={() => setDrawerOpen(false)}
            />
            <div
              className="mobile-drawer"
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: "75vh",
                zIndex: 200,
                display: "flex",
                flexDirection: "column",
                background: colors.bgLight,
                borderTop: `2px solid ${colors.border}`,
                borderRadius: "16px 16px 0 0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 0",
                  display: "flex",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                onClick={() => setDrawerOpen(false)}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: colors.border,
                  }}
                />
              </div>
              <Sidebar sidebarW={280} mode="drawer" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <AppLayout />
      <Analytics />
    </SimulationProvider>
  );
}
