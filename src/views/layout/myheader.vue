<script setup >
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue'
import { posts } from '@/posts'

const route = useRoute()
const router = useRouter()
const isPost = computed(() => route.path.startsWith('/layout/post'))
const theme = ref('light') // 默认主题改为 light

// 搜索相关状态
const isSearchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)

// 预处理所有文章数据，方便搜索
const allPosts = computed(() => {
  return Object.keys(posts).map(slug => {
    const post = posts[slug]
    const fm = post.frontmatter || {}
    return {
      slug,
      title: fm.title || slug,
      category: fm.category || '未分类',
      tags: fm.tags || [],
      date: fm.date,
      description: fm.description || ''
    }
  })
})

// 搜索结果计算
const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []
  
  return allPosts.value.filter(post => {
    const matchTitle = post.title.toLowerCase().includes(query)
    const matchCategory = post.category.toLowerCase().includes(query)
    // 标签是个数组，只要有一个标签匹配即可
    const matchTag = post.tags.some(tag => tag.toLowerCase().includes(query))
    
    return matchTitle || matchCategory || matchTag
  }).slice(0, 8) // 最多显示8条
})

function openSearch() {
  isSearchOpen.value = true
  // 等待 DOM 更新后聚焦输入框
  setTimeout(() => {
    searchInput.value?.focus()
  }, 100)
}

function closeSearch() {
  isSearchOpen.value = false
  searchQuery.value = ''
}

function goToPost(slug) {
  router.push(`/layout/post/${slug}`)
  closeSearch()
}

function applyTheme() {
  if (!isPost.value) {
    document.documentElement.removeAttribute('data-theme')
    return
  }
  document.documentElement.setAttribute('data-theme', theme.value)
}
function toggleTheme(event) {
  const isDark = theme.value === 'dark'
  
  const switchTheme = () => {
    theme.value = isDark ? 'light' : 'dark'
    applyTheme()
  }

  // Use View Transitions API if supported
  if (!document.startViewTransition) {
    switchTheme()
    return
  }

  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? window.innerHeight / 2

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = document.startViewTransition(() => {
    switchTheme()
  })

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ]
    document.documentElement.animate(
      {
        clipPath: clipPath,
      },
      {
        duration: 400,
        easing: 'ease-in',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  })
}
onMounted(() => {
  applyTheme()
})
watch(isPost, () => {
  applyTheme()
})
</script>

<template>
<div class="header-wrapper">
  <div class="header-content">
    <!-- Logo 区域 -->
    <div class="logo-section">
        <router-link to="/" class="logo-link">
          <img src="@/assets/img/Mikasa.jpg" alt="Logo">
          <span class="logo-text">My Blog</span>
        </router-link>
    </div>

    <!-- 导航菜单 -->
    <div class="nav-section">
      <nav class="nav-links">
        <router-link to="/" class="nav-item" active-class="active">首页</router-link>
        <router-link to="/layout/category/Frontend" class="nav-item" active-class="active">分类</router-link>
        <router-link to="/layout/tag/Vue" class="nav-item" active-class="active">标签</router-link>
        <router-link to="/layout/time" class="nav-item" active-class="active">时间轴</router-link>
        <router-link to="/layout/friends" class="nav-item" active-class="active">友链</router-link>
        <router-link to="/layout/about" class="nav-item" active-class="active">关于</router-link>
      </nav>
    </div>

    <!-- 功能按钮区域 -->
    <div class="action-section">
       <button class="action-btn theme-btn" @click="toggleTheme" title="切换主题">
         <img v-if="theme==='dark'" src="@/assets/img/sun.png" alt="Light Mode">
         <img v-else src="@/assets/img/moon.png" alt="Dark Mode">
       </button>
       <button class="action-btn search-btn" @click="openSearch" title="搜索">
         <img src="@/assets/img/search.png" alt="Search">
       </button>
    </div>
  </div>

  <!-- 搜索弹窗 -->
  <Transition name="fade">
    <div v-if="isSearchOpen" class="search-modal-overlay" @click.self="closeSearch">
      <div class="search-modal">
        <div class="search-header">
          <img src="@/assets/img/search.png" class="search-icon" alt="search">
          <input 
            ref="searchInput"
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索文章标题、分类或标签..." 
            class="search-input"
          >
          <button class="close-btn" @click="closeSearch">ESC</button>
        </div>
        
        <div class="search-results" v-if="searchQuery">
          <div v-if="searchResults.length === 0" class="no-results">
            未找到相关文章
          </div>
          <div 
            v-for="post in searchResults" 
            :key="post.slug" 
            class="result-item"
            @click="goToPost(post.slug)"
          >
            <div class="result-title">{{ post.title }}</div>
            <div class="result-meta">
              <span class="meta-tag" v-if="post.category">📁 {{ post.category }}</span>
              <span class="meta-tag" v-for="tag in post.tags" :key="tag"># {{ tag }}</span>
            </div>
          </div>
        </div>
        
        <div class="search-footer" v-else>
          输入关键词进行搜索
        </div>
      </div>
    </div>
  </Transition>
