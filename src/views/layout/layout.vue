<script setup>
import myheader from "@/views/layout/myheader.vue";
import myfooter from "@/views/layout/myfooter.vue";
import MusicPlayer from "@/components/MusicPlayer.vue";
import BackToTop from "@/components/BackToTop.vue";
import ReadingProgress from "@/components/ReadingProgress.vue";
</script>

<template>
  <ReadingProgress />
  <div class="global-header">
    <myheader class="site-header"></myheader>
  </div>
  <div class="container">
    <div class="main">
<!--      /*跳转页面的效果*/-->
      <RouterView v-slot="{ Component, route }">
        <Transition name="router-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </div>
  </div>
  <myfooter></myfooter>
  
  <!-- 全局音乐播放器 -->
  <MusicPlayer />
  <BackToTop />
</template>

<style scoped lang="scss">
.container {
  /* 容器,80的视口宽度是为了给左右两侧留margrin */
  height: 100%;
  width: 80vw;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .container {
    width: 95vw; /* 在移动端增加宽度 */
  }
}

.site-header {
  /* 头部,固定在顶部 ,设置高度为100px*/
  height: 100px;
}

.main {
  /* 主体内容,距离顶部100px */
  box-sizing: border-box;
  margin-top: 100px;
}
</style>
