/**
 * Zustand Store 测试
 * 测试 server store 的所有 action
 * Mock AsyncStorage 因为它是 RN 原生模块
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage —— 用内存模拟
const storage: Record<string, string> = {};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage[key] || null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(async () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    }),
  },
}));

import { useServerStore } from "../stores/server";

beforeEach(async () => {
  // 清空 mock 存储
  Object.keys(storage).forEach((k) => delete storage[k]);
  // 重置 store 数据（不要用 replace=true，否则会丢失 actions）
  useServerStore.setState({
    servers: [],
    currentServer: null,
    favorites: {},
  });
});

describe("ServerStore", () => {
  // ==================== 服务器 CRUD ====================
  describe("服务器管理", () => {
    it("添加服务器", async () => {
      await useServerStore.getState().addServer({
        name: "测试NAS",
        url: "https://nas.example.com/dav",
        username: "admin",
        password: "pass123",
      });

      const { servers } = useServerStore.getState();
      expect(servers).toHaveLength(1);
      expect(servers[0].name).toBe("测试NAS");
      expect(servers[0].url).toBe("https://nas.example.com/dav/");
      expect(servers[0].username).toBe("admin");
      expect(servers[0].id).toBeDefined();
      expect(servers[0].createdAt).toBeDefined();
    });

    it("添加多个服务器", async () => {
      await useServerStore.getState().addServer({
        name: "NAS1",
        url: "https://nas1.example.com/dav",
        username: "user1",
        password: "pass1",
      });
      await useServerStore.getState().addServer({
        name: "NAS2",
        url: "https://nas2.example.com/dav",
        username: "user2",
        password: "pass2",
      });

      expect(useServerStore.getState().servers).toHaveLength(2);
    });

    it("更新服务器", async () => {
      await useServerStore.getState().addServer({
        name: "原始名称",
        url: "https://old.example.com/dav",
        username: "admin",
        password: "pass",
      });

      const server = useServerStore.getState().servers[0];
      await useServerStore.getState().updateServer({
        ...server,
        name: "新名称",
        url: "https://new.example.com/dav",
      });

      const updated = useServerStore.getState().servers[0];
      expect(updated.name).toBe("新名称");
      expect(updated.url).toBe("https://new.example.com/dav");
    });

    it("删除服务器", async () => {
      await useServerStore.getState().addServer({
        name: "待删除",
        url: "https://del.example.com/dav",
        username: "admin",
        password: "pass",
      });

      const id = useServerStore.getState().servers[0].id;
      await useServerStore.getState().deleteServer(id);

      expect(useServerStore.getState().servers).toHaveLength(0);
    });

    it("删除服务器时清空 currentServer", async () => {
      await useServerStore.getState().addServer({
        name: "NAS",
        url: "https://nas.example.com/dav",
        username: "admin",
        password: "pass",
      });

      const server = useServerStore.getState().servers[0];
      useServerStore.getState().setCurrentServer(server);
      expect(useServerStore.getState().currentServer).not.toBeNull();

      await useServerStore.getState().deleteServer(server.id);
      expect(useServerStore.getState().currentServer).toBeNull();
    });

    it("删除非当前服务器不影响 currentServer", async () => {
      await useServerStore.getState().addServer({
        name: "NAS1",
        url: "https://nas1.example.com/dav",
        username: "admin",
        password: "pass",
      });
      await useServerStore.getState().addServer({
        name: "NAS2",
        url: "https://nas2.example.com/dav",
        username: "admin",
        password: "pass",
      });

      const allServers = useServerStore.getState().servers;
      const s1 = allServers[0];
      const s2 = allServers[1];

      // 用 id 确认两个服务器不同
      expect(s1.id).not.toBe(s2.id);

      // 把 s2 设为当前服务器
      useServerStore.getState().setCurrentServer(s2);

      // 确认 currentServer 设置成功
      expect(useServerStore.getState().currentServer?.id).toBe(s2.id);

      // 删除 s1（不是当前服务器）
      await useServerStore.getState().deleteServer(s1.id);

      // currentServer 应该还是 s2
      const current = useServerStore.getState().currentServer;
      expect(current).not.toBeNull();
      expect(current!.name).toBe("NAS2");
    });
  });

  // ==================== 当前服务器选择 ====================
  describe("当前服务器", () => {
    it("设置当前服务器", async () => {
      await useServerStore.getState().addServer({
        name: "NAS",
        url: "https://nas.example.com/dav",
        username: "admin",
        password: "pass",
      });

      const server = useServerStore.getState().servers[0];
      useServerStore.getState().setCurrentServer(server);
      expect(useServerStore.getState().currentServer?.name).toBe("NAS");
    });

    it("清空当前服务器", () => {
      useServerStore.getState().setCurrentServer(null);
      expect(useServerStore.getState().currentServer).toBeNull();
    });
  });

  // ==================== 收藏管理 ====================
  describe("收藏管理", () => {
    it("添加收藏", async () => {
      await useServerStore.getState().addFavorite("server1", "/documents");
      const { favorites } = useServerStore.getState();
      expect(favorites["server1"]).toContain("/documents");
    });

    it("添加多个收藏", async () => {
      await useServerStore.getState().addFavorite("server1", "/documents");
      await useServerStore.getState().addFavorite("server1", "/photos");
      await useServerStore.getState().addFavorite("server1", "/videos");

      expect(useServerStore.getState().favorites["server1"]).toHaveLength(3);
    });

    it("不重复添加相同收藏", async () => {
      await useServerStore.getState().addFavorite("server1", "/documents");
      await useServerStore.getState().addFavorite("server1", "/documents");

      expect(useServerStore.getState().favorites["server1"]).toHaveLength(1);
    });

    it("不同服务器独立收藏", async () => {
      await useServerStore.getState().addFavorite("server1", "/docs");
      await useServerStore.getState().addFavorite("server2", "/photos");

      expect(useServerStore.getState().favorites["server1"]).toContain("/docs");
      expect(useServerStore.getState().favorites["server2"]).toContain("/photos");
    });

    it("移除收藏", async () => {
      await useServerStore.getState().addFavorite("server1", "/documents");
      await useServerStore.getState().addFavorite("server1", "/photos");
      await useServerStore.getState().removeFavorite("server1", "/documents");

      const favs = useServerStore.getState().favorites["server1"];
      expect(favs).not.toContain("/documents");
      expect(favs).toContain("/photos");
    });

    it("移除不存在的收藏不报错", async () => {
      await useServerStore.getState().removeFavorite("server1", "/nonexistent");
      // 不抛异常即通过
    });
  });

  // ==================== 持久化 ====================
  describe("持久化", () => {
    it("保存到 AsyncStorage", async () => {
      await useServerStore.getState().addServer({
        name: "持久化测试",
        url: "https://persist.example.com/dav",
        username: "admin",
        password: "pass",
      });

      const stored = storage["@webdav_servers"];
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe("持久化测试");
    });

    it("收藏保存到 AsyncStorage", async () => {
      await useServerStore.getState().addFavorite("s1", "/test");

      const stored = storage["@webdav_favorites"];
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed["s1"]).toContain("/test");
    });

    it("从 AsyncStorage 加载服务器", async () => {
      // 手动写入 mock 存储
      const mockServers = [
        {
          id: "1",
          name: "加载测试",
          url: "https://load.example.com/dav",
          username: "admin",
          password: "pass",
          createdAt: Date.now(),
        },
      ];
      storage["@webdav_servers"] = JSON.stringify(mockServers);

      await useServerStore.getState().loadServers();
      expect(useServerStore.getState().servers).toHaveLength(1);
      expect(useServerStore.getState().servers[0].name).toBe("加载测试");
    });

    it("从 AsyncStorage 加载收藏", async () => {
      const mockFavs = { server1: ["/a", "/b"] };
      storage["@webdav_favorites"] = JSON.stringify(mockFavs);

      await useServerStore.getState().loadFavorites();
      expect(useServerStore.getState().favorites["server1"]).toEqual(["/a", "/b"]);
    });

    it("AsyncStorage 为空时不报错", async () => {
      await useServerStore.getState().loadServers();
      await useServerStore.getState().loadFavorites();
      expect(useServerStore.getState().servers).toEqual([]);
      expect(useServerStore.getState().favorites).toEqual({});
    });
  });
});
