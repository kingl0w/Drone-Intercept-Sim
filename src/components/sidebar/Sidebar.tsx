import { useState } from "react";
import { useSimulation } from "../../hooks/useSimulation";
import { colors } from "../../config/theme";
import AssetsTab from "./AssetsTab";
import ScenarioTab from "./ScenarioTab";
import DetectionTab from "./DetectionTab";
import AdvancedTab from "./AdvancedTab";

interface TabDef {
  key: string;
  label: string;
  shortLabel: string;
}

const TABS: TabDef[] = [
  { key: "assets", label: "Assets", shortLabel: "Assets" },
  { key: "scenario", label: "Scenario", shortLabel: "Scene" },
  { key: "detection", label: "Detection", shortLabel: "Detect" },
  { key: "advanced", label: "Advanced", shortLabel: "Adv" },
];

interface SidebarProps {
  sidebarW: number;
  mode?: "full" | "collapsed" | "drawer";
  drawerOpen?: string | false;
  onTabClick?: (tab: string) => void;
}

export default function Sidebar({ sidebarW, mode = "full", drawerOpen, onTabClick }: SidebarProps) {
  const { simulate, reset, exportJSON, shareURL, shareCopied, runHistory, running, result } = useSimulation();

  const [activeTab, setActiveTab] = useState("assets");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabContent = (
    <>
      {activeTab === "assets" && <AssetsTab />}
      {activeTab === "scenario" && <ScenarioTab />}
      {activeTab === "detection" && <DetectionTab />}
      {activeTab === "advanced" && <AdvancedTab />}
    </>
  );

  const runButton = (
    <div
      style={{
        padding: "8px 10px",
        flexShrink: 0,
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <button
        onClick={simulate}
        disabled={running}
        style={{
          width: "100%",
          padding: "12px",
          background: running ? colors.textMuted : colors.accent,
          border: "none",
          color: "#ffffff",
          borderRadius: 8,
          cursor: running ? "default" : "pointer",
          fontSize: 16,
          fontFamily: "inherit",
          fontWeight: 700,
          letterSpacing: 0.5,
          transition: "background 0.2s",
          opacity: running ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!running) e.currentTarget.style.background = colors.accentHover;
        }}
        onMouseLeave={(e) => {
          if (!running) e.currentTarget.style.background = colors.accent;
        }}
      >
        {running ? "Running\u2026" : "Run Simulation"}
      </button>
      <div style={{ display: "flex", gap: 8, marginTop: 6, justifyContent: "center" }}>
        <button
          onClick={() => exportJSON("current")}
          disabled={!runHistory.length}
          style={{
            background: "none",
            border: "none",
            fontSize: 12,
            color: runHistory.length ? colors.textDim : colors.textMuted,
            cursor: runHistory.length ? "pointer" : "default",
            fontFamily: "inherit",
            padding: "2px 0",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            if (runHistory.length) e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          Export
        </button>
        <span style={{ color: colors.border }}>·</span>
        <button
          onClick={shareURL}
          style={{
            background: "none",
            border: "none",
            fontSize: 12,
            color: shareCopied ? colors.success : colors.textDim,
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "2px 0",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            if (!shareCopied) e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          {shareCopied ? "Copied!" : "Share"}
        </button>
        {result && (
          <>
            <span style={{ color: colors.border }}>·</span>
            <button
              onClick={reset}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                color: colors.textDim,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "2px 0",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (mode === "collapsed") {
    const openTab = drawerOpen;
    return (
      <>
        <div
          style={{
            width: 60,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            background: colors.bgLight,
            borderRight: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          {TABS.map((tab) => {
            const isActive = openTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  onTabClick?.(tab.key);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 4px",
                  background: isActive ? colors.accentDim : "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: isActive ? colors.accent : colors.textDim,
                  borderLeft: isActive
                    ? `2px solid ${colors.accent}`
                    : "2px solid transparent",
                  transition: "all 0.15s",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                {tab.shortLabel}
              </button>
            );
          })}

          <div style={{ flex: 1 }} />

          <button
            onClick={simulate}
            disabled={running}
            style={{
              margin: "8px 6px",
              padding: "8px 4px",
              background: running ? colors.textMuted : colors.accent,
              border: "none",
              color: "#ffffff",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            RUN
          </button>
        </div>

        <div
          className="tablet-drawer"
          style={{
            position: "absolute",
            left: 60,
            top: 0,
            bottom: 0,
            width: 280,
            zIndex: 150,
            background: colors.bgLight,
            borderRight: `1px solid ${colors.border}`,
            transform: openTab ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: openTab ? "4px 0 20px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <div
            style={{
              padding: "10px 12px 6px",
              fontSize: 14,
              fontWeight: 600,
              color: colors.text,
              borderBottom: `1px solid ${colors.border}`,
              flexShrink: 0,
            }}
          >
            {TABS.find((t) => t.key === activeTab)?.label || ""}
          </div>
          <div
            className="section-scroll"
            style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}
          >
            {tabContent}
          </div>
          {runButton}
        </div>
      </>
    );
  }

  if (mode === "drawer") {
    return (
      <>
        <div
          style={{
            display: "flex",
            gap: 0,
            padding: "0 10px",
            flexShrink: 0,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? colors.text : colors.textMuted,
                  position: "relative",
                  transition: "color 0.15s",
                  textAlign: "center",
                }}
              >
                {tab.label}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -1,
                      left: "15%",
                      right: "15%",
                      height: 2,
                      background: colors.accent,
                      borderRadius: "1px 1px 0 0",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          className="section-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}
        >
          {tabContent}
        </div>
        {runButton}
      </>
    );
  }

  return (
    <div
      style={{
        width: sidebarW,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: colors.bgLight,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 0,
          padding: "0 10px",
          flexShrink: 0,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const isHovered = hoveredTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              onMouseEnter={() => setHoveredTab(tab.key)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                flex: 1,
                padding: "10px 4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? colors.text
                  : isHovered
                    ? colors.textDim
                    : colors.textMuted,
                position: "relative",
                transition: "color 0.15s",
                textAlign: "center",
              }}
            >
              {tab.label}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -1,
                    left: "15%",
                    right: "15%",
                    height: 2,
                    background: colors.accent,
                    borderRadius: "1px 1px 0 0",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        className="section-scroll"
        style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}
      >
        {tabContent}
      </div>

      {runButton}
    </div>
  );
}
