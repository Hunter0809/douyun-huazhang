/**
 * Node.js 25+ 实验性 globalThis.localStorage 存在但非完整 Storage 实例，
 * 导致 getItem 等方法不存在，引发 SSR 报错。
 * 此 polyfill 在服务器启动时修复该问题。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGlobal = { localStorage: any };

export function patchLocalStorageForSSR(): void {
  // 仅在服务器端修复
  if (typeof window === 'undefined') {
    // Node.js 25+ 实验性 localStorage 可能导致 TypeError
    // 将其设为 undefined 以触发 typeof 安全防护
    try {
      const g = globalThis as unknown as AnyGlobal;
      const ls = g.localStorage;
      if (ls !== undefined && typeof ls.getItem !== 'function') {
        g.localStorage = undefined;
      }
    } catch {
      // 忽略
    }
  }
}

// Ensure this runs immediately
patchLocalStorageForSSR();
