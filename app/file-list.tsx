/**
 * 文件浏览页 —— 核心页面
 * 展示目录内容，支持浏览、删除、新建文件夹、收藏等操作
 */
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useServerStore } from "../src/stores/server";
import { listFiles, deleteItem, createDirectory, moveItem, copyItem } from "../src/services/webdav";
import { FileEntry, SortConfig } from "../src/types";
import { formatSize, formatDate, getFileIcon, isPreviewable } from "../src/utils/format";

export default function FileListScreen() {
  const router = useRouter();
  const { path: initialPath } = useLocalSearchParams<{ path?: string }>();

  const currentServer = useServerStore((s) => s.currentServer);
  const favorites = useServerStore((s) => s.favorites);
  const addFavorite = useServerStore((s) => s.addFavorite);
  const removeFavorite = useServerStore((s) => s.removeFavorite);

  // 当前路径（面包屑用）
  const [currentPath, setCurrentPath] = useState(initialPath || "/");
  // 文件列表
  const [files, setFiles] = useState<FileEntry[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 排序
  const [sort, setSort] = useState<SortConfig>({ field: "name", order: "asc" });
  // 新建文件夹的输入
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  // 搜索
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // 当前目录是否已收藏
  const isFavorited = currentServer
    ? (favorites[currentServer.id] || []).includes(currentPath)
    : false;

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    if (!currentServer) return;
    try {
      setLoading(true);
      const items = await listFiles(currentServer, currentPath);
      // 排序
      const sorted = sortFiles(items, sort);
      setFiles(sorted);
    } catch (e: any) {
      Alert.alert("加载失败", e?.message || "无法获取文件列表");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentServer, currentPath, sort]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // 搜索过滤
  const filteredFiles = searchQuery.trim()
    ? files.filter((f) =>
        f.basename.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : files;

  // 排序函数
  const sortFiles = (items: FileEntry[], config: SortConfig): FileEntry[] => {
    // 目录始终排在文件前面
    const dirs = items.filter((f) => f.type === "directory");
    const fileItems = items.filter((f) => f.type === "file");

    const comparator = (a: FileEntry, b: FileEntry) => {
      let cmp = 0;
      switch (config.field) {
        case "name":
          cmp = a.basename.localeCompare(b.basename, "zh");
          break;
        case "size":
          cmp = a.size - b.size;
          break;
        case "lastmod":
          cmp = new Date(a.lastmod).getTime() - new Date(b.lastmod).getTime();
          break;
      }
      return config.order === "asc" ? cmp : -cmp;
    };

    return [...dirs.sort(comparator), ...fileItems.sort(comparator)];
  };

  // 切换排序
  const toggleSort = (field: SortConfig["field"]) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // 点击文件/目录
  const handlePress = (item: FileEntry) => {
    if (item.type === "directory") {
      // 进入子目录
      setCurrentPath(item.filename);
    } else if (isPreviewable(item.basename)) {
      // 可预览的文件 → 预览页
      router.push(
        `/preview?path=${encodeURIComponent(item.filename)}&name=${encodeURIComponent(item.basename)}`
      );
    } else {
      Alert.alert("提示", "该文件类型暂不支持预览");
    }
  };

  // 长按文件/目录 → 操作菜单
  const handleLongPress = (item: FileEntry) => {
    const options: any[] = [
      {
        text: "移动",
        onPress: () => handleMove(item),
      },
      {
        text: "复制",
        onPress: () => handleCopy(item),
      },
      {
        text: "重命名",
        onPress: () => handleRename(item),
      },
      {
        text: "删除",
        style: "destructive",
        onPress: () => handleDelete(item),
      },
      { text: "取消", style: "cancel" },
    ];

    // 目录可以收藏
    if (item.type === "directory") {
      options.unshift({
        text: isFavorited ? "取消收藏" : "收藏",
        onPress: () => toggleFavorite(item.filename),
      });
    }

    Alert.alert(item.basename, "选择操作", options);

    // 移动/复制操作（通过输入目标路径实现）
    const handleMove = (item: FileEntry) => {
      Alert.prompt?.(
        "移动到",
        "输入目标路径（如 /documents/）",
        [
          { text: "取消", style: "cancel" },
          {
            text: "移动",
            onPress: async (destPath: string | undefined) => {
              if (!destPath?.trim() || !currentServer) return;
              const dest = destPath.trim().endsWith("/")
                ? destPath.trim() + item.basename
                : destPath.trim() + "/" + item.basename;
              try {
                await moveItem(currentServer, item.filename, dest);
                Alert.alert("移动成功 ✅");
                loadFiles();
              } catch (e: any) {
                Alert.alert("移动失败 ❌", e?.message || "未知错误");
              }
            },
          },
        ],
        "plain-text",
        currentPath
      );
    };

    const handleCopy = (item: FileEntry) => {
      Alert.prompt?.(
        "复制到",
        "输入目标路径（如 /backup/）",
        [
          { text: "取消", style: "cancel" },
          {
            text: "复制",
            onPress: async (destPath: string | undefined) => {
              if (!destPath?.trim() || !currentServer) return;
              const dest = destPath.trim().endsWith("/")
                ? destPath.trim() + item.basename
                : destPath.trim() + "/" + item.basename;
              try {
                await copyItem(currentServer, item.filename, dest);
                Alert.alert("复制成功 ✅");
                loadFiles();
              } catch (e: any) {
                Alert.alert("复制失败 ❌", e?.message || "未知错误");
              }
            },
          },
        ],
        "plain-text",
        currentPath
      );
    };
  };

  // 删除
  const handleDelete = (item: FileEntry) => {
    Alert.alert("确认删除", `确定要删除 "${item.basename}" 吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem(currentServer!, item.filename);
            loadFiles(); // 刷新列表
          } catch (e: any) {
            Alert.alert("删除失败", e?.message || "未知错误");
          }
        },
      },
    ]);
  };

  // 重命名
  const handleRename = (item: FileEntry) => {
    Alert.prompt?.(
      "重命名",
      "输入新名称",
      [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          onPress: async (newName: string | undefined) => {
            if (!newName?.trim()) return;
            const parentPath = currentPath.replace(/\/[^/]*\/?$/, "/");
            const newPath = parentPath + newName.trim();
            try {
              const { moveItem } = await import("../src/services/webdav");
              await moveItem(currentServer!, item.filename, newPath);
              loadFiles();
            } catch (e: any) {
              Alert.alert("重命名失败", e?.message || "未知错误");
            }
          },
        },
      ],
      "plain-text",
      item.basename
    );
  };

  // 新建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentServer) return;
    try {
      const path = currentPath.endsWith("/")
        ? currentPath + newFolderName.trim()
        : currentPath + "/" + newFolderName.trim();
      await createDirectory(currentServer, path);
      setNewFolderName("");
      setShowNewFolder(false);
      loadFiles();
    } catch (e: any) {
      Alert.alert("创建失败", e?.message || "未知错误");
    }
  };

  // 切换收藏
  const toggleFavorite = async (path: string) => {
    if (!currentServer) return;
    if (isFavorited) {
      await removeFavorite(currentServer.id, path);
    } else {
      await addFavorite(currentServer.id, path);
    }
  };

  // 上传文件
  const handleUpload = async () => {
    if (!currentServer) return;
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const remotePath = currentPath.endsWith("/")
        ? currentPath + file.name
        : currentPath + "/" + file.name;

      Alert.alert("上传确认", `确定要上传 "${file.name}" 吗？`, [
        { text: "取消", style: "cancel" },
        {
          text: "上传",
          onPress: async () => {
            try {
              const { uploadFile: upload } = await import("../src/services/download");
              await upload(currentServer, file.uri, remotePath);
              Alert.alert("上传成功 ✅");
              loadFiles();
            } catch (e: any) {
              Alert.alert("上传失败 ❌", e?.message || "未知错误");
            }
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert("选择文件失败", e?.message || "未知错误");
    }
  };

  // 面包屑导航
  const renderBreadcrumb = () => {
    const parts = currentPath.split("/").filter(Boolean);
    return (
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => setCurrentPath("/")}>
          <Text style={styles.breadcrumbItem}>🏠 /</Text>
        </TouchableOpacity>
        {parts.map((part, i) => {
          const path = "/" + parts.slice(0, i + 1).join("/") + "/";
          return (
            <TouchableOpacity key={i} onPress={() => setCurrentPath(path)}>
              <Text style={styles.breadcrumbItem}>› {part}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // 渲染单个文件条目
  const renderItem = ({ item }: { item: FileEntry }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => handlePress(item)}
      onLongPress={() => handleLongPress(item)}
    >
      <Text style={styles.fileIcon}>{getFileIcon(item.basename, item.type)}</Text>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.basename}
        </Text>
        <Text style={styles.fileMeta}>
          {item.type === "directory"
            ? "文件夹"
            : formatSize(item.size)}
          {" · "}
          {formatDate(item.lastmod)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!currentServer) {
    return (
      <View style={styles.center}>
        <Text>请先选择一个服务器</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部工具栏 */}
      <View style={styles.toolbar}>
        {/* 搜索按钮 */}
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchQuery("");
          }}
        >
          <Text>{showSearch ? "✕" : "🔍"}</Text>
        </TouchableOpacity>
        {/* 上传按钮 */}
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleUpload}>
          <Text>📤</Text>
        </TouchableOpacity>
        {/* 收藏按钮 */}
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => toggleFavorite(currentPath)}
        >
          <Text>{isFavorited ? "⭐" : "☆"}</Text>
        </TouchableOpacity>
        {/* 新建文件夹 */}
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => setShowNewFolder(!showNewFolder)}
        >
          <Text>📁+</Text>
        </TouchableOpacity>
        {/* 排序 */}
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => toggleSort("name")}
        >
          <Text style={sort.field === "name" ? styles.sortActive : undefined}>
            A↕{sort.field === "name" && (sort.order === "asc" ? "↑" : "↓")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => toggleSort("size")}
        >
          <Text style={sort.field === "size" ? styles.sortActive : undefined}>
            大↕{sort.field === "size" && (sort.order === "asc" ? "↑" : "↓")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => toggleSort("lastmod")}
        >
          <Text style={sort.field === "lastmod" ? styles.sortActive : undefined}>
            时↕{sort.field === "lastmod" && (sort.order === "asc" ? "↑" : "↓")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜索栏 */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索文件名..."
            placeholderTextColor="#999"
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* 新建文件夹输入框 */}
      {showNewFolder && (
        <View style={styles.newFolderBar}>
          <TextInput
            style={styles.newFolderInput}
            value={newFolderName}
            onChangeText={setNewFolderName}
            placeholder="文件夹名称"
            placeholderTextColor="#999"
            autoFocus
          />
          <TouchableOpacity style={styles.newFolderBtn} onPress={handleCreateFolder}>
            <Text style={styles.newFolderBtnText}>创建</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newFolderCancel}
            onPress={() => {
              setShowNewFolder(false);
              setNewFolderName("");
            }}
          >
            <Text style={styles.newFolderCancelText}>取消</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 面包屑 */}
      {renderBreadcrumb()}

      {/* 文件列表 */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : filteredFiles.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{searchQuery ? "🔍" : "📂"}</Text>
          <Text style={styles.emptyText}>{searchQuery ? "没有匹配的文件" : "空目录"}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={(item) => item.filename}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              loadFiles();
            }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, color: "#999" },

  // 工具栏
  toolbar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  toolbarBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  sortActive: { color: "#2196F3", fontWeight: "600" },

  // 搜索栏
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    padding: 0,
  },
  searchClear: { fontSize: 16, color: "#999", padding: 4 },

  // 新建文件夹
  newFolderBar: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  newFolderInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginRight: 8,
  },
  newFolderBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newFolderBtnText: { color: "#fff", fontWeight: "600" },
  newFolderCancel: { paddingHorizontal: 12, paddingVertical: 10 },
  newFolderCancelText: { color: "#999" },

  // 面包屑
  breadcrumb: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  breadcrumbItem: {
    fontSize: 13,
    color: "#2196F3",
    marginRight: 4,
  },

  // 文件条目
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  fileIcon: { fontSize: 28, marginRight: 12 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, color: "#333", fontWeight: "500" },
  fileMeta: { fontSize: 12, color: "#999", marginTop: 3 },
});
