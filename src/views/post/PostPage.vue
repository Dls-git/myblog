<script setup>
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { posts } from '@/posts'
import Toc from '@/components/Toc.vue'
import  '@/assets/css/markdown.scss'


const route = useRoute()

// 当前文章 slug
const slug = computed(() => route.params.slug)

// 当前文章内容
const post = computed(() => posts[slug.value])

const activeId = ref('')
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

watch(post, async p => {
  if (!p) return
  await nextTick()
  setupObserver()
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
    <!-- 正文 -->
    <article v-if="post" class="markdown-body">
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

    <!-- 右侧 TOC -->
    <Toc v-if="post" :toc="post.toc" :active-id="activeId" />

    <!-- 简单兜底 -->
    <div v-if="!post">
      <h2>文章不存在</h2>
    </div>
  </div>
</template>

<style scoped lang="scss">
.markdown-layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
}
    
.post-header {
  margin-bottom: 40px;
  text-align: center;
  border-bottom: 1px dashed rgba(0,0,0,0.1);
  padding-bottom: 20px;
}

.post-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 15px;
  color: rgb(var(--color-text-primary));
}

.post-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: rgb(var(--color-text-primary));
  opacity: 0.6;
}

.divider {
  margin: 0 10px;
  opacity: 0.3;
}
</style>
