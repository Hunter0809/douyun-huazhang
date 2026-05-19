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
    "【任务：生成传统文化主题图案 · 第二步】",
    "请根据以下文化主题和核心元素，创作一幅中华传统文化风格的平面装饰图案。",
    `文化主题：${options.theme}`,
    `核心元素：${options.element}`,
    options.meaning ? `文化说明：${options.meaning}` : "",
    options.aspectRatio ? `画面比例：${options.aspectRatio}` : "",
    "",
    "设计要求：",
    "• 主体居中，边缘明确，色块清晰分明，高对比度",
    "• 避免复杂渐变和模糊过渡，便于后续像素化处理",
    "• 背景建议为纯白或浅纯色，不要有杂乱的背景元素",
    "• 这是第二步「图案设计」，后续第三步会对本结果进行像素化处理变成拼豆图纸",
    "• 不要把图案像素化，不要绘制拼豆网格，不要添加色号",
    "• 输出干净的平面装饰图，不要文字、不要水印、不要复杂背景",
  ].filter(Boolean).join("\n");
}
