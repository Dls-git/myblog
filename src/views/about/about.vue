<script setup>
import { ref, computed } from 'vue'
import EmailModal from '@/components/EmailModal.vue'
import { qaList } from '@/posts/dataJs/aboutData.js'

const showEmailModal = ref(false)
const activeCardId = ref(null)

// Pagination Logic
const currentPage = ref(1)
const pageSize = 9
const totalPages = computed(() => Math.ceil(qaList.length / pageSize))

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return qaList.slice(start, start + pageSize)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const activeCard = computed(() => {
  return qaList.find(item => item.id === activeCardId.value)
})

const openCard = (id) => {
  activeCardId.value = id
}

const closeCard = () => {
  activeCardId.value = null
}
</script>

<template>
  <div class="about-container">
    <div class="content-wrapper">
      <!-- 标题区 -->
      <header class="page-header">
        <h1 class="title">About Me</h1>
        <p class="subtitle">碎片 · 探索 · 联结</p>
      </header>

      <!-- 卡片网格 -->
      <div class="cards-grid">
        <div 
          v-for="(item, index) in paginatedList" 
          :key="item.id" 
          class="card-item"
          :class="`type-${item.type}`"
          @click="openCard(item.id)"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="card-inner">
            <div class="card-front">
              <span class="q-mark">Q.</span>
              <h3 class="question">{{ item.question }}</h3>
              <div class="preview-answer">
                <span v-if="item.type === 'profile'" class="preview-avatar">
                   <img src="@/assets/img/Mikasa.jpg" alt="avatar" />
                </span>
                <p v-else-if="item.type === 'quote'" class="preview-quote">“{{ item.answer }}”</p>
                <div v-else-if="item.type === 'skills'" class="preview-skills">
                  <span v-for="s in item.skills.slice(0, 3)" :key="s">{{ s }}</span>
                  <span v-if="item.skills.length > 3">...</span>
                </div>
                <div v-else-if="item.type === 'social'" class="preview-social">
                   <img src="@/assets/img/github.png" alt="icon" />
                   <img src="@/assets/img/mail.png" alt="icon" />
                   <span>...</span>
                </div>
                <p v-else class="preview-text">{{ item.answer }}</p>
              </div>
              <div class="tap-hint">Tap to explore</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button 
          class="page-btn prev" 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          &lt;
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          class="page-btn next" 
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          &gt;
        </button>
      </div>
    </div>



    <!-- 详情展开层 (Modal) -->
    <Transition name="modal-zoom">
      <div v-if="activeCardId" class="modal-overlay" @click.self="closeCard">
        <div class="modal-card">
          <button class="close-btn" @click="closeCard">×</button>
          
          <div class="modal-content">
            <h2 class="modal-question">{{ activeCard.question }}</h2>
            
            <!-- Profile Detail -->
            <div v-if="activeCard.type === 'profile'" class="detail-profile">
              <img src="@/assets/img/Mikasa.jpg" class="large-avatar" />
              <h3>{{ activeCard.name }}</h3>
              <p class="role">{{ activeCard.role }}</p>
              <div class="timeline">
                <div v-for="(exp, idx) in activeCard.detail.experiences" :key="idx" class="timeline-item">
                  <span class="year">{{ exp.year }}</span>
                  <span class="event">{{ exp.event }}</span>
                </div>
              </div>
              <p class="intro-text">{{ activeCard.detail.intro }}</p>
            </div>

            <!-- Skills Detail -->
            <div v-else-if="activeCard.type === 'skills'" class="detail-skills">
              <div class="skill-bars">
                <div v-for="skill in activeCard.detail.main" :key="skill.name" class="skill-bar-item">
                  <div class="skill-label">
                    <span>{{ skill.name }}</span>
                    <span>{{ skill.level }}%</span>
                  </div>
                  <div class="progress-bg">
                    <div class="progress-fill" :style="{ width: skill.level + '%' }"></div>
                  </div>
                </div>
              </div>
              <div class="tools-cloud">
                <h4>Tools I use:</h4>
                <div class="tags">
                  <span v-for="tool in activeCard.detail.tools" :key="tool">{{ tool }}</span>
                </div>
              </div>
            </div>

            <!-- Hobbies Detail -->
            <div v-else-if="activeCard.id === 'hobbies'" class="detail-hobbies">
              <div class="hobby-grid">
                <div v-for="hobby in activeCard.detail.list" :key="hobby.name" class="hobby-item">
                  <span class="hobby-icon">{{ hobby.icon }}</span>
                  <h4>{{ hobby.name }}</h4>
                  <p>{{ hobby.desc }}</p>
                </div>
              </div>
            </div>

            <!-- Social Detail -->
            <div v-else-if="activeCard.type === 'social'" class="detail-social">
              <p class="social-text">{{ activeCard.detail.text }}</p>
              <div class="social-icons-large">
                <a href="https://github.com" target="_blank" class="s-icon github">
                  <img src="@/assets/img/github.png" alt="Github">
                  <span>Github</span>
                </a>
                <a href="https://weixin.qq.com/" target="_blank" class="s-icon wechat">
                  <img src="@/assets/img/wechat.png" alt="WeChat">
                  <span>WeChat</span>
                </a>
                <a href="https://im.qq.com/index.shtml" target="_blank" class="s-icon qq">
                  <img src="@/assets/img/QQ.png" alt="QQ">
                  <span>QQ</span>
                </a>
                <div class="s-icon email" @click="showEmailModal = true">
                  <img src="@/assets/img/mail.png" alt="Email">
                  <span>Email</span>
                </div>
              </div>
            </div>

            <!-- Quote Detail -->
            <div v-else-if="activeCard.type === 'quote'" class="detail-quote">
              <blockquote class="big-quote">{{ activeCard.answer }}</blockquote>
              <cite>{{ activeCard.subAnswer }}</cite>
              <div class="quote-divider"></div>
              <p class="quote-note">{{ activeCard.detail.text }}</p>
            </div>

            <!-- Generic Text Detail -->
            <div v-else class="detail-text">
              <p class="main-answer">{{ activeCard.answer }}</p>
              <p v-if="activeCard.detail && activeCard.detail.text" class="sub-text">{{ activeCard.detail.text }}</p>
            </div>

          </div>
        </div>
      </div>
    </Transition>

    <EmailModal :visible="showEmailModal" @close="showEmailModal = false" />
  </div>
