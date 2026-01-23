---
title: README
description: ''
cover: ''
date: '2026-01-22'
status: published
category: 开发文档
tags: []
updated: '2026-01-23'
wordCount: 3188
readingTime: 8
---
# MyBlog 使用文档

## 📦 开箱即用指南

### 1. 快速开始

#### 环境要求
- Node.js >= 20.x
- npm 或 pnpm

#### 安装依赖
```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

#### 启动开发服务器
```bash
npm run dev
```

#### 构建生产版本
```bash
npm run build
```

#### 本地预览生产版本
```bash
npm run preview
```

### 2. 项目结构

```
myblog/
├── local-cms/           # 本地CMS管理系统
├── public/              # 静态资源目录
│   ├── music/           # 音乐文件
│   └── uploads/         # 上传文件
├── src/                 # 源代码
│   ├── assets/          # 资源文件
│   │   ├── css/         # 样式文件
│   │   ├── friendsAvatar/ # 友链头像
│   │   ├── gallery/     # 相册图片
│   │   └── img/         # 系统图标
│   ├── components/      # Vue组件
│   ├── posts/           # 博客内容
│   │   ├── dataJs/      # 结构化数据（说说、友链等）
│   │   └── *.md         # 文章Markdown文件
│   ├── router/          # 路由配置
│   └── views/           # 页面视图
│       ├── cms/         # CMS管理页面
│       └── layout/      # 布局组件
├── index.html           # 入口HTML
├── package.json         # 项目配置
└── vite.config.js       # Vite配置
```

## 🎛️ CMS管理平台使用
> cms使用文档可以在youthy.site网站里面查看

### 1. 启动CMS

```bash
npm run admin
```

这将同时启动：
- 本地开发服务器 (http://localhost:5173)
- CMS管理系统后端 (http://localhost:3000)

### 2. 访问CMS

打开浏览器访问：http://localhost:5173/cms

### 3. CMS功能模块

#### 3.1 仪表盘
- 查看博客统计信息
- 快速导航到各功能模块

#### 3.2 文章管理
- **文章列表**：查看、搜索、排序文章
- **撰写新文章**：使用Markdown编辑器撰写文章
- **编辑文章**：修改已有文章
- **删除文章**：删除文章
- **批量管理**：批量删除文章

#### 3.3 分类与标签管理
- **分类管理**：创建、编辑、删除分类
- **标签管理**：创建、编辑、删除标签
- **文章关联**：将文章添加到分类或标签

#### 3.4 说说管理
- **说说列表**：查看、编辑、删除说说
- **添加说说**：发布新说说
- **拖拽排序**：调整说说顺序

#### 3.5 友链管理
- **友链列表**：查看、编辑、删除友链
- **添加友链**：新增友链
- **拖拽排序**：调整友链顺序

#### 3.6 相册管理
- **相册列表**：查看、编辑、删除相册
- **添加相册**：上传新照片
- **拖拽排序**：调整照片顺序

#### 3.7 摘录管理
- **摘录列表**：查看、编辑、删除摘录
- **添加摘录**：新增摘录

#### 3.8 媒体管理
- **文件上传**：上传图片、视频等媒体文件
- **文件管理**：查看、删除上传的文件

#### 3.9 系统管理
- **基本设置**：配置博客基本信息
- **主题设置**：调整博客主题

## 🛠️ 改造成自己的博客

### 1. 个性化配置

#### 1.1 修改个人信息

编辑 `src/views/home/selfprofile.vue`：
- 头像
- 昵称
- 简介
- 社交链接

编辑 `src/views/layout/myfooter.vue`：
- 备案信息
- 运行时间
- 版权信息

#### 1.2 修改导航栏

编辑 `src/views/layout/myheader.vue` 中的 `navItems` 数组：
```javascript
const navItems = [
  { name: '首页', path: '/layout/home' },
  { name: '文章', path: '/layout/article' },
  { name: '分类', path: '/layout/category' },
  { name: '标签', path: '/layout/tag' },
  { name: '时间轴', path: '/layout/time' },
  { name: '说说', path: '/layout/thinking' },
  { name: '摘录', path: '/layout/quote' },
  { name: '相册', path: '/layout/gallery' },
  { name: '友链', path: '/layout/friends' },
  { name: '关于', path: '/layout/about' }
]
```

#### 1.3 修改主题色

编辑 `src/assets/css/theme-vars.scss`，调整CSS变量：
```scss
:root {
  --color-bg-root: 248 250 252;
  --color-bg-primary: 255 255 255;
  --color-bg-secondary: 240 244 248;
  --color-text-primary: 45 55 72;
  --color-text-secondary: 100 116 139;
  --color-border-primary: 214 226 238;
  --color-accent: 66 153 225;
}
```

### 2. 发布内容

#### 2.1 发布文章

使用CMS管理平台的文章编辑器撰写文章，或直接在 `src/posts/` 目录下创建Markdown文件：

```markdown
---
title: 文章标题
date: 2025-12-18
category: 分类
tags: [标签1, 标签2]
description: 文章描述
cover: /uploads/cover.jpg
---

文章内容...
```

#### 2.2 发布说说

使用CMS管理平台的说说管理功能，或直接编辑 `src/posts/dataJs/thoughts.js`：

```javascript
export const thoughts = [
  {
    content: "今天天气不错",
    date: "2025-12-18 10:00",
    week: "星期四",
    likes: 0,
    comments: 0
  }
]
```

#### 2.3 发布相册

使用CMS管理平台的相册管理功能，或直接编辑 `src/posts/dataJs/photos.js`：

```javascript
export const photos = [
  {
    url: "/src/assets/gallery/photo.jpg",
    date: "2025-12-18",
    description: "照片描述",
    location: "地点"
  }
]
```

### 3. 自定义功能

#### 3.1 添加新页面

1. 在 `src/views/` 目录下创建新的Vue组件
2. 在 `src/router/index.js` 中配置路由
3. 在导航栏中添加链接

#### 3.2 添加新组件

在 `src/components/` 目录下创建新的Vue组件，然后在需要的页面中引入使用。

#### 3.3 修改样式

编辑 `src/assets/css/` 目录下的样式文件：
- `global.scss`：全局样式
- `markdown.scss`：Markdown样式
- `theme-vars.scss`：主题变量

### 4. 部署博客

#### 4.1 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录下。

#### 4.2 部署到静态托管服务

- **Vercel**：直接上传 `dist/` 目录
- **Netlify**：直接上传 `dist/` 目录
- **GitHub Pages**：上传 `dist/` 目录到GitHub仓库
- **自己的服务器**：将 `dist/` 目录部署到Web服务器


