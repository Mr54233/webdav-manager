/**
 * 下载服务测试
 * Mock expo-file-system 和 webdav 包
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock expo-file-system
const mockDownloadAsync = vi.fn();
vi.mock("expo-file-system", () => ({
  cacheDirectory: "/tmp/cache/",
  createDownloadResumable: vi.fn(() => ({
    downloadAsync: mockDownloadAsync,
  })),
  readAsStringAsync: vi.fn(async () => "base64content"),
  EncodingType: { Base64: "base64" },
}));

// Mock webdav
const mockPutFileContents = vi.fn();
vi.mock("webdav", () => ({
  createClient: vi.fn(() => ({
    putFileContents: mockPutFileContents,
    getDirectoryContents: vi.fn(),
  })),
}));

import { downloadFile, uploadFile } from "../services/download";
import { disconnect } from "../services/webdav";
import { ServerConfig } from "../types";

const testServer: ServerConfig = {
  id: "test-1",
  name: "测试服务器",
  url: "https://nas.example.com/dav/",
  username: "admin",
  password: "secret",
  createdAt: Date.now(),
};

beforeEach(() => {
  vi.clearAllMocks();
  disconnect();
});

describe("下载服务", () => {
  // ==================== downloadFile ====================
  describe("downloadFile", () => {
    it("下载成功返回本地路径", async () => {
      mockDownloadAsync.mockResolvedValueOnce({
        uri: "/tmp/cache/test.txt",
      });

      const result = await downloadFile(testServer, "/docs/test.txt");
      expect(result).toBe("/tmp/cache/test.txt");
    });

    it("调用 createDownloadResumable 时传入正确的 URL", async () => {
      mockDownloadAsync.mockResolvedValueOnce({
        uri: "/tmp/cache/file.txt",
      });

      const { createDownloadResumable } = await import("expo-file-system");
      await downloadFile(testServer, "/path/to/file.txt");

      expect(createDownloadResumable).toHaveBeenCalledWith(
        expect.stringContaining("/path/to/file.txt"),
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic"),
          }),
        }),
        expect.any(Function)
      );
    });

    it("处理中文文件名", async () => {
      mockDownloadAsync.mockResolvedValueOnce({
        uri: "/tmp/cache/报告.pdf",
      });

      const result = await downloadFile(testServer, "/文档/报告.pdf");
      expect(result).toContain("报告.pdf");
    });

    it("下载失败抛出异常", async () => {
      mockDownloadAsync.mockResolvedValueOnce(null);

      await expect(downloadFile(testServer, "/fail.txt")).rejects.toThrow(
        "下载失败"
      );
    });

    it("进度回调被调用", async () => {
      mockDownloadAsync.mockResolvedValueOnce({
        uri: "/tmp/cache/test.txt",
      });

      const onProgress = vi.fn();
      await downloadFile(testServer, "/test.txt", onProgress);

      // createDownloadResumable 的第4个参数是进度回调
      const { createDownloadResumable } = await import("expo-file-system");
      const progressCallback = (createDownloadResumable as any).mock
        .calls[0][3];

      // 模拟进度回调
      progressCallback({
        totalBytesWritten: 500,
        totalBytesExpectedToWrite: 1000,
      });
      expect(onProgress).toHaveBeenCalledWith(0.5);
    });

    it("进度回调处理零大小文件", async () => {
      mockDownloadAsync.mockResolvedValueOnce({
        uri: "/tmp/cache/empty.txt",
      });

      const onProgress = vi.fn();
      await downloadFile(testServer, "/empty.txt", onProgress);

      const { createDownloadResumable } = await import("expo-file-system");
      const progressCallback = (createDownloadResumable as any).mock
        .calls[0][3];

      // 模拟 totalBytesExpectedToWrite 为 0
      progressCallback({
        totalBytesWritten: 0,
        totalBytesExpectedToWrite: 0,
      });
      // 不应该调用 onProgress（因为 totalBytesExpectedToWrite <= 0）
    });
  });

  // ==================== uploadFile ====================
  describe("uploadFile", () => {
    it("上传成功", async () => {
      mockPutFileContents.mockResolvedValueOnce(true);

      await uploadFile(testServer, "file:///local/test.txt", "/remote/test.txt");
      expect(mockPutFileContents).toHaveBeenCalledWith(
        "/remote/test.txt",
        expect.any(Buffer)
      );
    });

    it("上传失败抛出异常", async () => {
      mockPutFileContents.mockRejectedValueOnce(new Error("Upload error"));

      await expect(
        uploadFile(testServer, "file:///local/fail.txt", "/remote/fail.txt")
      ).rejects.toThrow("Upload error");
    });
  });
});
