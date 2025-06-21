"use client";

import { useEffect, useState } from "react";

export default function TopProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let finishTimer: NodeJS.Timeout | undefined;

    if (active) {
      // start: quickly grow to 90%
      setWidth(0);
      const start = requestAnimationFrame(() => {
        setWidth(90);
      });
      return () => cancelAnimationFrame(start);
    } else if (width > 0) {
      // when deactivated, complete to 100% then fade out
      setWidth(100);
      finishTimer = setTimeout(() => {
        setWidth(0);
      }, 300); // match transition time
    }
    return () => {
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [active]);

  const visible = active || width !== 0;

  return (
    <>
      <div
        className="top-progress-bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "2px",
          width: `${width}%`,
          transition: "width 0.3s ease",
          zIndex: 50,
          pointerEvents: "none",
          opacity: visible ? 1 : 0,
          borderRadius: "0 4px 4px 0",
        }}
      />
      <style jsx>{`
        .top-progress-bar {
          background: linear-gradient(
            90deg,
            #ff0000,
            #ff7f00,
            #ffff00,
            #00ff00,
            #00ffff,
            #0000ff,
            #8b00ff
          );
          background-size: 600% 100%;
          animation: rainbow-shift 4s linear infinite;
        }
        @keyframes rainbow-shift {
          0% {
            background-position: 0% 0;
          }
          100% {
            background-position: -600% 0;
          }
        }
      `}</style>
    </>
  );
} 