</template>

<style scoped lang="scss">
/* 容器与背景 */
.about-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  padding-top: 100px;
  padding-bottom: 5px;
  color: rgb(var(--color-text-primary));
  background-color: rgb(var(--color-bg-root));
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  margin-bottom: 60px;
  animation: fadeDown 0.8s ease-out;
  animation: fadeDown 0.8s ease-out;

  .title {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 10px;
    color: rgb(var(--color-text-primary));
  }

  .subtitle {
    font-size: 1.2rem;
    opacity: 0.6;
    letter-spacing: 4px;
    text-transform: uppercase;
  }
}

/* 网格布局 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  perspective: 1000px;
  min-height: 500px; /* Prevent layout shift */
}

.card-item {
  position: relative;
  height: 220px;
  cursor: pointer;
  border-radius: 20px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-10px) scale(1.02);
    z-index: 2;
    
    .card-inner {
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      border-color: rgba(var(--color-accent), 0.3);
    }
    
    .tap-hint {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.card-inner {
  height: 100%;
  background: rgba(var(--color-bg-primary), 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  overflow: hidden;
}

.card-front {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .q-mark {
    font-size: 1.5rem;
    font-weight: 900;
    color: rgba(var(--color-accent), 0.2);
    margin-bottom: 5px;
  }

  .question {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 15px;
    line-height: 1.4;
  }
  
  .preview-answer {
    flex-grow: 1;
    opacity: 0.8;
    font-size: 0.95rem;
    
    .preview-text {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

.preview-avatar {
  img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.preview-quote {
  font-style: italic;
  font-family: serif;
  font-size: 1.1rem;
}

.preview-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  span {
    background: rgba(var(--color-accent), 0.1);
    color: rgb(var(--color-accent));
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
  }
}

.preview-social {
  display: flex;
  gap: 10px;
  align-items: center;
  img { width: 24px; height: 24px; opacity: 0.7; }
}

.tap-hint {
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-size: 0.8rem;
  color: rgb(var(--color-accent));
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  font-weight: 600;
}

/* Pagination Styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  gap: 20px;
}

.page-btn {
  background: rgba(var(--color-bg-primary), 0.8);
  border: 1px solid rgba(0,0,0,0.1);
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  color: rgb(var(--color-text-primary));
  font-weight: bold;
  
  &:hover:not(:disabled) {
    background: rgb(var(--color-accent));
    color: white;
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-info {
  font-weight: 600;
  opacity: 0.8;
}



/* Modal 样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.modal-card {
  background: rgb(var(--color-bg-primary));
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  border-radius: 30px;
  padding: 40px;
  position: relative;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255,255,255,0.5);
  
  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 3px;
  }
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.05);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: rgb(var(--color-text-primary));
  
  &:hover {
    background: rgba(0,0,0,0.1);
    transform: rotate(90deg);
  }
}

.modal-content {
  .modal-question {
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    color: rgb(var(--color-text-primary));
  }
}

/* 详情内容样式 */
.detail-profile {
  text-align: center;
  
  .large-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin-bottom: 20px;
    border: 4px solid white;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }
  
  h3 { font-size: 1.5rem; margin-bottom: 5px; }
  .role { opacity: 0.6; margin-bottom: 30px; }
  
  .timeline {
    text-align: left;
    margin-bottom: 30px;
    border-left: 2px solid rgba(0,0,0,0.1);
    padding-left: 20px;
    
    .timeline-item {
      margin-bottom: 15px;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        left: -26px;
        top: 6px;
        width: 10px;
        height: 10px;
        background: rgb(var(--color-accent));
        border-radius: 50%;
      }
      
      .year { font-weight: bold; margin-right: 10px; color: rgb(var(--color-accent)); }
    }
  }
  
  .intro-text { line-height: 1.8; opacity: 0.8; text-align: left; }
}

.detail-skills {
  .skill-bar-item {
    margin-bottom: 15px;
    
    .skill-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 0.9rem;
      font-weight: 600;
    }
    
    .progress-bg {
      height: 8px;
      background: rgba(0,0,0,0.05);
      border-radius: 4px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: rgb(var(--color-accent));
        border-radius: 4px;
      }
    }
  }
  
  .tools-cloud {
    margin-top: 30px;
    h4 { margin-bottom: 15px; opacity: 0.7; }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      span {
        padding: 6px 12px;
        background: rgba(0,0,0,0.05);
        border-radius: 8px;
        font-size: 0.9rem;
      }
    }
  }
}

