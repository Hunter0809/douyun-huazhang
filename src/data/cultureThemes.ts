export type CultureTheme = {
  id: string;
  name: string;
  elements: string[];
  colors: string[];
  paletteHints: string[];
  meaning: string;
};

export const cultureThemes: CultureTheme[] = [
  {
    id: "dunhuang",
    name: "敦煌文化",
    elements: ["飞天", "藻井", "祥云", "莲花纹", "九色鹿"],
    colors: ["土黄", "赭红", "青绿", "米白"],
    paletteHints: ["#EDB045", "#943630", "#3DAF80", "#FCF9E0", "#0B3C43"],
    meaning: "敦煌文化融合佛教艺术、丝路文明与中国传统装饰审美，适合转译为高对比、强轮廓的拼豆纹样。",
  },
  {
    id: "blue_porcelain",
    name: "青花瓷",
    elements: ["莲花", "缠枝纹", "云纹", "瓷瓶", "海水纹"],
    colors: ["瓷白", "深蓝", "浅蓝"],
    paletteHints: ["#FFFFFF", "#1557A8", "#3677D2", "#CDE8FF", "#1C334D"],
    meaning: "青花瓷以蓝白配色和清雅纹样体现中国陶瓷审美，适合杯垫、冰箱贴和挂饰类文创。",
  },
  {
    id: "opera_mask",
    name: "京剧脸谱",
    elements: ["关羽", "张飞", "曹操", "包拯", "对称脸谱"],
    colors: ["红", "黑", "白", "蓝", "金"],
    paletteHints: ["#E7002F", "#000000", "#FFFFFF", "#1A60C3", "#FFDA45"],
    meaning: "京剧脸谱通过色彩象征人物性格与戏曲文化符号，适合生成对称、饱满、识别度高的拼豆图案。",
  },
  {
    id: "shanhaijing",
    name: "山海经",
    elements: ["神兽", "羽翼", "山纹", "日月", "瑞兽"],
    colors: ["墨黑", "朱红", "青绿", "金黄"],
    paletteHints: ["#1D1414", "#D30022", "#166F41", "#FFC830", "#E6B483"],
    meaning: "山海经意象强调想象力与东方神话叙事，可转化为轮廓鲜明的挂件或摆件。",
  },
  {
    id: "solar_terms",
    name: "二十四节气",
    elements: ["立春", "清明", "小满", "白露", "冬至"],
    colors: ["嫩绿", "米白", "浅蓝", "暖黄"],
    paletteHints: ["#AFDCAB", "#FFFDF0", "#A0E2FB", "#FFDD99", "#F7B4C6"],
    meaning: "二十四节气连接物候、农事与生活美学，适合做胸针、课程材料和季节限定文创。",
  },
  {
    id: "oracle_bone",
    name: "甲骨文",
    elements: ["日", "月", "山", "水", "人"],
    colors: ["骨白", "墨黑", "赭红", "土黄"],
    paletteHints: ["#F6EFE2", "#000000", "#943630", "#EDB045", "#D0CCAA"],
    meaning: "甲骨文把汉字源流转化为简洁符号，天然适合低像素网格和研学手作场景。",
  },
];

export function getThemeById(id: string): CultureTheme {
  return cultureThemes.find((theme) => theme.id === id) ?? cultureThemes[0];
}
