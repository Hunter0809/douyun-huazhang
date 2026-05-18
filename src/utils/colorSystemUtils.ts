import { PaletteColor } from "./pixelation";
import colorSystemMapping from "../app/colorSystemMapping.json";

export type ColorSystem = "heritage" | "palette" | "sequence";

export const DEFAULT_COLOR_SYSTEM: ColorSystem = "heritage";

export const colorSystemOptions: { key: ColorSystem; name: string }[] = [
  { key: "heritage", name: "传统色号" },
  { key: "palette", name: "配色编号" },
  { key: "sequence", name: "顺序编号" },
];

type ColorMapping = Record<string, Record<ColorSystem, string>>;
const typedColorSystemMapping = colorSystemMapping as ColorMapping;

export function getAllHexValues(): string[] {
  return Object.keys(typedColorSystemMapping);
}

export function getHeritageToHexMapping(): Record<string, string> {
  const mapping: Record<string, string> = {};
  Object.entries(typedColorSystemMapping).forEach(([hex, colorData]) => {
    const key = colorData.heritage;
    if (key) mapping[key] = hex;
  });
  return mapping;
}

export function loadFullColorMapping(): Map<string, Record<ColorSystem, string>> {
  const mapping = new Map<string, Record<ColorSystem, string>>();
  Object.entries(typedColorSystemMapping).forEach(([baseKey, colorData]) => {
    mapping.set(baseKey, colorData);
  });
  return mapping;
}

export function convertPaletteToColorSystem(
  palette: PaletteColor[],
  colorSystem: ColorSystem,
): PaletteColor[] {
  return palette.map((color) => ({
    ...color,
    key: getDisplayColorKey(color.hex, colorSystem),
  }));
}

export function getDisplayColorKey(hexValue: string, colorSystem: ColorSystem): string {
  if (hexValue === "ERASE" || hexValue.length === 0 || hexValue === "?") {
    return hexValue;
  }

  const normalizedHex = hexValue.toUpperCase();
  return typedColorSystemMapping[normalizedHex]?.[colorSystem] ?? "?";
}

export function convertColorKeyToHex(displayKey: string, colorSystem: ColorSystem): string {
  if (displayKey.startsWith("#") && displayKey.length === 7) {
    return displayKey.toUpperCase();
  }

  for (const [hex, mapping] of Object.entries(typedColorSystemMapping)) {
    if (mapping[colorSystem] === displayKey) return hex;
  }

  return displayKey;
}

export function isValidColorInSystem(hexValue: string, colorSystem: ColorSystem): boolean {
  return typedColorSystemMapping[hexValue.toUpperCase()]?.[colorSystem] !== undefined;
}

export function getColorKeyByHex(hexValue: string, colorSystem: ColorSystem): string {
  return getDisplayColorKey(hexValue, colorSystem);
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    if (max === g) h = ((b - r) / diff + 2) / 6;
    if (max === b) h = ((r - g) / diff + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function sortColorsByHue<T extends { color: string }>(colors: T[]): T[] {
  return colors.slice().sort((a, b) => {
    const hslA = hexToHsl(a.color);
    const hslB = hexToHsl(b.color);
    if (Math.abs(hslA.h - hslB.h) > 5) return hslA.h - hslB.h;
    if (Math.abs(hslA.l - hslB.l) > 3) return hslB.l - hslA.l;
    return hslB.s - hslA.s;
  });
}
