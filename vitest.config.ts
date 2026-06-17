import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 匹配测试文件
    include: ["src/**/*.test.{ts,tsx}"],
    // 全局 API（不用每个文件 import describe/it）
    globals: true,
    // 环境
    environment: "node",
  },
});
