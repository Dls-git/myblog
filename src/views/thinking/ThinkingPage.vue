<script setup>
import { ref, computed } from 'vue'
import { thoughts } from '@/posts/dataJs/thoughts.js'

// 模拟头像引用 (实际开发中可以放在 thoughts 数据里或者统一配置)
import avatar from '@/assets/img/Mikasa.jpg'

// 分页逻辑
const currentPage = ref(1)
const pageSize = 10
const totalPages = computed(() => Math.ceil(thoughts.length / pageSize))

const displayThoughts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return thoughts.slice(start, start + pageSize)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 简单的点赞功能 (仅前端效果)
const handleLike = (item) => {
  item.likes++
}
</script>

<template>
  <div class="thinking-page">
    <div class="header-section">
      <h1 class="page-title">
        思考 <span class="rss-icon">📶</span>
      </h1>
      <p class="subtitle">谢谢你听我诉说</p>
    </div>

    <div class="timeline">
      <div v-for="item in displayThoughts" :key="item.id" class="thought-item">
        <div class="avatar-col">
          <img :src="avatar" alt="Avatar" class="avatar">
        </div>

        <div class="content-col">
          <div class="meta-info">
            <span class="nickname">Youth</span>
            <span class="date">{{ item.date }} {{ item.week }}</span>
          </div>

          <div class="bubble">
            <div class="bubble-content" v-html="item.content.replace(/(https?:\/\/[^\s]+)/g, '<a href=\'$1\' target=\'_blank\'>$1</a>')"></div>
          </div>

          <div class="actions">
            <span class="action-item">
              <span class="icon">💬</span> {{ item.comments }}
            </span>
            <span class="action-item like-btn" @click="handleLike(item)">
              <span class="icon">🤍</span> {{ item.likes }}
            </span>
            <span class="action-item">
              <span class="icon">👀</span> 0
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页器 -->
    <div class="pagination" v-if="totalPages > 1">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        &lt;
      </button>
      <button
        v-for="page in totalPages"
        :key="page"
        class="page-btn"
        :class="{ active: currentPage === page }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        &gt;
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.thinking-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 80vh;
}

.header-section {
  margin-bottom: 60px;

  .page-title {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgb(var(--color-text-primary));

    .rss-icon {
      font-size: 24px;
      color: #ff9f43;
    }
  }

  .subtitle {
    font-size: 24px;
    font-weight: 700;
    color: rgb(var(--color-text-primary));
    opacity: 0.9;
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.thought-item {
  display: flex;
  gap: 20px;
  animation: fadeIn 0.5s ease-up;
}

.avatar-col {
  flex-shrink: 0;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(var(--color-border-primary), 0.2);
  }
}

.content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-info {
  display: flex;
  align-items: baseline;
  gap: 10px;

  .nickname {
    font-size: 16px;
    font-weight: 600;
    color: rgb(var(--color-text-primary));
  }

  .date {
    font-size: 12px;
    color: rgb(var(--color-text-primary));
    opacity: 0.6;
  }
}

.bubble {
  position: relative;
  background: rgba(var(--color-bg-secondary), 0.5);
  padding: 15px 20px;
  border-radius: 12px;
  border-top-left-radius: 2px; /* 气泡角效果 */
  font-size: 15px;
  line-height: 1.6;
  color: rgb(var(--color-text-primary));
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  border: 1px solid rgba(var(--color-border-primary), 0.1);

  :deep(a) {
    color: #409eff;
    text-decoration: none;
    word-break: break-all;

    &:hover {
      text-decoration: underline;
    }
  }
}

.actions {
  display: flex;
  gap: 25px;
  margin-top: 5px;
  padding-left: 5px;

  .action-item {
    font-size: 13px;
    color: rgb(var(--color-text-primary));
    opacity: 0.6;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      opacity: 1;
      color: #409eff;
    }

    &.like-btn:active {
      transform: scale(0.9);
    }

    .icon {
      font-size: 14px;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .header-section {
    margin-bottom: 40px;

    .page-title { font-size: 28px; }
    .subtitle { font-size: 18px; }
  }

  .thought-item {
    gap: 12px;
  }

  .avatar-col .avatar {
    width: 40px;
    height: 40px;
  }
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 60px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #409eff;
    color: white;
  }

  &.active {
    background: #409eff;
    color: white;
    font-weight: bold;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
