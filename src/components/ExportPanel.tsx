"use client";

import type { BeadCount } from "@/utils/countBeads";
import type { CultureCopy } from "@/utils/cultureTextGenerator";
import { exportProjectPdfLikeHtml } from "@/utils/exportPdf";

type Props = {
  title: string;
  patternUrl: string | null;
  mockupUrl: string | null;
  copy: CultureCopy;
  beadCounts: BeadCount[];
};

function downloadUrl(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

function downloadCsv(items: BeadCount[], filename: string): void {
  const header = ["颜色", "色号", "RGB", "数量", "占比", "用途"];
  const rows = items.map((item) => [
    item.colorName,
    item.brandCode,
    item.rgb,
    item.count.toString(),
    `${(item.ratio * 100).toFixed(2)}%`,
    item.usage,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadUrl(URL.createObjectURL(blob), filename);
}

export default function ExportPanel({ title, patternUrl, mockupUrl, copy, beadCounts }: Props) {
  const disabled = !patternUrl || !mockupUrl;

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button
        type="button"
        disabled={!patternUrl}
        onClick={() => patternUrl && downloadUrl(patternUrl, `${title}-拼豆图纸.png`)}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        下载图纸 PNG
      </button>
      <button
        type="button"
        disabled={!mockupUrl}
        onClick={() => mockupUrl && downloadUrl(mockupUrl, `${title}-产品预览.png`)}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        下载预览 PNG
      </button>
      <button
        type="button"
        disabled={beadCounts.length === 0}
        onClick={() => downloadCsv(beadCounts, `${title}-材料清单.csv`)}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        导出 CSV
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          patternUrl &&
          mockupUrl &&
          exportProjectPdfLikeHtml({ title, patternUrl, mockupUrl, copy, beadCounts })
        }
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        打印 / PDF
      </button>
    </section>
  );
}
