<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { posts } from '@/posts';
import { thoughts } from '@/posts/dataJs/thoughts.js';
import { photos } from '@/posts/dataJs/photos.js';

// 1. 运行时间计算
const startDate = new Date('2025-12-11'); // 你的博客创建日期
const runningTime = ref('');
let timer = null;

const calculateRunningTime = () => {
  const now = new Date();
  const diff = now - startDate;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  runningTime.value = `${days} 天 ${hours} 小时 ${minutes} 分 ${seconds} 秒`;
};

// 2. 总字数统计 (文章 + 说说)
const totalWordCount = computed(() => {
  let count = 0;
  
  // 统计文章字数
  Object.values(posts).forEach(post => {
    const wordCount = post.frontmatter?.wordCount || 0;
    count += Number(wordCount);
  });

  // 统计说说字数 (简单计算内容长度)
  thoughts.forEach(thought => {
    count += thought.content.length;
  });

  return (count / 1000).toFixed(1) + 'k';
});

// 3. 各类内容统计
const postCount = Object.keys(posts).length;
const thoughtCount = thoughts.length;
const photoCount = photos.length;

onMounted(() => {
  calculateRunningTime();
  timer = setInterval(calculateRunningTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <footer class="footer-wrapper">
    <div class="footer-content">

      <!-- 左侧：版权信息与简介 -->
      <div class="footer-section brand">
        <h3 class="logo-text">My Blog</h3>
        <p class="desc">
          写来玩玩，以后重构<br>
          持续学习
        </p>
        <p class="copyright">
          &copy; {{ new Date().getFullYear() }} Youth Finished design by <a href="https://github.com/lxchapu/astro-gyoza">Gyoza</a>.
        </p>

      </div>

      <!-- 中间：站点统计 -->
      <div class="footer-section stats">
        <h4>站点统计</h4>
        <div class="stat-item">
          <span class="label">运行时间：</span>
          <span class="value">{{ runningTime }}</span>
        </div>
        <div class="stat-item">
          <span class="label">文章：</span>
          <span class="value">{{ postCount }} 篇</span>
        </div>
        <div class="stat-item">
          <span class="label">说说：</span>
          <span class="value">{{ thoughtCount }} 条</span>
        </div>
        <div class="stat-item">
          <span class="label">瞬间：</span>
          <span class="value">{{ photoCount }} 张</span>
        </div>
        <div class="stat-item">
          <span class="label">总字数：</span>
          <span class="value">{{ totalWordCount }} 字</span>
        </div>
      </div>

      <!-- 右侧：社交链接 -->
      <div class="footer-section social">
        <h4>联系我</h4>
        <div class="social-links">
          <a href="https://github.com" target="_blank" title="Github">
            <i class="fab fa-github"></i> Github
          </a>
          <a href="mailto:example@email.com" title="Email">
            <i class="fas fa-envelope"></i> Email
          </a>
          <a href="#" title="RSS">
            <i class="fas fa-rss"></i> RSS
          </a>
        </div>
      </div>

    </div>

    <!-- 底部装饰条 -->
    <div class="footer-bottom">
        <p>Powered by <a href="https://cn.vuejs.org/" target="_blank">Vue 3</a> & Designed with ❤️</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer-wrapper {
  background: rgb(var(--color-bg-primary));
  border-top: 1px solid rgba(var(--color-border-primary), 0.1);
  padding: 60px 0 20px;
  margin-top: 80px;
  color: rgb(var(--color-text-primary));
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  flex-wrap: wrap;
  gap: 40px;
}

.footer-section {
  flex: 1;
  min-width: 250px;
}

/* 品牌区域 */
.brand {
  .logo-text {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 15px;
    background: linear-gradient(120deg, #409eff, #667eea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .desc {
    font-size: 14px;
    line-height: 1.6;
    opacity: 0.7;
    margin-bottom: 20px;
  }

  .copyright {
    font-size: 12px;
    opacity: 0.5;
  }
}

/* 统计区域 */
.stats h4, .social h4 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -5px;
    width: 30px;
    height: 3px;
    background: #409eff;
    border-radius: 2px;
  }
}

.stat-item {
  margin-bottom: 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;

  .label {
    opacity: 0.6;
  }

  .value {
    font-family: monospace;
    font-weight: bold;
  }
}

/* 社交链接 */
.social-links {
  display: flex;
  flex-direction: column;
  gap: 12px;

  a {
    text-decoration: none;
    color: rgb(var(--color-text-primary));
    opacity: 0.7;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;

    &:hover {
      opacity: 1;
      color: #409eff;
      transform: translateX(5px);
    }
  }
}

/* 底部装饰 */
.footer-bottom {
  text-align: center;
  margin-top: 50px;
  padding-top: 20px;
  border-top: 1px dashed rgba(var(--color-border-primary), 0.1);
  font-size: 12px;
  opacity: 0.5;

  a {
    color: inherit;
    text-decoration: underline;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .stats h4::after, .social h4::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .stat-item {
    justify-content: center;
  }

  .social-links {
    align-items: center;

    a:hover {
      transform: scale(1.1);
    }
  }
}
</style>
