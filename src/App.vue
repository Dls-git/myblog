<script setup>
import { onMounted, onUnmounted } from 'vue';
import ClickEffects from '@/components/ClickEffects.vue';

// 网页标题搞怪特效
const originTitle = document.title;
let titleTime;

const handleVisibilityChange = () => {
  if (document.hidden) {
    document.title = '跑哪里去了';
    clearTimeout(titleTime);
  } else {
    document.title = ' back';
    titleTime = setTimeout(() => {
      document.title = originTitle;
    }, 2000);
  }
};

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
    <ClickEffects />
    <router-view></router-view>
</template>

<style scoped>
* {
  height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;

}
</style>
