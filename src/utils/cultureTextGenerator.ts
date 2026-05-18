import type { BeadCount } from "./countBeads";

export type CultureTextOptions = {
  theme: string;
  element: string;
  product: string;
  meaning: string;
  gridSize: number;
  colorCount: number;
  beadCounts: BeadCount[];
};

export type CultureCopy = {
  title: string;
  source: string;
  meaning: string;
  design: string;
  scenario?: string;
  steps?: string[];
};

export function generateCultureCopy(options: CultureTextOptions): CultureCopy {
  const primary = options.beadCounts[0]?.colorName ?? "主题色";
  const secondary = options.beadCounts[1]?.colorName ?? "辅助色";

  return {
    title: `${options.element}${options.theme.replace("文化", "")}拼豆${options.product}`,
    source: `${options.theme} / ${options.element}`,
    meaning: options.meaning,
    design: `作品提取“${options.element}”作为核心符号，将${options.theme}的代表色彩压缩为 ${options.colorCount} 色以内的拼豆色卡。${primary}承担主体面积，${secondary}用于边缘和细节，使 ${options.gridSize}x${options.gridSize} 网格在手工制作时仍保持清晰识别度。`,
    scenario: `适用于${options.product}、研学课堂材料、博物馆文创样品和非遗体验活动。`,
    steps: [],
  };
}
