"use client";

import type { CulturePromptOptions } from "./promptBuilder";
import { getAspectRatio } from "@/data/aspectRatios";
import {
  PixelationMode,
  calculatePixelGrid,
  colorDistance,
  findClosestPaletteColor,
  hexToRgb,
  type MappedPixel,
  type PaletteColor,
  type RgbColor,
} from "./pixelation";
import { getMardToHexMapping } from "./colorSystemUtils";

export type BeadPattern = {
  grid: MappedPixel[][];
  width: number;
  height: number;
  palette: string[];
  source: "sample" | "ai" | "upload";
};

const fullPalette: PaletteColor[] = Object.entries(getMardToHexMapping())
  .map(([key, hex]) => {
    const rgb = hexToRgb(hex);
    return rgb ? { key, hex: hex.toUpperCase(), rgb } : null;
  })
  .filter((item): item is PaletteColor => Boolean(item));

const whiteFallback: PaletteColor =
  fullPalette.find((color) => color.hex === "#FFFFFF") ?? fullPalette[0];

function closestPaletteFromHex(hex: string, palette: PaletteColor[]): PaletteColor {
  const rgb = hexToRgb(hex);
  return rgb ? findClosestPaletteColor(rgb, palette) : whiteFallback;
}

const samplePaletteHints = ["#FFFFFF", "#1557A8", "#3677D2", "#CDE8FF", "#1C334D", "#EDB045"];

function getFocusedPalette(): PaletteColor[] {
  const seeded = samplePaletteHints.map((hex) => closestPaletteFromHex(hex, fullPalette));
  const base = ["#FFFFFF", "#000000", "#F6EFE2", "#EDEDED"].map((hex) =>
    closestPaletteFromHex(hex, fullPalette),
  );
  const byHex = new Map<string, PaletteColor>();
  [...seeded, ...base, ...fullPalette].forEach((color) => byHex.set(color.hex, color));
  return Array.from(byHex.values());
}

function clampColorCount(grid: MappedPixel[][], maxColors: number): MappedPixel[][] {
  const counts = new Map<string, { count: number; cell: MappedPixel }>();

  grid.flat().forEach((cell) => {
    if (!cell || cell.isExternal) return;
    const key = cell.color.toUpperCase();
    const current = counts.get(key);
    counts.set(key, { count: (current?.count ?? 0) + 1, cell });
  });

  const dominant = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)
    .map((entry) => entry.cell);

  if (dominant.length === 0) return grid;

  const dominantPalette = dominant
    .map((cell) => {
      const rgb = hexToRgb(cell.color);
      return rgb ? { key: cell.key, hex: cell.color.toUpperCase(), rgb } : null;
    })
    .filter((item): item is PaletteColor => Boolean(item));

  return grid.map((row) =>
    row.map((cell) => {
      if (!cell || cell.isExternal) return cell;
      if (dominantPalette.some((color) => color.hex === cell.color.toUpperCase())) return cell;
      const rgb = hexToRgb(cell.color);
      if (!rgb) return cell;
      const closest = findClosestPaletteColor(rgb, dominantPalette);
      return { key: closest.key, color: closest.hex };
    }),
  );
}

function removeSingleCellNoise(grid: MappedPixel[][]): MappedPixel[][] {
  return grid.map((row, y) =>
    row.map((cell, x) => {
      if (!cell || cell.isExternal) return cell;
      const neighbors: MappedPixel[] = [];
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const next = grid[y + dy]?.[x + dx];
          if (next && !next.isExternal) neighbors.push(next);
        }
      }
      const same = neighbors.filter((next) => next.color === cell.color).length;
      if (same >= 2 || neighbors.length < 3) return cell;

      const neighborCounts = new Map<string, { count: number; cell: MappedPixel }>();
      neighbors.forEach((next) => {
        const current = neighborCounts.get(next.color);
        neighborCounts.set(next.color, { count: (current?.count ?? 0) + 1, cell: next });
      });
      const replacement = Array.from(neighborCounts.values()).sort((a, b) => b.count - a.count)[0];
      return replacement?.count >= 3 ? { ...replacement.cell } : cell;
    }),
  );
}

