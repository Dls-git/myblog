<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="not-found-container">
    <h1 class="code">404</h1>
    <p class="desc">访问的页面不存在</p>
    <button class="back-btn" @click="goHome">返回首页</button>
  </div>
</template>

<style scoped lang="scss">
.not-found-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgb(var(--color-bg-primary));
  color: rgb(var(--color-text-primary));
}

.code {
  font-size: 120px;
  font-weight: 300; /* 细字体看起来更高级简约 */
  margin: 0;
  line-height: 1;
  opacity: 0.15; /* 极淡的颜色 */
}

.desc {
  font-size: 18px;
  margin: 20px 0 40px;
  opacity: 0.6;
  letter-spacing: 1px;
}

.back-btn {
  padding: 10px 24px;
  background: transparent;
  border: 1px solid rgb(var(--color-border-primary));
  color: rgb(var(--color-text-primary));
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  opacity: 0.8;

  &:hover {
    opacity: 1;
    border-color: rgb(var(--color-text-primary));
  }
}
</style>