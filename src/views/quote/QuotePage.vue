<script setup>
import { ref, computed } from 'vue'
import { quotes } from '@/posts/dataJs/quotes.js'

// 分页逻辑
const currentPage = ref(1)
const pageSize = 9
const totalPages = computed(() => Math.ceil(quotes.length / pageSize))

const displayQuotes = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return quotes.slice(start, start + pageSize)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="quote-page">
    <div class="header-section">
      <h1 class="page-title">
        摘录 <span class="icon">🔖</span>
      </h1>
      <p class="subtitle">收集喜欢的文字与瞬间</p>
    </div>

    <div class="quote-grid">
      <div
        v-for="(item, index) in displayQuotes"
        :key="item.id"
        class="quote-card"
      >
        <div class="quote-content">
          <span class="quote-text">{{ item.content }}</span>
        </div>

        <div class="quote-footer">
          <div class="author-info">
            <span v-if="item.author" class="author">—— {{ item.author }}</span>
            <span v-if="item.source" class="source"> {{ item.source }}</span>
          </div>
          <div class="date">{{ item.date }}</div>
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
.quote-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 80vh;
}

.header-section {
  text-align: center;
  margin-bottom: 60px;

  .page-title {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 10px;
    color: rgb(var(--color-text-primary));

    .icon {
      font-size: 30px;
    }
  }

  .subtitle {
    font-size: 18px;
    color: rgb(var(--color-text-primary));
    opacity: 0.6;
    letter-spacing: 1px;
  }
}

.quote-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
}

.quote-card {
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  border: 1px solid rgba(var(--color-border-primary), 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.1);
    border-color: rgba(var(--color-border-primary), 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #9d9e9f 0%, #ebeded 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::before {
    opacity: 1;
  }
}

.quote-content {
  font-size: 18px;
  line-height: 1.8;
  color: rgb(var(--color-text-primary));
  font-family: "Georgia", "Source Han Serif", serif;
  margin-bottom: 25px;
  position: relative;

  .quote-mark {
    font-size: 40px;
    color: rgba(var(--color-text-primary), 0.1);
    font-family: sans-serif;
    position: absolute;

    &.left {
      top: -20px;
      left: -15px;
    }

    &.right {
      bottom: -30px;
      right: 0;
      z-index: 0;
    }
  }
}

.quote-text {
  position: relative;
  z-index: 1; /* 确保文字在引号上面 */
}

.quote-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 14px;
  border-top: 1px dashed rgba(var(--color-border-primary), 0.1);
  padding-top: 15px;

  .author-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .author {
      font-weight: bold;
      color: rgb(var(--color-text-primary));
    }

    .source {
      font-style: italic;
      color: rgb(var(--color-text-primary));
      opacity: 0.6;
      font-size: 12px;
    }
  }

  .date {
    color: rgb(var(--color-text-primary));
    opacity: 0.4;
    font-size: 12px;
    font-family: monospace;
  }
}

@media (max-width: 600px) {
  .quote-grid {
    grid-template-columns: 1fr;
  }

  .header-section {
    margin-bottom: 40px;
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
