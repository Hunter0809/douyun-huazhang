/**
 * Node.js 25+ 移除了实验性 localStorage 或存在兼容性问题。
 * 此模块在 SSR 时提供一个安全的空实现。
 */

// 检查当前 localStorage 是否可用
export function isLocalStorageUsable(): boolean {
  if (typeof window === 'undefined') return false;
  // Node.js 25+ 实验性 global localStorage 可能无效
  if (typeof localStorage === 'undefined' || localStorage === null) return false;
  try {
    if (typeof localStorage.getItem !== 'function') return false;
    localStorage.getItem('__test__');
    return true;
  } catch {
    return false;
  }
}
