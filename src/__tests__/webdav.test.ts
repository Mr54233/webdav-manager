/**
 * WebDAV 服务层测试
 * 用 mock 测试，不依赖真实网络
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServerConfig } from "../types";

// Mock webdav 包
const mockGetDirectoryContents = vi.fn();
const mockCreateDirectory = vi.fn();
const mockDeleteFile = vi.fn();
const mockMoveFile = vi.fn();
const mockCopyFile = vi.fn();
const mockPutFileContents = vi.fn();
const mockGetFileContents = vi.fn();

vi.mock("webdav", () => ({
  createClient: vi.fn(() => ({
    getDirectoryContents: mockGetDirectoryContents,
    createDirectory: mockCreateDirectory,
    deleteFile: mockDeleteFile,
    moveFile: mockMoveFile,
    copyFile: mockCopyFile,
    putFileContents: mockPutFileContents,
    getFileContents: mockGetFileContents,
  })),
}));

// mock 之后再 import
import {
  getClient,
  testConnection,
  listFiles,
  createDirectory,
  deleteItem,
  moveItem,
  copyItem,
  uploadFile,
  disconnect,
} from "../services/webdav";

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

describe("WebDAV 服务层", () => {
  // ==================== getClient ====================
  describe("getClient", () => {
    it("创建客户端", () => {
      const client = getClient(testServer);
      expect(client).toBeDefined();
    });

    it("相同服务器复用客户端", () => {
      const client1 = getClient(testServer);
      const client2 = getClient(testServer);
      expect(client1).toBe(client2);
    });

    it("不同服务器创建新客户端", () => {
      const client1 = getClient(testServer);
      const client2 = getClient({
        ...testServer,
        id: "test-2",
        url: "https://other.example.com/dav/",
      });
      expect(client1).not.toBe(client2);
    });
  });

  // ==================== testConnection ====================
  describe("testConnection", () => {
    it("连接成功返回 true", async () => {
      mockGetDirectoryContents.mockResolvedValueOnce([]);
      const result = await testConnection(testServer);
      expect(result).toBe(true);
    });

    it("连接失败返回 false", async () => {
      mockGetDirectoryContents.mockRejectedValueOnce(new Error("Network error"));
      const result = await testConnection(testServer);
      expect(result).toBe(false);
    });
  });

  // ==================== listFiles ====================
  describe("listFiles", () => {
    it("返回文件列表", async () => {
      mockGetDirectoryContents.mockResolvedValueOnce([
        {
          filename: "/docs",
          basename: "docs",
          lastmod: "2024-01-01T00:00:00Z",
          size: 0,
          type: "directory",
          mime: undefined,
          etag: null,
        },
        {
          filename: "/readme.txt",
          basename: "readme.txt",
          lastmod: "2024-01-02T00:00:00Z",
          size: 1024,
          type: "file",
          mime: "text/plain",
          etag: '"abc123"',
        },
      ]);

      const files = await listFiles(testServer, "/");
      expect(files).toHaveLength(2);
      expect(files[0].basename).toBe("docs");
      expect(files[0].type).toBe("directory");
      expect(files[1].basename).toBe("readme.txt");
      expect(files[1].size).toBe(1024);
    });

    it("过滤隐藏文件", async () => {
      mockGetDirectoryContents.mockResolvedValueOnce([
        {
          filename: "/.hidden",
          basename: ".hidden",
          lastmod: "2024-01-01T00:00:00Z",
          size: 0,
          type: "file",
          mime: undefined,
          etag: null,
        },
        {
          filename: "/visible.txt",
          basename: "visible.txt",
          lastmod: "2024-01-01T00:00:00Z",
          size: 100,
          type: "file",
          mime: "text/plain",
          etag: null,
        },
      ]);

      const files = await listFiles(testServer, "/");
      expect(files).toHaveLength(1);
      expect(files[0].basename).toBe("visible.txt");
    });

    it("处理空目录", async () => {
      mockGetDirectoryContents.mockResolvedValueOnce([]);
      const files = await listFiles(testServer, "/empty");
      expect(files).toEqual([]);
    });

    it("处理 data 属性格式的响应", async () => {
      // webdav 包有时返回 { data: [...] } 格式
      mockGetDirectoryContents.mockResolvedValueOnce({
        data: [
          {
            filename: "/file.txt",
            basename: "file.txt",
            lastmod: "2024-01-01T00:00:00Z",
            size: 50,
            type: "file",
            mime: "text/plain",
            etag: null,
          },
        ],
      });

      const files = await listFiles(testServer, "/");
      expect(files).toHaveLength(1);
    });

    it("网络错误抛出异常", async () => {
      mockGetDirectoryContents.mockRejectedValueOnce(new Error("Connection refused"));
      await expect(listFiles(testServer, "/")).rejects.toThrow("Connection refused");
    });

    it("size 为非数字时默认为 0", async () => {
      mockGetDirectoryContents.mockResolvedValueOnce([
        {
          filename: "/dir",
          basename: "dir",
          lastmod: "2024-01-01T00:00:00Z",
          size: "unknown",
          type: "directory",
          mime: undefined,
          etag: null,
        },
      ]);

      const files = await listFiles(testServer, "/");
      expect(files[0].size).toBe(0);
    });
  });

  // ==================== createDirectory ====================
  describe("createDirectory", () => {
    it("创建目录成功", async () => {
      mockCreateDirectory.mockResolvedValueOnce(undefined);
      await createDirectory(testServer, "/new-folder");
      expect(mockCreateDirectory).toHaveBeenCalledWith("/new-folder", { recursive: true });
    });

    it("创建失败抛出异常", async () => {
      mockCreateDirectory.mockRejectedValueOnce(new Error("Permission denied"));
      await expect(createDirectory(testServer, "/forbidden")).rejects.toThrow(
        "Permission denied"
      );
    });
  });

  // ==================== deleteItem ====================
  describe("deleteItem", () => {
    it("删除文件成功", async () => {
      mockDeleteFile.mockResolvedValueOnce(undefined);
      await deleteItem(testServer, "/file.txt");
      expect(mockDeleteFile).toHaveBeenCalledWith("/file.txt");
    });

    it("删除目录成功", async () => {
      mockDeleteFile.mockResolvedValueOnce(undefined);
      await deleteItem(testServer, "/folder");
      expect(mockDeleteFile).toHaveBeenCalledWith("/folder");
    });

    it("删除失败抛出异常", async () => {
      mockDeleteFile.mockRejectedValueOnce(new Error("Not found"));
      await expect(deleteItem(testServer, "/nonexistent")).rejects.toThrow("Not found");
    });
  });

  // ==================== moveItem ====================
  describe("moveItem", () => {
    it("移动/重命名成功", async () => {
      mockMoveFile.mockResolvedValueOnce(undefined);
      await moveItem(testServer, "/old.txt", "/new.txt");
      expect(mockMoveFile).toHaveBeenCalledWith("/old.txt", "/new.txt");
    });

    it("移动失败抛出异常", async () => {
      mockMoveFile.mockRejectedValueOnce(new Error("Conflict"));
      await expect(moveItem(testServer, "/a", "/b")).rejects.toThrow("Conflict");
    });
  });

  // ==================== copyItem ====================
  describe("copyItem", () => {
    it("复制成功", async () => {
      mockCopyFile.mockResolvedValueOnce(undefined);
      await copyItem(testServer, "/original.txt", "/copy.txt");
      expect(mockCopyFile).toHaveBeenCalledWith("/original.txt", "/copy.txt");
    });

    it("复制失败抛出异常", async () => {
      mockCopyFile.mockRejectedValueOnce(new Error("No space"));
      await expect(copyItem(testServer, "/a", "/b")).rejects.toThrow("No space");
    });
  });

  // ==================== uploadFile ====================
  describe("uploadFile", () => {
    it("上传字符串内容", async () => {
      mockPutFileContents.mockResolvedValueOnce(true);
      await uploadFile(testServer, "/test.txt", "hello world");
      expect(mockPutFileContents).toHaveBeenCalledWith("/test.txt", "hello world");
    });

    it("上传失败抛出异常", async () => {
      mockPutFileContents.mockRejectedValueOnce(new Error("Upload failed"));
      await expect(uploadFile(testServer, "/fail.txt", "data")).rejects.toThrow(
        "Upload failed"
      );
    });
  });

  // ==================== disconnect ====================
  describe("disconnect", () => {
    it("断开后重新创建客户端", () => {
      const client1 = getClient(testServer);
      disconnect();
      const client2 = getClient(testServer);
      expect(client1).not.toBe(client2);
    });
  });
});
