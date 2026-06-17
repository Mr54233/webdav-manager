/**
 * 下载服务
 * 用 expo-file-system 把远程文件下载到本地
 */
import * as FileSystem from "expo-file-system";
import { ServerConfig } from "../types";
import { getClient } from "./webdav";

/**
 * 下载文件到本地缓存目录
 * @param server 服务器配置
 * @param remotePath 远程文件路径
 * @param onProgress 进度回调 (0-1)
 * @returns 本地文件路径
 */
export async function downloadFile(
  server: ServerConfig,
  remotePath: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // 构造带认证的 URL
  const base = server.url.replace(/\/$/, "");
  const encodedPath = remotePath
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  const url = `${base}${encodedPath}`;

  // 本地文件名
  const fileName = remotePath.split("/").filter(Boolean).pop() || "download";
  // cacheDirectory 可能是字符串或 undefined，给个默认值
  const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).Paths?.cache || "/tmp/";
  const localPath = `${cacheDir}${fileName}`;

  // 下载
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    localPath,
    {
      headers: {
        Authorization: `Basic ${btoa(`${server.username}:${server.password}`)}`,
      },
    },
    (downloadProgress) => {
      if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        onProgress(Math.min(progress, 1));
      }
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result) {
    throw new Error("下载失败");
  }
  return result.uri;
}

/**
 * 上传本地文件到远程
 * @param server 服务器配置
 * @param localUri 本地文件 URI
 * @param remotePath 远程目标路径
 */
export async function uploadFile(
  server: ServerConfig,
  localUri: string,
  remotePath: string
): Promise<void> {
  // 读取本地文件内容
  const content = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 用 webdav 包上传
  const client = getClient(server);
  const buffer = Buffer.from(content, "base64");
  await client.putFileContents(remotePath, buffer);
}
