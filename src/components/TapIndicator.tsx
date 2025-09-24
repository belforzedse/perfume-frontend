import React from "react";

interface TapIndicatorProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export default function TapIndicator({
  size = 180,
  color = "var(--color-accent)",
  strokeWidth = 3,
  className = "",
}: TapIndicatorProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100  100"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="tap-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="6" fill={color} />

      <circle cx="50" cy="50" r="20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeOpacity="0.8">
        <animate attributeName="r" values="20;44" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
      </circle>

      <circle cx="50" cy="50" r="20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeOpacity="0.8">
        <animate attributeName="r" values="20;44" dur="1.8s" begin="-0.9s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="1.8s" begin="-0.9s" repeatCount="indefinite" />
      </circle>

      <circle cx="50" cy="50" r="44" fill="url(#tap-fade)" />
    </svg>
  );
}
