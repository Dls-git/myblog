<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)

const updateProgress = () => {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  if (docHeight > 0) {
    progress.value = (scrollTop / docHeight) * 100
  } else {
    progress.value = 0
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
})
</script>

<template>
  <div class="reading-progress-bar" :style="{ width: progress + '%' }"></div>
</template>

<style scoped>
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  z-index: 9999;
  transition: width 0.1s ease-out;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}
</style>
