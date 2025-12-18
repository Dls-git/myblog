<script setup>
import { ref, computed } from 'vue'
import { photos } from '@/posts/dataJs/photos.js'
import ImageLightbox from '@/components/ImageLightbox.vue'

// 图片灯箱状态
const lightboxVisible = ref(false)
const currentImage = ref('')
const currentAlt = ref('')

// 打开灯箱
const openLightbox = (photo) => {
  currentImage.value = photo.url
  currentAlt.value = photo.title
  lightboxVisible.value = true
}

// 瀑布流布局模拟（简单的两列或三列布局）
// 这里的简单实现是将数组分为两半，分别渲染在左右两列
// 更复杂的实现可能需要计算图片高度，这里为了简化直接均分
const leftColumn = computed(() => photos.filter((_, i) => i % 2 === 0))
const rightColumn = computed(() => photos.filter((_, i) => i % 2 !== 0))

</script>

<template>
  <div class="gallery-page">
    <div class="header-section">
      <h1 class="page-title">
        瞬间 <span class="icon">📷</span>
      </h1>
      <p class="subtitle">定格美好的时光</p>
    </div>

    <div class="gallery-container">
      <!-- 左列 -->
      <div class="gallery-column">
        <div
          v-for="photo in leftColumn"
          :key="photo.id"
          class="photo-card"
          @click="openLightbox(photo)"
        >
          <img :src="photo.url" :alt="photo.title" loading="lazy">
          <div class="photo-overlay">
            <div class="photo-info">
              <h3>{{ photo.title }}</h3>
              <p>{{ photo.date }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列 -->
      <div class="gallery-column">
        <div
          v-for="photo in rightColumn"
          :key="photo.id"
          class="photo-card"
          @click="openLightbox(photo)"
        >
          <img :src="photo.url" :alt="photo.title" loading="lazy">
          <div class="photo-overlay">
            <div class="photo-info">
              <h3>{{ photo.title }}</h3>
              <p>{{ photo.date }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 灯箱组件 -->
    <ImageLightbox
      :visible="lightboxVisible"
      :src="currentImage"
      :alt="currentAlt"
      @close="lightboxVisible = false"
    />
  </div>
</template>

<style scoped lang="scss">
.gallery-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 80vh;
}

.header-section {
  text-align: center;
  margin-bottom: 60px;

  .page-title {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 10px;
    color: rgb(var(--color-text-primary));

    .icon {
      font-size: 30px;
    }
  }

  .subtitle {
    font-size: 18px;
    color: rgb(var(--color-text-primary));
    opacity: 0.6;
    letter-spacing: 1px;
  }
}

.gallery-container {
  display: flex;
  gap: 20px;
}

.gallery-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.photo-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: zoom-in;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;

  img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.5s ease;
  }

  &:hover {
    transform: translateY(-5px);

    img {
      transform: scale(1.05);
    }

    .photo-overlay {
      opacity: 1;
    }
  }
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;

  .photo-info {
    h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 12px;
      opacity: 0.8;
    }
  }
}

@media (max-width: 768px) {
  .gallery-container {
    flex-direction: column;
  }
}
</style>
