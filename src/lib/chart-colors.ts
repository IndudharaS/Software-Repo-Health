// Validated dark-surface categorical/status hexes (see dataviz skill reference palette).
// Categorical slots 1-3 are the only ones that clear all-pairs CVD checks together,
// so charts with more than 3 identity-bearing series fold the remainder into "other".
export const CATEGORICAL = {
  blue: "#3987e5",
  orange: "#d95926",
  aqua: "#199e70",
  other: "#4b4b58",
} as const;

export const SEQUENTIAL_BLUE = {
  100: "#cde2fb",
  300: "#6da7ec",
  400: "#3987e5",
  500: "#256abf",
  600: "#184f95",
} as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const CHART_CHROME = {
  gridline: "#2c2c2a",
  axis: "#5c5c68",
  mutedText: "#8b8b9e",
} as const;
