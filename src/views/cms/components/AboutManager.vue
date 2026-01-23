
<script setup>
import { EditOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons-vue'
import draggable from 'vuedraggable'
import { normalizeUrl } from '../utils'
import { aboutTypeOptions } from '../constants'
import { computed } from 'vue'

const props = defineProps({
  listData: {
    type: Array,
    required: true
  },
  aboutNewType: String
})

const emit = defineEmits([
  'update:aboutNewType',
  'openAboutDetail',
  'editAboutItem',
  'deleteAboutItem',
  'openAboutAddModal',
  'update:listData'
])

const list = computed({
  get: () => props.listData,
  set: (value) => emit('update:listData', value)
})
</script>

<template>
  <div class="cms-about-container">
    <div class="about-info-header">
      <div class="header-left">
        <div class="title">关于页卡片</div>
        <div class="subtitle">点击卡片预览详情，点击按钮进行编辑/删除</div>
      </div>
      <div class="header-right">
        <button class="action-btn primary" @click="emit('openAboutAddModal')">新增卡片</button>
      </div>
    </div>

    <draggable 
      v-if="list.length > 0"
      v-model="list" 
      class="cms-about-grid"
      item-key="_cms_id"
      handle=".drag-handle"
      :animation="300"
      ghost-class="ghost-card"
    >
      <template #item="{ element, index }">
        <div class="cms-about-card-wrap cms-card-wrap">
          <div class="cms-about-card" @click="emit('openAboutDetail', element.id)">
            <div class="cms-about-q">Q.</div>
            <div class="cms-about-question">{{ element.question }}</div>
            <div class="cms-about-preview">
              <div v-if="element.type === 'profile'" class="profile-preview">
                <span class="avatar-box">
                  <img :src="normalizeUrl('/assets/img/Mikasa.jpg')" alt="avatar" />
                </span>
                <div class="name-text">{{ element.name || 'Me' }}</div>
              </div>
              <p v-else-if="element.type === 'quote'" class="quote-preview">“{{ element.answer }}”</p>
              <div v-else-if="element.type === 'skills'" class="skills-preview">
                <span v-for="s in (element.skills || []).slice(0, 3)" :key="s">{{ s }}</span>
                <span v-if="(element.skills || []).length > 3">...</span>
              </div>
              <div v-else-if="element.type === 'social'" class="social-preview">
                <span class="social-tag">Social Links</span>
              </div>
              <div v-else-if="element.type === 'hobbies'" class="skills-preview">
                <span v-for="h in element.detail?.list ? element.detail.list.slice(0, 3) : []" :key="h.name">{{ h.icon || '✨' }}</span>
                <span v-if="element.detail?.list && element.detail.list.length > 3">...</span>
              </div>
              <p v-else class="text-preview">{{ element.answer }}</p>
            </div>
            <div class="tap-hint">点击预览详情</div>
          </div>
          <div class="cms-about-actions cms-card-actions">
            <div class="cms-action-btn drag-handle" title="拖拽排序">
              <HolderOutlined />
            </div>
            <button class="cms-action-btn" @click.stop="emit('editAboutItem', index)" title="编辑">
              <EditOutlined />
            </button>
            <button class="cms-action-btn danger" @click.stop="emit('deleteAboutItem', index)" title="删除">
              <DeleteOutlined />
            </button>
          </div>
        </div>
      </template>
    </draggable>
    <div v-else class="empty-state">暂无数据，请点击右上角按钮新增卡片</div>
  </div>
</template>

<style scoped lang="scss">
.cms-about-container {
  padding-bottom: 20px;
}

.about-info-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  .title {
    font-weight: 700;
    color: rgb(var(--color-text-primary));
    margin-bottom: 4px;
  }
  .subtitle {
    font-size: 0.85rem;
    color: rgb(var(--color-text-secondary));
  }
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cms-about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.cms-about-card-wrap {
  position: relative;
}

.cms-about-card {
  position: relative;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  background: rgb(var(--color-bg-primary));
  min-height: 280px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    border-color: rgba(var(--color-accent), 0.3);

    .tap-hint {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.cms-about-q {
  font-weight: 900;
  color: rgba(var(--color-accent), 0.2);
  font-size: 1.5rem;
  margin-bottom: 5px;
}

.cms-about-question {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 15px;
  line-height: 1.4;
}

.cms-about-preview {
  flex-grow: 1;
  opacity: 0.8;
  font-size: 0.95rem;
}

.profile-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.avatar-box {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgb(var(--color-bg-secondary));
  background: rgb(var(--color-bg-secondary));
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.name-text {
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

.quote-preview {
  margin: 0;
  font-style: italic;
  font-family: serif;
  font-size: 1.1rem;
  line-height: 1.6;
}

.skills-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    background: rgba(var(--color-accent), 0.1);
    color: rgb(var(--color-accent));
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
  }
}

.social-preview {
  .social-tag {
    font-weight: 600;
    color: rgb(var(--color-accent));
  }
}

.text-preview {
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tap-hint {
  position: absolute;
  bottom: 15px;
  right: 20px;
  font-size: 0.75rem;
  color: rgb(var(--color-accent));
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  font-weight: 600;
}

.cms-bottom-bar {
  position: sticky;
  bottom: 0;
  margin-top: 18px;
  padding: 12px 0;
  background: rgb(var(--color-bg-primary) / 0.92);
  /* backdrop-filter: blur(10px); */
  border-top: 1px solid rgb(var(--color-border-primary) / 0.75);
  z-index: 5;
}

.cms-bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
}



.action-btn {
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    border-color: rgb(var(--color-accent) / 0.8);
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--color-accent), 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  }
  
  &.primary {
    background: rgb(var(--color-accent));
    color: white;
    border: none;
    
    &:hover {
      background: rgb(var(--color-accent) / 0.9);
      box-shadow: 0 6px 16px rgba(var(--color-accent), 0.25);
    }
    
    &:active {
      background: rgb(var(--color-accent) / 0.85);
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
