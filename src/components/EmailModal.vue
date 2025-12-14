<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    default: '2879664978@qq.com'
  }
});

const emit = defineEmits(['close']);
const copied = ref(false);

const close = () => {
  emit('close');
  copied.value = false;
};

const copyEmail = () => {
  navigator.clipboard.writeText(props.email).then(() => {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  });
};
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <div class="modal-header">
          <h3>联系我</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="message">有问题可以给我发邮件 👇</p>
          <div class="email-box">
            <span class="email-text">{{ email }}</span>
            <button class="copy-btn" @click="copyEmail" :class="{ 'copied': copied }">
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: rgb(var(--color-bg-primary));
  width: 90%;
  max-width: 400px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 1px solid rgba(var(--color-border-primary), 0.1);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(var(--color-border-primary), 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 18px;
    color: rgb(var(--color-text-primary));
  }
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: rgb(var(--color-text-primary));
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.5;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.modal-body {
  padding: 30px 20px;
  text-align: center;
}

.message {
  margin-bottom: 20px;
  color: rgb(var(--color-text-primary));
  opacity: 0.8;
}

.email-box {
  background: rgb(var(--color-bg-secondary));
  padding: 12px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border: 1px solid rgba(var(--color-border-primary), 0.1);
}

.email-text {
  font-family: monospace;
  font-size: 16px;
  color: rgb(var(--color-text-primary));
}

.copy-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #409eff;
  background: transparent;
  color: #409eff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background: #409eff;
    color: white;
  }

  &.copied {
    background: #67c23a;
    border-color: #67c23a;
    color: white;
  }
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
