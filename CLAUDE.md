# CLAUDE.md — WebDAV Manager 项目指南

## 项目概述

一个纯 WebDAV 文件管理器移动端应用，用于管理 NAS 上的 WebDAV 文件。
目标：简洁、实用、专注 WebDAV，不做多余的。

## 技术栈

| 层级 | 选型 | 说明 |
|------|------|------|
| 框架 | React Native + Expo (managed workflow) | 开发者是 RN 新手，Expo 降低门槛 |
| 语言 | TypeScript | 类型安全 |
| 包管理 | pnpm | 快，依赖隔离好 |
| 导航 | Expo Router（基于文件路由） | app/ 目录下文件即路由 |
| 状态管理 | Zustand | 轻量，简单 |
| UI | React Native 原生 StyleSheet | 不用第三方 UI 库（避免依赖冲突） |
| WebDAV | `webdav` npm 包 | 纯 JS 实现，RN 兼容 |
| 本地存储 | @react-native-async-storage/async-storage | 存连接配置、收藏 |
| 文件系统 | expo-file-system | 下载文件到本地 |
| 文件选择 | expo-document-picker | 选文件上传 |
| 图片预览 | expo-image | 高性能图片加载，支持 auth headers |
| 安全存储 | expo-secure-store | 可用于存密码（后续优化） |

## WebDAV 协议要点

核心操作映射：
- 列目录 → `PROPFIND /path` (Depth: 1)
- 下载文件 → `GET /path`
- 上传文件 → `PUT /path`
- 创建目录 → `MKCOL /path`
- 删除 → `DELETE /path`
- 重命名/移动 → `MOVE`
- 复制 → `COPY`

`webdav` npm 包封装了这些操作，API 示例：
```ts
import { createClient } from "webdav"

const client = createClient("https://nas.example.com/dav", {
  username: "user",
  password: "pass",
})

const contents = await client.getDirectoryContents("/")
await client.putFileContents("/test.txt", "hello")
await client.getFileContents("/test.txt")
await client.createDirectory("/new-folder")
await client.deleteFile("/old-file.txt")
```

## NAS 连接信息

- WebDAV 已通过公网域名暴露，有效 HTTPS 证书，无需处理自签证书问题
- 具体连接地址和账号由用户在 App 内自行配置

## 项目结构（当前）

```
webdav-manager/
├── app/                        # Expo Router 页面（文件即路由）
│   ├── _layout.tsx             # 根布局（Stack 导航）
│   ├── server-edit.tsx         # 服务器编辑页（modal）
│   ├── file-list.tsx           # 文件浏览页
│   ├── preview.tsx             # 文件预览页
│   └── (tabs)/                 # Tab 布局组
│       ├── _layout.tsx         # Tab 导航配置
│       ├── index.tsx           # 首页（服务器列表）
│       ├── favorites.tsx       # 收藏页
│       └── settings.tsx        # 设置页
├── src/
│   ├── types/index.ts          # TypeScript 类型定义
│   ├── services/webdav.ts      # WebDAV 服务封装层
│   ├── stores/server.ts        # 服务器状态管理
│   ├── stores/theme.ts         # 主题状态管理
│   ├── utils/format.ts         # 工具函数（格式化、图标等）
│   └── components/             # 可复用组件（待开发）
├── src/__tests__/              # 测试文件
│   ├── format.test.ts          # 工具函数测试 (35)
│   ├── store.test.ts           # Store 测试 (19)
│   ├── webdav.test.ts          # WebDAV 服务测试 (26)
│   ├── download.test.ts        # 下载服务测试 (8)
│   ├── theme.test.ts           # 主题测试 (11)
│   └── edge-cases.test.ts      # 边界情况测试 (30)
├── assets/                     # 图标、图片
├── app.json                    # Expo 配置
├── vitest.config.ts            # Vitest 配置
├── CLAUDE.md                   # 本文件
├── PROGRESS.md                 # 进度跟踪
├── package.json
└── tsconfig.json
```

## 测试

运行测试：`pnpm test`
监听模式：`pnpm test:watch`

当前：**126 测试，100% 通过率**

| 文件 | 测试数 | 覆盖范围 |
|------|--------|----------|
| format.test.ts | 35 | formatSize, formatDate, getFileIcon, isPreviewable, getPreviewType |
| store.test.ts | 19 | 服务器 CRUD、收藏管理、持久化存储 |
| webdav.test.ts | 23 | 连接测试、文件列表、创建/删除/移动/复制、上传 |
| download.test.ts | 8 | 文件下载、上传、进度回调 |
| theme.test.ts | 11 | 主题切换、持久化、颜色定义 |
| edge-cases.test.ts | 30 | 边界输入、特殊字符、大写扩展名、类型验证 |

## 开发注意事项

1. **RN 新手友好**：关键代码加注释，避免过度抽象
2. **渐进式开发**：每个 Phase 完成后应可运行，不搞一次性全写完
3. **错误处理**：WebDAV 操作必须有 try-catch，网络错误要友好提示
4. **中文界面**：UI 全部中文
5. **pnpm**：包管理用 pnpm，不用 npm
6. **不引入重依赖**：UI 用 RN 原生 StyleSheet，不引入 react-native-paper 等有兼容问题的库
7. **提交规范**：`type: description@suffix`（见下方）

## 提交信息格式

`type: description@suffix`

| Suffix | 含义 | 示例 |
|---|---|---|
| `@reqXXXXX` | 需求单号 | `feat: 添加 WebDAV 连接@req12345` |
| `@bugXXXXXX` | Bug 单号 | `fix: 修复上传失败@bug123456` |
| `@other` | 无关联单号 | `feat: 文件列表页@other` |

提交前问用户是否有单号，没有就用 `@other`。
