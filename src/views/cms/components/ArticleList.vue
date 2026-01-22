
<script setup>
import { ref, computed } from 'vue'
import { 
  EditOutlined, 
  DeleteOutlined, 
  HolderOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CheckSquareOutlined,
  BorderOutlined
} from '@ant-design/icons-vue'
import draggable from 'vuedraggable'

const props = defineProps({
  filteredPosts: {
    type: Array,
    default: () => []
  },
  query: String
})

const emit = defineEmits([
  'update:query', 
  'openPost', 
  'deletePost', 
  'createNewArticle', 
  'update:filteredPosts',
  'batchDelete'
])

const localQuery = computed({
  get: () => props.query,
  set: (val) => emit('update:query', val)
})

// 筛选与排序状态
const statusFilter = ref('all') // all, published, draft
const sortBy = ref('date') // date, title
const sortOrder = ref('desc') // desc, asc
const isDragging = ref(false) // 拖拽状态标记
const currentMode = ref('drag') // drag 或 sort，控制拖拽和排序功能切换

// 批量选择状态
const selectedSlugs = ref(new Set())
const isBatchMode = ref(false)

// 检查拖拽功能是否可用
const isDraggableEnabled = computed(() => {
  return currentMode.value === 'drag' && 
         !Boolean(localQuery.value && String(localQuery.value).trim()) && 
         !isBatchMode.value
})

// 用于拖拽的原始数据
const dragList = computed({
  get: () => props.filteredPosts,
  set: (val) => emit('update:filteredPosts', val)
})

// 用于显示的处理后数据
const processedList = computed(() => {
  let list = [...props.filteredPosts]

  // 1. 状态筛选
  if (statusFilter.value !== 'all') {
    list = list.filter(p => (p.status || 'published') === statusFilter.value)
  }

  // 2. 排序 - 仅当排序模式或拖拽不可用时进行排序
  if (currentMode.value === 'sort' || !isDraggableEnabled.value) {
    list.sort((a, b) => {
      let valA, valB
      if (sortBy.value === 'date') {
        valA = new Date(a.date || 0).getTime()
        valB = new Date(b.date || 0).getTime()
      } else {
        valA = (a.title || '').toLowerCase()
        valB = (b.title || '').toLowerCase()
      }

      if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }
  // 当拖拽模式且可用时，使用拖拽后的顺序

  return list
})

const toggleSelect = (slug) => {
  if (selectedSlugs.value.has(slug)) {
    selectedSlugs.value.delete(slug)
  } else {
    selectedSlugs.value.add(slug)
  }
}

const toggleSelectAll = () => {
  if (selectedSlugs.value.size === processedList.value.length) {
    selectedSlugs.value.clear()
  } else {
    selectedSlugs.value = new Set(processedList.value.map(p => p.slug))
  }
}

const handleBatchDelete = () => {
  if (selectedSlugs.value.size === 0) return
  emit('batchDelete', Array.from(selectedSlugs.value))
  selectedSlugs.value.clear()
  isBatchMode.value = false
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return isNaN(d) ? date : d.toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="article-manager-view">
    <div class="list-toolbar">
      <div class="toolbar-top">
        <input v-model="localQuery" class="search-input" placeholder="搜索标题或 slug..." />
        <button class="action-btn" @click="emit('createNewArticle')">
          <EditOutlined />
          撰写新文章
        </button>
      </div>

      <div class="toolbar-bottom">
        <div class="filter-group">
          <span class="label"><FilterOutlined /> 筛选:</span>
          <select v-model="statusFilter" class="filter-select">
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿箱</option>
          </select>
          
          <span class="label"><SortAscendingOutlined /> 排序:</span>
          <select v-model="sortBy" class="filter-select" :disabled="currentMode === 'drag'">
            <option value="date">发布日期</option>
            <option value="title">文章标题</option>
          </select>
          <button class="sort-order-btn" @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'" :disabled="currentMode === 'drag'">
            {{ sortOrder === 'desc' ? '倒序 ↓' : '正序 ↑' }}
          </button>
          
          <button 
            class="mode-toggle-btn"
            :class="{ active: true }"
            @click="currentMode = currentMode === 'drag' ? 'sort' : 'drag'"
          >
            {{ currentMode === 'drag' ? '拖拽模式' : '排序模式' }}
          </button>
        </div>

        <div class="batch-actions">
          <button 
            class="batch-btn" 
            :class="{ active: isBatchMode }" 
            @click="isBatchMode = !isBatchMode; selectedSlugs.clear()"
          >
            {{ isBatchMode ? '退出批量' : '批量管理' }}
          </button>
          <template v-if="isBatchMode">
            <button class="batch-btn" @click="toggleSelectAll">
              {{ selectedSlugs.size === processedList.size ? '取消全选' : '全选' }}
            </button>
            <button 
              class="batch-btn danger" 
              :disabled="selectedSlugs.size === 0"
              @click="handleBatchDelete"
            >
              删除所选 ({{ selectedSlugs.size }})
            </button>
          </template>
        </div>
      </div>
    </div>

    <div class="card-container" v-if="processedList.length">
      <draggable
        v-model="dragList"
        class="article-list-drag"
        item-key="slug"
        handle=".drag-handle"
        :animation="300"
        :disabled="!isDraggableEnabled"
        ghost-class="ghost-card"
        @start="isDragging = true"
        @end="isDragging = false"
      >
        <template #item="{ element: p }">
          <div 
            class="post-card" 
            :class="{ 'is-selected': selectedSlugs.has(p.slug), 'batch-mode': isBatchMode }"
            @click="isBatchMode ? toggleSelect(p.slug) : emit('openPost', p.slug)"
          >
            <div class="post-card-content">
              <div class="post-card-header">
                <div class="selection-indicator" v-if="isBatchMode">
                  <CheckSquareOutlined v-if="selectedSlugs.has(p.slug)" />
                  <BorderOutlined v-else />
                </div>
                <h2 class="post-card-title">{{ p.title }}</h2>
              </div>
              <p v-if="p.description" class="post-card-desc">{{ p.description }}</p>
              <div class="post-card-footer">
                <div class="post-card-meta">
                  <span class="status-badge" :class="p.status || 'published'">
                    {{ (p.status || 'published') === 'published' ? '已发布' : '草稿' }}
                  </span>
                  <span v-if="p.date">📅 {{ formatDate(p.date) }}</span>
                  <span class="divider" v-if="p.category">|</span>
                  <span v-if="p.category">📁 {{ p.category }}</span>
                  <span class="divider" v-if="p.tags && p.tags.length">|</span>
                  <span v-if="p.tags && p.tags.length">🏷️ {{ p.tags.join(', ') }}</span>
                </div>
                <div class="post-card-actions">
                  <div class="drag-handle" title="拖拽排序 (仅限默认排序时)" v-if="isDraggableEnabled">
                    <HolderOutlined />
                  </div>
                  <div class="continue-link" v-if="!isBatchMode">编辑文章 -></div>
                  <button class="delete-btn" v-if="!isBatchMode" @click.stop="emit('deletePost', p.slug)" title="删除文章">
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
    <div v-else class="empty">暂无文章</div>
  </div>
</template>

<style scoped lang="scss">
.article-manager-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-toolbar {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgb(var(--color-bg-secondary) / 0.2);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
}

.toolbar-top {
  display: flex;
  gap: 16px;
}

.toolbar-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  color: rgb(var(--color-text-secondary));

  .label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
  }
}

.filter-select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgb(var(--color-border-primary) / 0.8);
  background: rgb(var(--color-bg-primary));
  color: inherit;
  outline: none;
  font-size: 0.85rem;

  &:focus {
    border-color: rgb(var(--color-accent));
  }
}

