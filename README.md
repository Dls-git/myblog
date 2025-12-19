---
title: MyBlog 开发文档
date: 2025-12-18
category: 开发文档
tags:
    - Markdown
    - blog
    - 文档
    - 开发
description: 基于 Vue 3 + Vite 的静态博客系统开发详解
updated: 2025-12-18
readingTime: 20
wordCount: 4500
---

# MyBlog 项目开发文档

## 1. 项目简介

**MyBlog** 是一个基于 **Vue 3** 和 **Vite** 构建的现代静态博客系统。它采用了 **"File-as-Database"（文件即数据库）** 的架构思想，无需传统的后端数据库（如 MySQL），所有的文章数据直接来源于项目中的 Markdown 文件。

**核心功能：**
*   **Markdown 驱动**：直接编写 `.md` 文件即可发布文章。
*   **即时渲染**：支持代码高亮、目录（TOC）自动生成、图片解析。
*   **内容聚合**：自动聚合文章、说说、摘录、瞬间（照片）等多种内容形式。
*   **多维归档**：支持按分类、标签、时间轴进行归档查看。
*   **交互体验**：集成音乐播放器、粒子特效、评论系统、图片灯箱等丰富交互。
*   **响应式设计**：完美适配 PC 和移动端，支持平滑切换的暗黑模式。

---

## 2. 技术选型

### 核心框架
*   **Vue 3 (Composition API)**：使用组合式 API 构建，逻辑复用性强。
*   **Vite**：提供极速的冷启动和热更新（HMR），构建速度极快。
*   **Vue Router**：处理单页应用（SPA）的路由跳转。

### Markdown 渲染引擎
*   **markdown-it**：核心解析器，负责将 Markdown 转换为 HTML。
*   **Shiki**：基于 TextMate 语法的构建时代码高亮引擎，生成无需运行时 JS 的高性能高亮代码。
*   **Gray-matter**：解析 Markdown 文件顶部的 YAML Frontmatter 元数据。

### 样式与适配
*   **SCSS**：CSS 预处理器，利用变量和嵌套简化样式编写。
*   **PostCSS (postcss-px-to-viewport)**：自动将 `px` 转换为 `vw`，实现移动端完美适配。
*   **FontAwesome / Ant Design Icons**：提供丰富的图标资源。

---

## 3. 项目结构说明

### 📂 目录树预览

```text
src/
├── assets/                 # 静态资源
│   ├── css/                # 全局样式 (global.scss, markdown.scss 等)
│   ├── friendsAvatar/      # 友链头像
│   ├── gallery/            # 相册图片
│   └── img/                # 系统图标
├── components/             # 全局通用组件
│   ├── ActivityGraph.vue   # 贡献度热力图
│   ├── BackToTop.vue       # 返回顶部火箭
│   ├── ClickEffects.vue    # 鼠标点击粒子特效
│   ├── CommentSection.vue  # 评论区组件
│   ├── ImageLightbox.vue   # 图片灯箱
│   ├── MusicPlayer.vue     # 全局音乐播放器
│   ├── ReadingProgress.vue # 阅读进度条
│   └── Toc.vue             # 目录导航
├── markdown/               # Markdown 渲染核心
│   ├── render.js           # 渲染器逻辑 (markdown-it + shiki)
│   └── vite-plugin-md.js   # Vite 插件
├── posts/                  # 内容数据源
│   ├── *.md                # 文章源文件
│   ├── dataJs/             # 结构化数据
│   │   ├── friendList.js   # 友链
│   │   ├── photos.js       # 相册
│   │   ├── quotes.js       # 摘录
│   │   └── thoughts.js     # 说说
│   └── index.js            # 数据索引入口
├── views/                  # 页面视图
│   ├── home/               # 首页
│   ├── layout/             # 布局框架
│   ├── post/               # 文章详情页
│   ├── time/               # 时间轴页
│   ├── friends/            # 友链页
│   ├── gallery/            # 瞬间/相册页
│   ├── quote/              # 摘录页
│   ├── thinking/           # 思考页
│   ├── category/           # 分类页
│   └── tag/                # 标签页
├── App.vue                 # 根组件 (标题搞怪特效)
└── main.js                 # 入口文件
```

