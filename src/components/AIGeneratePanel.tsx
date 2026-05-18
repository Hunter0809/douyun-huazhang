"use client";

import { type CulturePromptOptions } from "@/utils/promptBuilder";

type Props = {
  options: CulturePromptOptions;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  onSample: () => void;
  onUpload: (file: File) => void;
};

export default function AIGeneratePanel({ loading, error, onGenerate, onSample, onUpload }: Props) {
  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "生成中..." : "AI 生成图案"}
        </button>
        <button
          type="button"
          onClick={onSample}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          使用内置样例
        </button>
        <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          手动上传图片
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
    </section>
  );
}
