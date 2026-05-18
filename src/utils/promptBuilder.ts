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
  const gridText =
    options.gridWidth && options.gridHeight
      ? `${options.gridWidth}x${options.gridHeight}`
      : `${options.gridSize}x${options.gridSize}`;

  return [
    "生成一个适合拼豆制作的中华文创像素图案。",
    `文化主题：${options.theme}`,
    `核心元素：${options.element}`,
    options.meaning ? `文化说明：${options.meaning}` : "",
    `产品载体：${options.product}`,
    options.productPrompt ? `产品形态要求：${options.productPrompt}` : "",
    options.aspectRatio ? `画面比例：${options.aspectRatio}` : "",
    `网格尺寸：适合 ${gridText}`,
    `颜色数量：不超过 ${options.colorCount} 种`,
    "画面要求：直接生成该文创载体的正面成品设计，而不是只生成一个通用图案；主体居中，边缘明确，色块分明，高对比，避免复杂渐变。",
    "拼豆要求：必须像可手工制作的 perler beads / fuse beads 拼豆作品，保留拼豆颗粒感和网格化结构，避免摄影写实材质。",
    "输出风格：干净的像素艺术文创成品图，可直接转化为拼豆图纸，不要文字、不要水印、不要复杂摄影背景。",
  ].filter(Boolean).join("\n");
}
