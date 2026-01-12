<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
// import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons-vue';
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons-vue';
import { posts } from '@/posts';
import { thoughts } from '@/posts/dataJs/thoughts.js';
import { quotes } from '@/posts/dataJs/quotes.js';
import { photos } from '@/posts/dataJs/photos.js';
import { qaList } from '@/assets/gallery/aboutData.js';

const now = ref(new Date());
let timer = null;

// 处理文章数据
const allItems = computed(() => {
  // 1. 处理文章
  const postItems = Object.keys(posts).map(slug => {
    const post = posts[slug];
    const fm = post.frontmatter || {};
    return {
      type: 'post',
      id: slug,
      slug,
      title: fm.title || slug,
      date: fm.date ? new Date(fm.date) : new Date(),
      description: fm.description || '',
    };
  });

  // 2. 处理说说 (thoughts)
  const thoughtItems = thoughts.map(thought => {
    return {
      type: 'thought',
      id: `thought-${thought.id}`,
      title: thought.content, // 标题即内容
      date: new Date(thought.date),
      description: '',
      link: '/layout/thinking' // 跳转到思考页
    };
  });

  // 3. 处理摘录 (quotes)
  const quoteItems = quotes.map(quote => {
    return {
      type: 'quote',
      id: `quote-${quote.id}`,
      title: quote.content, // 标题即内容
      date: new Date(quote.date),
      description: '',
      link: '/layout/quotes' // 跳转到摘录页
    };
  });

  // 4. 处理照片 (photos)
  const photoItems = photos.map(photo => {
    return {
      type: 'photo',
      id: `photo-${photo.id}`,
      title: photo.title, // 标题即照片标题
      date: new Date(photo.date),
      description: '',
      link: '/layout/gallery' // 跳转到相册页
    };
  });

  // 5. 处理关于 (about)
  const aboutItems = qaList.map(qa => {
    return {
      type: 'about',
      id: `about-${qa.id}`,
      title: qa.question, // 标题即问题
      date: new Date('2024-01-01'), // 默认给一个固定时间，或者当前时间
      description: qa.answer,
      link: '/layout/about' // 跳转到关于页
    };
  });

  // 6. 合并并排序
  return [...postItems, ...thoughtItems, ...quoteItems, ...photoItems, ...aboutItems].sort((a, b) => b.date - a.date);
});

// 按年份分组
const itemsByYear = computed(() => {
  const groups = {};
  allItems.value.forEach(item => {
    const year = item.date.getFullYear();
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(item);
  });
  // 年份倒序
  return Object.keys(groups).sort((a, b) => b - a).map(year => ({
    year,
    items: groups[year]
  }));
});

