/**
 * 主题 Store 测试
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
const storage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage[key] || null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(async () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    }),
  },
}));

// Mock react-native useColorScheme
vi.mock("react-native", () => ({
  useColorScheme: vi.fn(() => "light"),
}));

import { useThemeStore, colors } from "../stores/theme";

beforeEach(() => {
  Object.keys(storage).forEach((k) => delete storage[k]);
  useThemeStore.setState({ mode: "system" });
});

describe("ThemeStore", () => {
  describe("主题切换", () => {
    it("默认主题是 system", () => {
      expect(useThemeStore.getState().mode).toBe("system");
    });

    it("切换到浅色主题", async () => {
      await useThemeStore.getState().setTheme("light");
      expect(useThemeStore.getState().mode).toBe("light");
    });

    it("切换到深色主题", async () => {
      await useThemeStore.getState().setTheme("dark");
      expect(useThemeStore.getState().mode).toBe("dark");
    });

    it("切换到跟随系统", async () => {
      await useThemeStore.getState().setTheme("system");
      expect(useThemeStore.getState().mode).toBe("system");
    });
  });

  describe("持久化", () => {
    it("主题保存到 AsyncStorage", async () => {
      await useThemeStore.getState().setTheme("dark");
      expect(storage["@webdav_theme"]).toBe("dark");
    });

    it("从 AsyncStorage 加载主题", async () => {
      storage["@webdav_theme"] = "light";
      await useThemeStore.getState().loadTheme();
      expect(useThemeStore.getState().mode).toBe("light");
    });

    it("AsyncStorage 为空时保持默认", async () => {
      await useThemeStore.getState().loadTheme();
      expect(useThemeStore.getState().mode).toBe("system");
    });

    it("无效值保持默认", async () => {
      storage["@webdav_theme"] = "invalid";
      await useThemeStore.getState().loadTheme();
      expect(useThemeStore.getState().mode).toBe("system");
    });
  });

  describe("颜色定义", () => {
    it("浅色主题颜色完整", () => {
      expect(colors.light.background).toBeDefined();
      expect(colors.light.surface).toBeDefined();
      expect(colors.light.text).toBeDefined();
      expect(colors.light.primary).toBeDefined();
      expect(colors.light.border).toBeDefined();
      expect(colors.light.error).toBeDefined();
    });

    it("深色主题颜色完整", () => {
      expect(colors.dark.background).toBeDefined();
      expect(colors.dark.surface).toBeDefined();
      expect(colors.dark.text).toBeDefined();
      expect(colors.dark.primary).toBeDefined();
      expect(colors.dark.border).toBeDefined();
      expect(colors.dark.error).toBeDefined();
    });

    it("浅色和深色主题颜色不同", () => {
      expect(colors.light.background).not.toBe(colors.dark.background);
      expect(colors.light.surface).not.toBe(colors.dark.surface);
      expect(colors.light.text).not.toBe(colors.dark.text);
    });
  });
});
