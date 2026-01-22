
<script setup>
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { normalizeUrl } from '../utils'

const props = defineProps({
  listData: Array
})

const emit = defineEmits(['editItem', 'deleteItem'])
</script>

<template>
  <div class="cms-friends-container">
    <div class="cms-friends-grid" v-if="listData.length > 0">
      <div class="cms-friend-card-wrap cms-card-wrap" v-for="(item, index) in listData" :key="index">
        <div class="cms-friend-card">
          <div class="avatar-wrapper">
            <img v-if="item.avatar" :src="normalizeUrl(item.avatar)" :alt="item.name" class="avatar" />
            <div v-else class="avatar-placeholder">{{ (item.name || 'F').charAt(0).toUpperCase() }}</div>
          </div>
          <div class="info">
            <h3 class="name">{{ item.name || 'Friend' }}</h3>
            <p class="desc" :title="item.desc">{{ item.desc }}</p>
            <a class="link-text" :href="item.link" target="_blank" rel="noopener">{{ item.link }}</a>
          </div>
        </div>
        <div class="cms-friend-actions cms-card-actions">
          <button class="cms-action-btn" @click.prevent="emit('editItem', index)" title="编辑">
            <EditOutlined />
          </button>
          <button class="cms-action-btn danger" @click.prevent="emit('deleteItem', index)" title="删除">
            <DeleteOutlined />
          </button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">暂无数据，请点击上方新增</div>
  </div>
</template>

<style scoped lang="scss">
.cms-friends-container {
  padding: 0 40px;
}

.cms-friends-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.cms-friend-card-wrap {
  position: relative;
}

.cms-friend-card {
  display: flex;
  align-items: center;
  padding: 24px;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  height: 100%;
}

.cms-friend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1);
}

.avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgb(var(--color-bg-secondary));
  flex-shrink: 0;
  background: rgb(var(--color-bg-secondary));
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.cms-friend-card:hover .avatar {
  transform: scale(1.1);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: rgb(var(--color-text-primary));
  opacity: 0.5;
  background: rgb(var(--color-bg-secondary));
}

.info {
  margin-left: 16px;
  flex: 1;
  min-width: 0;

  .name {
    margin: 0 0 4px 0;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .desc {
    margin: 0 0 8px 0;
    font-size: 0.9rem;
    color: rgb(var(--color-text-secondary));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .link-text {
    font-size: 0.8rem;
    color: rgb(var(--color-accent));
    text-decoration: none;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.7;

    &:hover {
      text-decoration: underline;
      opacity: 1;
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
  transition: all 0.2s ease;
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

@media (max-width: 900px) {
  .cms-friends-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .cms-friends-grid {
    grid-template-columns: 1fr;
  }
}
</style>
