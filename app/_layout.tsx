/**
 * 根布局 —— 所有页面的最外层容器
 * Expo Router 约定：app/_layout.tsx 是根布局
 */
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useServerStore } from "../src/stores/server";
import { useThemeStore, useThemeColors } from "../src/stores/theme";

export default function RootLayout() {
  // 应用启动时加载已保存的数据
  const loadServers = useServerStore((s) => s.loadServers);
  const loadFavorites = useServerStore((s) => s.loadFavorites);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const colors = useThemeColors();

  useEffect(() => {
    loadServers();
    loadFavorites();
    loadTheme();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#2196F3" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        {/* Tab 导航 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* 服务器编辑页 */}
        <Stack.Screen
          name="server-edit"
          options={{ title: "编辑服务器", presentation: "modal" }}
        />
        {/* 文件列表页 */}
        <Stack.Screen name="file-list" options={{ title: "文件浏览" }} />
        {/* 文件预览页 */}
        <Stack.Screen name="preview" options={{ title: "文件预览" }} />
      </Stack>
    </>
  );
}
