---
title: 全语法 Markdown 示例文档
date: 2024-10-01
category: 工具教程
tags:
  - Markdown
  - 示例
  - 排版
description: 展示所有 Markdown 语法效果的测试文档
updated: 2024-10-05
readingTime: 8
wordCount: 1200
---

# 全语法 Markdown 示例文档

> 本文件涵盖 Markdown 核心语法与拓展语法，用于演示博客 / 文档的排版能力

## 一、 标题（Heading）

Markdown 支持 1-6 级标题，对应 HTML 的 `<h1>`-`<h6>`



```
\# 一级标题

\## 二级标题

\### 三级标题

\#### 四级标题

\##### 五级标题

\###### 六级标题
```

## 二、 文本格式（Text Formatting）

### 2.1 基础样式



* **加粗文本**：`**加粗**` 或 `__加粗__`

* *斜体文本*：`*斜体*` 或 `_斜体_`

* *加粗斜体*：`***加粗斜体***`

* ~~删除线文本~~：`~~删除线~~`

* 下划线文本：`<u>下划线</u>`（部分编辑器支持 `++下划线++`）

* 高亮文本：`==高亮文本==`（拓展语法）

### 2.2 上下标（拓展语法）



* 上标：X^2^ + Y^3^ = Z^5^ → `X^2^ + Y^3^ = Z^5^`

* 下标：H\~2\~O 是水的化学式 → `H~2~O 是水的化学式`

## 三、 列表（List）

### 3.1 无序列表



* 博客文章分类


  * 技术教程


    * Frontend

    * Backend

  * 生活随笔

  * 读书笔记

* 开发工具清单


  * VS Code

  * Git

  * Node.js

### 3.2 有序列表



1. 项目初始化


   1. 创建文件夹 `mkdir blog-demo`

   2. 初始化 npm `npm init -y`

2. 安装依赖


   1. 安装 Vue3 `npm install vue`

   2. 安装 Markdown 渲染器 `npm install markdown-it`

3. 编写代码并测试

### 3.3 任务列表（拓展语法）

完成 Markdown 语法整理

编写代码块示例

优化文档排版

导出为 PDF 格式

## 四、 链接（Link）

### 4.1 普通链接



* 行内式：[Vue3 官方文档](https://vuejs.org/) → `[Vue3 官方文档](``https://vuejs.org/`` "Vue3 Docs")`

* 参考式：

  我正在学习 \[Vue3]\[1]，并使用 \[Astro]\[2] 构建静态博客。

  \[1]: [https://vuejs.org/](https://vuejs.org/) "Vue3 官网"

  \[2]: [https://astro.build/](https://astro.build/) "Astro 官网"

### 4.2 锚点链接

跳转到 [标题部分](#一-标题heading) → `跳转到 [标题部分](#一-标题heading)`

## 五、 图片（Image）

### 5.1 基础图片



```
!\[Vue3 Logo]\(https://vuejs.org/images/logo.svg "Vue3 Logo")
```
![Mikasa.jpg](../assets/img/Mikasa.jpg)
实际效果：



![Vue3 Logo](https://vuejs.org/images/logo.svg)

### 5.2 图片链接（图片 + 超链接）



```
\[!\[Vue3 Logo]\(https://vuejs.org/images/logo.svg "点击进入 Vue3 官网")]\(https://vuejs.org/)
```

实际效果：



![Vue3 Logo](https://vuejs.org/images/logo.svg)

## 六、 代码块（Code Block）

### 6.1 行内代码

行内代码示例：`const message = "Hello Markdown!"` → `` `const message = "Hello Markdown!"` ``

### 6.2 多行代码块（带语法高亮）



```
\<!-- Vue3 组件示例 -->

\<template>

&#x20; \<div class="markdown-demo">

&#x20;   \<h2>{{ title }}\</h2>

&#x20;   \<div v-html="renderedMarkdown">\</div>

&#x20; \</div>

\</template>

\<script setup>

import { ref, computed } from 'vue'

import markdownIt from 'markdown-it'

const md = markdownIt({

&#x20; html: true,

&#x20; linkify: true,

&#x20; typographer: true

})

const title = ref('Markdown 渲染示例')

const rawMarkdown = ref('# Hello Vue3 + Markdown')

const renderedMarkdown = computed(() => md.render(rawMarkdown.value))

\</script>

\<style scoped>

.markdown-demo {

&#x20; padding: 20px;

&#x20; max-width: 800px;

&#x20; margin: 0 auto;

}

\</style>
```

## 七、 引用（Blockquote）

### 7.1 基础引用

> Markdown 是一种轻量级标记语言，创始人为约翰・格鲁伯（John Gruber）。

它允许人们使用易读易写的纯文本格式编写文档，然后转换成有效的 XHTML（或者 HTML）文档。

### 7.2 嵌套引用

> 前端开发三大核心：

> HTML（结构）、CSS（样式）、JavaScript（行为）

框架选型建议：

> 中小型项目：Vue3 / React

静态站点：Astro / Nuxt

## 八、 分割线（Horizontal Rule）

以下三种写法均可生成分割线：



```
\---

\*\*\*

\_\_\_
```

实际效果：



***

## 九、 表格（Table）

### 9.1 基础表格



| Markdown 渲染库 | 优点     | 缺点        |
| ------------ | ------ | --------- |
| markdown-it  | 轻量、可拓展 | 部分拓展语法需插件 |
| marked       | 速度快    | 自定义配置较复杂  |
| remark       | 生态丰富   | 学习成本较高    |

### 9.2 对齐方式



| 左对齐      | 居中对齐      | 右对齐      |
| -------- | --------- | -------- |
| 内容 1     | 内容 2      | 内容 3     |
| 长文本测试左对齐 | 长文本测试居中对齐 | 长文本测试右对齐 |

## 十、 脚注（Footnote）（拓展语法）

Markdown 支持脚注功能[^footnote](脚注的具体内容会显示在文档底部。)。

## 十一、 数学公式（拓展语法，需插件支持）

### 行内公式

$E=mc^2$ → `$E=mc^2$`

### 块级公式

$\sum_{i=1}^n i = \frac{n(n+1)}{2}$

对应代码：



```
\$\$

\sum\_{i=1}^n i = \frac{n(n+1)}{2}

\$\$
```

## 十二、 定义列表（拓展语法）

Markdown

: 轻量级标记语言，用于快速编写格式化文档

Vue3

: 渐进式 JavaScript 框架，专注于视图层

## 十三、 特殊符号转义

如果需要显示 Markdown 语法符号本身，需使用反斜杠 `\` 转义：



* \* 斜体语法转义示例 \* → `\*斜体语法转义示例\*`

* \# 转义后的一级标题符号 → `\# 转义后的一级标题符号`

*

$é¾æ¥ææ¬$

$é¾æ¥å°å$ → `\[链接文本\]\(链接地址\)`



***


