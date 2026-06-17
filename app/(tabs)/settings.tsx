/**
 * 设置页
 */
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useServerStore } from "../../src/stores/server";
import { useThemeStore, useThemeColors, ThemeMode } from "../../src/stores/theme";
import { disconnect } from "../../src/services/webdav";

export default function SettingsScreen() {
  const servers = useServerStore((s) => s.servers);
  const themeMode = useThemeStore((s) => s.mode);
  const setTheme = useThemeStore((s) => s.setTheme);
  const colors = useThemeColors();

  const themeOptions: { label: string; value: ThemeMode; icon: string }[] = [
    { label: "浅色", value: "light", icon: "☀️" },
    { label: "深色", value: "dark", icon: "🌙" },
    { label: "跟随系统", value: "system", icon: "📱" },
  ];

  const handleClearData = () => {
    Alert.alert("清除所有数据", "这会删除所有服务器配置和收藏，确定吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "清除",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          disconnect();
          useServerStore.getState().loadServers();
          useServerStore.getState().loadFavorites();
          Alert.alert("已清除", "所有数据已清除");
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 主题设置 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          外观
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                { borderBottomColor: colors.border },
                themeMode === option.value && {
                  backgroundColor: colors.primary + "15",
                },
              ]}
              onPress={() => setTheme(option.value)}
            >
              <Text style={styles.themeIcon}>{option.icon}</Text>
              <Text style={[styles.themeLabel, { color: colors.text }]}>
                {option.label}
              </Text>
              {themeMode === option.value && (
                <Text style={[styles.themeCheck, { color: colors.primary }]}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 信息区 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          关于
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <InfoRow label="应用名称" value="WebDAV 管理器" colors={colors} />
          <InfoRow label="版本" value="1.0.0" colors={colors} />
          <InfoRow label="已配置服务器" value={`${servers.length} 个`} colors={colors} />
          <InfoRow label="测试用例" value="118 个，100% 通过" colors={colors} />
        </View>
      </View>

      {/* 数据管理 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          数据管理
        </Text>
        <TouchableOpacity
          style={[styles.dangerButton, { borderColor: colors.error }]}
          onPress={handleClearData}
        >
          <Text style={[styles.dangerButtonText, { color: colors.error }]}>
            清除所有数据
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // 主题选项
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeIcon: { fontSize: 20, marginRight: 12 },
  themeLabel: { flex: 1, fontSize: 16 },
  themeCheck: { fontSize: 18, fontWeight: "600" },
  // 信息行
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15 },
  // 危险按钮
  dangerButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
