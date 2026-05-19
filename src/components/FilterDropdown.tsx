"use client";

import { useState, useRef, useEffect } from "react";
import { IMAGE_FILTER_OPTIONS, type ImageFilter } from "@/utils/colorSystemUtils";

type Props = {
  value: ImageFilter;
  onChange: (value: ImageFilter) => void;
};

export default function FilterDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = IMAGE_FILTER_OPTIONS.find((f) => f.key === value) ?? IMAGE_FILTER_OPTIONS[0];

  return (
    <div ref={ref} className="relative" title={selected.name}>
      {/* 按钮只显示图标 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm hover:bg-stone-50 transition"
      >
        <span className="text-base leading-none">{selected.icon}</span>
      </button>

      {/* 自定义下拉菜单，每个选项显示图标+名称 */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-stone-200 bg-white py-1 shadow-lg">
            {IMAGE_FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  onChange(f.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                  f.key === value
                    ? "bg-stone-100 font-semibold text-stone-900"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <span className="text-base">{f.icon}</span>
                <span className="flex-1">{f.name}</span>
                {f.key === value && (
                  <svg className="h-4 w-4 text-[#8f1d21]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
