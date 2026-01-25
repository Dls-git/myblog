<script setup>
import { ref, computed, onMounted } from 'vue'
import { thoughts } from '@/posts/dataJs/thoughts.js'
import { CommentOutlined, HeartOutlined, EyeOutlined } from '@ant-design/icons-vue'

// 模拟头像引用 (实际开发中可以放在 thoughts 数据里或者统一配置)
import avatar from '@/assets/img/Mikasa.jpg'

// 1. 先按时间倒序排序
const sortedThoughts = computed(() => {
  return [...thoughts].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// 分页逻辑
const currentPage = ref(1)
const pageSize = 10
const totalPages = computed(() => Math.ceil(sortedThoughts.value.length / pageSize))

const displayThoughts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedThoughts.value.slice(start, start + pageSize)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 简单的点赞功能 (仅前端效果)
const handleLike = (item) => {
  item.likes++
}

// 侧边栏数据计算
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

// 时间线导航
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
</script>

<template>
  <div class="thinking-page">
    <div class="header-section">
      <h1 class="page-title">
        思考 <span class="rss-icon">📶</span>
      </h1>
      <p class="subtitle">谢谢你听我诉说</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="timeline">
        <div v-for="item in displayFilteredThoughts" :key="item.id" class="thought-item">
          <div class="avatar-col">
            <img :src="avatar" alt="Avatar" class="avatar">
          </div>

          <div class="content-col">
            <div class="meta-info">
              <span class="nickname">Youth</span>
              <span class="date">{{ item.date }} {{ item.week }}</span>
            </div>

            <div class="bubble">
              <div class="bubble-content" v-html="item.content.replace(/(https?:\/\/[^\s]+)/g, '<a href=\'$1\' target=\'_blank\'>$1</a>')"></div>
            </div>

            <div class="actions">
              <span class="action-item">
                <CommentOutlined class="icon" />
                <span class="count">{{ item.comments }}</span>
              </span>
              <span class="action-item like-btn" @click="handleLike(item)">
                <HeartOutlined class="icon" />
                <span class="count">{{ item.likes }}</span>
              </span>
              <span class="action-item">
                <EyeOutlined class="icon" />
                <span class="count">0</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页器 -->
      <div class="pagination" v-if="filteredTotalPages > 1">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          &lt;
        </button>
        <button
          v-for="page in filteredTotalPages"
          :key="page"
          class="page-btn"
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button
          class="page-btn"
          :disabled="currentPage === filteredTotalPages"
          @click="changePage(currentPage + 1)"
        >
          &gt;
        </button>
      </div>
    </div>

    <!-- 侧边信息栏 -->
    <div class="sidebar">
      <!-- 统计信息 -->
      <div class="sidebar-section">
        <h3 class="sidebar-title">说说统计</h3>
        <div class="sidebar-stat">
          <span class="stat-label">总说说数</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="sidebar-stat">
          <span class="stat-label">总获赞数</span>
          <span class="stat-value">{{ stats.totalLikes }}</span>
        </div>
        <div class="sidebar-stat">
          <span class="stat-label">总评论数</span>
          <span class="stat-value">{{ stats.totalComments }}</span>
        </div>
        <div class="sidebar-stat">
          <span class="stat-label">本月新增</span>
          <span class="stat-value">{{ stats.recentCount }}</span>
        </div>
      </div>

      <!-- 随机说说 -->
      <div class="sidebar-section" v-if="randomThought">
        <h3 class="sidebar-title">随机说说</h3>
        <div class="random-thought">
          <div class="random-title">随机一条</div>
          <div class="random-content" v-html="randomThought.content.replace(/(https?:\/\/[^\s]+)/g, '<a href=\'$1\' target=\'_blank\'>$1</a>')"></div>
        </div>
      </div>

      <!-- 时间线导航 -->
      <div class="sidebar-section">
        <h3 class="sidebar-title">时间线导航</h3>
        <div class="timeline-nav">
          <div 
            v-for="year in yearNav" 
            :key="year"
            class="nav-item"
            :class="{ active: selectedYear === year }"
            @click="handleYearSelect(year)"
          >
            {{ year }} 年
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.thinking-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 80vh;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 40px;
  align-items: start;
}

.header-section {
  grid-column: 1 / -1;
  margin-bottom: 40px;

  .page-title {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgb(var(--color-text-primary));

    .rss-icon {
      font-size: 24px;
      color: #ff9f43;
    }
  }

  .subtitle {
    font-size: 24px;
    font-weight: 700;
    color: rgb(var(--color-text-primary));
    opacity: 0.9;
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* 侧边信息栏 */
.sidebar {
  position: sticky;
  top: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: rgb(var(--color-bg-primary));
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgb(var(--color-border-primary) / 0.1);
  height: fit-content;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--color-text-primary));
  margin-bottom: 4px;
}

.sidebar-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.1);
  font-size: 14px;

  &:last-child {
    border-bottom: none;
  }

  .stat-label {
    color: rgb(var(--color-text-secondary));
  }

  .stat-value {
    font-weight: 600;
    color: rgb(var(--color-accent));
  }
}

