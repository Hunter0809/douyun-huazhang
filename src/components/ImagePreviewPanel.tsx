"use client";

type Props = {
  title: string;
  imageUrl: string | null;
  caption?: string;
};

export default function ImagePreviewPanel({ title, imageUrl, caption }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {caption && <p className="text-sm text-slate-500">{caption}</p>}
      </div>
      <div className="flex min-h-64 items-center justify-center rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="max-h-[520px] w-full object-contain" />
        ) : (
          <p className="px-4 text-center text-sm text-slate-500">等待生成或上传图片</p>
        )}
      </div>
    </section>
  );
}
