<script setup>
import selfprofile from "@/views/home/selfprofile.vue";
import content from "@/views/home/content.vue";
</script>

<template>
  <div class="home-root">
    <selfprofile class="self-profile"></selfprofile>
    <div class="nothing-here arrange">
      <div class="flex-box">
           <div class="nothing-here-content">
                <h2 class="small-font">Nothing here</h2>
           </div>
           <div class="arrow-down-container">
                 <img src="@/assets/img/down.png" class="arrow-down" alt="404">
           </div>
      </div>
    </div>
    <content class="content"></content>
  </div>
</template>

<style scoped lang="scss">
.home-root {
  display: block;
}

.nothing-here {
  margin-top: 100px;
}

.flex-box {
  display: flex;
  flex-direction: column;
  align-items: center;

  .arrow-down-container {
    margin-top: 20px;

    .arrow-down {
      animation: arrow-down 1.2s ease-in-out infinite;
      display: block;
      height: 50px;
      width: 50px;
    }
  }
}

/*给arrow-down添加动画*/
@keyframes arrow-down {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(15px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
