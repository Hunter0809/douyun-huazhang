"use client";

import { useEffect, useRef } from "react";
import type { ProductTemplate } from "@/data/productTemplates";
import type { BeadPattern } from "@/utils/culturePattern";
import { renderMockupToCanvas } from "@/utils/renderMockup";

type Props = {
  pattern: BeadPattern | null;
  product: ProductTemplate;
  sceneUrl?: string | null;
  loading?: boolean;
  onRendered?: (dataUrl: string) => void;
};

export default function ProductMockup({ pattern, product, sceneUrl, loading, onRendered }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pattern || !canvasRef.current || sceneUrl) return;
    renderMockupToCanvas(canvasRef.current, pattern, product);
    onRendered?.(canvasRef.current.toDataURL("image/png"));
  }, [pattern, product, sceneUrl, onRendered]);

  return (
    <section className="relative">
      {sceneUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sceneUrl}
          alt={`${product.name}真实场景预览`}
          className="aspect-square w-full rounded-md border border-slate-200 bg-white object-contain dark:border-slate-700"
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="aspect-square w-full rounded-md border border-slate-200 bg-white dark:border-slate-700"
        />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/80 text-sm font-semibold text-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
          正在生成真实场景预览...
        </div>
      )}
    </section>
  );
}