.detail-hobbies {
  .hobby-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    
    .hobby-item {
      background: rgba(0,0,0,0.02);
      padding: 20px;
      border-radius: 16px;
      text-align: center;
      
      .hobby-icon { font-size: 2rem; display: block; margin-bottom: 10px; }
      h4 { margin-bottom: 5px; }
      p { font-size: 0.85rem; opacity: 0.7; }
    }
  }
}

.detail-social {
  text-align: center;
  .social-text { margin-bottom: 30px; opacity: 0.8; }
  
  .social-icons-large {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    
    .s-icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: rgba(0,0,0,0.03);
      border-radius: 16px;
      transition: all 0.3s;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      
      img { width: 40px; height: 40px; margin-bottom: 10px; }
      
      &:hover {
        background: rgba(var(--color-accent), 0.1);
        transform: translateY(-3px);
      }
    }
  }
}

.detail-quote {
  text-align: center;
  padding: 20px;
  
  .big-quote {
    font-size: 1.5rem;
    font-family: serif;
    font-style: italic;
    margin-bottom: 20px;
    line-height: 1.6;
  }
  
  .quote-divider {
    height: 1px;
    width: 50px;
    background: rgba(0,0,0,0.1);
    margin: 30px auto;
  }
  
  .quote-note {
    font-size: 0.95rem;
    opacity: 0.7;
    line-height: 1.7;
  }
}

.detail-text {
  .main-answer { font-size: 1.2rem; font-weight: 500; margin-bottom: 20px; line-height: 1.6; }
  .sub-text { opacity: 0.7; line-height: 1.7; }
}

/* 动画类 */
.modal-zoom-enter-active,
.modal-zoom-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-zoom-enter-from,
.modal-zoom-leave-to {
  opacity: 0;
}

.modal-zoom-enter-from .modal-card,
.modal-zoom-leave-to .modal-card {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

.modal-zoom-enter-to .modal-card,
.modal-zoom-leave-from .modal-card {
  transform: scale(1) translateY(0);
  opacity: 1;
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .orb { opacity: 0.2; }
  .modal-card { padding: 25px; }
  .detail-hobbies .hobby-grid { grid-template-columns: 1fr; }
  .detail-social .social-icons-large { grid-template-columns: 1fr 1fr; }
}
</style>
