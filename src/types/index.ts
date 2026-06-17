// WebDAV 服务器连接配置
export interface ServerConfig {
  id: string;           // 唯一标识
  name: string;         // 服务器名称，用户自定义
  url: string;          // WebDAV 地址，如 https://nas.example.com/dav
  username: string;     // 用户名
  password: string;     // 密码
  createdAt: number;    // 创建时间戳
}

// WebDAV 文件/目录条目
export interface FileEntry {
  filename: string;       // 完整路径
  basename: string;       // 文件名（不含路径）
  lastmod: string;        // 最后修改时间
  size: number;           // 文件大小（字节），目录为 0
  type: 'file' | 'directory';
  mime?: string;          // MIME 类型，如 image/jpeg
  etag?: string | null;   // 用于缓存判断
}

// 排序方式
export type SortField = 'name' | 'size' | 'lastmod';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// 视图模式
export type ViewMode = 'list' | 'grid';
