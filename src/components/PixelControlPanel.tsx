"use client";

import { aspectRatios, type AspectRatioId } from "@/data/aspectRatios";

type Props = {
  gridSize: number;
  colorCount: number;
  aspectRatio: AspectRatioId;
  showGrid: boolean;
  antiAlias: boolean;
  onGridSizeChange: (value: number) => void;
  onColorCountChange: (value: number) => void;
  onAspectRatioChange: (value: AspectRatioId) => void;
  onShowGridChange: (value: boolean) => void;
  onAntiAliasChange: (value: boolean) => void;
};

const gridSizes = [16, 24, 32, 48, 64, 96, 128, 192];
const colorCounts = [4, 8, 16, 32, 64, 128, 256, 512];

export default function PixelControlPanel({
  gridSize,
  colorCount,
  aspectRatio,
  showGrid,
  antiAlias,
  onGridSizeChange,
  onColorCountChange,
  onAspectRatioChange,
  onShowGridChange,
  onAntiAliasChange,
}: Props) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">画面比例</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onAspectRatioChange(ratio.id)}
              className={`rounded-md border px-2 py-2 text-sm ${
                aspectRatio === ratio.id
                  ? "border-cyan-600 bg-cyan-50 text-cyan-900 dark:border-cyan-300 dark:bg-cyan-950 dark:text-cyan-100"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">网格尺寸</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {gridSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onGridSizeChange(size)}
              className={`rounded-md border px-2 py-2 text-sm ${
                gridSize === size
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
            >
              {size}x{size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">颜色数量上限</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {colorCounts.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onColorCountChange(count)}
              className={`rounded-md border px-2 py-2 text-sm ${
                colorCount === count
                  ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-amber-300 dark:bg-amber-950 dark:text-amber-100"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
            >
              {count} 色
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          显示网格
          <input type="checkbox" checked={showGrid} onChange={(event) => onShowGridChange(event.target.checked)} />
        </label>
        <label className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          去抗锯齿
          <input type="checkbox" checked={antiAlias} onChange={(event) => onAntiAliasChange(event.target.checked)} />
        </label>
      </div>
    </section>
  );
}
