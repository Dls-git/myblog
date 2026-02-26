<script setup>
import { ref, computed } from 'vue'
import { thoughts } from '@/posts/dataJs/thoughts.js'
import { CommentOutlined, HeartOutlined, EyeOutlined } from '@ant-design/icons-vue'

// 模拟头像引用
import avatar from '@/assets/img/Mikasa.jpg'

// 1. 先按时间倒序排序
const sortedThoughts = computed(() => {
  return [...thoughts].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// 分页逻辑
const currentPage = ref(1)
const pageSize = 10

// 侧边栏统计数据计算
const stats = computed(() => {
  const total = thoughts.length
  const totalLikes = thoughts.reduce((sum, item) => sum + (item.likes || 0), 0)
  const totalComments = thoughts.reduce((sum, item) => sum + (item.comments || 0), 0)
  const recentMonth = new Date()
  recentMonth.setMonth(recentMonth.getMonth() - 1)
  const recentCount = thoughts.filter(item => new Date(item.date) >= recentMonth).length
  
  return {
    total,
    totalLikes,
    totalComments,
    recentCount
  }
})

// 随机说说
const randomThought = computed(() => {
  if (thoughts.length === 0) return null
  const randomIndex = Math.floor(Math.random() * thoughts.length)
  return thoughts[randomIndex]
})

// 时间线导航数据
const yearNav = computed(() => {
  const years = new Set()
  thoughts.forEach(item => {
    const year = new Date(item.date).getFullYear()
    years.add(year)
  })
  return Array.from(years).sort((a, b) => b - a)
})

// 当前选中的年份
const selectedYear = ref(null)

const handleYearSelect = (year) => {
  selectedYear.value = selectedYear.value === year ? null : year
  currentPage.value = 1 // 切换年份时重置页码
}

// 根据年份筛选的说说
const filteredThoughts = computed(() => {
  if (!selectedYear.value) return sortedThoughts.value
  return sortedThoughts.value.filter(item => 
    new Date(item.date).getFullYear() === selectedYear.value
  )
})

// 更新分页逻辑，使用筛选后的数据
const displayFilteredThoughts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredThoughts.value.slice(start, start + pageSize)
})

const filteredTotalPages = computed(() => Math.ceil(filteredThoughts.value.length / pageSize))

const changePage = (page) => {
  if (page >= 1 && page <= filteredTotalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 简单的点赞功能 (仅前端效果)
const handleLike = (item) => {
  item.likes++
}
</script>

<template>
  <div class="moments-container">
    <header class="moments-header">
      <h1 class="page-title">
        说说 <span class="rss-icon"></span>
      </h1>
      <p class="subtitle">记录生活，捕捉瞬间</p>
    </header>

    <div class="moments-layout">
      <!-- 主要内容区域 -->
      <main class="moments-main">
        <div class="moments-list">
          <article v-for="item in displayFilteredThoughts" :key="item.id" class="moment-card">
            <div class="card-header">
              <div class="user-info">
                <img :src="avatar" alt="Avatar" class="user-avatar">
                <div class="user-meta">
                  <span class="user-name">Youth</span>
                  <span class="publish-date">{{ item.date }} {{ item.week }}</span>
                </div>
              </div>
            </div>

            <div class="card-content">
              <div class="moment-text" v-html="item.content.replace(/(https?:\/\/[^\s]+)/g, '<a href=\'$1\' target=\'_blank\'>$1</a>')"></div>
            </div>

            <footer class="card-footer">
              <div class="card-actions">
                <div class="action-item" @click="handleLike(item)">
                  <HeartOutlined class="action-icon" />
                  <span class="action-count">{{ item.likes }}</span>
                </div>
                <div class="action-item">
                  <CommentOutlined class="action-icon" />
                  <span class="action-count">{{ item.comments }}</span>
                </div>
                <div class="action-item">
                  <EyeOutlined class="action-icon" />
                  <span class="action-count">0</span>
                </div>
              </div>
            </footer>
          </article>
        </div>

        <!-- 分页器 -->
        <nav class="pagination-wrapper" v-if="filteredTotalPages > 1" aria-label="Pagination">
          <button
            class="page-nav-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            &larr;
          </button>
          <div class="page-numbers">
            <button
              v-for="page in filteredTotalPages"
              :key="page"
              class="page-number-btn"
              :class="{ active: currentPage === page }"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
          </div>
          <button
            class="page-nav-btn"
            :disabled="currentPage === filteredTotalPages"
            @click="changePage(currentPage + 1)"
          >
            &rarr;
          </button>
        </nav>
      </main>

      <!-- 侧边信息栏 -->
      <aside class="moments-sidebar">
        <!-- 统计信息 -->
        <section class="sidebar-widget">
          <h3 class="widget-title">动态统计</h3>
          <div class="stats-grid">
            <div class="stat-badge">
              <span class="stat-label">总说说</span>
              <span class="stat-value">{{ stats.total }}</span>
            </div>
            <div class="stat-badge">
              <span class="stat-label">获赞</span>
              <span class="stat-value">{{ stats.totalLikes }}</span>
            </div>
            <div class="stat-badge">
              <span class="stat-label">评论</span>
              <span class="stat-value">{{ stats.totalComments }}</span>
            </div>
            <div class="stat-badge">
              <span class="stat-label">本月</span>
              <span class="stat-value">{{ stats.recentCount }}</span>
            </div>
          </div>
        </section>

        <!-- 随机说说 -->
        <section class="sidebar-widget" v-if="randomThought">
          <h3 class="widget-title">偶然发现</h3>
          <div class="random-moment-card">
            <div class="random-content" v-html="randomThought.content.replace(/(https?:\/\/[^\s]+)/g, '<a href=\'$1\' target=\'_blank\'>$1</a>')"></div>
          </div>
        </section>

        <!-- 时间线导航 -->
        <section class="sidebar-widget">
          <h3 class="widget-title">时光回顾</h3>
          <nav class="year-nav">
            <button 
              v-for="year in yearNav" 
              :key="year"
              class="year-link"
              :class="{ active: selectedYear === year }"
              @click="handleYearSelect(year)"
            >
              {{ year }} 年
            </button>
          </nav>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 基础变量与重置 */
.moments-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 20px;
  min-height: 100vh;
  background-color: #FAFAFA; /* 更中性的浅灰白背景，移除蓝色调 */
}

/* 头部样式 */
.moments-header {
  margin-bottom: 50px;
  text-align: left;

  .page-title {
    font-size: 42px;
    font-weight: 800;
    margin-bottom: 12px;
    color: #1A1A1A;
    display: flex;
    align-items: center;
    gap: 15px;

    .rss-icon {
      font-size: 24px;
      color: #FF9F43;
    }
  }

  .subtitle {
    font-size: 20px;
    color: #666;
    font-weight: 500;
  }
}

/* 布局结构 */
.moments-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 40px;
  align-items: start;
}

