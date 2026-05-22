"use client";

import type { CultureCopy } from "@/utils/cultureTextGenerator";
import type { AppLanguage } from "@/utils/language";

type Props = {
  copy: CultureCopy;
  language?: AppLanguage;
};

export default function CultureExplanation({ copy, language = "zh" }: Props) {
  const L = (zh: string, en: string) => (language === "en" ? en : zh);
  const sections = [
    { label: L("作品名称", "Work Title"), title: true, value: copy.title },
    { label: L("文化来源", "Cultural Source"), title: false, value: copy.source },
    { label: L("图案寓意", "Pattern Meaning"), title: false, value: copy.meaning },
    { label: L("设计说明", "Design Notes"), title: false, value: copy.design },
  ];

  return (
    <section className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
      {sections.map((section) => (
        <div
          key={section.label}
          className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
        >
          <p className="mb-1 text-xs font-semibold text-slate-500">{section.label}</p>
          {section.title ? (
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{section.value}</h2>
          ) : (
            <p>{section.value}</p>
          )}
        </div>
      ))}
    </section>
  );
}
