export type CulturePromptOptions = {
  theme: string;
  element: string;
  meaning?: string;
  product: string;
  productPrompt?: string;
  aspectRatio?: string;
  gridSize: number;
  gridWidth?: number;
  gridHeight?: number;
  colorCount: number;
};

export function buildCulturePrompt(options: CulturePromptOptions): string {
  return [
    "生成一幅中华传统文化主题的平面装饰图案。",
    `文化主题：${options.theme}`,
    `核心元素：${options.element}`,
    options.meaning ? `文化说明：${options.meaning}` : "",
    options.aspectRatio ? `画面比例：${options.aspectRatio}` : "",
    "画面要求：主体居中，边缘明确，色块清晰分明，高对比度，避免复杂渐变和模糊过渡。",
    "输出干净的平面装饰图，不要文字、不要水印、不要复杂背景。",
  ].filter(Boolean).join("\n");
}