// 格式化日期 MM-DD
const formatDate = (date) => {
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${m}-${d}`;
};

// 文章总数
const postCount = Object.keys(posts).length;
const thoughtCount = thoughts.length;
const photoCount = photos.length;

const updateTime = () => {
    now.value = new Date();
    timer = requestAnimationFrame(updateTime);
};

onMounted(() => {
    updateTime();
});

onUnmounted(() => {
    if (timer) cancelAnimationFrame(timer);
});

const currentYear = computed(() => now.value.getFullYear());

const dayOfYear = computed(() => {
    const start = new Date(now.value.getFullYear(), 0, 0);
    const diff = now.value - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
});

const yearPassedPercent = computed(() => {
    const startOfYear = new Date(now.value.getFullYear(), 0, 1);
    const endOfYear = new Date(now.value.getFullYear() + 1, 0, 1);
    const total = endOfYear - startOfYear;
    const passed = now.value - startOfYear;
    return (passed / total * 100).toFixed(6);
});

const dayPassedPercent = computed(() => {
    const startOfDay = new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate());
    const total = 1000 * 60 * 60 * 24;
    const passed = now.value - startOfDay;
    return (passed / total * 100).toFixed(6);
});

// 截断文本函数
const truncate = (text, length = 30) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

const getTimeLineColor = (type) => {
    switch (type) {
        case 'post': return 'blue';
        case 'thought': return 'green';
        case 'quote': return 'purple'; // 摘录用紫色
        case 'photo': return 'orange'; // 照片用橙色
        case 'about': return 'cyan'; // 关于用青色
        default: return 'gray';
    }
}
</script>

<template>
    <div class="time-wrapper">
        <div class="stats-card">
            <h1 class="title">时间线</h1>
            <p class="subtitle">
                共有 {{ postCount }} 篇文章，{{ thoughtCount }} 个说说，{{ photoCount }} 个定格瞬间，{{ aboutCount }} 个关于，再接再厉
            </p>
            <div class="divider"></div>
            <div class="stats-info">
                <p>今天是 {{ currentYear }} 年的第 {{ dayOfYear }} 天</p>
                <p>今年已过 {{ yearPassedPercent }}%</p>
                <p>今天已过 {{ dayPassedPercent }}%</p>
                <p class="footer-motto">活在当下，珍惜眼下</p>
            </div>
        </div>

        <div class="timeline-container">
            <a-timeline>
                <template v-for="group in itemsByYear" :key="group.year">
                    <!-- 年份节点 -->
                    <a-timeline-item color="gray">
                        <template #dot>
                            <div class="year-dot">{{ group.year }}</div>
                        </template>
                        <div class="year-label"></div>
                    </a-timeline-item>

                    <!-- 列表项 (文章 + 说说 + 摘录 + 照片) -->
                    <a-timeline-item
                        v-for="item in group.items"
                        :key="item.id"
                        :color="getTimeLineColor(item.type)"
                    >
                        <!-- 所有类型现在都可以点击跳转 -->
                        <component
                          :is="item.type === 'post' || item.link ? 'router-link' : 'div'"
                          :to="item.type === 'post' ? `/layout/post/${item.slug}` : item.link"
                          class="post-link"
                          :class="{
                            'thought-item': item.type === 'thought',
                            'quote-item': item.type === 'quote',
                            'photo-item': item.type === 'photo',
                            'about-item': item.type === 'about'
                          }"
                        >
                            <span class="post-date">{{ formatDate(item.date) }}</span>

                            <!-- 标题内容 -->
                            <span class="post-title" :title="item.title">
                              <!-- 如果是说说，加个图标区分 -->
                              <span v-if="item.type === 'thought'" class="item-icon">💡</span>
                              <!-- 如果是摘录 -->
                              <span v-else-if="item.type === 'quote'" class="item-icon">�</span>
                              <!-- 如果是照片 -->
                              <span v-else-if="item.type === 'photo'" class="item-icon">📷</span>

                              {{ ['thought', 'quote'].includes(item.type) ? truncate(item.title, 30) : item.title }}
                            </span>
                        </component>
                    </a-timeline-item>
                </template>

                <!-- 结束点 -->
                <a-timeline-item>
                    <template #dot>
                        <ClockCircleOutlined style="font-size: 16px; color: gray;" />
                    </template>
                    <span style="color: gray; font-size: 14px;">The beginning...</span>
                </a-timeline-item>
            </a-timeline>
        </div>
    </div>
</template>

<style scoped lang="scss">
.time-wrapper {
  padding-top: 100px; /* 给 fixed header 留出空间 */
  display: flex;
  flex-direction: column;
  padding-left: 10vw; /* 整体左侧留白 */
  width: 100%;
}

.stats-card {
  margin-bottom: 40px;
  padding: 20px;
}

.title {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 10px;
  color: rgb(var(--color-text-primary));
}

.subtitle {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: rgb(var(--color-text-primary));
}

.divider {
  height: 1px;
  width: 100px; /* 分割线长度 */
  background-color: #e0e0e0;
  margin-bottom: 30px;
}

.stats-info p {
  font-size: 20px;
  line-height: 1.8;
  color: rgb(var(--color-text-primary));
}

.footer-motto {
  margin-top: 10px;
}

.timeline-container {
  margin-bottom: 100px;
  padding: 20px;
}

/* 自定义时间轴样式 */
.year-dot {
  font-size: 24px;
  font-weight: bold;
  color: rgb(var(--color-text-primary));
  transform: translateX(-8px); /* 微调位置 */
  background: rgb(var(--color-bg-root)); /* 遮挡线 */
  padding: 5px 0;
}

.post-link {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 15px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background: rgb(var(--color-bg-secondary));
    transform: translateX(5px);
  }
}

.thought-item,
.quote-item,
.photo-item {
  cursor: pointer; /* 改为手型，表示可点击 */

  &:hover {
    /* 恢复背景变色效果，因为现在可以跳转了 */
    background: rgb(var(--color-bg-secondary));
    transform: translateX(5px);
  }

  .post-title {
    color: rgb(var(--color-text-secondary));
    /* 说说和摘录用斜体 */
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 600px;
    display: inline-block;
    vertical-align: middle;
  }
}

/* 照片单独处理，标题不用斜体 */
.photo-item .post-title,
.about-item .post-title {
  font-style: normal;
}

.item-icon {
  margin-right: 5px;
  font-style: normal;
}

.post-date {
  font-size: 14px;
  color: rgb(var(--color-text-primary));
  opacity: 0.6;
  font-family: monospace;
}

.post-title {
  font-size: 16px;
  color: rgb(var(--color-text-primary));
  font-weight: 500;
}

/* 覆盖 Ant Design 默认样式以适配暗黑模式 */
:deep(.ant-timeline-item-tail) {
  border-left: 2px solid rgba(var(--color-border-primary), 0.2);
}

:deep(.ant-timeline-item-content) {
  margin-left: 28px;
}
</style>
