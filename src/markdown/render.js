import MarkdownIt from 'markdown-it'
import { createHighlighter, bundledLanguages } from 'shiki'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

let highlighterPromise = null

async function getShiki() {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: ['github-dark'],
            langs: Object.keys(bundledLanguages),
        })
    }
    return highlighterPromise
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    switch (ext) {
        case '.png': return 'image/png'
        case '.jpg':
        case '.jpeg': return 'image/jpeg'
        case '.gif': return 'image/gif'
        case '.webp': return 'image/webp'
        case '.svg': return 'image/svg+xml'
        default: return 'application/octet-stream'
    }
}

export async function renderMarkdown(mdText, fromPath) {
    const highlighter = await getShiki()

    // Parse frontmatter
    const { content, data: frontmatter } = matter(mdText)

    const toc = []

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,

        // ✅ 新版 Shiki 高亮
        highlight(code, lang) {
            const normalizedLang = (lang || '').toLowerCase()

            const safeLang = highlighter
                .getLoadedLanguages()
                .includes(normalizedLang)
                ? normalizedLang
                : 'text'

            return highlighter.codeToHtml(code, {
                lang: safeLang,
                theme: 'github-dark',
            })
        },
    })

    // ✅ TOC 逻辑 - 修复id生成和TOC推送
    md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const level = Number(token.tag.slice(1))

        if (level === 2 || level === 3) {
            // 获取标题文本，确保处理所有类型的标题内容
            let text = ''
            for (let i = idx + 1; i < tokens.length; i++) {
                if (tokens[i].type === 'heading_close') {
                    break
                }
                text += tokens[i].content
            }
            
            // 生成更健壮的id
            let id = text
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]/g, '')
            
            // 确保id不为空
            if (!id) {
                id = `heading-${idx}`
            }
            
            // 确保id唯一（使用简单的计数器，避免依赖document）
            let uniqueId = id
            let counter = 1
            
            // 检查当前toc数组中是否已存在相同id
            while (toc.some(item => item.id === uniqueId)) {
                uniqueId = `${id}-${counter}`
                counter++
            }

            token.attrSet('id', uniqueId)

            toc.push({
                id: uniqueId,
                text,
                level,
            })
        }

        return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const srcAttr = token.attrs && token.attrs.find(a => a[0] === 'src')
        const alt = token.content || ''
        let src = srcAttr ? srcAttr[1] : ''
        const isRemote = /^https?:\/\//i.test(src) || /^data:/i.test(src)
        if (!isRemote && fromPath) {
            const baseDir = path.dirname(fromPath)
            const abs = path.resolve(baseDir, src)
            try {
                const buf = fs.readFileSync(abs)
                const mime = getMimeType(abs)
                src = `data:${mime};base64,${buf.toString('base64')}`
            } catch {
                src = src
            }
        }
        return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" class="md-image">`
    }

    // Render the content (without frontmatter)
    const html = md.render(content)

    return {
        html,
        toc,
        frontmatter,
    }
}
