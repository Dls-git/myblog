
<script setup>
import { EditOutlined, DeleteOutlined, HolderOutlined, CommentOutlined, HeartOutlined, EyeOutlined } from '@ant-design/icons-vue'
import draggable from 'vuedraggable'
import { normalizeUrl, linkify } from '../utils'
import { computed } from 'vue'

const props = defineProps({
  listData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['editItem', 'deleteItem', 'update:listData'])

const list = computed({
  get: () => props.listData,
  set: (value) => emit('update:listData', value)
})

// 统计数据计算
const totalLikes = computed(() => {
  return list.value.reduce((sum, item) => sum + (item.likes || 0), 0)
})

const totalComments = computed(() => {
  return list.value.reduce((sum, item) => sum + (item.comments || 0), 0)
})

const recentAdditions = computed(() => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  
  return list.value.filter(item => {
    const itemDate = new Date(item.date)
    return !isNaN(itemDate) && itemDate >= oneMonthAgo
  }).length
})
</script>

<template>
  <div class="cms-thinking-container">
    <!-- 管理统计信息 -->
    <div class="cms-thinking-stats">
      <div class="stat-card">
        <div class="stat-value">{{ list.length }}</div>
        <div class="stat-label">总说说数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalLikes }}</div>
        <div class="stat-label">总获赞数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalComments }}</div>
        <div class="stat-label">总评论数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ recentAdditions }}</div>
        <div class="stat-label">本月新增</div>
      </div>
    </div>

    <draggable 
      v-if="list.length > 0"
      v-model="list" 
      class="cms-thinking-list"
      item-key="_cms_id"
      handle=".drag-handle"
      :animation="300"
      ghost-class="ghost-card"
    >
      <template #item="{ element, index }">
        <div class="cms-thought-item cms-card-wrap">
          <div class="cms-thought-avatar-col">
            <img :src="normalizeUrl('/assets/img/Mikasa.jpg')" alt="Avatar" class="cms-thought-avatar-img" loading="lazy">
          </div>
          <div class="cms-thought-content-col">
            <div class="cms-thought-meta">
              <span class="cms-thought-nickname">Youth</span>
              <span class="cms-thought-date">{{ element.date }} {{ element.week }}</span>
            </div>
            <div class="cms-thought-bubble">
              <div class="cms-thought-bubble-content" v-html="linkify(element.content)"></div>
            </div>
            <div class="cms-thought-actions-row">
              <span class="cms-thought-action-item">
                <CommentOutlined class="icon" />
                <span class="count">{{ element.comments ?? 0 }}</span>
              </span>
              <span class="cms-thought-action-item">
                <HeartOutlined class="icon" />
                <span class="count">{{ element.likes ?? 0 }}</span>
              </span>
              <span class="cms-thought-action-item">
                <EyeOutlined class="icon" />
                <span class="count">0</span>
              </span>
            </div>
          </div>
          <div class="cms-thought-actions cms-card-actions">
            <div class="cms-action-btn drag-handle" title="拖拽排序">
              <HolderOutlined />
            </div>
            <button class="cms-action-btn" @click="emit('editItem', index)" title="编辑">
              <EditOutlined />
            </button>
            <button class="cms-action-btn danger" @click="emit('deleteItem', index)" title="删除">
              <DeleteOutlined />
            </button>
          </div>
        </div>
      </template>
    </draggable>
    <div v-else class="empty-state">暂无数据，请点击上方新增</div>
  </div>
</template>

<style scoped lang="scss">
.cms-thinking-container {
  padding: 0 20px;
  max-width: 100%;
  margin: 0 auto;
}

/* 统计信息样式 */
.cms-thinking-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  border: 1px solid rgb(var(--color-border-primary) / 0.1);
}

.stat-card {
  text-align: center;
  padding: 20px 16px;
  background: rgb(var(--color-bg-secondary) / 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgb(var(--color-border-primary) / 0.1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  background: rgb(var(--color-bg-secondary) / 0.5);
  border-color: rgb(var(--color-border-primary) / 0.3);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: rgb(var(--color-accent));
  margin-bottom: 6px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: rgb(var(--color-text-secondary));
  font-weight: 500;
  opacity: 0.8;
}

.cms-thinking-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.cms-thought-item {
  display: flex;
  gap: 16px;
  position: relative;
  padding: 0;
  border: none;
  transition: all 0.2s ease;
  background: transparent;
  box-shadow: none;
  border-radius: 0;

  &:hover {
    background: transparent;
    transform: none;
    box-shadow: none;
  }
}

.cms-thought-avatar-col {
  flex-shrink: 0;
}

.cms-thought-avatar-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  background: transparent;
  transition: all 0.2s ease;
  border: none;
  box-shadow: none;
}

.cms-thought-content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.cms-thought-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .cms-thought-nickname {
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

  .cms-thought-date {
    font-size: 0.85rem;
    color: #666666;
    opacity: 1;
    letter-spacing: 0;
  }
}

.cms-thought-bubble {
  position: relative;
  background: #f5f5f5;
  padding: 16px 20px;
  border-radius: 16px;
  transition: all 0.2s ease;
  line-height: 1.5;
  max-width: fit-content;
}

.cms-thought-bubble-content {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #000000;
  word-break: break-word;
  white-space: pre-wrap;
  font-weight: 400;

  :deep(a) {
    color: #000000;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      color: #000000;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }

  :deep(p) {
    margin: 0;
    padding: 0;
  }
}

.cms-thought-actions-row {
  display: flex;
  gap: 48px;
  padding-top: 8px;
  align-items: center;
}

.cms-thought-action-item {
  font-size: 0.85rem;
  color: #999999;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 1;
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
}

.cms-card-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 8px;
  opacity: 0.3;
  transform: translateY(0);
  transition: all 0.2s ease;
  z-index: 2;
}

.cms-thought-item:hover .cms-card-actions {
  opacity: 0.6;
}

.cms-action-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  color: #666666;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: none;
  font-size: 0.85rem;

  &:hover {
    background: #f8f8f8;
    color: #333333;
    border-color: #d0d0d0;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: scale(0.95);
  }
}

.cms-action-btn.danger {
  &:hover {
    background: #fef2f2;
    color: #ef4444;
    border-color: #fee2e2;
  }
}

.cms-action-btn.drag-handle {
  cursor: grab;
  opacity: 0.5;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:active {
    cursor: grabbing;
  }
}

.ghost-card {
  opacity: 0.5;
  background: rgb(var(--color-bg-secondary)) !important;
  border: 2px dashed rgb(var(--color-accent)) !important;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: rgb(var(--color-text-secondary));
}
</style>
