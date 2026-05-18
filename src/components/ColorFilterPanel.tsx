"use client";

import { colorSystemOptions, type ColorSystem } from "@/utils/colorSystemUtils";

type Props = {
  selectedColorSystem: ColorSystem;
  onChange: (system: ColorSystem) => void;
};

export default function ColorFilterPanel({ selectedColorSystem, onChange }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-semibold">颜色滤镜</h2>
      <p className="mt-1 text-sm text-slate-500">切换开源色号标注方式，只影响图纸上的编号展示。</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {colorSystemOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key as ColorSystem)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              selectedColorSystem === opt.key
                ? "bg-slate-950 text-white shadow-sm"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </section>
  );
}
