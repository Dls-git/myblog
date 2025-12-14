<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: '无标题'
  },
  date: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    required: true
  },
  readingTime: {
    type: [Number, String],
    default: 0
  },
  wordCount: {
    type: [Number, String],
    default: 0
  }
})

// 简单的日期格式化
const formattedDate = computed(() => {
  if (!props.date) return ''
  return new Date(props.date).toLocaleDateString('zh-CN')
})
</script>

<template>
  <router-link :to="`/layout/post/${slug}`" class="card hover-scale-to-wide">
      <h2 class="card-title">
        {{ title }}
      </h2>
      <p v-if="description" class="card-desc">
        {{ description }}
      </p>
    <div class="footer">
      <div class="detail small-font">
        <span v-if="formattedDate">📅 {{ formattedDate }}</span>
        <span class="divider" v-if="formattedDate && (wordCount || readingTime)">|</span>
        <span v-if="wordCount">📝 {{ wordCount }}字</span>
        <span class="divider" v-if="wordCount && readingTime">|</span>
        <span v-if="readingTime">⏱️ {{ readingTime }}分钟</span>
      </div>
      <div class="continue">继续阅读&nbsp; -></div>
    </div>
  </router-link>
</template>

<style scoped lang="scss">
.card {
  display: block; /* router-link 默认为 inline */
  height: auto;
  min-height: 140px;
  border-radius: 20px;
  padding: 24px;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  margin-bottom: 20px;

  &:hover {
    /*同时加上一些阴影*/
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    /* 鼠标悬停时,卡片缩放 */
    transform: translateY(-2px);
    background: rgb(var(--color-bg-secondary) / 0.3);
  }

  .card-title {
    font-size: 24px;
    margin-bottom: 12px;
    color: rgb(var(--color-text-primary));
    font-weight: bold;
  }

  .card-desc {
    font-size: 16px;
    color: rgb(var(--color-text-primary));
    opacity: 0.7;
    margin-bottom: 20px;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed rgba(0, 0, 0, 0.1);
    padding-top: 15px;

    .detail span {
      color: rgb(var(--color-text-primary));
      opacity: 0.5;
      font-size: 14px;
    }

    .divider {
      margin: 0 8px;
      opacity: 0.3;
    }

    .continue {
      font-size: 16px;
      color: #409eff;
      font-weight: 500;
      transition: transform 0.2s;

      &:hover {
        cursor: pointer;
        transform: translateX(5px);
      }
    }
  }
}
</style>