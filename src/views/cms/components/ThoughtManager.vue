
<script setup>
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { normalizeUrl, linkify } from '../utils'

const props = defineProps({
  listData: Array
})

const emit = defineEmits(['editItem', 'deleteItem'])
</script>

<template>
  <div class="cms-thinking-container">
    <div class="cms-thinking-list" v-if="listData.length > 0">
      <div class="cms-thought-item cms-card-wrap" v-for="(item, index) in listData" :key="index">
        <div class="cms-thought-avatar-col">
          <img :src="normalizeUrl('/assets/img/Mikasa.jpg')" alt="Avatar" class="cms-thought-avatar-img" loading="lazy">
        </div>
        <div class="cms-thought-content-col">
          <div class="cms-thought-meta">
            <span class="cms-thought-nickname">Youth</span>
            <span class="cms-thought-date">{{ item.date }} {{ item.week }}</span>
          </div>
          <div class="cms-thought-bubble">
            <div class="cms-thought-bubble-content" v-html="linkify(item.content)"></div>
          </div>
          <div class="cms-thought-actions-row">
            <span class="cms-thought-action-item">
              <span class="icon">💬</span> {{ item.comments ?? 0 }}
            </span>
            <span class="cms-thought-action-item">
              <span class="icon">🤍</span> {{ item.likes ?? 0 }}
            </span>
            <span class="cms-thought-action-item">
              <span class="icon">👀</span> 0
            </span>
          </div>
        </div>
        <div class="cms-thought-actions cms-card-actions">
          <button class="cms-action-btn" @click="emit('editItem', index)" title="编辑">
            <EditOutlined />
          </button>
          <button class="cms-action-btn danger" @click="emit('deleteItem', index)" title="删除">
            <DeleteOutlined />
          </button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">暂无数据，请点击上方新增</div>
  </div>
</template>

<style scoped lang="scss">
.cms-thinking-container {
  padding: 0 20px;
  max-width: 800px;
  margin: 0 auto;
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
}

.cms-thought-avatar-col {
  flex-shrink: 0;
}

.cms-thought-avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(var(--color-border-primary), 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cms-thought-content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.cms-thought-meta {
  display: flex;
  align-items: baseline;
  gap: 10px;

  .cms-thought-nickname {
    font-size: 1rem;
    font-weight: 700;
    color: rgb(var(--color-text-primary));
  }

  .cms-thought-date {
    font-size: 0.75rem;
    color: rgb(var(--color-text-secondary));
    opacity: 0.7;
  }
}

.cms-thought-bubble {
  position: relative;
  background: rgba(var(--color-bg-secondary), 0.4);
  padding: 16px 20px;
  border-radius: 14px;
  border-top-left-radius: 2px;
  border: 1px solid rgba(var(--color-border-primary), 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(var(--color-bg-secondary), 0.6);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  }
}

.cms-thought-bubble-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--color-text-primary));
  word-break: break-all;

  :deep(a) {
    color: rgb(var(--color-accent));
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.cms-thought-actions-row {
  display: flex;
  gap: 20px;
  padding-left: 4px;

  .cms-thought-action-item {
    font-size: 0.8rem;
    color: rgb(var(--color-text-secondary));
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.7;

    .icon {
      font-size: 0.9rem;
    }
  }
}

.cms-card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease;
  z-index: 2;
}

.cms-card-wrap:hover .cms-card-actions {
  opacity: 1;
  transform: translateY(0);
}

.cms-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgb(var(--color-border-primary) / 0.85);
  background: rgb(var(--color-bg-primary) / 0.92);
  color: rgb(var(--color-text-primary));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.cms-action-btn.danger {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: rgb(var(--color-text-secondary));
}
</style>