---

## 4. 核心架构深度解析

### 4.1 "文件即数据库" 的实现原理

本项目没有数据库，数据流转完全依赖构建工具的处理：

1.  **数据源 (Source)**：`src/posts/*.md` 文件。
2.  **构建拦截 (Build Time)**：
    *   `vite-plugin-md.js` 拦截对 `.md` 文件的导入请求。
    *   调用 `render.js`，利用 `gray-matter` 提取元数据，`markdown-it` 生成 HTML，`shiki` 处理高亮。
    *   将结果封装为一个包含 `html`, `frontmatter`, `toc` 的 JS 对象返回。
3.  **数据索引 (Indexing)**：
    *   `src/posts/index.js` 使用 `import.meta.glob('./*.md', { eager: true })` 暴力加载所有文章。
    *   导出一个全局的 `posts` 对象，这就是全站的“数据库”。
4.  **运行时消费 (Runtime)**：
    *   `PostPage.vue` 根据路由参数 `slug` 从 `posts` 对象中直接读取数据渲染。
    *   `CategoryPage.vue` 和 `TagPage.vue` 通过 `computed` 属性遍历 `posts` 对象进行实时筛选。

**优势**：
*   **极致性能**：所有解析工作在构建时完成，运行时无 Markdown 解析开销。
*   **零网络请求**：页面切换纯粹是内存数据读取，无需 API 请求。
*   **部署简单**：构建后只是纯静态文件，可部署在任何静态托管服务上。

### 4.1.1 Markdown 渲染数据对象详解

经过构建工具处理后，每个 Markdown 文件最终会转化为一个标准的 JavaScript 对象。理解这个对象的结构对于二次开发至关重要。

**Post 对象结构示例：**

```javascript
{
  // 1. 渲染后的 HTML 字符串
  // 包含了 Shiki 生成的内联样式代码高亮
  // 包含了转为 Base64 的本地图片
  html: `<h1 id="hello">Hello</h1><p>...</p>`,

  // 2. 目录结构 (TOC)
  // 用于 Toc.vue 组件生成侧边导航
  toc: [
    { text: "简介", id: "intro", level: 2 },
    { text: "安装步骤", id: "install", level: 2 },
    { text: "配置说明", id: "config", level: 3 }
  ],

  // 3. 元数据 (Frontmatter)
  // 解析自 Markdown 文件顶部的 YAML 区域
  frontmatter: {
    title: "Vue3 深度解析",      // 文章标题
    date: "2025-12-18",         // 发布日期
    category: "Frontend",       // 分类 (用于归档)
    tags: ["Vue", "Vite"],      // 标签 (用于归档)
    description: "...",         // 文章摘要
    cover: "/img/vue.png",      // 封面图路径
    wordCount: 2300,            // 字数统计 (可选)
    readingTime: 8              // 阅读时长 (可选)
  }
}
```

**全局 Posts 对象 (`src/posts/index.js`)：**

全站的数据汇聚成一个大的字典对象，Key 为文件名为 (Slug)，Value 为上述的 Post 对象。

```javascript
export const posts = {
  "hello-world": { html: "...", frontmatter: {...}, toc: [...] },
  "vue-tutorial": { html: "...", frontmatter: {...}, toc: [...] }
}
```

### 4.1.2 Markdown 渲染管线深度解析

Markdown 的渲染过程是本项目构建环节的核心。为了实现“零运行时开销”，我们将所有繁重的文本解析工作都移到了 **构建阶段 (Build Time)**。

整个渲染管线分为三个阶段：

#### 阶段一：Vite 拦截 (`vite-plugin-md.js`)

我们编写了一个自定义 Vite 插件。当 Vite 遇到 `.md` 文件的导入请求时，`transform` 钩子会被触发：

