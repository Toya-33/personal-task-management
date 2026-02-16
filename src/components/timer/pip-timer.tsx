"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useTimer } from "./timer-provider";
import { formatTimer } from "@/lib/utils/time";

/**
 * Uses the Document Picture-in-Picture API to render the timer
 * in an always-on-top OS-level window, visible even when the
 * browser is minimized or behind other windows.
 */
export function PipTimer() {
  const { activeSubtask, elapsed, isRunning, stopTimer, completeTimer } =
    useTimer();
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipContainerRef = useRef<HTMLDivElement | null>(null);
  const prevIsRunning = useRef(false);

  // Auto-open PiP when timer starts
  useEffect(() => {
    if (isRunning && !prevIsRunning.current && !pipWindow) {
      openPip();
    }
    prevIsRunning.current = isRunning;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Close PiP when timer stops
  useEffect(() => {
    if (!isRunning && pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    }
  }, [isRunning, pipWindow]);

  const openPip = useCallback(async () => {
    if (!("documentPictureInPicture" in window)) {
      return; // fallback to in-browser floating timer
    }

    try {
      const pip = await (window as any).documentPictureInPicture.requestWindow({
        width: 340,
        height: 120,
      });

      // Inject minimal styles directly into the PiP window
      const style = pip.document.createElement("style");
      style.textContent = getPipStyles();
      pip.document.head.appendChild(style);
      pip.document.title = "Timer";

      // Create container for React portal
      const container = pip.document.createElement("div");
      container.id = "pip-root";
      pip.document.body.appendChild(container);
      pipContainerRef.current = container;

      pip.addEventListener("pagehide", () => {
        setPipWindow(null);
        pipContainerRef.current = null;
      });

      setPipWindow(pip);
    } catch {
      // User cancelled or API not available
    }
  }, []);

  // Render into PiP window via portal
  if (!pipWindow || !pipContainerRef.current || !isRunning || !activeSubtask) {
    return null;
  }

  return createPortal(
    <div className="pip-container">
      <div className="pip-header">
        <svg className="pip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <div className="pip-info">
          <div className="pip-label">
            {activeSubtask.task_title && (
              <span>{activeSubtask.task_title} / </span>
            )}
            {activeSubtask.title}
          </div>
          <div className="pip-time">{formatTimer(elapsed)}</div>
        </div>
      </div>
      <div className="pip-actions">
        <button
          className="pip-btn pip-btn-stop"
          onClick={stopTimer}
          title="Stop timer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>
        <button
          className="pip-btn pip-btn-complete"
          onClick={completeTimer}
          title="Complete subtask"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </button>
      </div>
    </div>,
    pipContainerRef.current
  );
}

function getPipStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #e0e0e0;
      overflow: hidden;
      user-select: none;
    }
    .pip-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      height: 100vh;
      gap: 12px;
    }
    .pip-header {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }
    .pip-icon {
      width: 20px;
      height: 20px;
      color: #6c63ff;
      flex-shrink: 0;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .pip-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .pip-label {
      font-size: 11px;
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
    .pip-time {
      font-size: 28px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
      letter-spacing: 1px;
      color: #fff;
    }
    .pip-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .pip-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.1s, background 0.15s;
    }
    .pip-btn:hover {
      transform: scale(1.1);
    }
    .pip-btn:active {
      transform: scale(0.95);
    }
    .pip-btn svg {
      width: 16px;
      height: 16px;
    }
    .pip-btn-stop {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    .pip-btn-stop:hover {
      background: rgba(239, 68, 68, 0.25);
    }
    .pip-btn-complete {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }
    .pip-btn-complete:hover {
      background: rgba(34, 197, 94, 0.25);
    }
  `;
}