.sort-order-btn {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.8);
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;

  &:hover {
    border-color: rgb(var(--color-accent));
    color: rgb(var(--color-accent));
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      border-color: rgb(var(--color-border-primary) / 0.8);
      color: inherit;
    }
  }
}

.mode-toggle-btn {
  background: rgb(var(--color-accent));
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  margin-left: 8px;

  &:hover {
    background: rgb(var(--color-accent) / 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.filter-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.batch-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgb(var(--color-border-primary) / 0.8);
  background: rgb(var(--color-bg-primary));
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: rgb(var(--color-accent));
    color: white;
    border-color: rgb(var(--color-accent));
  }

  &.danger {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);

    &:hover:not(:disabled) {
      background: #ef4444;
      color: white;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.search-input {
  flex: 1;
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 12px;
  padding: 10px 16px;
  outline: none;
  background: rgb(var(--color-bg-primary));
  color: rgb(var(--color-text-primary));
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

  &:focus {
    border-color: rgb(var(--color-accent));
    box-shadow: 0 0 0 3px rgb(var(--color-accent) / 0.1);
  }
}

.card-container {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.article-list-drag {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
    border-color: rgb(var(--color-accent) / 0.2);
  }

  &.is-selected {
    border-color: rgb(var(--color-accent));
    background: rgb(var(--color-accent) / 0.02);
  }

  &.batch-mode {
    &:hover {
      background: rgb(var(--color-bg-secondary) / 0.5);
    }
  }
}

.post-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.selection-indicator {
  font-size: 1.2rem;
  color: rgb(var(--color-accent));
  margin-top: 4px;
}

.post-card-content {
  padding: 20px;
}

.post-card-title {
  font-size: 1.2rem;
  margin: 0;
  color: rgb(var(--color-text-primary));
  font-weight: 700;
  line-height: 1.4;
}

.post-card-desc {
  font-size: 0.9rem;
  color: rgb(var(--color-text-secondary));
  margin-bottom: 16px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgb(var(--color-border-primary) / 0.3);
  padding-top: 12px;
}

.post-card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: rgb(var(--color-text-secondary));

  .divider {
    margin: 0 8px;
    opacity: 0.3;
  }
}

.status-badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 8px;
  
  &.published {
    background: #ecfdf5;
    color: #10b981;
  }
  
  &.draft {
    background: #fff7ed;
    color: #f59e0b;
  }
}

.post-card-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.continue-link {
  font-size: 0.85rem;
  color: rgb(var(--color-accent));
  font-weight: 500;
  transition: transform 0.2s;

  &:hover {
    transform: translateX(4px);
  }
}

.delete-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  opacity: 0.5;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    opacity: 1;
  }
}

.drag-handle {
  cursor: grab;
  color: rgb(var(--color-text-secondary));
  padding: 4px;
  display: flex;
  align-items: center;
  opacity: 0.5;
  
  &:active {
    cursor: grabbing;
  }
  
  &:hover {
    opacity: 1;
    color: rgb(var(--color-text-primary));
  }
}

.ghost-card {
  opacity: 0.5;
  background: rgb(var(--color-bg-secondary)) !important;
  border: 2px dashed rgb(var(--color-accent)) !important;
}

.empty {
  padding: 60px;
  text-align: center;
  color: rgb(var(--color-text-secondary));
  background: rgb(var(--color-bg-secondary) / 0.2);
  border-radius: 20px;
  border: 2px dashed rgb(var(--color-border-primary) / 0.5);
}

.action-btn {
  background: rgb(var(--color-accent));
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;

  &:hover {
    background: rgb(var(--color-accent) / 0.85);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgb(var(--color-accent) / 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
