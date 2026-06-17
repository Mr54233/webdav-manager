/**
 * WebDAV 服务层
 * 封装 webdav npm 包，提供简洁的文件操作 API
 * 页面层只调用这里的方法，不直接操作底层库
 */
import { createClient, WebDAVClient, FileStat } from "webdav";
import { ServerConfig, FileEntry } from "../types";

// 缓存当前客户端实例，避免重复创建
let currentClient: WebDAVClient | null = null;
let currentServerId: string | null = null;

/**
 * 获取或创建 WebDAV 客户端
 * 如果切换了服务器，会重新创建
 */
export function getClient(server: ServerConfig): WebDAVClient {
  if (currentClient && currentServerId === server.id) {
    return currentClient;
  }
  // 断开旧连接
  currentClient = null;

  currentClient = createClient(server.url, {
    username: server.username,
    password: server.password,
  });
  currentServerId = server.id;
  return currentClient;
}

/**
 * 测试连接是否正常
 * 尝试列目录，成功返回 true
 */
export async function testConnection(server: ServerConfig): Promise<boolean> {
  try {
    const client = getClient(server);
    await client.getDirectoryContents("/");
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取目录内容
 * 返回 FileEntry 数组，已过滤掉隐藏文件
 */
export async function listFiles(
  server: ServerConfig,
  path: string = "/"
): Promise<FileEntry[]> {
  const client = getClient(server);
  const contents = await client.getDirectoryContents(path);

  // webdav 包返回的可能是单个对象或数组
  const items: FileStat[] = Array.isArray(contents)
    ? contents
    : (contents as any).data;

  return items
    .filter((item) => !item.basename.startsWith(".")) // 过滤隐藏文件
    .map((item) => ({
      filename: item.filename,
      basename: item.basename,
      lastmod: item.lastmod,
      size: typeof item.size === "number" ? item.size : 0,
      type: item.type as "file" | "directory",
      mime: item.mime,
      etag: item.etag,
    }));
}

/**
 * 创建目录
 */
export async function createDirectory(
  server: ServerConfig,
  path: string
): Promise<void> {
  const client = getClient(server);
  await client.createDirectory(path, { recursive: true });
}

/**
 * 删除文件或目录
 */
export async function deleteItem(
  server: ServerConfig,
  path: string
): Promise<void> {
  const client = getClient(server);
  await client.deleteFile(path);
}

/**
 * 重命名/移动文件
 */
export async function moveItem(
  server: ServerConfig,
  fromPath: string,
  toPath: string
): Promise<void> {
  const client = getClient(server);
  await client.moveFile(fromPath, toPath);
}

/**
 * 复制文件
 */
export async function copyItem(
  server: ServerConfig,
  fromPath: string,
  toPath: string
): Promise<void> {
  const client = getClient(server);
  await client.copyFile(fromPath, toPath);
}

/**
 * 获取文件下载 URL
 * 用于直接在浏览器/WebView 中打开文件
 */
export function getFileUrl(server: ServerConfig, path: string): string {
  // 构造带认证的 URL
  const base = server.url.replace(/\/$/, "");
  const encodedPath = path
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  return `${base}${encodedPath}`;
}

/**
 * 上传文件内容
 * @param path 远程路径
 * @param content 文件内容（字符串或 Buffer）
 */
export async function uploadFile(
  server: ServerConfig,
  path: string,
  content: string | Buffer
): Promise<void> {
  const client = getClient(server);
  await client.putFileContents(path, content);
}

/**
 * 断开连接（清理缓存）
 */
export function disconnect(): void {
  currentClient = null;
  currentServerId = null;
}
