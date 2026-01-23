
<script setup>
import { EditOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons-vue'
import draggable from 'vuedraggable'
import { normalizeUrl } from '../utils'
import { computed, ref } from 'vue'

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
        <div class="cms-photo-card-wrap">
          <div class="cms-photo-card">
            <!-- Image Preview -->
            <div class="photo-preview-container">
              <img 
                :src="normalizeUrl(element.url)" 
                :alt="element.title" 
                class="photo-preview" 
                loading="lazy" 
              />
              <!-- Image Overlay -->
              <div class="photo-overlay">
                <div class="photo-overlay-content">
                  <span class="photo-overlay-category" v-if="element.category">{{ element.category }}</span>
                  <button 
                    class="photo-overlay-btn edit-btn" 
                    @click.prevent="emit('editItem', index)"
                    title="编辑"
                  >
                    <EditOutlined />
                  </button>
                  <button 
                    class="photo-overlay-btn delete-btn" 
                    @click.prevent="emit('deleteItem', index)"
                    title="删除"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
              <!-- Drag Handle -->
              <div class="drag-handle" @click.stop>
                <HolderOutlined />
              </div>
            </div>
            
            <!-- Photo Info -->
            <div class="photo-info">
              <h3 class="photo-title">{{ element.title || '无标题' }}</h3>
              <p class="photo-desc" v-if="element.description">{{ element.description }}</p>
              <p class="photo-date" v-if="element.date">{{ element.date }}</p>
            </div>
          </div>
        </div>
      </template>
    </draggable>
    <div v-else class="empty-state">
      <div class="empty-icon">📷</div>
      <p>暂无摄影作品</p>
      <p class="empty-hint">点击上方按钮添加您的第一张摄影作品</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cms-photos-container {
  padding: 0 20px;
  min-height: 400px;
}

.cms-photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  margin-top: 20px;
}

.cms-photo-card-wrap {
  position: relative;
  perspective: 1000px;
}

.cms-photo-card {
  background: rgb(var(--color-bg-primary));
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(var(--color-border-primary) / 0.3);
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18), 0 8px 24px rgba(15, 23, 42, 0.12);
    border-color: rgb(var(--color-accent) / 0.3);
  }
}

/* Photo Preview Container */
.photo-preview-container {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  background: linear-gradient(135deg, rgb(var(--color-bg-secondary)) 0%, rgb(var(--color-bg-primary)) 100%);
  border-radius: 24px 24px 0 0;
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  filter: brightness(0.95) contrast(1.05);
}

.cms-photo-card:hover .photo-preview {
  transform: scale(1.1);
  filter: brightness(1) contrast(1.1);
}

/* Photo Overlay */
.photo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  padding: 20px;
}

.cms-photo-card:hover .photo-overlay {
  opacity: 1;
}

.photo-overlay-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.photo-overlay-category {
  background: rgba(255, 255, 255, 0.9);
  color: rgb(var(--color-text-primary));
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.photo-overlay-btns {
  display: flex;
  gap: 8px;
}

.photo-overlay-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: rgb(var(--color-text-primary));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }
  
  &.edit-btn:hover {
    background: rgb(var(--color-accent));
    color: white;
  }
  
  &.clone-btn:hover {
    background: #10b981;
    color: white;
  }
  
  &.delete-btn:hover {
    background: #ef4444;
    color: white;
  }
}

/* Drag Handle */
.drag-handle {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  color: rgb(var(--color-text-secondary));
  cursor: grab;
  transition: all 0.3s ease;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: scale(1.1);
    color: rgb(var(--color-accent));
    background: rgba(255, 255, 255, 1);
  }
  
  &:active {
    cursor: grabbing;
    transform: scale(0.95);
  }
}

/* Photo Info */
.photo-info {
  padding: 20px 24px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.photo-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: rgb(var(--color-text-primary));
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  
  .cms-photo-card:hover & {
    color: rgb(var(--color-accent));
  }
}

.photo-desc {
  font-size: 0.95rem;
  color: rgb(var(--color-text-secondary));
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.photo-date {
  font-size: 0.85rem;
  color: rgb(var(--color-text-tertiary, var(--color-text-secondary)));
  margin: 0;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgb(var(--color-text-secondary));
  background: rgb(var(--color-bg-secondary) / 0.3);
  border: 2px dashed rgb(var(--color-border-primary) / 0.5);
  border-radius: 24px;
  margin-top: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgb(var(--color-accent) / 0.5);
    background: rgb(var(--color-bg-secondary) / 0.5);
  }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.empty-state p {
  margin: 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--color-text-primary));
}

.empty-hint {
  font-size: 0.9rem;
  color: rgb(var(--color-text-secondary));
  font-weight: normal;
  margin-top: 12px;
}

/* Ghost Card */
.ghost-card {
  opacity: 0.6;
  background: linear-gradient(135deg, rgba(var(--color-accent), 0.1) 0%, rgba(var(--color-accent), 0.05) 100%) !important;
  border: 2px dashed rgb(var(--color-accent)) !important;
  border-radius: 24px !important;
  transform: scale(1.02);
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .cms-photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .photo-preview-container {
    height: 180px;
  }
}

@media (max-width: 480px) {
  .cms-photos-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .photo-preview-container {
    height: 200px;
  }
  
  .photo-info {
    padding: 16px 20px 20px;
  }
}
</style>
