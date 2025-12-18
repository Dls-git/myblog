<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const show = ref(false)

const checkScroll = () => {
  show.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <Transition name="fade">
    <button v-if="show" class="back-to-top" @click="scrollToTop" title="回到顶部">
      ⬆
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 30px;
  left: 30px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(var(--color-bg-secondary), 0.8);
  backdrop-filter: blur(10px);
  color: rgb(var(--color-text-primary));
  border: 1px solid rgba(var(--color-border-primary), 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s;
}

.back-to-top:hover {
  background-color: #409eff;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
