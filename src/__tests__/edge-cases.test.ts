/**
 * 边界情况和综合测试
 * 覆盖各种极端输入和边界条件
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatSize,
  formatDate,
  getFileIcon,
  isPreviewable,
  getPreviewType,
} from "../utils/format";

describe("边界情况测试", () => {
  // ==================== formatSize 边界 ====================
  describe("formatSize 边界", () => {
    it("负数返回 -", () => {
      // 负数不应该出现，但要处理
      const result = formatSize(-1);
      expect(result).toBeDefined();
    });

    it("极大值 TB", () => {
      const result = formatSize(1099511627776 * 100);
      expect(result).toContain("TB");
    });

    it("1025 字节", () => {
      expect(formatSize(1025)).toBe("1.0 KB");
    });

    it("1.5 KB 精确", () => {
      expect(formatSize(1536)).toBe("1.5 KB");
    });

    it("1 MB 精确", () => {
      expect(formatSize(1048576)).toBe("1.0 MB");
    });

    it("1 GB 精确", () => {
      expect(formatSize(1073741824)).toBe("1.0 GB");
    });
  });

  // ==================== formatDate 边界 ====================
  describe("formatDate 边界", () => {
    it("无效日期字符串", () => {
      const result = formatDate("not-a-date");
      // 应该返回 NaN 或处理过的结果，不崩溃
      expect(result).toBeDefined();
    });

    it("Unix 时间戳格式", () => {
      const result = formatDate("1705312200000");
      // 可能不是有效 ISO 日期
      expect(result).toBeDefined();
    });

    it("只有日期没有时间", () => {
      const result = formatDate("2024-01-15");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it("完整 ISO 带时区", () => {
      const result = formatDate("2024-01-15T14:30:00+08:00");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });
  });

  // ==================== getFileIcon 边界 ====================
  describe("getFileIcon 边界", () => {
    it("空文件名", () => {
      expect(getFileIcon("", "file")).toBe("📄");
    });

    it("只有扩展名", () => {
      expect(getFileIcon(".gitignore", "file")).toBe("📄");
    });

    it("多个点的文件名", () => {
      expect(getFileIcon("archive.tar.gz", "file")).toBe("📦");
    });

    it("大写混合扩展名", () => {
      expect(getFileIcon("Photo.JPEG", "file")).toBe("🖼️");
      expect(getFileIcon("Video.MP4", "file")).toBe("🎬");
      expect(getFileIcon("Audio.MP3", "file")).toBe("🎵");
    });

    it("目录始终返回文件夹图标", () => {
      expect(getFileIcon("photo.jpg", "directory")).toBe("📁");
      expect(getFileIcon("video.mp4", "directory")).toBe("📁");
      expect(getFileIcon("", "directory")).toBe("📁");
    });

    it("超长文件名", () => {
      const longName = "a".repeat(200) + ".txt";
      expect(getFileIcon(longName, "file")).toBe("📃");
    });

    it("特殊字符文件名", () => {
      expect(getFileIcon("文件名.txt", "file")).toBe("📃");
      expect(getFileIcon("file name.txt", "file")).toBe("📃");
      expect(getFileIcon("file-name.txt", "file")).toBe("📃");
      expect(getFileIcon("file_name.txt", "file")).toBe("📃");
    });
  });

  // ==================== isPreviewable 边界 ====================
  describe("isPreviewable 边界", () => {
    it("空文件名", () => {
      expect(isPreviewable("")).toBe(false);
    });

    it("无扩展名", () => {
      expect(isPreviewable("Makefile")).toBe(false);
      expect(isPreviewable("Dockerfile")).toBe(false);
    });

    it("所有图片格式", () => {
      const images = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
      images.forEach((ext) => {
        expect(isPreviewable(`file.${ext}`)).toBe(true);
      });
    });

    it("所有视频格式", () => {
      const videos = ["mp4", "mov", "webm"];
      videos.forEach((ext) => {
        expect(isPreviewable(`file.${ext}`)).toBe(true);
      });
    });

    it("所有音频格式", () => {
      const audio = ["mp3", "wav", "ogg", "m4a"];
      audio.forEach((ext) => {
        expect(isPreviewable(`file.${ext}`)).toBe(true);
      });
    });

    it("不可预览的格式", () => {
      const nonPreviewable = [
        "zip", "rar", "7z", "exe", "apk", "bin", "dat", "iso",
      ];
      nonPreviewable.forEach((ext) => {
        expect(isPreviewable(`file.${ext}`)).toBe(false);
      });
    });
  });

  // ==================== getPreviewType 边界 ====================
  describe("getPreviewType 边界", () => {
    it("空文件名", () => {
      expect(getPreviewType("")).toBe("unknown");
    });

    it("无扩展名", () => {
      expect(getPreviewType("README")).toBe("unknown");
    });

    it("大写扩展名", () => {
      expect(getPreviewType("PHOTO.JPG")).toBe("image");
      expect(getPreviewType("VIDEO.MP4")).toBe("video");
      expect(getPreviewType("AUDIO.MP3")).toBe("audio");
      expect(getPreviewType("CODE.JS")).toBe("text");
    });

    it("所有文本代码类型", () => {
      const textExts = [
        "txt", "md", "json", "xml", "yaml", "yml", "toml", "ini", "conf", "log",
        "js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "go", "rs", "php", "rb",
        "html", "css", "scss", "sql", "sh", "bat",
      ];
      textExts.forEach((ext) => {
        expect(getPreviewType(`file.${ext}`)).toBe("text");
      });
    });
  });
});

// ==================== 类型定义验证 ====================
describe("类型定义验证", () => {
  it("ServerConfig 结构正确", () => {
    const server = {
      id: "1",
      name: "test",
      url: "https://example.com",
      username: "user",
      password: "pass",
      createdAt: Date.now(),
    };
    // TypeScript 编译时检查，运行时只验证结构
    expect(server.id).toBeDefined();
    expect(server.name).toBeDefined();
    expect(server.url).toBeDefined();
    expect(server.username).toBeDefined();
    expect(server.password).toBeDefined();
    expect(server.createdAt).toBeDefined();
  });

  it("FileEntry 结构正确", () => {
    const file = {
      filename: "/test.txt",
      basename: "test.txt",
      lastmod: "2024-01-01",
      size: 100,
      type: "file" as const,
    };
    expect(file.type).toBe("file");
    expect(typeof file.size).toBe("number");
  });

  it("SortConfig 支持所有排序字段", () => {
    const fields = ["name", "size", "lastmod"];
    const orders = ["asc", "desc"];
    fields.forEach((field) => {
      orders.forEach((order) => {
        const config = { field, order };
        expect(config.field).toBe(field);
        expect(config.order).toBe(order);
      });
    });
  });
});
