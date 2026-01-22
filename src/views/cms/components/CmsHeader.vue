
<script setup>
import { UndoOutlined, PlusOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  pageTitle: String,
  currentView: String,
  showPreview: Boolean,
  showMeta: Boolean,
  isListView: Boolean,
  canUndo: Boolean
})

const emit = defineEmits(['update:showPreview', 'update:showMeta', 'openAddModal', 'openHistory'])
</script>

<template>
  <header class="top-bar">
    <div class="page-title">{{ pageTitle }}</div>
    <div class="actions">
      <div v-if="currentView === 'article'" style="display: flex; gap: 8px; margin-right: 16px">
        <button class="btn-icon" :class="{ active: showPreview }" @click="emit('update:showPreview', !showPreview)" title="预览">
          预览
        </button>
        <button class="btn-icon" :class="{ active: showMeta }" @click="emit('update:showMeta', !showMeta)" title="设置">
          设置
        </button>
      </div>
      <div v-if="currentView === 'article_list' || currentView === 'aboutData.js' || currentView === 'taxonomy_manager'" style="display: flex; gap: 12px; align-items: center">
        <button 
          v-if="canUndo" 
          class="undo-btn" 
          @click="emit('openHistory')" 
          title="查看历史记录与回滚"
        >
          <UndoOutlined />
          <span>历史</span>
        </button>
      </div>
      <div v-else-if="isListView" style="display: flex; gap: 12px; align-items: center">
        <button 
          v-if="canUndo" 
          class="undo-btn" 
          @click="emit('openHistory')" 
          title="查看历史记录与撤销"
        >
          <UndoOutlined />
          <span>历史</span>
        </button>
        <button class="action-btn" @click="emit('openAddModal')">
          <PlusOutlined />
          <span>新增项目</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.top-bar {
  height: 64px;
  background: rgb(var(--color-bg-primary) / 0.9);
  /* 优化性能：去掉 backdrop-filter 或改为简单透明 */
  /* backdrop-filter: blur(10px); */
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
  z-index: 10;
}

.page-title {
  font-family: inherit;
  font-size: 1.25rem;
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
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
}

.action-btn:hover {
  filter: brightness(0.95);
}

.undo-btn {
  background: transparent;
  color: rgb(var(--color-text-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.8);
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-size: 0.85rem;
  opacity: 0.8;

  &:hover {
    background: rgb(var(--color-bg-secondary));
    opacity: 1;
    border-color: rgb(var(--color-accent) / 0.5);
    color: rgb(var(--color-accent));
  }
}

.btn-icon {
  background: rgb(var(--color-bg-secondary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  color: rgb(var(--color-text-primary));
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-icon.active {
  background: rgb(var(--color-accent) / 0.14);
  border-color: rgb(var(--color-accent) / 0.3);
  color: rgb(var(--color-accent));
}
</style>
