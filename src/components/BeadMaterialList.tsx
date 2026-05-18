"use client";

import type { BeadCount } from "@/utils/countBeads";

type Props = {
  items: BeadCount[];
};

export default function BeadMaterialList({ items }: Props) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const minutes = Math.max(20, Math.round(total / 18));
  const difficulty = total > 1400 || items.length > 12 ? "较高" : total > 600 ? "中等" : "入门";

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500">总颗数</p>
          <p className="text-lg font-bold">{total}</p>
        </div>
        <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500">颜色</p>
          <p className="text-lg font-bold">{items.length}</p>
        </div>
        <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500">难度</p>
          <p className="text-lg font-bold">{difficulty}</p>
        </div>
      </div>
      <p className="text-sm text-slate-500">预计制作时间：{minutes} 分钟</p>
      <div className="max-h-72 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-100 text-left text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2">颜色</th>
              <th className="px-3 py-2">色号</th>
              <th className="px-3 py-2 text-right">数量</th>
              <th className="px-3 py-2">用途</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.rgb} className="border-t border-slate-200 dark:border-slate-700">
                <td className="px-3 py-2">
                  <span
                    className="mr-2 inline-block h-4 w-4 rounded-sm border border-slate-300 align-middle"
                    style={{ backgroundColor: item.rgb }}
                  />
                  {item.rgb}
                </td>
                <td className="px-3 py-2 font-mono">{item.brandCode}</td>
                <td className="px-3 py-2 text-right">{item.count}</td>
                <td className="px-3 py-2">{item.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
