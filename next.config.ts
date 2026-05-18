import type { NextConfig } from "next";

// 修复 Node.js 25+ 实验性 localStorage 兼容性问题
// Node.js 25 在 globalThis 上暴露了一个非标准的 localStorage 存根，
// 它存在但没有 getItem/setItem 等标准方法，导致 SSR 时报 TypeError
try {
  const g = globalThis as Record<string, unknown>;
  const ls = g.localStorage;
  if (ls !== undefined && ls !== null && typeof (ls as Storage).getItem !== "function") {
    // 移除无效的 localStorage 存根
    delete g.localStorage;
  }
} catch {
  // 忽略修复失败
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