```javascript
// src/markdown/vite-plugin-md.js
transform(code, id) {
  if (!id.endsWith('.md')) return;
  
  // 1. 读取文件内容
  // 2. 调用渲染核心
  const { html, toc, frontmatter } = await renderMarkdown(code, id);
  
  // 3. 封装为 JS 模块返回
  return `export default {
    html: ${JSON.stringify(html)},
    toc: ${JSON.stringify(toc)},
    frontmatter: ${JSON.stringify(frontmatter)}
  }`;
}
```

#### 阶段二：解析与转换 (`render.js`)

这是渲染引擎的内核，主要完成四项工作：

1.  **元数据剥离**：使用 `gray-matter` 将文件顶部的 YAML 配置提取为 `frontmatter` 对象。
2.  **构建时高亮 (Shiki)**：
    *   不同于常见的浏览器端高亮（如 Highlight.js），我们使用 `Shiki` 在 Node.js 环境下预先生成带有内联样式的 HTML。
    *   这意味着浏览器不需要加载任何 CSS 文件或 JS 库来处理代码高亮，加载即渲染，速度极快。
3.  **目录提取 (TOC)**：
    *   通过拦截 `markdown-it` 的 `heading_open` 钩子，我们在渲染 `h2/h3` 标签时，顺便收集标题文本和 ID，生成目录树数组。
4.  **资源内联化**：
    *   **难点**：Markdown 中的 `![](./img/a.png)` 是相对路径，在 SPA 中直接引用会失效。
    *   **解决**：我们拦截了 `image` 渲染规则，使用 `fs.readFileSync` 直接读取本地图片文件，将其转换为 Base64 字符串嵌入 HTML。这实现了真正的“单文件自包含”。

#### 阶段三：模块封装

经过上述处理，原本的 `.md` 文本文件在浏览器眼里，变成了一个普通的 JavaScript 对象。这使得我们可以像操作 JSON 一样操作博客文章数据。

### 4.1.3 动态路由与分类生成机制

MyBlog 的一个核心特性是**自动化**。你只需要专注于写 Markdown，不需要手动维护路由表或分类列表。

#### 1. 动态路由匹配 (`src/router/index.js`)

我们使用了 Vue Router 的动态片段 (Dynamic Segments) 功能：

```javascript
{
  path: '/layout/post/:slug',     // 匹配 /layout/post/hello-world
  component: () => import('@/views/post/PostPage.vue')
},
{
  path: '/layout/category/:name', // 匹配 /layout/category/Frontend
  component: () => import('@/views/category/CategoryPage.vue')
},
{
  path: '/layout/tag/:name',      // 匹配 /layout/tag/Vue
  component: () => import('@/views/tag/TagPage.vue')
}
```

#### 2. 分类/标签的“无中生有”

你可能会问：*“我没有创建过分类表，系统怎么知道有哪些分类？”*

答案在 **运行时计算**。当用户访问 `/layout/category/Frontend` 时：
1.  **路由匹配**：Vue Router 捕获到参数 `name = "Frontend"`。
2.  **组件挂载**：`CategoryPage.vue` 组件被激活。
3.  **实时扫描**：组件内部的 `computed` 属性会遍历全局 `posts` 对象，筛选出 `frontmatter.category === "Frontend"` 的文章。
4.  **自动去重**：侧边栏的“分类墙”也是同理，它遍历所有文章，提取所有分类名并去重统计，从而动态生成分类列表。

这种**“查时即建” (Read-time Construction)** 的策略，彻底消除了维护“分类表”的繁琐。

### 4.2 特色功能实现细节

#### 🎵 全局音乐播放器 (MusicPlayer)
*   **持久化**：利用 `localStorage` 记录播放进度、当前曲目和最小化状态。
*   **防御性编程**：处理了浏览器自动播放策略限制，确保用户体验流畅。
*   **交互**：支持歌单切换、进度拖拽、黑胶旋转动画。

#### 🌌 交互特效
*   **点击粒子 (ClickEffects)**：使用 Canvas 实现鼠标点击时的彩色粒子爆炸效果。
*   **标题搞怪 (App.vue)**：监听 `visibilitychange` 事件，用户切换标签页时修改 `document.title` 卖萌。
*   **暗黑模式**：基于 CSS 变量 (`var(--color-bg-primary)`) 和 View Transitions API 实现平滑的圆形扩散切换动画。

