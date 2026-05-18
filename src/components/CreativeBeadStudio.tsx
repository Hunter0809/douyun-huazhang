"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CultureExplanation from "@/components/CultureExplanation";
import ExportPanel from "@/components/ExportPanel";
import InteractiveMatting from "@/components/InteractiveMatting";
import ProductMockup from "@/components/ProductMockup";
import { type AspectRatioId, aspectRatios } from "@/data/aspectRatios";
import { cultureThemes } from "@/data/cultureThemes";
import { getProductTemplate } from "@/data/productTemplates";
import { countBeads, type BeadCount } from "@/utils/countBeads";
import {
  generateSamplePattern,
  imageDataUrlToPattern,
  renderPatternToCanvas,
  renderPatternToCanvasClean,
  renderSampleDesignOriginal,
  type BeadPattern,
} from "@/utils/culturePattern";
import { generateCultureCopy } from "@/utils/cultureTextGenerator";
import {
  DEFAULT_COLOR_SYSTEM,
  getAllHexValues,
  getDisplayColorKey,
  sortColorsByHue,
  type ColorSystem,
} from "@/utils/colorSystemUtils";

type SiteView = "home" | "start" | "faq";
type StudioStep = "config" | "extract" | "pattern" | "preview";

const navItems: { id: SiteView; label: string }[] = [
  { id: "home", label: "首页" },
  { id: "start", label: "快速开始" },
  { id: "faq", label: "说明" },
];

const studioSteps: { id: StudioStep; label: string; desc: string }[] = [
  { id: "config", label: "配置", desc: "选择传统主题、作品形式、网格尺寸、颜色数量和可用色" },
  { id: "extract", label: "主体提取", desc: "AI 生成或上传图片，查看原图与主体提取结果" },
  { id: "pattern", label: "拼豆图纸", desc: "生成带色号网格、统计颜色用量并导出图纸" },
  { id: "preview", label: "场景预览", desc: "查看成品效果、文化说明并导出完整制作资料" },
];

const formLabels = [
  { id: "coaster", label: "杯垫底稿" },
  { id: "keychain", label: "挂件底稿" },
  { id: "magnet", label: "冰箱贴底稿" },
  { id: "brooch", label: "胸针底稿" },
  { id: "pendant", label: "吊饰底稿" },
  { id: "bag_charm", label: "随身牌底稿" },
];

const showcase = [
  { title: "青花莲纹", theme: "青花瓷", colors: ["#FFFFFF", "#1557A8", "#3677D2", "#CDE8FF"] },
  { title: "敦煌飞天", theme: "敦煌文化", colors: ["#FCF9E0", "#EDB045", "#943630", "#0B3C43"] },
  { title: "京剧脸谱", theme: "戏曲脸谱", colors: ["#FFFFFF", "#E7002F", "#000000", "#FFDA45"] },
  { title: "山海瑞兽", theme: "山海经", colors: ["#1D1414", "#D30022", "#166F41", "#FFC830"] },
];

const craftSteps = [
  {
    title: "选择传统主题",
    text: "从青花瓷、敦煌纹样、京剧脸谱、山海经、二十四节气等主题出发，确定适合拼豆表达的主体、纹样和色彩气质。",
  },
  {
    title: "AI 生成或上传素材",
    text: "可让 AI 生成传统文化图案，也可上传手绘稿、照片或参考图，系统会提取主体并转为可编辑的拼豆网格。",
  },
  {
    title: "映射传统配色",
    text: "以开源色表进行近似色映射，支持指定已有颜色、限制颜色数量、保留网格线，便于实际摆豆和核对。",
  },
  {
    title: "导出制作资料",
    text: "导出带色号图纸、预览图、文化说明和用量统计 CSV，用于个人创作、课堂活动、社群分享或开源二次开发。",
  },
];

