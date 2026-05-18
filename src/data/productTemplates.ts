export type ProductTemplate = {
  id: string;
  name: string;
  description: string;
  aiPrompt: string;
  scenePrompt: string;
  width: number;
  height: number;
  patternBox: { x: number; y: number; w: number; h: number };
};

export const productTemplates: ProductTemplate[] = [
  {
    id: "keychain",
    name: "钥匙扣",
    description: "适合小尺寸高对比图案，便于挂包和纪念品售卖。",
    aiPrompt: "画面应呈现为可制作的拼豆钥匙扣成品正面设计，主体上方预留清晰圆形挂孔或吊环连接位，整体轮廓紧凑，适合随身挂件。",
    scenePrompt: "生成真实生活场景预览：一个金属钥匙圈钥匙扣，钥匙扣主体必须使用参考图中的拼豆成果，挂在钥匙串或帆布包拉链上，桌面自然光，真实摄影风格。",
    width: 800,
    height: 800,
    patternBox: { x: 220, y: 248, w: 360, h: 360 },
  },
  {
    id: "magnet",
    name: "冰箱贴",
    description: "强调正面识别度，适合文化场馆伴手礼。",
    aiPrompt: "画面应呈现为冰箱贴成品正面设计，轮廓可为贴纸式外形或圆角磁贴外形，背后可隐含磁贴属性但不要画复杂场景，主体适合贴在冰箱门上远距离识别。",
    scenePrompt: "生成真实生活场景预览：参考图中的拼豆成果被制作成冰箱贴，贴在浅色冰箱门上，旁边可有便签或厨房小物作为尺度参照，主体清晰，真实摄影风格。",
    width: 800,
    height: 800,
    patternBox: { x: 188, y: 185, w: 424, h: 424 },
  },
  {
    id: "coaster",
    name: "杯垫",
    description: "适合 32x32 或 48x48 方形纹样，展示完整装饰边框。",
    aiPrompt: "画面应呈现为杯垫成品正面设计，整体为方形或圆形杯垫构图，保留稳定边框和中心纹样，适合承托茶杯或咖啡杯。",
    scenePrompt: "生成真实生活场景预览：参考图中的拼豆成果被制作成杯垫，放在木质桌面或茶席上，旁边有一只茶杯或咖啡杯，杯垫主体完整可见，真实摄影风格。",
    width: 800,
    height: 800,
    patternBox: { x: 175, y: 175, w: 450, h: 450 },
  },
  {
    id: "brooch",
    name: "胸针",
    description: "适合主体居中、色彩明确的小型图案。",
    aiPrompt: "画面应呈现为胸针成品正面设计，主体居中，轮廓小巧完整，适合佩戴在衣物上，避免过多细碎背景。",
    scenePrompt: "生成真实生活场景预览：参考图中的拼豆成果被制作成胸针，别在棉麻衣物或帆布包上，针饰主体完整清晰，真实摄影风格。",
    width: 800,
    height: 800,
    patternBox: { x: 232, y: 230, w: 336, h: 336 },
  },
  {
    id: "pendant",
    name: "挂件",
    description: "适合人物、神兽、文字符号等强轮廓图案。",
    aiPrompt: "画面应呈现为拼豆挂件成品正面设计，顶部预留挂绳孔位或连接结构，主体轮廓清晰，适合悬挂展示。",
    scenePrompt: "生成真实生活场景预览：参考图中的拼豆成果被制作成挂件，用细绳悬挂在展示架或墙面小挂钩上，主体清晰，真实摄影风格。",
    width: 800,
    height: 800,
    patternBox: { x: 205, y: 230, w: 390, h: 390 },
  },
  {
    id: "bag_charm",
    name: "书包挂饰",
    description: "适合研学课程与校园文创，关注耐看和易制作。",
    aiPrompt: "画面应呈现为书包挂饰成品正面设计，带有便于挂在书包拉链或背带上的连接位，造型活泼但保持拼豆可制作性。",
    scenePrompt: "生成真实生活场景预览：参考图中的拼豆成果被制作成书包挂饰，挂在书包拉链或背带上，校园日常氛围，主体清晰，真实摄影风格。",
    width: 800,
    height: 800,
    patternBox: { x: 210, y: 245, w: 380, h: 380 },
  },
];

export function getProductTemplate(id: string): ProductTemplate {
  return productTemplates.find((template) => template.id === id) ?? productTemplates[0];
}
