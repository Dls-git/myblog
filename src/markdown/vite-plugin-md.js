import { renderMarkdown } from './render'

export default function vitePluginMarkdown() {
    return {
        name: 'vite-plugin-markdown-to-vue',

        async transform(code, id) {
            if (!id.endsWith('.md')) return null

            // ✅ 关键修复：await
            const {html, toc, frontmatter} = await renderMarkdown(code, id)

            return {
                code: `
          export default {
            html: ${JSON.stringify(html)},
            toc: ${JSON.stringify(toc)},
            frontmatter: ${JSON.stringify(frontmatter)}
          }
        `,
                map: null,
            }
        },
    }
}
