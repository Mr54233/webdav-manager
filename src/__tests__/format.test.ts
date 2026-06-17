/**
 * 工具函数测试
 * 测试 formatSize, formatDate, getFileIcon, isPreviewable, getPreviewType
 */
import {
  formatSize,
  formatDate,
  getFileIcon,
  isPreviewable,
  getPreviewType,
} from "../utils/format";

// ==================== formatSize ====================
describe("formatSize", () => {
  it("0 字节返回 -", () => {
    expect(formatSize(0)).toBe("-");
  });

  it("格式化字节", () => {
    expect(formatSize(500)).toBe("500 B");
  });

  it("格式化 KB", () => {
    expect(formatSize(1024)).toBe("1.0 KB");
    expect(formatSize(1536)).toBe("1.5 KB");
  });

  it("格式化 MB", () => {
    expect(formatSize(1048576)).toBe("1.0 MB");
    expect(formatSize(5242880)).toBe("5.0 MB");
  });

  it("格式化 GB", () => {
    expect(formatSize(1073741824)).toBe("1.0 GB");
  });

  it("格式化 TB", () => {
    expect(formatSize(1099511627776)).toBe("1.0 TB");
  });

  it("1 字节", () => {
    expect(formatSize(1)).toBe("1 B");
  });

  it("1023 字节", () => {
    expect(formatSize(1023)).toBe("1023 B");
  });
});

// ==================== formatDate ====================
describe("formatDate", () => {
  it("空字符串返回 -", () => {
    expect(formatDate("")).toBe("-");
  });

  it("格式化 ISO 日期", () => {
    const result = formatDate("2024-01-15T14:30:00Z");
    // 结果取决于本地时区，但格式应该正确
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it("格式化简单日期", () => {
    const result = formatDate("2024-12-25");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it("单数月份补零", () => {
    const result = formatDate("2024-03-05T08:05:00Z");
    expect(result).toMatch(/03/);
    expect(result).toMatch(/05/);
  });
});

// ==================== getFileIcon ====================
describe("getFileIcon", () => {
  it("目录返回 📁", () => {
    expect(getFileIcon("any-name", "directory")).toBe("📁");
  });

  it("图片文件", () => {
    expect(getFileIcon("photo.jpg", "file")).toBe("🖼️");
    expect(getFileIcon("image.png", "file")).toBe("🖼️");
    expect(getFileIcon("pic.gif", "file")).toBe("🖼️");
    expect(getFileIcon("icon.svg", "file")).toBe("🖼️");
    expect(getFileIcon("shot.webp", "file")).toBe("🖼️");
  });

  it("视频文件", () => {
    expect(getFileIcon("movie.mp4", "file")).toBe("🎬");
    expect(getFileIcon("clip.mkv", "file")).toBe("🎬");
    expect(getFileIcon("video.avi", "file")).toBe("🎬");
  });

  it("音频文件", () => {
    expect(getFileIcon("song.mp3", "file")).toBe("🎵");
    expect(getFileIcon("audio.wav", "file")).toBe("🎵");
    expect(getFileIcon("track.flac", "file")).toBe("🎵");
  });

  it("文档文件", () => {
    expect(getFileIcon("doc.pdf", "file")).toBe("📄");
    expect(getFileIcon("report.docx", "file")).toBe("📝");
    expect(getFileIcon("data.xlsx", "file")).toBe("📊");
    expect(getFileIcon("slides.pptx", "file")).toBe("📽️");
  });

  it("压缩包", () => {
    expect(getFileIcon("archive.zip", "file")).toBe("📦");
    expect(getFileIcon("backup.rar", "file")).toBe("📦");
    expect(getFileIcon("data.7z", "file")).toBe("📦");
    expect(getFileIcon("files.tar.gz", "file")).toBe("📦");
  });

  it("文本/配置文件", () => {
    expect(getFileIcon("readme.txt", "file")).toBe("📃");
    expect(getFileIcon("config.json", "file")).toBe("📃");
    expect(getFileIcon("settings.yaml", "file")).toBe("📃");
    expect(getFileIcon("notes.md", "file")).toBe("📃");
  });

  it("代码文件", () => {
    expect(getFileIcon("app.js", "file")).toBe("💻");
    expect(getFileIcon("index.tsx", "file")).toBe("💻");
    expect(getFileIcon("main.py", "file")).toBe("💻");
    expect(getFileIcon("Program.java", "file")).toBe("💻");
  });

  it("可执行文件", () => {
    expect(getFileIcon("setup.exe", "file")).toBe("⚙️");
    expect(getFileIcon("app.apk", "file")).toBe("⚙️");
  });

  it("种子文件", () => {
    expect(getFileIcon("download.torrent", "file")).toBe("🧲");
  });

  it("未知类型返回默认图标", () => {
    expect(getFileIcon("file.xyz", "file")).toBe("📄");
  });

  it("无扩展名返回默认图标", () => {
    expect(getFileIcon("Makefile", "file")).toBe("📄");
  });

  it("大写扩展名", () => {
    expect(getFileIcon("PHOTO.JPG", "file")).toBe("🖼️");
    expect(getFileIcon("VIDEO.MP4", "file")).toBe("🎬");
  });
});

// ==================== isPreviewable ====================
describe("isPreviewable", () => {
  it("图片可预览", () => {
    expect(isPreviewable("photo.jpg")).toBe(true);
    expect(isPreviewable("image.png")).toBe(true);
  });

  it("视频可预览", () => {
    expect(isPreviewable("movie.mp4")).toBe(true);
    expect(isPreviewable("clip.mov")).toBe(true);
  });

  it("音频可预览", () => {
    expect(isPreviewable("song.mp3")).toBe(true);
  });

  it("文本可预览", () => {
    expect(isPreviewable("readme.txt")).toBe(true);
    expect(isPreviewable("code.js")).toBe(true);
    expect(isPreviewable("config.json")).toBe(true);
  });

  it("不可预览的文件", () => {
    expect(isPreviewable("archive.zip")).toBe(false);
    expect(isPreviewable("setup.exe")).toBe(false);
    expect(isPreviewable("data.bin")).toBe(false);
  });
});

// ==================== getPreviewType ====================
describe("getPreviewType", () => {
  it("图片类型", () => {
    expect(getPreviewType("photo.jpg")).toBe("image");
    expect(getPreviewType("image.png")).toBe("image");
    expect(getPreviewType("pic.gif")).toBe("image");
  });

  it("视频类型", () => {
    expect(getPreviewType("movie.mp4")).toBe("video");
    expect(getPreviewType("clip.mov")).toBe("video");
  });

  it("音频类型", () => {
    expect(getPreviewType("song.mp3")).toBe("audio");
    expect(getPreviewType("audio.wav")).toBe("audio");
  });

  it("文本类型", () => {
    expect(getPreviewType("readme.txt")).toBe("text");
    expect(getPreviewType("code.js")).toBe("text");
    expect(getPreviewType("style.css")).toBe("text");
    expect(getPreviewType("data.sql")).toBe("text");
  });

  it("未知类型", () => {
    expect(getPreviewType("file.xyz")).toBe("unknown");
    expect(getPreviewType("archive.zip")).toBe("unknown");
    expect(getPreviewType("binary.bin")).toBe("unknown");
  });
});