/* 说说卡片列表 */
.moments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 单个说说卡片 */
.moment-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(0, 0, 0, 0.02);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
}

/* 卡片头部：用户信息 */
.card-header {
  margin-bottom: 16px;

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      background: #eee;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .user-name {
        font-weight: 700;
        font-size: 16px;
        color: #1A1A1A;
      }

      .publish-date {
        font-size: 13px;
        color: #999;
      }
    }
  }
}

/* 卡片内容 */
.card-content {
  margin-bottom: 20px;

  .moment-text {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;

    :deep(a) {
      color: rgb(var(--color-accent, #4A90E2));
      text-decoration: none;
      font-weight: 500;
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

/* 卡片底部操作栏 */
.card-footer {
  padding-top: 16px;
  border-top: 1px dashed #EEE; /* 虚线分割线 */

  .card-actions {
    display: flex;
    gap: 32px;

    .action-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #888;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;

      .action-icon {
        font-size: 18px;
      }

      &:hover {
        color: rgb(var(--color-accent, #4A90E2)); /* 悬停变为主题色 */
        .action-icon {
          transform: scale(1.1);
        }
      }
    }
  }
}

/* 侧边栏样式 */
.moments-sidebar {
  position: sticky;
  top: 40px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.sidebar-widget {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .widget-title {
    font-size: 16px;
    font-weight: 700;
    color: #1A1A1A;
    margin-bottom: 20px;
    padding-left: 10px;
    border-left: 4px solid rgb(var(--color-accent, #4A90E2));
  }
}

/* 统计徽章设计 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .stat-badge {
    background-color: rgba(var(--color-accent-rgb, 74, 144, 226), 0.08); /* 极浅主题色背景 */
    padding: 12px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .stat-label {
      font-size: 12px;
      color: rgb(var(--color-accent, #4A90E2));
      font-weight: 500;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 800;
      color: rgb(var(--color-accent, #4A90E2));
    }
  }
}

/* 随机说说侧边卡片 */
.random-moment-card {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  font-style: italic;
  
  .random-content {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* 年份导航 */
.year-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .year-link {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    background: #F0F2F5;
    color: #666;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #E4E7ED;
      color: rgb(var(--color-accent, #4A90E2));
    }

    &.active {
      background: rgb(var(--color-accent, #4A90E2));
      color: #FFF;
      font-weight: 600;
    }
  }
}

/* 分页器样式 */
.pagination-wrapper {
  margin-top: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;

  .page-nav-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid #EEE;
    background: #FFF;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      border-color: rgb(var(--color-accent, #4A90E2));
      color: rgb(var(--color-accent, #4A90E2));
    }
  }

  .page-numbers {
    display: flex;
    gap: 10px;

    .page-number-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: none;
      background: #FFF;
      color: #666;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #F0F2F5;
        color: rgb(var(--color-accent, #4A90E2));
      }

      &.active {
        background: rgb(var(--color-accent, #4A90E2));
        color: #FFF;
      }
    }
  }
}

/* 响应式适配 */
@media (max-width: 992px) {
  .moments-layout {
    grid-template-columns: 1fr;
  }
  
  .moments-sidebar {
    position: static;
    order: -1; /* 移动端侧边栏统计信息提到上方 */
  }

  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .moments-container {
    padding: 30px 15px;
  }

  .moments-header .page-title {
    font-size: 32px;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