#### 📅 全能时间轴 (TimeLine)
*   **聚合展示**：`time.vue` 不仅展示文章，还通过数据合并逻辑，将说说、摘录、相册更新按时间倒序穿插展示。
*   **多态渲染**：不同类型的内容使用不同颜色的节点和图标，并支持跳转到各自的详情页。

### 4.3 数据走向与时间轴聚合原理

**时间轴 (TimeLine)** 是本项目中数据聚合最复杂的模块，它将**文章、说说、摘录、瞬间**四种不同结构的数据源统一处理，按时间倒序排列。

#### 1. 数据源头 (Data Sources)
所有数据均存储在 `src/posts/` 目录下，但分为两类：
*   **文章 (Posts)**：来源于 `.md` 文件，通过 `src/posts/index.js` 统一导出为一个对象 `posts`。
*   **轻量内容 (Micro Content)**：来源于 `src/posts/dataJs/` 下的 `.js` 文件，直接导出为数组：
    *   `thoughts.js` (说说)
    *   `quotes.js` (摘录)
    *   `photos.js` (瞬间/相册)

#### 2. 数据标准化 (Normalization)
在 `src/views/time/time.vue` 中，我们使用 Vue 的 `computed` 属性将上述四种异构数据统一转换为标准格式：

```javascript
// 伪代码逻辑
const allItems = computed(() => {
  // 1. 处理文章
  const postItems = Object.keys(posts).map(slug => ({
    type: 'post',
    title: posts[slug].frontmatter.title,
    date: new Date(posts[slug].frontmatter.date),
    link: `/layout/post/${slug}`
  }));

  // 2. 处理说说
  const thoughtItems = thoughts.map(item => ({
    type: 'thought',
    title: item.content, // 说说内容即标题
    date: new Date(item.date),
    link: '/layout/thinking'
  }));

  // ... 同理处理 quotes 和 photos ...

  // 3. 合并并按时间倒序排序
  return [...postItems, ...thoughtItems, ...quoteItems, ...photoItems]
    .sort((a, b) => b.date - a.date);
});
```

#### 3. 按年份分组 (Grouping)
为了在时间轴上展示年份节点，我们对排序后的数据进行了二次处理：
```javascript
const itemsByYear = computed(() => {
  const groups = {};
  allItems.value.forEach(item => {
    const year = item.date.getFullYear();
    if (!groups[year]) groups[year] = [];
    groups[year].push(item);
  });
  return groups; // { 2025: [...], 2024: [...] }
});
```

#### 4. 视图渲染 (Rendering)
最终，`<template>` 遍历 `itemsByYear`，根据 `item.type` 动态决定：
*   **节点颜色**：文章(蓝)、说说(绿)、摘录(紫)、瞬间(橙)。
*   **图标**：💡 / 🔖 / 📷。
*   **跳转逻辑**：文章跳转至详情页，其他类型跳转至各自的列表归档页。

### 4.4 主题切换系统详解

本项目的主题切换（Light/Dark Mode）不依赖任何第三方 UI 库，完全基于 **CSS 变量** 和原生 **View Transitions API** 实现，兼顾了性能与视觉体验。

#### 1. CSS 变量定义 (`src/assets/css/global.scss`)

我们使用 RGB 三元组格式定义变量，以便在 CSS 中动态调整透明度。

```scss
/* 默认模式 (Light) */
:root {
  --color-bg-primary: 255, 255, 255;      /* 卡片背景 */
  --color-text-primary: 31, 35, 41;       /* 主文本 */
  // ...
}

/* 暗黑模式 (Dark) */
/* 当 html 标签带有 data-theme='dark' 属性时生效 */
[data-theme='dark'] {
  --color-bg-primary: 30, 30, 30;
  --color-text-primary: 225, 225, 225;
  // ...
}
```

#### 2. 切换逻辑 (`src/views/layout/myheader.vue`)

切换本质是修改 `<html>` 标签的属性：

