<script setup>
import { ref, computed } from 'vue'
import FriendCard from './friend-card.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const formData = ref({
  name: '',
  desc: '',
  link: '',
  avatar: ''
})

const imageFile = ref(null)
const previewUrl = ref('')
const isCopied = ref(false)
const inputMode = ref('file') // 'file' or 'url'

// 处理文件上传预览
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    // 释放之前的 URL 对象，避免内存泄漏
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(file)
  }
}

// 预览数据
const previewData = computed(() => ({
  name: formData.value.name || 'Your Name',
  desc: formData.value.desc || 'Your description here...',
  link: formData.value.link || '#',
  avatar: inputMode.value === 'file' ? previewUrl.value : formData.value.avatar
}))

// 生成申请格式 JSON
const generateTemplate = () => {
  const data = {
    name: formData.value.name,
    desc: formData.value.desc,
    link: formData.value.link,
    // 如果是文件上传模式，生成预期的文件路径
    avatar: inputMode.value === 'file'
      ? `new URL('../../assets/friendsAvatar/${imageFile.value?.name || 'image.jpg'}', import.meta.url).href`
      : formData.value.avatar
  }

  // 附加说明
  const comment = inputMode.value === 'file'
    ? `\n// 注意：请查收邮件附件中的图片，并将其重命名为 ${imageFile.value?.name || 'image.jpg'} 放入 src/assets/friendsAvatar 目录`
    : ''

  return JSON.stringify(data, null, 2) + comment
}

const copyToClipboard = async () => {
  const text = generateTemplate()
  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const sendEmail = () => {
  const subject = encodeURIComponent(`友链申请 - ${formData.value.name}`)
  let bodyText = `请将以下 JSON 数据添加到 friends.vue 中：\n\n${generateTemplate()}`

  if (inputMode.value === 'file') {
    bodyText += `\n\n【重要提示】\n请记得将我的头像图片作为邮件附件发送！`
  }

  const body = encodeURIComponent(bodyText)
  window.open(`https://mail.qq.com/`)
}

const close = () => {
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <button class="close-btn" @click="close">&times;</button>

        <div class="modal-header">
          <h2>申请友链</h2>
          <p>请填写以下信息，生成申请格式,通过qq邮箱(2879664978@qq.com)发送给我</p>
          <p>照片只能作为邮件附件发送，本地仅供预览</p>
        </div>

        <div class="modal-body">
          <!-- 左侧表单 -->
          <div class="form-section">
            <div class="form-group">
              <label>昵称 </label>
              <input v-model="formData.name" placeholder="例如：YouthY" type="text">
            </div>

            <div class="form-group">
              <label>简介 / 描述</label>
              <input v-model="formData.desc" placeholder="选择你喜欢的一句话" type="text">
            </div>

            <div class="form-group">
              <label>链接</label>
              <input v-model="formData.link" placeholder="https://...(没有就填#)" type="text">
            </div>

            <div class="form-group">
              <label>头像</label>
              <div class="tab-switch">
                <button
                  :class="{ active: inputMode === 'file' }"
                  @click="inputMode = 'file'"
                >本地上传</button>
                <button
                  :class="{ active: inputMode === 'url' }"
                  @click="inputMode = 'url'"
                >网络链接</button>
              </div>

              <div v-if="inputMode === 'file'" class="file-input-wrapper">
                <input type="file" accept="image/*" @change="handleFileChange">
                <p class="hint">图片将仅用于本地预览，申请时请记得作为邮件附件发送</p>
              </div>

              <div v-else>
                <input v-model="formData.avatar" placeholder="https://.../avatar.png" type="text">
                <p class="hint">请提供一个可公开访问的图片链接</p>
              </div>
            </div>
          </div>

          <!-- 右侧预览 -->
          <div class="preview-section">
            <h3>卡片预览</h3>
            <div class="preview-card-wrapper">
              <FriendCard
                v-bind="previewData"
                class="preview-card"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="copyToClipboard">
            {{ isCopied ? '已复制 JSON' : '复制申请格式 (JSON)' }}
          </button>
          <button class="btn btn-primary" @click="sendEmail">
            发送邮件申请
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
/* ... (保留原有样式) ... */
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
  padding: 20px;
}

.modal-content {
  background: rgb(var(--color-bg-primary));
  width: 800px;
  max-width: 95%;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: rgb(var(--color-text-primary));
  opacity: 0.5;
  z-index: 10;

  &:hover {
    opacity: 1;
  }
}

.modal-header {
  padding: 30px 30px 0;
  text-align: center;

  h2 {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 10px;
    color: rgb(var(--color-text-primary));
  }

  p {
    color: rgb(var(--color-text-primary));
    opacity: 0.6;
  }
}

.modal-body {
  padding: 30px;
  display: flex;
  gap: 40px;
  overflow-y: auto;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 14px;
    font-weight: 600;
    color: rgb(var(--color-text-primary));
    opacity: 0.8;
  }

  input[type="text"] {
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid rgba(var(--color-border-primary), 0.1);
    background: rgb(var(--color-bg-secondary));
    color: rgb(var(--color-text-primary));
    font-size: 16px;
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: #409eff;
      background: rgb(var(--color-bg-primary));
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
    }
  }

  /* 文件输入框样式 */
  .file-input-wrapper {
    input[type="file"] {
      width: 100%;
      padding: 10px;
      background: rgb(var(--color-bg-secondary));
      border-radius: 12px;
      color: rgb(var(--color-text-primary));
    }
  }

  .hint {
    font-size: 12px;
    color: rgb(var(--color-text-primary));
    opacity: 0.5;
    margin: 5px 0 0;
  }
}

/* 切换按钮 */
.tab-switch {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;

  button {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba(var(--color-border-primary), 0.2);
    background: transparent;
    color: rgb(var(--color-text-primary));
    cursor: pointer;
    font-size: 13px;
    opacity: 0.7;
    transition: all 0.2s;

    &.active {
      background: #409eff;
      color: white;
      border-color: #409eff;
      opacity: 1;
    }

    &:hover:not(.active) {
      opacity: 1;
      background: rgb(var(--color-bg-secondary));
    }
  }
}

.preview-section {
  flex: 1;
  background: rgb(var(--color-bg-secondary) / 0.3);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  h3 {
    margin-bottom: 20px;
    color: rgb(var(--color-text-primary));
    opacity: 0.7;
    font-size: 16px;
  }
}

.preview-card-wrapper {
  width: 100%;
  pointer-events: none; /* 预览时不让点击跳转 */
}

.modal-footer {
  padding: 20px 30px 30px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  border-top: 1px solid rgba(var(--color-border-primary), 0.1);
  background: rgb(var(--color-bg-primary));
}

.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;

  &.btn-secondary {
    background: rgb(var(--color-bg-secondary));
    color: rgb(var(--color-text-primary));

    &:hover {
      background: rgba(var(--color-bg-secondary), 0.8);
    }
  }

  &.btn-primary {
    background: #409eff;
    color: white;

    &:hover {
      background: #66b1ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
  }
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;

  .modal-content {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.9) translateY(20px);
  }
}
</style>
