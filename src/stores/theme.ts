/**
 * 主题状态管理
 * 支持浅色/深色/跟随系统
 */
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

const THEME_KEY = "@webdav_theme";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeStore {
  mode: ThemeMode;
  // 加载主题设置
  loadTheme: () => Promise<void>;
  // 设置主题
  setTheme: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "system",

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved && ["light", "dark", "system"].includes(saved)) {
        set({ mode: saved as ThemeMode });
      }
    } catch (e) {
      console.error("加载主题失败:", e);
    }
  },

  setTheme: async (mode) => {
    set({ mode });
    await AsyncStorage.setItem(THEME_KEY, mode);
  },
}));

// 主题颜色定义
export const colors = {
  light: {
    background: "#f5f5f5",
    surface: "#ffffff",
    text: "#333333",
    textSecondary: "#666666",
    textTertiary: "#999999",
    primary: "#2196F3",
    border: "#eeeeee",
    error: "#ff4444",
    success: "#4caf50",
  },
  dark: {
    background: "#121212",
    surface: "#1e1e1e",
    text: "#ffffff",
    textSecondary: "#b0b0b0",
    textTertiary: "#808080",
    primary: "#64b5f6",
    border: "#333333",
    error: "#ff6b6b",
    success: "#81c784",
  },
};

// 获取当前主题颜色的 hook
export function useThemeColors() {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");

  return isDark ? colors.dark : colors.light;
}
