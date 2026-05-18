"use client";

import type { BeadCount } from "./countBeads";
import type { CultureCopy } from "./cultureTextGenerator";

export function exportProjectPdfLikeHtml(options: {
  title: string;
  patternUrl: string;
  mockupUrl: string;
  copy: CultureCopy;
  beadCounts: BeadCount[];
}): void {
  const rows = options.beadCounts
    .map(
      (item) =>
        `<tr><td><span style="display:inline-block;width:14px;height:14px;background:${item.rgb};border:1px solid #999"></span> ${item.colorName}</td><td>${item.rgb}</td><td>${item.count}</td><td>${(item.ratio * 100).toFixed(1)}%</td></tr>`,
    )
    .join("");

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${options.title}</title>
<style>
body{font-family:Arial,'Microsoft YaHei',sans-serif;margin:32px;color:#111827}
h1{font-size:28px;margin:0 0 8px} h2{font-size:18px;margin-top:24px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.img{width:100%;border:1px solid #d1d5db}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #d1d5db;padding:8px;text-align:left}
@media print{button{display:none}body{margin:18mm}.grid{break-inside:avoid}}
</style></head><body>
<button onclick="window.print()">打印 / 保存为 PDF</button>
<h1>${options.title}</h1>
<p>${options.copy.source}</p>
<div class="grid"><img class="img" src="${options.patternUrl}"><img class="img" src="${options.mockupUrl}"></div>
<h2>文化说明</h2><p>${options.copy.source}</p><p>${options.copy.meaning}</p><p>${options.copy.design}</p>
${options.copy.steps?.length ? `<h2>制作步骤</h2><ol>${options.copy.steps.map((step) => `<li>${step}</li>`).join("")}</ol>` : ""}
<h2>材料清单</h2><table><thead><tr><th>色号</th><th>RGB</th><th>数量</th><th>占比</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`);
  win.document.close();
  win.focus();
}
