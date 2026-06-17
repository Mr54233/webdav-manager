/**
 * 工具函数
 */

/**
 * 格式化文件大小
 * 1024 → "1 KB", 1048576 → "1 MB"
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}

/**
 * 格式化时间
 * ISO 字符串 → "2024-01-15 14:30"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 根据文件名获取文件类型图标 emoji
 * 简单实现，后续可以换成真正的图标
 */
export function getFileIcon(basename: string, type: "file" | "directory"): string {
  if (type === "directory") return "📁";

  const ext = basename.split(".").pop()?.toLowerCase() || "";

  // 图片
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return "🖼️";
  // 视频
  if (["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"].includes(ext)) return "🎬";
  // 音频
  if (["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"].includes(ext)) return "🎵";
  // 文档
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx", "odt", "rtf"].includes(ext)) return "📝";
  if (["xls", "xlsx", "ods", "csv"].includes(ext)) return "📊";
  if (["ppt", "pptx", "odp"].includes(ext)) return "📽️";
  // 压缩包
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) return "📦";
  // 代码/文本
  if (["txt", "md", "json", "xml", "yaml", "yml", "toml", "ini", "conf", "log"].includes(ext)) return "📃";
  if (["js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "go", "rs", "php", "rb", "swift", "kt"].includes(ext)) return "💻";
  // 可执行
  if (["exe", "msi", "dmg", "app", "apk", "deb", "rpm"].includes(ext)) return "⚙️";
  // 种子
  if (["torrent"].includes(ext)) return "🧲";

  return "📄"; // 默认
}

/**
 * 判断文件是否可预览
 */
export function isPreviewable(basename: string): boolean {
  const ext = basename.split(".").pop()?.toLowerCase() || "";
  const previewableExts = [
    // 图片
    "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp",
    // 视频
    "mp4", "mov", "webm",
    // 音频
    "mp3", "wav", "ogg", "m4a",
    // 文本
    "txt", "md", "json", "xml", "yaml", "yml", "toml", "ini", "conf", "log",
    "js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "go", "rs", "php", "rb",
    "html", "css", "scss", "sql", "sh", "bat",
  ];
  return previewableExts.includes(ext);
}

/**
 * 根据文件名判断预览类型
 */
export function getPreviewType(basename: string): "image" | "video" | "audio" | "text" | "unknown" {
  const ext = basename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (["txt", "md", "json", "xml", "yaml", "yml", "toml", "ini", "conf", "log",
       "js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "go", "rs", "php", "rb",
       "html", "css", "scss", "sql", "sh", "bat"].includes(ext)) return "text";
  return "unknown";
}
