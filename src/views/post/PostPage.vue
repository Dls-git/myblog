<script setup>
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { posts } from '@/posts'
import Toc from '@/components/Toc.vue'
import CommentSection from '@/components/CommentSection.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import  '@/assets/css/markdown.scss'


const route = useRoute()

// 当前文章 slug
const slug = computed(() => route.params.slug)

// 当前文章内容
const post = computed(() => posts[slug.value])

const activeId = ref('')
const lightboxVisible = ref(false)
const lightboxSrc = ref('')
const lightboxAlt = ref('')

let observer = null

function setupObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  observer = new IntersectionObserver(
    entries => {
      let current = ''
      for (const e of entries) {
        if (e.isIntersecting) {
          const id = e.target && e.target.id
          if (id) current = id
        }
      }
      if (current) activeId.value = current
    },
    { root: null, rootMargin: '-40% 0px -50% 0px' }
  )
  document
    .querySelectorAll('.markdown-body h2, .markdown-body h3')
    .forEach(el => observer && observer.observe(el))
}

function setupEnhancements() {
  const markdownBody = document.querySelector('.markdown-body')
  if (!markdownBody) return

  // 1. 图片点击放大
  const images = markdownBody.querySelectorAll('img')
  images.forEach(img => {
    img.style.cursor = 'zoom-in'
    img.onclick = () => {
      lightboxSrc.value = img.src
      lightboxAlt.value = img.alt
      lightboxVisible.value = true
    }
  })

  // 2. 代码块复制按钮
  const preBlocks = markdownBody.querySelectorAll('pre')
  preBlocks.forEach(pre => {
    if (pre.querySelector('.copy-btn')) return

    // 确保 pre 有相对定位，以便按钮绝对定位
    if (getComputedStyle(pre).position === 'static') {
      pre.style.position = 'relative'
    }

    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.innerHTML = '📋' // 或者用图标
    btn.title = 'Copy Code'
    
    btn.onclick = (e) => {
      e.stopPropagation()
      const code = pre.querySelector('code')?.innerText || pre.innerText
      navigator.clipboard.writeText(code).then(() => {
        btn.innerHTML = '✅'
        setTimeout(() => {
          btn.innerHTML = '📋'
        }, 2000)
      }).catch(err => {
        console.error('Copy failed', err)
        btn.innerHTML = '❌'
      })
    }

    pre.appendChild(btn)
  })
}

watch(post, async p => {
  if (!p) return
  await nextTick()
  setupObserver()
  setupEnhancements()
}, { immediate: true })

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <div class="markdown-layout">
    <!-- 正文区域包裹 -->
    <div class="post-wrapper" v-if="post">
      <!-- 正文 -->
      <article class="markdown-body">
        <!-- 文章头部信息 -->
        <div class="post-header">
          <h1 class="post-title">{{ post.frontmatter.title }}</h1>
          <div class="post-meta">
            <span v-if="post.frontmatter.date">📅 {{ new Date(post.frontmatter.date).toLocaleDateString('zh-CN') }}</span>
            <span class="divider" v-if="post.frontmatter.date && (post.frontmatter.wordCount || post.frontmatter.readingTime)">|</span>
            <span v-if="post.frontmatter.wordCount">📝 {{ post.frontmatter.wordCount }}字</span>
            <span class="divider" v-if="post.frontmatter.wordCount && post.frontmatter.readingTime">|</span>
            <span v-if="post.frontmatter.readingTime">⏱️ {{ post.frontmatter.readingTime }}分钟</span>
          </div>
        </div>
        
        <!-- Markdown 内容 -->
        <div v-html="post.html"></div>
      </article>

      <!-- 评论区 -->
      <CommentSection />
    </div>

    <!-- 右侧 TOC -->
    <Toc v-if="post" :toc="post.toc" :active-id="activeId" />

    <!-- 简单兜底 -->
    <div v-if="!post">
      <h2>文章不存在</h2>
    </div>

    <!-- 图片查看器 -->
    <ImageLightbox 
      :visible="lightboxVisible" 
      :src="lightboxSrc" 
      :alt="lightboxAlt"
      @close="lightboxVisible = false"
    />
  </div>
</template>

<style scoped lang="scss">
.markdown-layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
    
.post-header {
  margin-bottom: 50px;
  text-align: center;
  border-bottom: 2px solid rgb(var(--color-border-primary) / 0.3);
  padding-bottom: 30px;
  animation: fadeIn 0.6s ease-out;
}

.post-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: rgb(var(--color-text-primary));
  line-height: 1.3;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--bt-h1-color), var(--bt-h2-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.post-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.95rem;
  color: rgb(var(--color-text-secondary));
  gap: 20px;
  flex-wrap: wrap;
}

.divider {
  margin: 0;
  opacity: 0.3;
  color: rgb(var(--color-accent, 37 99 235));
}

.post-wrapper {
  flex: 1;
  min-width: 0;
  max-width: 800px;
  animation: fadeIn 0.8s ease-out;
}

/* Enhanced TOC styling */
:deep(.toc-container) {
  position: sticky;
  top: 80px;
  width: 280px;
  background-color: rgb(var(--color-bg-primary));
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 1px solid rgb(var(--color-border-primary) / 0.3);
  animation: fadeIn 1s ease-out;
}

:deep(.toc-title) {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 15px;
  color: rgb(var(--color-text-primary));
  border-bottom: 2px solid rgb(var(--color-accent, 37 99 235));
  padding-bottom: 10px;
}

:deep(.toc-list) {
  list-style: none;
  padding: 0;
  margin: 0;
}

:deep(.toc-item) {
  margin: 8px 0;
}

:deep(.toc-link) {
  color: rgb(var(--color-text-secondary));
  text-decoration: none;
  display: block;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

:deep(.toc-link:hover) {
  color: rgb(var(--color-accent, 37 99 235));
  background-color: rgb(var(--color-bg-secondary) / 0.5);
  transform: translateX(4px);
}

:deep(.toc-link.active) {
  color: rgb(var(--color-accent, 37 99 235));
  font-weight: 600;
  background-color: rgb(var(--color-accent, 37 99 235) / 0.1);
  border-left: 3px solid rgb(var(--color-accent, 37 99 235));
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .markdown-layout {
    flex-direction: column;
    gap: 30px;
    padding: 20px 16px;
  }
  
  :deep(.toc-container) {
    position: static;
    width: 100%;
  }
  
  .post-title {
    font-size: 2rem;
  }
}

@media (max-width: 640px) {
  .post-title {
    font-size: 1.75rem;
  }
  
  .post-meta {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .divider {
    display: none;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
