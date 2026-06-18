# PROGRESS.md — 开发进度跟踪

## 当前状态：🟢 全部功能完成，测试覆盖完整

---

## Phase 1：项目搭建 + 连接管理
**状态：✅ 完成**

- [x] Expo 项目初始化（pnpm + blank-typescript）
- [x] 安装核心依赖（webdav, zustand, expo-router 等）
- [x] Expo Router 路由配置
- [x] 底部 Tab 导航（服务器/收藏/设置）
- [x] 服务器列表页 UI
- [x] 服务器编辑页（新增/编辑连接）
- [x] 连接测试功能
- [x] AsyncStorage 存储连接配置
- [x] TypeScript 类型定义
- [x] WebDAV 服务层封装
- [x] Zustand 状态管理
- [x] 工具函数（格式化、图标、预览判断）

## Phase 2：文件浏览 + 基础操作
**状态：✅ 完成**

- [x] 文件列表页（FlatList）
- [x] 面包屑导航
- [x] 文件类型图标映射（emoji）
- [x] 新建文件夹
- [x] 重命名（Alert.prompt，仅 iOS）
- [x] 删除
- [x] 移动操作
- [x] 复制操作
- [x] 排序功能（名称/大小/时间）
- [x] 搜索功能

## Phase 3：上传下载
**状态：✅ 完成**

- [x] 文件上传（expo-document-picker）
- [x] 文件下载（expo-file-system）
- [x] 进度回调已实现

## Phase 4：搜索 + 收藏
**状态：✅ 完成**

- [x] 文件名搜索
- [x] 目录收藏（Zustand + AsyncStorage）
- [x] 收藏列表和快速跳转

## Phase 5：文件预览
**状态：✅ 完成**

- [x] 图片预览（expo-image + Basic Auth）
- [x] 视频预览页（带下载提示）
- [x] 音频预览页（带下载提示）
- [x] 文本/代码查看

## Phase 6：深色模式
**状态：✅ 完成**

- [x] 主题 Store（light/dark/system）
- [x] 主题持久化（AsyncStorage）
- [x] 设置页主题切换 UI
- [x] 颜色系统（colors 定义）
- [x] useThemeColors hook

## Phase 7：测试
**状态：✅ 完成**

- [x] Vitest 测试框架搭建
- [x] 工具函数测试（formatSize, formatDate, getFileIcon, isPreviewable, getPreviewType）
- [x] Zustand Store 测试（服务器 CRUD、收藏、持久化）
- [x] WebDAV 服务层测试（mock 网络调用）
- [x] 下载服务测试
- [x] 主题 Store 测试
- [x] 边界情况测试

## 测试统计

| 测试文件 | 测试数 | 状态 |
|----------|--------|------|
| format.test.ts | 35 | ✅ |
| store.test.ts | 19 | ✅ |
| webdav.test.ts | 23 | ✅ |
| download.test.ts | 8 | ✅ |
| theme.test.ts | 11 | ✅ |
| edge-cases.test.ts | 30 | ✅ |
| **总计** | **126** | **✅ 全部通过** |

---

## 决策记录

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-06-16 | 技术栈选定 React Native + Expo | 开发者想学 RN，Expo 降低新手门槛 |
| 2026-06-16 | 功能范围定为实用级 | MVP 太简陋，完整级太慢，实用级最合适 |
| 2026-06-16 | WebDAV 库选用 npm `webdav` 包 | 纯 JS 实现，RN 兼容，API 简洁 |
| 2026-06-16 | 状态管理选 Zustand | 比 Redux 轻量，适合中等复杂度 |
| 2026-06-16 | UI 不用第三方库 | react-native-paper 与 Expo SDK 56 有 peer dep 冲突 |
| 2026-06-16 | 包管理用 pnpm | 比 npm 快，依赖隔离更好 |
| 2026-06-16 | 文件图标用 emoji | 快速实现，无需引入图标库 |
| 2026-06-16 | 测试框架选 Vitest | 比 Jest 快，API 兼容，配置简单 |
| 2026-06-16 | ID 生成用时间戳+随机数 | Date.now() 快速调用时可能重复 |
| 2026-06-16 | 主题支持 light/dark/system | 跟随系统是现代 App 的标配 |
