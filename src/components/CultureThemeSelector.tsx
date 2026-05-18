"use client";

import { cultureThemes } from "@/data/cultureThemes";
import { productTemplates } from "@/data/productTemplates";

type Props = {
  theme: string;
  element: string;
  meaning: string;
  productId: string;
  onThemeChange: (theme: string) => void;
  onElementChange: (element: string) => void;
  onMeaningChange: (meaning: string) => void;
  onProductChange: (productId: string) => void;
};

export default function CultureThemeSelector({
  theme,
  element,
  meaning,
  productId,
  onThemeChange,
  onElementChange,
  onMeaningChange,
  onProductChange,
}: Props) {
  return (
    <section className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">文化主题</label>
        <input
          value={theme}
          onChange={(event) => onThemeChange(event.target.value)}
          placeholder="例如：三星堆青铜文化、苗绣、宋代花鸟、敦煌飞天"
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">快速示例</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {cultureThemes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onThemeChange(item.name);
                onElementChange(item.elements[0]);
                onMeaningChange(item.meaning);
              }}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">核心元素</label>
        <input
          value={element}
          onChange={(event) => onElementChange(event.target.value)}
          placeholder="例如：莲花、青铜面具、飞天、云纹、神兽"
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">文化说明</label>
        <textarea
          value={meaning}
          onChange={(event) => onMeaningChange(event.target.value)}
          rows={4}
          placeholder="输入该主题的来源、寓意或设计方向，AI 会据此生成作品信息。"
          className="mt-2 w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">产品载体</label>
        <select
          value={productId}
          onChange={(event) => onProductChange(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {productTemplates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
