// src/posts/index.js

// 构建期扫描 posts 目录下所有 md 文件
const modules = import.meta.glob('./*.md', {
    eager: true,
})

// 最终导出的 posts 对象
// { slug: { html, toc, data } }
export const posts = {}

for (const path in modules) {
    const slug = path.replace('./', '').replace('.md', '')
    posts[slug] = modules[path].default
}
