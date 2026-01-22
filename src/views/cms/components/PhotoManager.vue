
<script setup>
import { EditOutlined, DeleteOutlined, HolderOutlined, CopyOutlined } from '@ant-design/icons-vue'
import draggable from 'vuedraggable'
import { normalizeUrl } from '../utils'
import { computed, ref } from 'vue'

const props = defineProps({
  listData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['editItem', 'cloneItem', 'deleteItem', 'update:listData'])

const list = computed({
  get: () => props.listData,
  set: (value) => emit('update:listData', value)
})

const isDragging = ref(false)

const onDragStart = () => {
  isDragging.value = true
}

const onDragEnd = () => {
  setTimeout(() => {
    isDragging.value = false
  }, 0)
}

const onCardClick = (index) => {
  if (isDragging.value) return
  emit('editItem', index)
}
</script>

<template>
  <div class="cms-photos-container">
    <draggable 
      v-if="list.length > 0"
      v-model="list" 
      class="cms-photos-grid"
      item-key="_cms_id"
      :animation="300"
      :filter="'.cms-card-actions, .cms-action-btn, button'"
      @start="onDragStart"
      @end="onDragEnd"
      ghost-class="ghost-card"
    >
      <template #item="{ element, index }">
        <div class="cms-photo-card-wrap cms-card-wrap">
          <div class="cms-photo-card" @click="onCardClick(index)">
            <div class="photo-preview-wrapper" v-if="element.url">
              <img :src="normalizeUrl(element.url)" :alt="element.title" class="photo-preview" loading="lazy" />
            </div>
            <div class="photo-info">
              <h3 class="photo-title">{{ element.title || '无标题' }}</h3>
              <p class="photo-desc" v-if="element.description">{{ element.description }}</p>
              <div class="photo-footer">
                <span class="photo-category" v-if="element.category">📁 {{ element.category }}</span>
                <span class="photo-date" v-if="element.date">📅 {{ element.date }}</span>
              </div>
            </div>
          </div>
          <div class="cms-photo-actions cms-card-actions">
            <div class="cms-action-btn drag-handle" title="拖拽排序">
              <HolderOutlined />
            </div>
            <button class="cms-action-btn" @click.prevent="emit('editItem', index)" title="编辑">
              <EditOutlined />
            </button>
            <button class="cms-action-btn" @click.prevent="emit('cloneItem', index)" title="克隆">
              <CopyOutlined />
            </button>
            <button class="cms-action-btn danger" @click.prevent="emit('deleteItem', index)" title="删除">
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
.cms-photos-container {
  padding: 0 20px;
}

.cms-photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.cms-card-wrap {
  position: relative;
}

.cms-photo-card {
  background: rgb(var(--color-bg-primary));
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: grab;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
    transform: translateY(-5px);
    background: rgb(var(--color-bg-secondary) / 0.3);

    .photo-preview {
      transform: scale(1.05);
    }
  }
}

.photo-preview-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.photo-info {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.photo-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: rgb(var(--color-text-primary));
}

.photo-desc {
  font-size: 0.95rem;
  color: rgb(var(--color-text-secondary));
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.photo-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: rgb(var(--color-text-secondary));
  padding-top: 12px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);

  .photo-category {
    background: rgb(var(--color-accent) / 0.1);
    color: rgb(var(--color-accent));
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
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

.drag-handle {
  cursor: grab;
  color: rgb(var(--color-text-secondary));
  
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
