import "@testing-library/jest-dom/vitest";

// Minimal localStorage / sessionStorage for jsdom
const memoryStore = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: memoryStore(),
    configurable: true,
  });
  Object.defineProperty(window, "sessionStorage", {
    value: memoryStore(),
    configurable: true,
  });
}
