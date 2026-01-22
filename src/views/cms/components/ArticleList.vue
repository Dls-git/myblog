
<script setup>
import { computed } from 'vue'
import { EditOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons-vue'
import draggable from 'vuedraggable'

const props = defineProps({
  filteredPosts: {
    type: Array,
    default: () => []
  },
  query: String
})

const emit = defineEmits(['update:query', 'openPost', 'deletePost', 'createNewArticle', 'update:filteredPosts'])

const localQuery = computed({
  get: () => props.query,
  set: (val) => emit('update:query', val)
})

const localList = computed({
  get: () => props.filteredPosts,
  set: (val) => emit('update:filteredPosts', val)
})

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return isNaN(d) ? date : d.toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="article-manager-view">
    <div class="list-toolbar">
      <input v-model="localQuery" class="search-input" placeholder="搜索标题或 slug..." />
      <button class="action-btn" @click="emit('createNewArticle')">
        <EditOutlined />
        撰写新文章
      </button>
    </div>
    <div class="card-container" v-if="filteredPosts.length">
      <draggable
        v-model="localList"
        class="article-list-drag"
        item-key="slug"
        handle=".drag-handle"
        :animation="300"
        :disabled="Boolean(query && String(query).trim())"
        ghost-class="ghost-card"
      >
        <template #item="{ element: p }">
          <div class="post-card">
            <div class="post-card-content" @click="emit('openPost', p.slug)">
              <h2 class="post-card-title">{{ p.title }}</h2>
              <p v-if="p.description" class="post-card-desc">{{ p.description }}</p>
              <div class="post-card-footer">
                <div class="post-card-meta">
                  <span v-if="p.date">📅 {{ formatDate(p.date) }}</span>
                  <span class="divider" v-if="p.category">|</span>
                  <span v-if="p.category">📁 {{ p.category }}</span>
                  <span class="divider" v-if="p.tags && p.tags.length">|</span>
                  <span v-if="p.tags && p.tags.length">🏷️ {{ p.tags.join(', ') }}</span>
                </div>
                <div class="post-card-actions">
                  <div class="drag-handle" title="拖拽排序" @click.stop>
                    <HolderOutlined />
                  </div>
                  <div class="continue-link">编辑文章 -></div>
                  <button class="delete-btn" @click.stop="emit('deletePost', p.slug)" title="删除文章">
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
/* ... existing styles ... */
.article-manager-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-input {
  width: 100%;
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 12px;
  padding: 12px 16px;
  outline: none;
  background: rgb(var(--color-bg-primary));
  color: rgb(var(--color-text-primary));
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.card-container {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.article-list-drag {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  background: rgb(var(--color-bg-primary));
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    background: rgb(var(--color-bg-secondary) / 0.3);
  }
}

.post-card-content {
  padding: 24px;
}

.post-card-title {
  font-size: 22px;
  margin: 0 0 12px 0;
  color: rgb(var(--color-text-primary));
  font-weight: bold;
}

.post-card-desc {
  font-size: 15px;
  color: rgb(var(--color-text-primary));
  opacity: 0.7;
  margin-bottom: 20px;
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
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  padding-top: 15px;
}

.post-card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: rgb(var(--color-text-primary));
  opacity: 0.5;

  .divider {
    margin: 0 8px;
    opacity: 0.3;
  }
}

.post-card-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.continue-link {
  font-size: 15px;
  color: #409eff;
  font-weight: 500;
  transition: transform 0.2s;

  &:hover {
    transform: translateX(5px);
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
  font-size: 18px;
  opacity: 0.6;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    opacity: 1;
    transform: scale(1.1);
  }
}

.drag-handle {
  cursor: grab;
  color: rgb(var(--color-text-secondary));
  padding: 4px;
  display: flex;
  align-items: center;
  
  &:active {
    cursor: grabbing;
  }
  
  &:hover {
    color: rgb(var(--color-text-primary));
  }
}

.ghost-card {
  opacity: 0.5;
  background: rgb(var(--color-bg-secondary)) !important;
  border: 2px dashed rgb(var(--color-accent)) !important;
}

.empty {
  padding: 40px;
  text-align: center;
  color: rgb(var(--color-text-secondary));
  background: rgb(var(--color-bg-secondary) / 0.3);
  border-radius: 16px;
  border: 1px dashed rgb(var(--color-border-primary));
}

.action-btn {
  background: rgb(var(--color-accent));
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;
}
</style>
