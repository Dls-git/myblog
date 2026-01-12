<script setup>
import { ref, computed } from 'vue'
import { photos } from '@/posts/dataJs/photos.js'
import ImageLightbox from '@/components/ImageLightbox.vue'

// 图片灯箱状态
const lightboxVisible = ref(false)
const currentImage = ref('')
const currentAlt = ref('')

// 分类过滤
const categories = ['All', ...new Set(photos.map(p => p.category).filter(Boolean))]
const activeCategory = ref('All')

const filteredPhotos = computed(() => {
  if (activeCategory.value === 'All') {
    return photos
  }
  return photos.filter(photo => photo.category === activeCategory.value)
})

// 打开灯箱
const openLightbox = (photo) => {
  currentImage.value = photo.url
  currentAlt.value = photo.title
  lightboxVisible.value = true
}

const setCategory = (cat) => {
  activeCategory.value = cat
}

// 统计数据
const stats = computed(() => [
  { label: 'Total Photos', value: photos.length },
  { label: 'Categories', value: categories.length - 1 },
  { label: 'Years', value: new Set(photos.map(p => p.date.split('-')[0])).size }
])
</script>

<template>
  <div class="gallery-page">
    <div class="content-container">
      <div class="header-simple">
        <h1 class="page-title">Gallery</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">A collection of moments</p>
      </div>

      <!-- Info Bar -->
      <div class="info-bar">
        <div class="stat-item" v-for="stat in stats" :key="stat.label">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-wrapper">
        <div class="filter-bar">
          <button 
            v-for="cat in categories" 
            :key="cat"
            class="filter-btn"
            :class="{ active: activeCategory === cat }"
            @click="setCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Masonry Grid -->
      <div class="gallery-masonry">
        <div
          v-for="(photo, index) in filteredPhotos"
          :key="photo.id"
          class="photo-card"
          @click="openLightbox(photo)"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <div class="image-wrapper">
            <img :src="photo.url" :alt="photo.title" loading="lazy">
            <div class="photo-overlay">
              <div class="overlay-content">
                <div class="badge-wrapper">
                   <span class="category-badge" v-if="photo.category">{{ photo.category }}</span>
                </div>
                <h3 class="photo-title">{{ photo.title }}</h3>
                <div class="photo-meta">
                  <span class="date">{{ photo.date }}</span>
                  <span class="desc" v-if="photo.description">{{ photo.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="gallery-footer">
        <div class="end-mark">■</div>
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
  min-height: 100vh;
  background-color: rgb(var(--color-bg-root));
  color: rgb(var(--color-text-primary));
  padding-top: 100px;
}

.header-simple {
  text-align: center;
  margin-bottom: 60px;
  animation: fadeUp 0.8s ease-out;

  .page-title {
    font-size: 3.5rem;
    font-weight: 800;
    margin: 0;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .title-line {
    width: 60px;
    height: 4px;
    background-color: rgb(var(--color-accent));
    margin: 20px auto;
  }

  .page-subtitle {
    font-size: 1.1rem;
    opacity: 0.6;
    font-weight: 300;
  }
}

.content-container {
  max-width: 1600px; /* Wider layout */
  margin: 0 auto;
  padding: 0 40px 60px;
  position: relative;
  z-index: 3;
}

/* Info Bar */
.info-bar {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-bottom: 60px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(var(--color-text-primary), 0.1);
  
  .stat-item {
    text-align: center;
    
    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: rgb(var(--color-accent));
      line-height: 1;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.6;
    }
  }
}

/* Filter Bar */
.filter-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 60px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 5px;
  background: rgba(var(--color-text-primary), 0.05);
  border-radius: 40px;
}

.filter-btn {
  padding: 10px 24px;
  border-radius: 30px;
  border: none;
  background: transparent;
  color: rgb(var(--color-text-primary));
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
  
  &:hover {
    color: rgb(var(--color-accent));
  }
  
  &.active {
    background: rgb(var(--color-accent));
    color: white;
    box-shadow: 0 4px 15px rgba(var(--color-accent), 0.3);
  }
}

/* 纯CSS瀑布流布局 */
.gallery-masonry {
  column-count: 3;
  column-gap: 40px; /* Wider gap */
  
  @media (max-width: 1200px) {
    column-count: 2;
  }
  
  @media (max-width: 640px) {
    column-count: 1;
  }
}

.photo-card {
  break-inside: avoid;
  margin-bottom: 40px;
  cursor: zoom-in;
  animation: fadeUp 0.8s ease backwards;
  
  &:hover {
    .image-wrapper {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      
      .photo-overlay {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
}

.image-wrapper {
  position: relative;
  border-radius: 0; /* Sharp corners for modern look */
  overflow: hidden;
  background: rgba(var(--color-bg-primary), 0.5);
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  
  img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1);
  }
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95); /* Ensure high contrast background */
  padding: 25px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  border-top: 4px solid rgb(var(--color-accent)); /* Thicker accent border */
  
  .overlay-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.badge-wrapper {
  margin-bottom: 5px;
}

.category-badge {
  display: inline-block;
  font-size: 0.75rem;
  color: white;
  background-color: rgb(var(--color-accent));
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.photo-title {
  color: #333; /* Dark text for clarity */
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
}

.photo-meta {
  color: #666; /* Darker secondary text */
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .date {
    font-family: monospace;
    font-size: 0.85rem;
    color: rgb(var(--color-accent));
    font-weight: 600;
  }
  
  .desc {
    font-style: italic;
  }
}

.gallery-footer {
  text-align: center;
  margin-top: 80px;
  opacity: 0.3;
  
  .end-mark {
    font-size: 1.5rem;
    color: rgb(var(--color-accent));
  }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .info-bar {
    gap: 20px;
    flex-wrap: wrap;
  }
  .content-container {
    padding: 40px 20px;
  }
  .header-simple .page-title {
    font-size: 2.5rem;
  }
}
</style>
