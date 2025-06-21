// @ts-nocheck
"use client";

import React from "react";

interface Props {
  /** Components to be wrapped by the rainbow border */
  children: React.ReactNode;
  /** Optional className that will be applied to the outer wrapper (the border itself) */
  className?: string;
  /** Optional className that will be applied to the inner container (your actual content area) */
  innerClassName?: string;
}

/**
 * RainbowBorder
 *
 * A simple wrapper that surrounds its children with a 1&nbsp;px rainbow-colored border.
 *
 * Tailwind's arbitrary value syntax is used to create a conic-gradient background which
 * shows through as the border. The wrapper uses <code>p-[1px]</code> (1&nbsp;px padding) so the
 * gradient appears as a thin border around the children.
 */
export default function RainbowBorder({
  children,
  className = "",
  innerClassName = "",
}: Props) {
  return (
    <div
      className={[
        "p-[1px] rounded bg-[conic-gradient(red,orange,yellow,green,blue,indigo,violet)]",
        className,
      ].join(" ")}
    >
      <div className={["rounded", innerClassName].join(" ")}>{children}</div>
    </div>
  );
} 