export const SEASONS = [
  "summer",
  "spring",
  "rainy",
  "autumn",
  "winter",
] as const;
export type Season = (typeof SEASONS)[number];
export type DayPhase = "Dawn" | "Day" | "Dusk" | "Night";
export const DAY_LENGTH_MINUTES = 2;
export const DAY_LENGTH_MS = DAY_LENGTH_MINUTES * 60 * 1000;
export const START_HOUR = 10;
export interface Daylight {
  hour: number;
  clock: string;
  phase: DayPhase;
  darkness: number;
  lightsOn: boolean;
}
export interface ClimateState extends Daylight {
  season: Season;
}
export const seasonDetails: Record<
  Season,
  { label: string; symbol: string; weather: string; description: string }
> = {
  summer: {
    label: "Summer",
    symbol: "☀",
    weather: "Warm & sunny",
    description: "Sunlit meadows, butterflies, and birdsong.",
  },
  spring: {
    label: "Spring",
    symbol: "✿",
    weather: "Blossoms on the breeze",
    description: "Tulips, daffodils, cherry blossoms, and returning birds.",
  },
  rainy: {
    label: "Rainy",
    symbol: "☂",
    weather: "A gentle village shower",
    description: "Rain, puddles, lush greenery, ducks, and frogs.",
  },
  autumn: {
    label: "Autumn",
    symbol: "❧",
    weather: "Golden leaves drifting",
    description: "Amber trees, fallen leaves, squirrels, and harvest pumpkins.",
  },
  winter: {
    label: "Winter",
    symbol: "❄",
    weather: "Snowfall & frozen water",
    description:
      "Snow-covered roofs and trees, icy rivers, hares, and winter birds.",
  },
};
const smooth = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};
export function daylightAt(hour: number): Daylight {
  const h = ((hour % 24) + 24) % 24;
  const darkness =
    h < 5 || h >= 20
      ? 1
      : h < 8
        ? 1 - smooth((h - 5) / 3)
        : h < 17
          ? 0
          : smooth((h - 17) / 3);
  const phase: DayPhase =
    h < 5 || h >= 20 ? "Night" : h < 8 ? "Dawn" : h < 17 ? "Day" : "Dusk";
  const totalMinutes = Math.floor(h * 60 + 1e-7) % 1440;
  return {
    hour: h,
    clock: `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`,
    phase,
    darkness,
    lightsOn: darkness >= 0.16,
  };
}
export function daylightAfter(elapsedMs: number): Daylight {
  return daylightAt(START_HOUR + (Math.max(0, elapsedMs) / DAY_LENGTH_MS) * 24);
}
export const initialClimate: ClimateState = {
  ...daylightAt(START_HOUR),
  season: "summer",
};
export function seasonColor(
  key: string,
  season: Season,
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  if (season === "summer") return [r, g, b];
  const green = g > r * 1.07 && g > b * 1.08;
  const water = key === "ground" && b > r * 1.13 && g > r * 1.1 && b > g * 0.86;
  const lum = r * 0.25 + g * 0.6 + b * 0.15;
  if (water && season === "winter")
    return [
      Math.min(241, 131 + lum * 0.45),
      Math.min(248, 166 + lum * 0.35),
      Math.min(251, 180 + lum * 0.32),
    ];
  if (!green) {
    if (
      key === "ground" &&
      season === "winter" &&
      r > 150 &&
      g > 130 &&
      b < g * 0.85
    )
      return [
        Math.min(244, r * 0.45 + 131),
        Math.min(244, g * 0.45 + 138),
        Math.min(237, b * 0.4 + 147),
      ];
    return [r, g, b];
  }
  if (season === "winter")
    return [
      Math.min(244, 48 + lum * 1.1),
      Math.min(249, 83 + lum * 0.94),
      Math.min(249, 99 + lum * 0.85),
    ];
  if (season === "spring" && (key === "tree1" || key === "tree3"))
    return [
      Math.min(249, 156 + lum * 0.52),
      Math.min(212, 52 + lum * 0.71),
      Math.min(224, 100 + lum * 0.59),
    ];
  if (season === "spring")
    return [
      Math.min(190, r * 1.08 + 6),
      Math.min(213, g * 1.1 + 4),
      Math.min(142, b * 0.91 + 3),
    ];
  if (season === "autumn") {
    if (key === "tree2") return [r * 0.95, g * 0.91, b * 0.9];
    return key === "ground"
      ? [r * 0.9 + 41, g * 0.7 + 29, b * 0.7 + 5]
      : [
          Math.min(225, 65 + lum * 0.94),
          Math.min(173, 31 + lum * 0.6),
          Math.min(94, 22 + lum * 0.24),
        ];
  }
  return [r * 0.79, g * 0.88, b * 0.96 + 4];
}
