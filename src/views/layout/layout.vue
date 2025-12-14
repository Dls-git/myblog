<script setup>
import myheader from "@/views/layout/myheader.vue";
import myfooter from "@/views/layout/myfooter.vue";
</script>

<template>
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
    <myfooter>

    </myfooter>
</template>

<style scoped>
.container{
  /* 容器,80的视口宽度是为了给左右两侧留margrin */
  height: 100%;
  width: 80vw;
  margin:0 auto;
  border: lightskyblue 3px solid;
}
.site-header {
  /* 头部,固定在顶部 ,设置高度为100px*/
  height: 100px;
}
.main{
  /* 主体内容,距离顶部100px */
  margin-top: 100px;
}

</style>
