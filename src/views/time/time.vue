<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
// import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons-vue';
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons-vue';
import { posts } from '@/posts';

const now = ref(new Date());
let timer = null;

// 处理文章数据
const allPosts = computed(() => {
  return Object.keys(posts).map(slug => {
    const post = posts[slug];
    const fm = post.frontmatter || {};
    return {
      slug,
      title: fm.title || slug,
      date: fm.date ? new Date(fm.date) : new Date(),
      description: fm.description || '',
    };
  }).sort((a, b) => b.date - a.date);
});

// 按年份分组
const postsByYear = computed(() => {
  const groups = {};
  allPosts.value.forEach(post => {
    const year = post.date.getFullYear();
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(post);
  });
  // 年份倒序
  return Object.keys(groups).sort((a, b) => b - a).map(year => ({
    year,
    posts: groups[year]
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
</script>

<template>
    <div class="time-wrapper">
        <div class="stats-card">
            <h1 class="title">时间线</h1>
            <p class="subtitle">共有 {{ postCount }} 篇文章，再接再厉</p>
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
                <template v-for="group in postsByYear" :key="group.year">
                    <!-- 年份节点 -->
                    <a-timeline-item color="gray">
                        <template #dot>
                            <div class="year-dot">{{ group.year }}</div>
                        </template>
                        <div class="year-label"></div>
                    </a-timeline-item>

                    <!-- 文章列表 -->
                    <a-timeline-item
                        v-for="post in group.posts"
                        :key="post.slug"
                        color="blue"
                    >
                        <router-link :to="`/layout/post/${post.slug}`" class="post-link">
                            <span class="post-date">{{ formatDate(post.date) }}</span>
                            <span class="post-title">{{ post.title }}</span>
                        </router-link>
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
