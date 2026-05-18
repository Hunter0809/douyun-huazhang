// Node.js 25+ 内置了 localStorage 全局对象，但 getItem 等方法是不可用的桩方法
// 这里提供一个内存级别的兼容实现，使用 Object.defineProperties 强制覆写，
// 以应对 Node.js 25+ 中 globalThis.localStorage 只读的问题。
try {
  // 测试内置 localStorage 是否真的可用
  let needsPolyfill = false;
  try {
    const testKey = '__polyfill_test__';
    localStorage.setItem(testKey, '1');
    const val = localStorage.getItem(testKey);
    if (val !== '1') needsPolyfill = true;
    localStorage.removeItem(testKey);
  } catch {
    needsPolyfill = true;
  }

  if (needsPolyfill) {
    const store = new Map();
    function lsGetItem(key) { return store.get(key) ?? null; }
    function lsSetItem(key, value) { store.set(key, String(value)); }
    function lsRemoveItem(key) { store.delete(key); }
    function lsClear() { store.clear(); }
    function lsKey(index) { return [...store.keys()][index] ?? null; }
    function lsLength() { return store.size; }

    // 使用 defineProperties 强制覆写（兼容只读属性）
    Object.defineProperties(globalThis, {
      localStorage: {
        value: Object.defineProperties({}, {
          getItem:     { value: lsGetItem, writable: true, configurable: true },
          setItem:     { value: lsSetItem, writable: true, configurable: true },
          removeItem:  { value: lsRemoveItem, writable: true, configurable: true },
          clear:       { value: lsClear, writable: true, configurable: true },
          key:         { value: lsKey, writable: true, configurable: true },
          length:      { get: lsLength, configurable: true },
        }),
        writable: false,
        configurable: false,
      },
    });
    console.log('[init-node] localStorage 已通过内存 polyfill 替换 (defineProperties)');
  } else {
    console.log('[init-node] localStorage 原生可用，无需 polyfill');
  }
} catch (e) {
  console.warn('[init-node] localStorage polyfill 初始化失败:', e);
}