```javascript
function applyTheme() {
  if (theme.value === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}
```

#### 3. 圆形扩散动画 (View Transitions API)

这是项目的一大亮点。我们在切换主题时，利用 View Transitions API 截取屏幕快照，并使用 Canvas 计算圆形剪裁路径，实现类似 Telegram 的扩散动画。

**核心代码实现：**

```javascript
function toggleTheme(event) {
  // 1. 获取点击坐标作为圆心
  const x = event.clientX
  const y = event.clientY

  // 2. 计算覆盖全屏所需的最大半径
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  // 3. 启动视图过渡
  const transition = document.startViewTransition(() => {
    // 切换 DOM 状态 (Light -> Dark)
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme()
  })

  // 4. 执行自定义动画
  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ]
    
    // 使用 Web Animations API 驱动伪元素
    document.documentElement.animate(
      { clipPath: clipPath },
      {
        duration: 400,
        easing: 'ease-in',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  })
}
```

**CSS 配合：**
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;       /* 禁用默认的淡入淡出 */
  mix-blend-mode: normal; /* 确保颜色准确 */
}
```

### 4.5 全局搜索实现 (Client-side Search)

由于是纯静态博客，我们无法使用 Elasticsearch 等后端搜索引擎。因此，我们实现了一个轻量级的**客户端全文检索**。

#### 1. 索引构建 (Indexing)
在 `src/views/layout/myheader.vue` 中，我们首先将所有文章数据“拍平”为一个搜索索引数组：

```javascript
const allPosts = computed(() => {
  return Object.keys(posts).map(slug => ({
    slug,
    title: posts[slug].frontmatter.title,
    category: posts[slug].frontmatter.category,
    tags: posts[slug].frontmatter.tags,
    // 我们只索引了标题、分类和标签，没有索引正文以保证性能
    // 如果需要索引正文，可以在这里加入 content 字段
  }))
})
```

#### 2. 实时过滤 (Filtering)
当用户输入关键词时，通过 `filter` 函数实时匹配：
```javascript
const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return allPosts.value.filter(post => {
    return post.title.includes(query) || 
           post.category.includes(query) || 
           post.tags.some(t => t.includes(query))
  })
})
```
这种纯前端的搜索方式响应速度极快（通常 < 10ms），对于千篇以内的博客文章规模绰绰有余。

### 4.6 Markdown 样式定制指南

由于 Markdown 渲染出的 HTML 是没有任何类名（Class Name）的纯标签（如 `<h1>`, `<p>`, `<ul>`），为了防止污染全局样式，我们采用了 **作用域样式隔离** 的策略。

#### 1. 样式文件位置
所有的 Markdown 专用样式都集中在 **`src/assets/css/markdown.scss`**。

#### 2. 作用域隔离原理
在 `PostPage.vue` 中，我们将文章内容的容器加上了 `.markdown-body` 类：

```html
<div class="markdown-body" v-html="post.html"></div>
```

而在 `markdown.scss` 中，我们利用 SCSS 的嵌套特性，将所有样式限定在这个类之下：

```scss
// src/assets/css/markdown.scss
.markdown-body {
  // 基础排版
  h1, h2, h3, h4, h5, h6 {
    color: rgb(var(--color-text-primary));
    margin-top: 1.5em;
  }
  
  p {
    line-height: 1.8; // 优化阅读体验
  }

  // 代码块高亮背景适配
  pre.shiki {
    background-color: #1e1e1e !important; // 强制深色背景
    border-radius: 8px;
    padding: 16px;
  }

  // 图片自适应
  img {
    max-width: 100%;
    border-radius: 8px;
  }
}
```

#### 3. 如何修改样式
如果你想调整文章的字体大小、行高或者引用块的样式，**请直接修改 `src/assets/css/markdown.scss`**，不要去改 `global.scss`，这样可以确保你的修改只会影响博客正文，而不会破坏导航栏或侧边栏的布局。

### 4.7 主题变量系统 (Theme System)

为了更好地管理主题色（特别是为了支持 Element Plus 和 Ant Design 等第三方库的深色模式适配），我们将所有**颜色变量**从 `global.scss` 中独立出来，放入了 **`src/assets/css/theme-vars.scss`**。

#### 1. 文件定位
*   **`src/assets/css/global.scss`**：负责全局布局、重置样式、原子类。
*   **`src/assets/css/theme-vars.scss`**（原名 newmd.scss）：负责定义 CSS 变量（CSS Custom Properties）。

#### 2. 变量定义规范
在这个文件中，我们通过媒体查询 `@media (prefers-color-scheme: dark)` 和属性选择器 `[data-theme='dark']` 来同时支持：
1.  **系统级深色模式**（跟随操作系统）。
2.  **手动切换深色模式**（用户点击按钮）。

```scss
// src/assets/css/theme-vars.scss
html {
  // 默认亮色变量
  --color-bg-primary: 255 255 255;
  
  // 深色模式覆盖
  &[data-theme=dark] {
    --color-bg-primary: 24 27 31 !important;
    // ...
  }
}
```

#### 3. 为什么需要独立文件？
将变量独立出来，可以确保在 `main.js` 中引入顺序的灵活性，并且让 `global.scss` 更加纯粹地关注布局逻辑，而非配色。




---

## 5. 如何使用与维护

### 5.1 开箱即用指南 (Quick Start)

本项目设计为开箱即用。如果你克隆了本项目，只需修改以下几个位置的数据，即可将其变为你自己的博客。

#### 1. 修改个人信息
打开 `src/views/home/selfprofile.vue` 和 `src/views/layout/myfooter.vue`，修改其中的：
*   **头像与昵称**
*   **社交链接** (GitHub, Bilibili 等)
*   **运行时间** (在 footer 中修改 `startDate`)

#### 2. 修改导航栏
打开 `src/views/layout/myheader.vue` 中的 `navItems` 数组，可以增删菜单项或修改路由跳转。

#### 3. 替换内容数据
*   **文章**：清空 `src/posts/*.md`，放入你自己的 Markdown 文件。
*   **说说/摘录/相册**：直接编辑 `src/posts/dataJs/` 下的三个 JS 文件。它们都是纯数组结构，直接替换内容即可。

#### 4. 友链配置
修改 `src/posts/dataJs/friendList.js`，按照现有格式添加你的友链信息。头像图片请放入 `src/assets/friendsAvatar/` 目录。

### 5.2 发布内容

#### 发布文章
在 `src/posts/` 下新建 `.md` 文件，头部添加 Frontmatter：
```yaml
---
title: 文章标题
date: 2025-12-18
category: 技术
tags: [Vue, Web]
description: 文章描述
cover: 可选封面图路径
---
```

#### 发布说说/摘录/照片
直接修改 `src/posts/dataJs/` 下对应的 `.js` 文件（`thoughts.js`, `quotes.js`, `photos.js`），只需在数组中追加对象即可。

### 5.3 进阶：如何管理非文章类内容

本博客不仅支持 Markdown 文章，还支持说说、摘录、瞬间等轻量级内容。这些数据均存储在 `src/posts/dataJs/` 目录下。

#### 1. 说说 (Thoughts)
编辑 `src/posts/dataJs/thoughts.js`。
*   **格式**：数组对象。
*   **字段**：`content` (内容), `date` (时间), `location` (可选地点)。

```javascript
export const thoughts = [
  {
    content: "今天天气不错，适合写代码。",
    date: "2025-12-18 10:00",
    location: "Shanghai"
  }
]
```

#### 2. 摘录 (Quotes)
编辑 `src/posts/dataJs/quotes.js`。
*   **字段**：`content` (摘录内容), `author` (作者), `source` (出处), `date` (时间)。

#### 3. 瞬间/相册 (Photos)
编辑 `src/posts/dataJs/photos.js`。
*   **字段**：`url` (图片路径), `date` (时间), `description` (描述), `location` (地点)。
*   **图片存放**：建议将图片文件放入 `src/assets/gallery/` 目录。

#### 4. 分类与标签 (Categories & Tags)
**注意**：分类和标签**不需要**在任何单独的地方配置！
*   它们是**自动生成**的。
*   你只需要在发布 Markdown 文章时，在 Frontmatter 中填写 `category` 和 `tags` 字段。
*   系统会自动扫描所有文章，动态生成分类墙和标签云。

```yaml
---
category: 前端开发  <-- 这里写什么，分类页就显示什么
tags: [Vue3, 教程] <-- 这里写什么，标签页就显示什么
---
```

#### 5. 音乐播放器配置 (Music Player)
编辑 `src/components/MusicPlayer.vue` 中的 `playlist` 数组。
*   **音频文件存放**：请将 `.mp3` 或 `.flac` 文件放入 `public/music/` 目录（注意是根目录下的 `public` 文件夹，不是 `src/assets`）。
*   **引用方式**：`src` 字段直接填写 `/music/文件名.mp3`。

```javascript
const playlist = ref([
  {
    title: '歌曲名',
    artist: '歌手',
    src: '/music/song.mp3', // 对应 public/music/song.mp3
    cover: '封面图URL'      // 可选
  }
])
```

#### 6. 邮箱联系弹窗 (Email Modal)
在 `src/views/home/selfprofile.vue` 中，你可以配置社交链接。
*   **普通链接**：直接配置 `url`。
*   **邮箱弹窗**：将 `action` 设置为 `'modal'`，并确保 `EmailModal` 组件已正确引入。
*   **修改默认邮箱**：
    *   **方式一**：直接修改 `src/components/EmailModal.vue` 中的 `default` 属性。
    *   **方式二**：在 `selfprofile.vue` 中调用组件时传入 `:email="your@email.com"`。

```javascript
// src/views/home/selfprofile.vue
const links = [
  { name: 'Github', icon: githubIcon, url: 'https://github.com/...' },
  // ...
  { name: 'Email', icon: mailIcon, action: 'modal' } // 触发弹窗
]
```

### 5.4 常用命令

*   **启动开发服务器**：
    ```bash
    npm run dev
    ```
*   **构建生产版本**：
    ```bash
    npm run build
    ```

---

## 6. 源码阅读指南

本项目代码量不大，但模块化程度较高。如果你想深入理解其实现原理，建议按照 **“数据流向”** 的顺序进行阅读。

### 6.1 阶段一：构建与数据源 (Build & Data)
**目标**：理解 Markdown 是如何变成 JS 对象的。
1.  **`src/markdown/vite-plugin-md.js`**：入口。看它如何拦截 `.md` 请求。
2.  **`src/markdown/render.js`**：核心。看它如何解析 Frontmatter、生成 TOC 和高亮代码。
3.  **`src/posts/index.js`**：汇聚。看 `import.meta.glob` 如何收集所有文章。

### 6.2 阶段二：路由与页面 (Router & Views)
**目标**：理解页面是如何消费数据的。
1.  **`src/router/index.js`**：骨架。看动态路由配置 (`/post/:slug`, `/category/:name`)。
2.  **`src/views/post/PostPage.vue`**：终点。看文章详情页如何通过 `posts[slug]` 获取数据并渲染。
3.  **`src/views/category/CategoryPage.vue`**：筛选。看如何使用 `computed` + `filter` 实现分类/标签筛选。

### 6.3 阶段三：布局与交互 (Layout & Effects)
**目标**：理解 UI 是如何构建的。
1.  **`src/views/layout/layout.vue`**：整体结构。
2.  **`src/views/layout/myheader.vue`**：导航栏。重点看 **主题切换** 和 **搜索功能** 的实现。
3.  **`src/views/time/time.vue`**：时间轴。重点看如何聚合四种不同类型的数据。

### 6.4 阶段四：样式系统 (Styling)
**目标**：理解暗黑模式和响应式。
1.  **`src/assets/css/global.scss`**：CSS 变量定义。
2.  **`src/assets/css/markdown.scss`**：Markdown 正文的专用样式。

---

## 7. 渲染引擎独立复用指南 

如果你希望在其他 Vue 3 + Vite 项目中**复用这套 Markdown 渲染系统**，从而实现“开箱即用”的文章渲染效果，请遵循以下步骤进行迁移。

### 7.1 核心文件迁移

请将以下文件/文件夹直接复制到新项目中：

1.  **渲染核心**：
    *   `src/markdown/` (整个文件夹)
        *   `vite-plugin-md.js`: Vite 插件入口
        *   `render.js`: 解析逻辑
2.  **样式核心**：
    *   `src/assets/css/markdown.scss`: 文章专用样式
    *   `src/assets/css/theme-vars.scss`: 颜色变量
3.  **UI 组件 (可选但推荐)**：
    *   `src/components/Toc.vue`: 目录组件（配套渲染出的 `toc` 数据使用）
    *   `src/components/ImageLightbox.vue`: 图片灯箱组件（用于点击放大图片）

### 7.2 依赖安装

在新项目中安装必要的依赖包：

```bash
npm install markdown-it gray-matter shiki github-markdown-css
npm install -D sass
```

### 7.3 Vite 配置

修改新项目的 `vite.config.js`，注册 Markdown 插件：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from './src/markdown/vite-plugin-md' // 引入插件

export default defineConfig({
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/], // 1. 允许 Vue 处理 .md 文件
    }),
    Markdown(), // 2. 注册 Markdown 插件
  ],
})
```

### 7.4 组件使用 (完整示例)

一个功能完备的文章详情页，通常需要处理**TOC 联动**、**代码块复制**和**图片预览**。以下是一个生产级可用的 `PostPage.vue` 模板：

```vue
<script setup>
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { posts } from '@/posts' // 假设你已导出所有文章
import Toc from '@/components/Toc.vue' // 引入目录组件

const route = useRoute()
const post = computed(() => posts[route.params.slug])
const activeId = ref('') // 当前阅读到的标题 ID

// --- 核心交互逻辑 ---
let observer = null

// 1. 滚动监听 (更新 TOC 高亮)
function setupObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) activeId.value = e.target.id
    })
  }, { rootMargin: '-100px 0px -60% 0px' })
  
  document.querySelectorAll('.markdown-body h2, .markdown-body h3')
    .forEach(el => observer.observe(el))
}

// 2. DOM 增强 (代码复制 + 图片点击)
function setupEnhancements() {
  const mdBody = document.querySelector('.markdown-body')
  if (!mdBody) return

  // 添加代码复制按钮
  mdBody.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.copy-btn')) return
    pre.style.position = 'relative'
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.innerHTML = '📋'
    btn.onclick = () => {
      navigator.clipboard.writeText(pre.innerText).then(() => {
        btn.innerHTML = '✅'; setTimeout(() => btn.innerHTML = '📋', 2000)
      })
    }
    pre.appendChild(btn)
  })
}

// 监听文章变化，重新挂载逻辑
watch(post, async () => {
  await nextTick()
  setupObserver()
  setupEnhancements()
}, { immediate: true })

onUnmounted(() => observer && observer.disconnect())
</script>

<template>
  <div class="layout">
    <!-- 正文区域 -->
    <div class="post-content">
      <h1>{{ post?.frontmatter.title }}</h1>
      <!-- 必须加上 markdown-body 类名 -->
      <div class="markdown-body" v-html="post?.html"></div>
    </div>

    <!-- 侧边目录 -->
    <aside class="toc-wrapper">
      <Toc v-if="post" :toc="post.toc" :active-id="activeId" />
    </aside>
  </div>
</template>

<style scoped>
/* 简单布局 */
.layout { display: flex; gap: 40px; max-width: 1200px; margin: 0 auto; }
.post-content { flex: 1; min-width: 0; }
.toc-wrapper { width: 240px; position: sticky; top: 100px; height: fit-content; }

/* 引入必要的 Markdown 样式 */
@import 'github-markdown-css/github-markdown.css';
@import '@/assets/css/markdown.scss';
</style>
```

只需完成以上步骤，你的新项目就能立刻拥有与本项目完全一致的 Markdown 渲染能力（含代码高亮、TOC 联动、复制按钮等）。
