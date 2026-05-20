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
  const primary = options.beadCounts[0]?.brandCode ?? options.beadCounts[0]?.colorName ?? "主题色";
  const secondary = options.beadCounts[1]?.brandCode ?? options.beadCounts[1]?.colorName ?? "辅助色";
  const third = options.beadCounts[2]?.brandCode ?? options.beadCounts[2]?.colorName ?? "点缀色";

  // 自动生成寓意说明：基于元素、主题和颜色生成更丰富的文化寓意
  const autoMeaning = options.meaning
    ? `${options.meaning}`
    : `源自${options.theme}的“${options.element}”意象，承载着中华传统文化中对吉祥、和谐与美好的向往。`;

  const designDetail = [
    `作品提取“${options.element}”作为核心符号，将${options.theme}的代表色彩压缩为 ${options.colorCount} 色以内的拼豆色卡。`,
    `${primary}承担主体面积，${secondary}用于边缘和细节，${third || secondary}作为点缀，使 ${options.gridSize}x${options.gridSize} 网格在手工制作时仍保持清晰识别度。`,
    `该设计融合了传统纹样的秩序美感与现代拼豆工艺的颗粒质感，让传统文化以可触碰的方式走进日常生活。`,
  ].join("\n");

  return {
    title: `${options.element}${options.theme.replace("文化", "")}拼豆${options.product}`,
    source: `${options.theme} / ${options.element}`,
    meaning: autoMeaning,
    design: designDetail,
    scenario: `适用于${options.product}、研学课堂材料、博物馆文创样品和非遗体验活动。`,
    steps: [],
  };
}
