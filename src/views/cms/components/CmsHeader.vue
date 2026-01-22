
<script setup>
const props = defineProps({
  pageTitle: String,
  currentView: String,
  showPreview: Boolean,
  showMeta: Boolean,
  isListView: Boolean
})

const emit = defineEmits(['update:showPreview', 'update:showMeta', 'openAddModal'])
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
      <button v-if="isListView" class="action-btn" @click="emit('openAddModal')">新增项目</button>
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
