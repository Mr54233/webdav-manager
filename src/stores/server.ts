/**
 * 服务器连接状态管理
 * 用 Zustand 管理：服务器列表、当前连接的服务器、收藏目录
 */
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ServerConfig } from "../types";

// AsyncStorage 的 key
const SERVERS_KEY = "@webdav_servers";
const FAVORITES_KEY = "@webdav_favorites";

interface ServerStore {
  // 服务器列表
  servers: ServerConfig[];
  // 当前选中的服务器
  currentServer: ServerConfig | null;
  // 收藏的目录路径（按服务器 id 分组）
  favorites: Record<string, string[]>;

  // 加载已保存的服务器列表
  loadServers: () => Promise<void>;
  // 添加服务器
  addServer: (server: Omit<ServerConfig, "id" | "createdAt">) => Promise<void>;
  // 更新服务器
  updateServer: (server: ServerConfig) => Promise<void>;
  // 删除服务器
  deleteServer: (id: string) => Promise<void>;
  // 选择当前服务器
  setCurrentServer: (server: ServerConfig | null) => void;

  // 收藏相关
  loadFavorites: () => Promise<void>;
  addFavorite: (serverId: string, path: string) => Promise<void>;
  removeFavorite: (serverId: string, path: string) => Promise<void>;
}

export const useServerStore = create<ServerStore>((set, get) => ({
  servers: [],
  currentServer: null,
  favorites: {},

  loadServers: async () => {
    try {
      const json = await AsyncStorage.getItem(SERVERS_KEY);
      if (json) {
        const servers: ServerConfig[] = JSON.parse(json);
        set({ servers });
      }
    } catch (e) {
      console.error("加载服务器列表失败:", e);
    }
  },

  addServer: async (data) => {
    const server: ServerConfig = {
      ...data,
      // 确保 URL 以 / 结尾
      url: data.url.endsWith("/") ? data.url : data.url + "/",
      // 时间戳 + 随机数，确保唯一
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    const servers = [...get().servers, server];
    set({ servers });
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  },

  updateServer: async (updated) => {
    const servers = get().servers.map((s) =>
      s.id === updated.id ? updated : s
    );
    set({ servers });
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  },

  deleteServer: async (id) => {
    set((state) => {
      const servers = state.servers.filter((s) => s.id !== id);
      return {
        servers,
        // 如果删的是当前选中的，清空；否则保留
        currentServer:
          state.currentServer?.id === id ? null : state.currentServer,
      };
    });
    const servers = get().servers;
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  },

  setCurrentServer: (server) => set({ currentServer: server }),

  loadFavorites: async () => {
    try {
      const json = await AsyncStorage.getItem(FAVORITES_KEY);
      if (json) {
        set({ favorites: JSON.parse(json) });
      }
    } catch (e) {
      console.error("加载收藏失败:", e);
    }
  },

  addFavorite: async (serverId, path) => {
    const favorites = { ...get().favorites };
    if (!favorites[serverId]) favorites[serverId] = [];
    if (!favorites[serverId].includes(path)) {
      favorites[serverId].push(path);
    }
    set({ favorites });
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  },

  removeFavorite: async (serverId, path) => {
    const favorites = { ...get().favorites };
    if (favorites[serverId]) {
      favorites[serverId] = favorites[serverId].filter((p) => p !== path);
    }
    set({ favorites });
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  },
}));