/* 随机说说卡片 */
.random-thought {
  background: rgb(var(--color-bg-secondary) / 0.5);
  padding: 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: rgb(var(--color-text-primary));
  opacity: 0.9;

  .random-title {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--color-text-secondary));
    margin-bottom: 8px;
  }
}

/* 时间线导航 */
.timeline-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .nav-item {
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    color: rgb(var(--color-text-secondary));
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;

    &:hover {
      background: rgb(var(--color-bg-secondary));
      color: rgb(var(--color-text-primary));
      border-color: rgb(var(--color-border-primary) / 0.2);
    }

    &.active {
      background: rgb(var(--color-accent) / 0.1);
      color: rgb(var(--color-accent));
      border-color: rgb(var(--color-accent) / 0.3);
    }
  }
}

.thought-item {
  display: flex;
  gap: 16px;
  animation: fadeIn 0.5s ease-up;
  padding: 0;
  border: none;
  transition: all 0.2s ease;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}

.avatar-col {
  flex-shrink: 0;
  margin-top: 2px;

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    background: transparent;
    transition: all 0.2s ease;
    border: none;
    box-shadow: none;
  }
}

.content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .nickname {
    font-size: 0.95rem;
    font-weight: 700;
    color: #000000;
    transition: all 0.2s ease;
    cursor: pointer;
    letter-spacing: 0;

    &:hover {
      color: #000000;
    }
  }

  .date {
    font-size: 0.85rem;
    color: #666666;
    opacity: 1;
    letter-spacing: 0;
  }
}

.bubble {
  position: relative;
  background: #f5f5f5;
  padding: 16px 20px;
  border-radius: 16px;
  border-top-left-radius: 16px; /* 统一圆角 */
  font-size: 0.95rem;
  line-height: 1.5;
  color: #000000;
  box-shadow: none;
  border: none;
  max-width: fit-content;

  :deep(a) {
    color: #000000;
    text-decoration: none;
    word-break: break-all;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      color: #000000;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }
}

.actions {
  display: flex;
  gap: 48px;
  margin-top: 8px;
  padding-left: 0;
  align-items: center;

  .action-item {
    font-size: 0.85rem;
    color: #999999;
    opacity: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 4px 12px;
    border-radius: 18px;
    user-select: none;
    background: transparent;
    white-space: nowrap;

    &:hover {
      color: #666666;
      opacity: 1;
      transform: translateY(-1px);
      background: #fafafa;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .icon {
      font-size: 0.9rem;
      transition: all 0.2s ease;
      color: #999999;
    }

    .count {
      font-size: 0.8rem;
      transition: color 0.2s ease;
    }

    &:hover .icon,
    &:hover .count {
      color: #666666;
    }

    &:hover .icon {
      transform: scale(1.1);
    }

    &:active {
      transform: translateY(0);
    }

    &:active .icon {
      transform: scale(0.95);
    }

    &.like-btn:active {
      transform: scale(0.95);
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 960px) {
  .thinking-page {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 20px 16px;
  }

  .sidebar {
    position: static;
    order: -1;
    padding: 16px;
  }
}

@media (max-width: 600px) {
  .header-section {
    margin-bottom: 40px;

    .page-title { font-size: 28px; }
    .subtitle { font-size: 18px; }
  }

  .thought-item {
    gap: 12px;
  }

  .avatar-col .avatar {
    width: 40px;
    height: 40px;
  }

  .sidebar {
    padding: 12px;
  }

  .sidebar-section {
    gap: 12px;
  }
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 60px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #409eff;
    color: white;
  }

  &.active {
    background: #409eff;
    color: white;
    font-weight: bold;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
