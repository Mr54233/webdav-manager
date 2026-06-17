/**
 * 首页 —— 服务器列表
 * 显示已保存的 WebDAV 服务器，可以添加、编辑、删除
 * 点击服务器进入文件浏览
 */
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useServerStore } from "../../src/stores/server";
import { ServerConfig } from "../../src/types";

export default function HomeScreen() {
  const router = useRouter();
  const servers = useServerStore((s) => s.servers);
  const deleteServer = useServerStore((s) => s.deleteServer);
  const setCurrentServer = useServerStore((s) => s.setCurrentServer);

  // 点击服务器 → 进入文件浏览
  const handlePress = (server: ServerConfig) => {
    setCurrentServer(server);
    router.push("/file-list");
  };

  // 长按 → 编辑或删除
  const handleLongPress = (server: ServerConfig) => {
    Alert.alert(server.name, "选择操作", [
      { text: "编辑", onPress: () => router.push(`/server-edit?id=${server.id}`) },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          Alert.alert("确认删除", `确定要删除 "${server.name}" 吗？`, [
            { text: "取消", style: "cancel" },
            { text: "删除", style: "destructive", onPress: () => deleteServer(server.id) },
          ]);
        },
      },
      { text: "取消", style: "cancel" },
    ]);
  };

  // 渲染单个服务器卡片
  const renderServer = ({ item }: { item: ServerConfig }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handlePress(item)}
      onLongPress={() => handleLongPress(item)}
    >
      <Text style={styles.cardIcon}>🖥️</Text>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardUrl} numberOfLines={1}>
          {item.url}
        </Text>
        <Text style={styles.cardUser}>👤 {item.username}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {servers.length === 0 ? (
        // 空状态
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={styles.emptyText}>还没有添加服务器</Text>
          <Text style={styles.emptyHint}>点击右下角 + 添加你的 NAS</Text>
        </View>
      ) : (
        <FlatList
          data={servers}
          keyExtractor={(item) => item.id}
          renderItem={renderServer}
          contentContainerStyle={styles.list}
        />
      )}

      {/* 添加按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/server-edit")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  list: {
    padding: 16,
  },
  // 服务器卡片
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // 阴影
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  cardUrl: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  cardUser: {
    fontSize: 12,
    color: "#999",
  },
  arrow: {
    fontSize: 24,
    color: "#ccc",
    marginLeft: 8,
  },
  // 空状态
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: "#999",
  },
  // 浮动添加按钮
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 30,
  },
});