const faqItems = [
  {
    q: "这个工具现在的主题是什么？",
    a: "页面围绕中华传统文化拼豆创作展开，强调传统纹样、传统配色、AI 辅助生成和开源制作资料。",
  },
  {
    q: "色号体系为什么改了？",
    a: "代码中的外部色号已替换为开源中性色号：传统色号、配色编号和顺序编号。它们只用于图纸标注和统计，不指向任何外部供应体系。",
  },
  {
    q: "可以使用自己的图片吗？",
    a: "可以。上传图片后会先进行主体提取，再映射为拼豆网格。传统纹样、书法字形、器物纹饰和简洁插画更适合低像素网格。",
  },
  {
    q: "用量统计如何理解？",
    a: "统计表只表示每种颜色在当前图纸中需要的格子数量，可作为整理材料和制作核对参考。",
  },
];

function downloadUrl(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

function downloadBeadCsv(items: BeadCount[], filename: string): void {
  const header = ["色号", "RGB", "数量", "比例", "用途"];
  const rows = items.map((item) => [
    item.brandCode,
    item.rgb,
    String(item.count),
    `${(item.ratio * 100).toFixed(2)}%`,
    item.usage,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadUrl(URL.createObjectURL(blob), filename);
}

function PatternMiniature({ colors }: { colors: string[] }) {
  const cells = Array.from({ length: 64 }, (_, index) => {
    const x = index % 8;
    const y = Math.floor(index / 8);
    const distance = Math.abs(x - 3.5) + Math.abs(y - 3.5);
    return colors[Math.min(colors.length - 1, Math.floor(distance / 2))] ?? colors[0];
  });

  return (
    <div className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
      {cells.map((color, index) => (
        <span key={index} style={{ backgroundColor: color }} className="border-[0.5px] border-white/60" />
      ))}
    </div>
  );
}

export default function CreativeBeadStudio() {
  const firstTheme = cultureThemes[1] ?? cultureThemes[0];
  const [view, setView] = useState<SiteView>("home");
  const [step, setStep] = useState<StudioStep>("config");
  const [theme, setTheme] = useState(firstTheme.name);
  const [element, setElement] = useState(firstTheme.elements[0] ?? "传统纹样");
  const [meaning, setMeaning] = useState(firstTheme.meaning);
  const [productId, setProductId] = useState("coaster");
  const [gridSize, setGridSize] = useState(32);
  const [colorCount, setColorCount] = useState(8);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("1:1");
  const [showGrid, setShowGrid] = useState(true);
  const [antiAlias, setAntiAlias] = useState(true);
  const [selectedColorSystem, setSelectedColorSystem] = useState<ColorSystem>(DEFAULT_COLOR_SYSTEM);
  const [forcedColors, setForcedColors] = useState<string[]>([]);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(null);
  const [pattern, setPattern] = useState<BeadPattern | null>(null);
  const [patternUrl, setPatternUrl] = useState<string | null>(null);
  const [cleanPatternUrl, setCleanPatternUrl] = useState<string | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [productSceneUrl, setProductSceneUrl] = useState<string | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [showMatting, setShowMatting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneAbortRef = useRef<AbortController | null>(null);

  const product = getProductTemplate(productId);
  const formLabel = formLabels.find((item) => item.id === productId)?.label ?? "拼豆底稿";
  const options = useMemo(
    () => ({
      theme,
      element,
      meaning,
      product: formLabel,
      productPrompt: product.aiPrompt,
      aspectRatio,
      gridSize,
      colorCount,
    }),
    [aspectRatio, colorCount, element, formLabel, gridSize, meaning, product.aiPrompt, theme],
  );

  const paletteColors = useMemo(() => {
    const colors = getAllHexValues().map((hex) => ({
      color: hex,
      key: getDisplayColorKey(hex, selectedColorSystem),
    }));
    return sortColorsByHue(colors);
  }, [selectedColorSystem]);

  const beadCounts = useMemo(
    () => (pattern ? countBeads(pattern.grid, selectedColorSystem) : []),
    [pattern, selectedColorSystem],
  );

  const copy = useMemo(
    () => generateCultureCopy({ ...options, meaning, beadCounts }),
    [beadCounts, meaning, options],
  );

  const forcedColorWarning = useMemo(() => {
    if (forcedColors.length <= colorCount) return null;
    return `已指定 ${forcedColors.length} 种颜色，超过当前 ${colorCount} 色上限。超出的 ${forcedColors.length - colorCount} 种颜色不会进入最终映射，请减少指定颜色或提高颜色上限。`;
  }, [colorCount, forcedColors.length]);

  const abortScene = useCallback(() => {
    sceneAbortRef.current?.abort();
    sceneAbortRef.current = null;
  }, []);

  const regenerateSample = useCallback(() => {
    abortScene();
    const original = renderSampleDesignOriginal(options);
    const next = generateSamplePattern({ ...options, antiAlias }, forcedColors);
    setSourceImageUrl(original);
    setExtractedImageUrl(original);
    setPattern(next);
    setProductSceneUrl(null);
    setError(null);
  }, [abortScene, antiAlias, forcedColors, options]);

  useEffect(() => {
    regenerateSample();
  }, [regenerateSample]);

  useEffect(() => {
    if (!pattern) return;
    if (canvasRef.current) {
      renderPatternToCanvas(canvasRef.current, pattern, true);
    }
    const patternCanvas = document.createElement("canvas");
    renderPatternToCanvas(patternCanvas, pattern, true);
    setPatternUrl(patternCanvas.toDataURL("image/png"));

    const cleanCanvas = document.createElement("canvas");
    renderPatternToCanvasClean(cleanCanvas, pattern, showGrid);
    setCleanPatternUrl(cleanCanvas.toDataURL("image/png"));
  }, [pattern, showGrid, step]);

  const handleThemeSelect = (themeId: string) => {
    const next = cultureThemes.find((item) => item.id === themeId);
    if (!next) return;
    setTheme(next.name);
    setElement(next.elements[0] ?? "");
    setMeaning(next.meaning);
  };

  const clearPatternArtifacts = () => {
    setPattern(null);
    setPatternUrl(null);
    setCleanPatternUrl(null);
    setProductSceneUrl(null);
    setMockupUrl(null);
  };

  const buildPatternFromExtracted = async () => {
    if (!extractedImageUrl) {
      setError("请先完成主题提取，再生成拼豆图纸。");
      setStep("extract");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await imageDataUrlToPattern(
        extractedImageUrl,
        { ...options, antiAlias, source: sourceImageUrl === extractedImageUrl ? "ai" : "upload", preserveSourceRatio: false },
        forcedColors,
      );
      setPattern(next);
      setProductSceneUrl(null);
      setMockupUrl(null);
      setStep("pattern");
    } catch (err) {
      setError(err instanceof Error ? err.message : "拼豆图纸生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    abortScene();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-culture-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "AI 图案生成失败");
      setSourceImageUrl(result.imageUrl);
      setExtractedImageUrl(result.imageUrl);
      clearPatternArtifacts();
      setShowMatting(false);
      setStep("extract");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 图案生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (file: File) => {
    abortScene();
    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true);
      setError(null);
      try {
        const imageUrl = String(reader.result);
        setSourceImageUrl(imageUrl);
        const response = await fetch("/api/extract-theme-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, isUpload: true }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error ?? "主体提取失败");
        setExtractedImageUrl(result.imageUrl);
        clearPatternArtifacts();
        setShowMatting(true);
        setStep("extract");
      } catch (err) {
        setError(err instanceof Error ? err.message : "图片处理失败");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyMattingResult = async (resultImageUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/extract-theme-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: resultImageUrl, isUpload: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "主题图案生成失败");
      setExtractedImageUrl(result.imageUrl);
      clearPatternArtifacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "抠图结果转传统文创图案失败");
    } finally {
      setLoading(false);
    }
  };

  const generateScene = async () => {
    const scenePatternUrl = cleanPatternUrl ?? patternUrl;
    if (!scenePatternUrl) return;
    abortScene();
    const controller = new AbortController();
    sceneAbortRef.current = controller;
    setSceneLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-product-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternUrl: scenePatternUrl, productId, aspectRatio }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "场景预览生成失败");
      setProductSceneUrl(result.imageUrl);
      setMockupUrl(result.imageUrl);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "场景预览生成失败");
    } finally {
      setSceneLoading(false);
    }
  };

  const renderImageBox = (url: string | null, alt: string) => (
    <div className="aspect-square overflow-hidden rounded-md border border-stone-200 bg-stone-50">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-stone-400">暂无图像</div>
      )}
    </div>
  );

  const renderStep = () => {
    if (step === "config") {
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold">配置传统文化拼豆方案</h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">选择主题、核心元素、叙述、作品形式、比例与网格参数。</p>
            {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium">
                传统主题
                <select onChange={(event) => handleThemeSelect(event.target.value)} className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2">
                  {cultureThemes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                核心元素
                <input value={element} onChange={(event) => setElement(event.target.value)} className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium">
                文化叙述
                <textarea value={meaning} onChange={(event) => setMeaning(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-md border border-stone-300 px-3 py-2" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">
                  作品形式
                  <select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2">
                    {formLabels.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  画面比例
                  <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value as AspectRatioId)} className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2">
                    {aspectRatios.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">
                  网格尺寸：{gridSize} x {gridSize}
                  <input type="range" min={16} max={128} step={8} value={gridSize} onChange={(event) => setGridSize(Number(event.target.value))} className="mt-3 w-full" />
                </label>
                <label className="text-sm font-medium">
                  颜色上限：{colorCount} 色
                  <input type="range" min={4} max={64} step={4} value={colorCount} onChange={(event) => setColorCount(Number(event.target.value))} className="mt-3 w-full" />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium">
                  显示网格
                  <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium">
                  平滑杂点
                  <input type="checkbox" checked={antiAlias} onChange={(event) => setAntiAlias(event.target.checked)} />
                </label>
                <label className="text-sm font-medium">
                  色号标注
                  <select value={selectedColorSystem} onChange={(event) => setSelectedColorSystem(event.target.value as ColorSystem)} className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2">
                    <option value="heritage">传统色号</option>
                    <option value="palette">配色编号</option>
                    <option value="sequence">顺序编号</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleGenerateAI} disabled={loading} className="rounded-md bg-[#8f1d21] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {loading ? "生成中..." : "AI 生成图案"}
                </button>
                <button type="button" onClick={regenerateSample} className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold">
                  使用内置样例
                </button>
                <label className="cursor-pointer rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold">
                  上传图片
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUpload(file);
                    event.currentTarget.value = "";
                  }} />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold">指定可用颜色</h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">选择手头已有或希望保留的颜色，映射时会优先纳入最终色表。</p>
            {forcedColorWarning && <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{forcedColorWarning}</div>}
            <div className="mt-4 flex flex-wrap gap-1.5 rounded-md border border-stone-200 p-2">
              {paletteColors.map((item) => {
                const selectedIndex = forcedColors.indexOf(item.color);
                const selected = selectedIndex !== -1;
                return (
                  <button
                    key={item.color}
                    type="button"
                    title={`${selected ? `已选第 ${selectedIndex + 1} 个` : "点击选择"}：${item.key} ${item.color}`}
                    onClick={() => setForcedColors((prev) => (selected ? prev.filter((hex) => hex !== item.color) : [...prev, item.color]))}
                    className={`relative h-6 w-6 rounded border transition ${selected ? "border-stone-950 ring-2 ring-[#8f1d21]" : "border-stone-200 hover:scale-110"}`}
                    style={{ backgroundColor: item.color }}
                  >
                    {selected && (
                      <span className="absolute -bottom-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full border border-stone-950 bg-white px-0.5 text-[9px] font-bold leading-none text-stone-950 shadow-sm">
                        {selectedIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setForcedColors([])} className="mt-3 text-sm font-medium text-stone-500 hover:text-[#8f1d21]">
              清空指定颜色
            </button>
          </section>
        </div>
      );
    }

    if (step === "extract") {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold">原始素材</h2>
            <p className="mt-1 text-sm text-stone-500">AI 生成或上传的原图会保留在这里，用于回看主题来源。</p>
            <div className="mt-4">{renderImageBox(sourceImageUrl, "原始素材")}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={handleGenerateAI} disabled={loading} className="rounded-md bg-[#8f1d21] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {loading ? "生成中..." : "重新 AI 生成"}
              </button>
              <label className="cursor-pointer rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold">
                重新上传
                <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleUpload(file);
                  event.currentTarget.value = "";
                }} />
              </label>
            </div>
          </section>
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold">主体提取结果</h2>
            <p className="mt-1 text-sm text-stone-500">上传图片会先提取主要元素，并结合当前主题生成传统文创图案；这里不进行拼豆化，拼豆网格会在第三阶段生成。</p>
            <div className="mt-4">{renderImageBox(extractedImageUrl, "主体素材")}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {sourceImageUrl && (
                <button type="button" onClick={() => setShowMatting((value) => !value)} className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold">
                  {showMatting ? "收起交互式抠图" : "打开交互式抠图"}
                </button>
              )}
              <button type="button" onClick={buildPatternFromExtracted} disabled={loading || !extractedImageUrl} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {loading ? "生成中..." : "生成拼豆图纸"}
              </button>
            </div>
          </section>
          {showMatting && sourceImageUrl && (
            <div className="lg:col-span-2">
              <InteractiveMatting
                imageUrl={sourceImageUrl}
                onMattingResult={applyMattingResult}
                onClose={() => setShowMatting(false)}
              />
            </div>
          )}
        </div>
      );
    }

    if (step === "pattern") {
      const total = beadCounts.reduce((sum, item) => sum + item.count, 0);
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">拼豆图纸</h2>
                <p className="mt-1 text-sm text-stone-500">当前使用开源传统色号标注，不包含外部供应专属字段。</p>
              </div>
              <div className="flex gap-2">
                {patternUrl && (
                  <button type="button" onClick={() => downloadUrl(patternUrl, "traditional-bead-pattern.png")} className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold">
                    下载图纸
                  </button>
                )}
                <button type="button" onClick={() => downloadBeadCsv(beadCounts, "traditional-bead-counts.csv")} className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold">
                  下载用量 CSV
                </button>
              </div>
              </div>
              <div className="mt-5 overflow-auto rounded-md border border-stone-200 bg-stone-50 p-4">
                {pattern ? (
                  <canvas ref={canvasRef} className="mx-auto max-w-full" />
                ) : (
                  <div className="grid min-h-64 place-items-center text-center">
                    <div>
                      <p className="text-sm text-stone-500">第三阶段会把主题提取图案转换成拼豆网格。</p>
                      <button type="button" onClick={buildPatternFromExtracted} disabled={loading || !extractedImageUrl} className="mt-3 rounded-md bg-[#8f1d21] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {loading ? "生成中..." : "生成拼豆图纸"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold">用量统计</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-stone-100 p-3">
                <p className="text-xs text-stone-500">总颗数</p>
                <p className="text-lg font-bold">{total}</p>
              </div>
              <div className="rounded-md bg-stone-100 p-3">
                <p className="text-xs text-stone-500">颜色数</p>
                <p className="text-lg font-bold">{beadCounts.length}</p>
              </div>
              <div className="rounded-md bg-stone-100 p-3">
                <p className="text-xs text-stone-500">网格</p>
                <p className="text-lg font-bold">{pattern ? `${pattern.width}x${pattern.height}` : "-"}</p>
              </div>
            </div>
            <div className="mt-4 max-h-[480px] overflow-auto rounded-md border border-stone-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-stone-100 text-left text-stone-600">
                  <tr>
                    <th className="px-3 py-2">颜色</th>
                    <th className="px-3 py-2">色号</th>
                    <th className="px-3 py-2 text-right">数量</th>
                    <th className="px-3 py-2">用途</th>
                  </tr>
                </thead>
                <tbody>
                  {beadCounts.map((item) => (
                    <tr key={item.rgb} className="border-t border-stone-200">
                      <td className="px-3 py-2">
                        <span className="mr-2 inline-block h-4 w-4 rounded-sm border border-stone-300 align-middle" style={{ backgroundColor: item.rgb }} />
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
        </div>
      );
    }

    return (
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">成品场景预览</h2>
              <p className="mt-1 text-sm text-stone-500">查看拼豆图纸在 {formLabel} 上的效果，可生成更完整的场景图。</p>
            </div>
            <button type="button" onClick={generateScene} disabled={!patternUrl || sceneLoading} className="rounded-md bg-[#8f1d21] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {sceneLoading ? "生成中..." : "生成场景图"}
            </button>
          </div>
          <div className="mt-5">
            <ProductMockup
              pattern={pattern}
              product={product}
              sceneUrl={productSceneUrl}
              loading={sceneLoading}
              onRendered={(url) => setMockupUrl(url)}
            />
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold">导出作品资料</h2>
            <ExportPanel title={copy.title} patternUrl={patternUrl} mockupUrl={mockupUrl} copy={copy} beadCounts={beadCounts} />
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold">文化说明</h2>
            <CultureExplanation copy={copy} />
          </div>
        </section>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-stone-950">
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#fffdf7]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setView("home")} className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#8f1d21] text-sm font-bold text-white">韵</span>
            <span className="text-lg font-semibold tracking-tight">豆韵传统拼豆</span>
          </button>
          <nav className="flex items-center gap-1 rounded-md bg-stone-100 p-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`rounded px-4 py-2 text-sm font-medium transition ${
                  view === item.id ? "bg-white text-stone-950 shadow-sm" : "text-stone-600 hover:text-stone-950"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {view === "home" && (
        <>
          <section className="relative overflow-hidden bg-[#2b2118] text-white">
            <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
              <p className="text-sm font-semibold text-[#f2c46d]">中华传统文化元素 × AI 拼豆方案</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                把青花、敦煌、脸谱与节气纹样转成可制作的拼豆图纸
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-200">
                选择传统主题，生成或上传素材，自动完成像素化、传统配色映射、色号标注和用量统计。页面与数据面向开源创作，不绑定任何外部色号体系。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={() => setView("start")} className="rounded-md bg-[#f2c46d] px-5 py-3 text-sm font-semibold text-stone-950">
                  快速开始
                </button>
                <button type="button" onClick={() => setView("faq")} className="rounded-md border border-stone-400 px-5 py-3 text-sm font-semibold text-white">
                  查看开源说明
                </button>
              </div>
            </div>
            <div className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
              {showcase.map((item) => (
                <article key={item.title} className="rounded-lg border border-white/15 bg-white/8 p-5">
                  <PatternMiniature colors={item.colors} />
                  <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-stone-300">{item.theme}主题配色</p>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-[#fffdf7] py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-sm font-semibold text-[#8f1d21]">制作流程</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">从文化意象到拼豆底稿</h2>
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {craftSteps.map((item) => (
                  <article key={item.title} className="rounded-lg border border-stone-200 bg-[#fbf7ed] p-5">
                    <PatternMiniature colors={["#FFFFFF", "#1557A8", "#943630", "#EDB045"]} />
                    <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {view === "faq" && (
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[#8f1d21]">开源说明</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">传统文化拼豆生成器说明</h1>
          <div className="mt-8 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
            {faqItems.map((item) => (
              <details key={item.q} className="group p-5" open={item.q === faqItems[0].q}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span className="text-xl text-stone-400 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-stone-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {view === "start" && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 grid gap-3 lg:grid-cols-4">
            {studioSteps.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "pattern" && !pattern) {
                    void buildPatternFromExtracted();
                    return;
                  }
                  setStep(item.id);
                }}
                className={`rounded-lg border p-4 text-left transition ${
                  step === item.id
                    ? "border-[#8f1d21] bg-[#8f1d21] text-white shadow-sm"
                    : "border-stone-200 bg-white text-stone-700 hover:border-[#8f1d21]/50"
                }`}
              >
                <span className="text-xs font-semibold">0{index + 1}</span>
                <span className="mt-1 block text-base font-semibold">{item.label}</span>
                <span className={`mt-2 block text-xs leading-5 ${step === item.id ? "text-white/80" : "text-stone-500"}`}>{item.desc}</span>
              </button>
            ))}
          </div>
          {renderStep()}
        </section>
      )}
    </main>
  );
}
