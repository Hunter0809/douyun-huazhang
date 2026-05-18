"use client";

import type { CultureCopy } from "@/utils/cultureTextGenerator";

type Props = {
  copy: CultureCopy;
};

export default function CultureExplanation({ copy }: Props) {
  const sections = [
    { label: "作品名称", value: copy.title },
    { label: "文化来源", value: copy.source },
    { label: "图案寓意", value: copy.meaning },
    { label: "设计说明", value: copy.design },
  ];

  return (
    <section className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
      {sections.map((section) => (
        <div
          key={section.label}
          className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
        >
          <p className="mb-1 text-xs font-semibold text-slate-500">{section.label}</p>
          {section.label === "作品名称" ? (
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{section.value}</h2>
          ) : (
            <p>{section.value}</p>
          )}
        </div>
      ))}
    </section>
  );
}
