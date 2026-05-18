const STORAGE_KEY = 'customPerlerPaletteSelections';

export interface PaletteSelections {
  [hexValue: string]: boolean;
}

/**
 * 检查 localStorage 是否可用（避免 SSR 时出错）
 * Node.js 25+ 可能内置实验性 localStorage 但不可用，需要兜底检查
 */
function isLocalStorageAvailable(): boolean {
  // 首先检查是否在浏览器环境（SSR 安全保护）
  if (typeof window === 'undefined') return false;
  // Node.js 25+ 实验性的 localSorage 对象存在但可能没有 setItem/getItem 方法
  // 使用 try/catch 包围所有访问
  try {
    if (typeof localStorage === 'undefined' || localStorage === null) return false;
    if (typeof localStorage.getItem !== 'function') return false;
    const testKey = '__ls_test__';
    localStorage.setItem(testKey, '1');
    const result = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return result === '1';
  } catch {
    return false;
  }
}

/**
 * 保存自定义色板选择状态到localStorage
 */
export function savePaletteSelections(selections: PaletteSelections): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  } catch (error) {
    console.error("无法保存色板选择到本地存储:", error);
  }
}

/**
 * 从localStorage加载自定义色板选择状态
 */
export function loadPaletteSelections(): PaletteSelections | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("无法从本地存储加载色板选择:", error);
    localStorage.removeItem(STORAGE_KEY); // 清除无效数据
  }
  return null;
}

/**
 * 将预设色板转换为选择状态对象（基于hex值）
 */
export function presetToSelections(allHexValues: string[], presetHexValues: string[]): PaletteSelections {
  const presetSet = new Set(presetHexValues.map(hex => hex.toUpperCase()));
  const selections: PaletteSelections = {};

  allHexValues.forEach(hex => {
    const normalizedHex = hex.toUpperCase();
    selections[normalizedHex] = presetSet.has(normalizedHex);
  });

  return selections;
}

/**
 * 根据MARD色号预设生成基于hex值的选择状态（用于兼容旧预设）
 */
export function presetKeysToHexSelections(
  allBeadPalette: Array<{key: string, hex: string}>,
  presetKeys: string[]
): PaletteSelections {
  const presetKeySet = new Set(presetKeys);
  const selections: PaletteSelections = {};
  const processedHexValues = new Set<string>();

  console.log(`presetKeysToHexSelections: 输入调色板大小 ${allBeadPalette.length}, 预设键数量 ${presetKeys.length}`);

  allBeadPalette.forEach(color => {
    const normalizedHex = color.hex.toUpperCase();

    // 检查是否已经处理过这个hex值
    if (processedHexValues.has(normalizedHex)) {
      console.warn(`重复的hex值: ${normalizedHex}, MARD键: ${color.key}`);
      return; // 跳过重复的hex值
    }

    processedHexValues.add(normalizedHex);
    selections[normalizedHex] = presetKeySet.has(color.key);
  });

  const selectedCount = Object.values(selections).filter(Boolean).length;
  console.log(`presetKeysToHexSelections: 生成选择对象，总数 ${Object.keys(selections).length}, 选中 ${selectedCount}`);

  return selections;
}
