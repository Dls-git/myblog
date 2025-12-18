<script setup>
defineProps({
  visible: Boolean,
  src: String,
  alt: String
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="lightbox-overlay" @click="close">
      <button class="close-btn" @click.stop="close">×</button>
      <div class="lightbox-content" @click.stop>
        <img :src="src" :alt="alt">
        <div v-if="alt" class="caption">{{ alt }}</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: zoom-out;
}

.lightbox-content {
  max-width: 90%;
  max-height: 90vh;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  cursor: default;
}

.caption {
  margin-top: 10px;
  color: #ccc;
  font-size: 14px;
  text-align: center;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: white;
  font-size: 40px;
  cursor: pointer;
  z-index: 2001;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.close-btn:hover {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
