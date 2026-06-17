/**
 * 收藏页 —— 显示收藏的常用目录
 */
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useServerStore } from "../../src/stores/server";

export default function FavoritesScreen() {
  const router = useRouter();
  const favorites = useServerStore((s) => s.favorites);
  const servers = useServerStore((s) => s.servers);
  const setCurrentServer = useServerStore((s) => s.setCurrentServer);

  // 把收藏数据展平成列表
  const favoriteItems = Object.entries(favorites).flatMap(
    ([serverId, paths]) => {
      const server = servers.find((s) => s.id === serverId);
      if (!server) return [];
      return paths.map((path) => ({
        serverId,
        serverName: server.name,
        server,
        path,
        name: path.split("/").filter(Boolean).pop() || "/",
      }));
    }
  );

  const handlePress = (item: (typeof favoriteItems)[0]) => {
    setCurrentServer(item.server);
    router.push(`/file-list?path=${encodeURIComponent(item.path)}`);
  };

  return (
    <View style={styles.container}>
      {favoriteItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyText}>还没有收藏目录</Text>
          <Text style={styles.emptyHint}>浏览文件时可以收藏常用目录</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteItems}
          keyExtractor={(item) => `${item.serverId}:${item.path}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handlePress(item)}
            >
              <Text style={styles.icon}>⭐</Text>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.path}>{item.path}</Text>
                <Text style={styles.server}>{item.serverName}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  list: { padding: 16 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  path: { fontSize: 12, color: "#666", marginTop: 2 },
  server: { fontSize: 11, color: "#999", marginTop: 2 },
  arrow: { fontSize: 24, color: "#ccc" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: "#666", marginBottom: 8 },
  emptyHint: { fontSize: 14, color: "#999" },
});