</div>
</template>

<style scoped lang="scss">
/* ... (保留原有的 header 样式) ... */
.header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70px; /* 更精致的高度 */
  z-index: 100;
  background: rgba(var(--color-bg-primary), 0.8); /* 增加透明度 */
  backdrop-filter: blur(20px); /* 更强的毛玻璃效果 */
  border-bottom: 1px solid rgba(var(--color-border-primary), 0.1);
  transition: all 0.3s ease;
}

.header-content {
  max-width: 1400px; /* 限制最大宽度，防止在大屏上太散 */
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 1. Logo 区域 */
.logo-section {
  flex: 0 0 auto;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  gap: 12px;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
  }

  .logo-text {
    font-size: 20px;
    font-weight: 700;
    color: rgb(var(--color-text-primary));
    letter-spacing: 0.5px;
  }

  &:hover img {
    transform: rotate(360deg);
  }
}

/* 2. 导航菜单 */
.nav-section {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-links {
  display: flex;
  gap: 8px;
  background: rgba(var(--color-bg-secondary), 0.5);
  padding: 6px;
  border-radius: 99px; /* 胶囊形状 */
  border: 1px solid rgba(var(--color-border-primary), 0.1);
}

.nav-item {
  position: relative;
  padding: 8px 20px;
  color: rgb(var(--color-text-primary));
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  border-radius: 99px;
  transition: all 0.3s ease;
  opacity: 0.8;

  &:hover {
    opacity: 1;
    background: rgba(var(--color-bg-primary), 0.8);
    color: #409eff;
  }

  &.active {
    opacity: 1;
    background: #fff;
    color: #000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-weight: 600;
  }
}

/* 暗色模式下的选中状态适配 */
:global([data-theme='dark']) .nav-item.active {
  background: #333;
  color: #fff;
}

/* 3. 功能按钮区域 */
.action-section {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(var(--color-border-primary), 0.1);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  img {
    width: 20px;
    height: 20px;
    opacity: 0.7;
    transition: all 0.3s;
  }

  &:hover {
    background: rgba(var(--color-bg-secondary), 0.8);
    border-color: rgba(var(--color-border-primary), 0.3);

    img {
      opacity: 1;
      transform: scale(1.1);
    }
  }
}

/* --- 搜索弹窗样式 --- */
.search-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 100px;
}

.search-modal {
  width: 600px;
  max-width: 90%;
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 1px solid rgba(var(--color-border-primary), 0.1);
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(var(--color-border-primary), 0.1);
  gap: 15px;
}

.search-icon {
  width: 24px;
  height: 24px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 18px;
  color: rgb(var(--color-text-primary));
  outline: none;
}

.close-btn {
  padding: 6px 12px;
  background: rgba(var(--color-bg-secondary), 0.5);
  border: 1px solid rgba(var(--color-border-primary), 0.1);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: rgb(var(--color-text-primary));
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.result-item {
  padding: 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(var(--color-bg-secondary), 0.5);

    .result-title {
      color: #409eff;
    }
  }
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgb(var(--color-text-primary));
}

.result-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(var(--color-bg-secondary));
  border-radius: 4px;
  color: rgb(var(--color-text-primary));
  opacity: 0.7;
}

.no-results, .search-footer {
  padding: 30px;
  text-align: center;
  color: rgb(var(--color-text-primary));
  opacity: 0.5;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
