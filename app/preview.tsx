/**
 * 文件预览页
 * 支持：图片、视频、音频、文本/代码查看
 */
import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useServerStore } from "../src/stores/server";
import { getPreviewType } from "../src/utils/format";
import { getClient } from "../src/services/webdav";

export default function PreviewScreen() {
  const { path, name } = useLocalSearchParams<{ path: string; name: string }>();
  const currentServer = useServerStore((s) => s.currentServer);

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const previewType = name ? getPreviewType(name) : "unknown";

  useEffect(() => {
    if (!currentServer || !path) return;

    const loadContent = async () => {
      try {
        setLoading(true);
        setError("");

        const client = getClient(currentServer);

        if (previewType === "image" || previewType === "video" || previewType === "audio") {
          // 媒体文件：构造带认证的 URL
          const base = currentServer.url.replace(/\/$/, "");
          const encodedPath = path
            .split("/")
            .map((p) => encodeURIComponent(p))
            .join("/");
          setMediaUrl(`${base}${encodedPath}`);
        } else if (previewType === "text") {
          // 文本：读取内容
          const data = await client.getFileContents(path, { format: "text" });
          setContent(data as string);
        } else {
          setError("该文件类型暂不支持预览");
        }
      } catch (e: any) {
        setError(e?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [currentServer, path, previewType]);

  if (!currentServer || !path) {
    return (
      <View style={styles.center}>
        <Text>参数错误</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // 构造带认证的 URL（用于 WebView 加载视频/音频）
  const authUrl = mediaUrl
    ? `${mediaUrl}?auth=${btoa(`${currentServer.username}:${currentServer.password}`)}`
    : "";

  return (
    <View style={styles.container}>
      {/* 文件名标题 */}
      <View style={styles.header}>
        <Text style={styles.fileName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.fileType}>
          {previewType === "image" ? "🖼️ 图片" :
           previewType === "video" ? "🎬 视频" :
           previewType === "audio" ? "🎵 音频" :
           previewType === "text" ? "📃 文本" : "📄 文件"}
        </Text>
      </View>

      {/* 图片预览 */}
      {previewType === "image" && (
        <Image
          source={{
            uri: mediaUrl,
            headers: {
              Authorization: `Basic ${btoa(`${currentServer.username}:${currentServer.password}`)}`,
            },
          }}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      )}

      {/* 视频预览 */}
      {previewType === "video" && (
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoIcon}>🎬</Text>
            <Text style={styles.videoText}>视频预览</Text>
            <Text style={styles.videoHint}>
              视频文件需要下载后播放
            </Text>
            <Text style={styles.videoUrl} numberOfLines={2}>
              {mediaUrl}
            </Text>
          </View>
        </View>
      )}

      {/* 音频预览 */}
      {previewType === "audio" && (
        <View style={styles.audioContainer}>
          <View style={styles.audioPlaceholder}>
            <Text style={styles.audioIcon}>🎵</Text>
            <Text style={styles.audioText}>音频预览</Text>
            <Text style={styles.audioHint}>
              音频文件需要下载后播放
            </Text>
            <Text style={styles.audioUrl} numberOfLines={2}>
              {mediaUrl}
            </Text>
          </View>
        </View>
      )}

      {/* 文本预览 */}
      {previewType === "text" && (
        <ScrollView style={styles.textContainer}>
          <Text style={styles.textContent} selectable>
            {content}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#666" },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { fontSize: 16, color: "#666", textAlign: "center" },

  // 头部
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fafafa",
  },
  fileName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  fileType: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  // 图片
  image: {
    flex: 1,
    backgroundColor: "#000",
  },

  // 视频
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlaceholder: {
    alignItems: "center",
    padding: 40,
  },
  videoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  videoText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  videoHint: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  videoUrl: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // 音频
  audioContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  audioPlaceholder: {
    alignItems: "center",
    padding: 40,
  },
  audioIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  audioText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  audioHint: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
  },
  audioUrl: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // 文本
  textContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  textContent: {
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 20,
    color: "#333",
  },
});
