// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// 1. 引入 postcss-px-to-viewport 插件
import postcssPxToViewport from 'postcss-px-to-viewport'

export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    // 2. 显式配置 PostCSS，强制加载插件
    css: {
        postcss: {
            plugins: [
                postcssPxToViewport({
                    viewportWidth: 1920,   // 你的设计稿宽度
                    unitPrecision: 5,      // 保留小数位数
                    viewportUnit: 'vw',    // 转换为vw
                    selectorBlackList: [], // 不转换的类
                    minPixelValue: 2,      // 小于2px不转换
                    mediaQuery: false,     // 不转换媒体查询里的px
                    exclude: []            // 不排除任何文件（包含Element Plus）
                })
            ]
        }
    }
})