function drawThemeSample(
  ctx: CanvasRenderingContext2D,
  options: CulturePromptOptions,
): void {
  const size = options.gridSize;
  const center = (size - 1) / 2;
  const colors = samplePaletteHints;

  ctx.fillStyle = colors[0] ?? "#FFFFFF";
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const radius = Math.sqrt(dx * dx + dy * dy) / (size / 2);
      const angle = Math.atan2(dy, dx);
      let color = colors[0];

      if (radius > 0.72 && radius < 0.92) color = colors[1];
      if (Math.sin(angle * 5 + radius * 8) > 0.46 && radius < 0.78) color = colors[2];
      if (Math.cos(angle * 3) > 0.62 && radius < 0.56) color = colors[3];
      if (ax < size * 0.04 || ay < size * 0.04) color = colors[4];
      if (radius < 0.14) color = colors[5];

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

export function generateSamplePattern(
  options: CulturePromptOptions & { antiAlias: boolean },
): BeadPattern {
  const canvas = document.createElement("canvas");
  canvas.width = options.gridSize;
  canvas.height = options.gridSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  drawThemeSample(ctx, options);
  const palette = getFocusedPalette();
  const grid = calculatePixelGrid(
    ctx,
    canvas.width,
    canvas.height,
    options.gridSize,
    options.gridSize,
    palette,
    PixelationMode.Dominant,
    whiteFallback,
  );

  const limited = clampColorCount(grid, options.colorCount);
  const cleaned = options.antiAlias ? removeSingleCellNoise(limited) : limited;

  return {
    grid: cleaned,
    width: options.gridSize,
    height: options.gridSize,
    palette: Array.from(new Set(cleaned.flat().map((cell) => cell.color))).sort(),
    source: "sample",
  };
}

export async function imageDataUrlToPattern(
  imageUrl: string,
  options: CulturePromptOptions & { antiAlias: boolean; source: "ai" | "upload"; preserveSourceRatio?: boolean },
): Promise<BeadPattern> {
  const image = new Image();
  image.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const ratio = getAspectRatio(options.aspectRatio ?? "1:1");
  const gridWidth = options.gridWidth ?? options.gridSize;
  const gridHeight =
    options.preserveSourceRatio
      ? Math.max(1, Math.round(gridWidth * (canvas.height / canvas.width)))
      : options.gridHeight ?? Math.max(1, Math.round(gridWidth * (ratio.height / ratio.width)));

  const palette = fullPalette;
  const grid = calculatePixelGrid(
    ctx,
    canvas.width,
    canvas.height,
    gridWidth,
    gridHeight,
    palette,
    PixelationMode.Dominant,
    whiteFallback,
  );
  const limited = clampColorCount(grid, options.colorCount);
  const cleaned = options.antiAlias ? removeSingleCellNoise(limited) : limited;

  return {
    grid: cleaned,
    width: gridWidth,
    height: gridHeight,
    palette: Array.from(new Set(cleaned.flat().map((cell) => cell.color))).sort((a, b) => {
      const rgbA = hexToRgb(a) as RgbColor;
      const rgbB = hexToRgb(b) as RgbColor;
      return colorDistance(rgbA, { r: 255, g: 255, b: 255 }) - colorDistance(rgbB, { r: 255, g: 255, b: 255 });
    }),
    source: options.source,
  };
}

export function renderPatternToCanvas(
  canvas: HTMLCanvasElement,
  pattern: BeadPattern,
  showGrid: boolean,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const cell = Math.max(8, Math.floor(640 / Math.max(pattern.width, pattern.height)));
  canvas.width = pattern.width * cell;
  canvas.height = pattern.height * cell;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pattern.grid.forEach((row, y) => {
    row.forEach((pixel, x) => {
      ctx.fillStyle = pixel.isExternal ? "#ffffff" : pixel.color;
      ctx.fillRect(x * cell, y * cell, cell, cell);
      if (showGrid) {
        ctx.strokeStyle = "rgba(17, 24, 39, 0.18)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cell + 0.5, y * cell + 0.5, cell, cell);
      }
    });
  });
}
