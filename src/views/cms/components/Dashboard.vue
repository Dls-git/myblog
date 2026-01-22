
<script setup>
import { computed } from 'vue'
import { 
  FileTextOutlined, 
  PictureOutlined, 
  TagOutlined, 
  FolderOpenOutlined,
  EditOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'

const props = defineProps({
  posts: { type: Array, default: () => [] },
  media: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] }
})

const emit = defineEmits(['navigate'])

// 基础统计
const stats = computed(() => {
  const publishedCount = props.posts.filter(p => (p.status || 'published') === 'published').length
  const draftCount = props.posts.length - publishedCount
  const totalMediaSize = props.media.reduce((acc, file) => acc + (file.size || 0), 0)
  
  // 提取所有标签
  const allTags = new Set()
  props.posts.forEach(p => {
    if (Array.isArray(p.tags)) p.tags.forEach(t => allTags.add(t))
  })

  return {
    totalPosts: props.posts.length,
    publishedCount,
    draftCount,
    mediaCount: props.media.length,
    mediaSize: formatSize(totalMediaSize),
    tagCount: allTags.size,
    categoryCount: props.categories.length
  }
})

// 最近编辑的文章
const recentPosts = computed(() => {
  return [...props.posts]
    .sort((a, b) => new Date(b.updated || b.date) - new Date(a.updated || a.date))
    .slice(0, 5)
})

// 分类占比
const categoryStats = computed(() => {
  const counts = {}
  props.posts.forEach(p => {
    const cat = p.category || '未分类'
    counts[cat] = (counts[cat] || 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
})

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(date) {
  if (!date) return '未知时间'
  return new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="dashboard-view">
    <div class="welcome-section">
      <h1>早安，作者</h1>
      <p>今天也是充满创作灵感的一天。</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon posts"><FileTextOutlined /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalPosts }}</div>
          <div class="stat-label">总文章 ({{ stats.draftCount }} 草稿)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon media"><PictureOutlined /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.mediaCount }}</div>
          <div class="stat-label">媒体资源 ({{ stats.mediaSize }})</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon categories"><FolderOpenOutlined /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.categoryCount }}</div>
          <div class="stat-label">分类专栏</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon tags"><TagOutlined /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.tagCount }}</div>
          <div class="stat-label">标签数量</div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="content-left">
        <div class="section-card">
          <div class="section-header">
            <h3><ClockCircleOutlined /> 最近编辑</h3>
            <button class="text-btn" @click="emit('navigate', 'article_list')">查看全部</button>
          </div>
          <div class="recent-list">
            <div v-for="post in recentPosts" :key="post.slug" class="recent-item" @click="emit('navigate', 'article', post.slug)">
              <div class="item-main">
                <span class="item-title">{{ post.title }}</span>
                <span class="item-time">{{ formatDate(post.updated || post.date) }}</span>
              </div>
              <div class="item-status" :class="post.status || 'published'">
                {{ (post.status || 'published') === 'published' ? '已发布' : '草稿' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-right">
        <div class="section-card">
          <div class="section-header">
            <h3>分类分布</h3>
          </div>
          <div class="category-chart">
            <div v-for="[name, count] in categoryStats" :key="name" class="chart-row">
              <div class="row-label">{{ name }}</div>
              <div class="row-bar-wrapper">
                <div class="row-bar" :style="{ width: (count / stats.totalPosts * 100) + '%' }"></div>
              </div>
              <div class="row-count">{{ count }}</div>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <button class="action-btn primary" @click="emit('navigate', 'article')">
            <EditOutlined /> 开始写新文章
          </button>
          <button class="action-btn" @click="emit('navigate', 'media_manager')">
            <PictureOutlined /> 管理媒体库
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.welcome-section {
  h1 {
    font-size: 2rem;
    margin: 0 0 8px 0;
    font-weight: 800;
  }
  p {
    color: rgb(var(--color-text-secondary));
    margin: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgb(var(--color-bg-primary));
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  
  &.posts { background: #e0f2fe; color: #0ea5e9; }
  &.media { background: #fef3c7; color: #f59e0b; }
  &.categories { background: #dcfce7; color: #10b981; }
  &.tags { background: #f3e8ff; color: #a855f7; }
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: rgb(var(--color-text-secondary));
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
}

.section-card {
  background: rgb(var(--color-bg-primary));
  border-radius: 20px;
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  padding: 24px;
  height: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.text-btn {
  background: transparent;
  border: none;
  color: rgb(var(--color-accent));
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 600;
  
  &:hover { text-decoration: underline; }
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  padding: 12px 16px;
  background: rgb(var(--color-bg-secondary) / 0.3);
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgb(var(--color-bg-secondary) / 0.6);
    transform: translateX(4px);
  }
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.item-time {
  font-size: 0.75rem;
  color: rgb(var(--color-text-secondary));
}

.item-status {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  
  &.published { background: #ecfdf5; color: #10b981; }
  &.draft { background: #fff7ed; color: #f59e0b; }
}

.category-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-row {
  display: grid;
  grid-template-columns: 80px 1fr 30px;
  align-items: center;
  gap: 12px;
}

.row-label {
  font-size: 0.85rem;
  color: rgb(var(--color-text-secondary));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-bar-wrapper {
  height: 8px;
  background: rgb(var(--color-bg-secondary));
  border-radius: 4px;
  overflow: hidden;
}

.row-bar {
  height: 100%;
  background: rgb(var(--color-accent));
  border-radius: 4px;
}

.row-count {
  font-size: 0.85rem;
  font-weight: 600;
  text-align: right;
}

.quick-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgb(var(--color-border-primary) / 0.8);
  background: rgb(var(--color-bg-primary));
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: rgb(var(--color-bg-secondary));
    border-color: rgb(var(--color-accent) / 0.3);
  }
  
  &.primary {
    background: rgb(var(--color-accent));
    color: white;
    border: none;
    
    &:hover {
      background: rgb(var(--color-accent) / 0.9);
      box-shadow: 0 4px 12px rgb(var(--color-accent) / 0.3);
    }
  }
}

@media (max-width: 1000px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>
