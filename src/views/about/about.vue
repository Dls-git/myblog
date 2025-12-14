<script setup>
import { ref } from 'vue'
import EmailModal from '@/components/EmailModal.vue'

const showEmailModal = ref(false)

const skills = [
  'Vue 3',
  'JavaScript',
  'TypeScript',
  'HTML5/CSS3',
  'Node.js',
  'Git',
  'Vite'
]
</script>

<template>
  <div class="about-wrapper">
    <div class="bento-grid">

      <!-- Profile Section -->
      <div class="card profile-card">
        <div class="profile-content">
          <div class="avatar-container">
            <img src="@/assets/img/Mikasa.jpg" alt="Profile" class="avatar" />
          </div>
          <div class="info">
            <h1 class="name">Hi, I'm <span class="highlight">YouthY</span> 👋</h1>
            <p class="role">Frontend Developer & UI Enthusiast</p>
            <p class="bio">
              目前还是一条咸鱼，希望有一天......
            </p>
          </div>
        </div>
      </div>

      <!-- Social Links -->
      <div class="card social-card">
        <h3>Connect Me</h3>
        <div class="social-links">
          <a href="https://github.com" target="_blank" class="social-item" title="Github">
            <img src="@/assets/img/github.png" alt="Github">
          </a>
          <a href="https://weixin.qq.com/" target="_blank" class="social-item" title="WeChat">
            <img src="@/assets/img/wechat.png" alt="WeChat">
          </a>
          <a href="https://im.qq.com/index.shtml" target="_blank" class="social-item" title="QQ">
            <img src="@/assets/img/QQ.png" alt="QQ">
          </a>
          <div class="social-item" title="Email" @click="showEmailModal = true" style="cursor: pointer;">
            <img src="@/assets/img/mail.png" alt="Email">
          </div>
        </div>
      </div>

      <!-- Skills -->
      <div class="card skills-card">
        <h3>Tech Stack</h3>
        <div class="skills-list">
          <span v-for="skill in skills" :key="skill" class="skill-tag">{{ skill }}</span>
        </div>
      </div>

      <!-- Personal Info -->
      <div class="card info-card">
        <h3>About</h3>
        <ul class="info-list">
          <li>
            <span class="label">📍 Location</span>
            <span class="value">China Wuhan</span>
          </li>
          <li>
            <span class="label">🎓 Education</span>
            <span class="value">Computer Science</span>
          </li>
          <li>
            <span class="label">💼 Experience</span>
            <span class="value">Frontend Dev</span>
          </li>
          <li>
            <span class="label">✨ Interests</span>
            <span class="value">Coding, Reading,Listen</span>
          </li>
        </ul>
      </div>

      <!-- Quote -->
      <div class="card quote-card">
        <div class="quote-content">
          <p class="quote-text">"劝君莫惜金缕衣，劝君惜取少年时"</p>
          <p class="quote-author">- 《金缕衣》</p>
        </div>
      </div>

    </div>

    <!-- 邮箱弹窗 -->
    <EmailModal
      :visible="showEmailModal"
      @close="showEmailModal = false"
    />
  </div>
</template>

<style scoped lang="scss">
.about-wrapper {
  padding-top: 120px; /* Header space */
  padding-bottom: 60px;
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 24px;
  width: 90%;
  max-width: 1200px;
}

/* Card Common Styles */
.card {
  background: rgb(var(--color-bg-primary));
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }

  h3 {
    font-size: 1.2rem;
    margin-bottom: 20px;
    color: rgb(var(--color-text-primary));
    opacity: 0.8;
  }
}

/* 1. Profile Card */
.profile-card {
  grid-column: span 2;
  grid-row: span 1;
  display: flex;
  align-items: center;
}

.profile-content {
  display: flex;
  align-items: center;
  gap: 40px;
}

.avatar-container {
  flex-shrink: 0;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgb(var(--color-bg-secondary));
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.info {
  .name {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 10px;
    color: rgb(var(--color-text-primary));
  }

  .highlight {
    color: #409eff; /* Element Plus Primary Color */
    background: linear-gradient(120deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.3) 100%);
    padding: 0 5px;
    border-radius: 8px;
  }

  .role {
    font-size: 1.2rem;
    color: rgb(var(--color-text-primary));
    opacity: 0.8;
    margin-bottom: 15px;
    font-weight: 500;
  }

  .bio {
    font-size: 1rem;
    line-height: 1.6;
    color: rgb(var(--color-text-primary));
    opacity: 0.7;
    max-width: 500px;
  }
}

/* 2. Social Card */
.social-card {
  grid-column: span 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.social-links {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.social-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: rgb(var(--color-bg-secondary));
  transition: all 0.3s ease;

  img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  &:hover {
    background: #e6f7ff;
    transform: scale(1.1);
  }
}

/* 3. Skills Card */
.skills-card {
  grid-column: span 1;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-tag {
  padding: 8px 16px;
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.3s;

  &:hover {
    background: #409eff;
    color: white;
  }
}

/* 4. Info Card */
.info-card {
  grid-column: span 1;
}

.info-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1rem;
    padding-bottom: 10px;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.1);

    &:last-child {
      border-bottom: none;
    }
  }

  .label {
    color: rgb(var(--color-text-primary));
    opacity: 0.7;
  }

  .value {
    font-weight: 600;
    color: rgb(var(--color-text-primary));
  }
}

/* 5. Quote Card */
.quote-card {
  grid-column: span 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: rgb(var(--color-text-primary));
}

.quote-content {
  text-align: center;
}

.quote-text {
  font-size: 1.5rem;
  font-weight: bold;
  font-style: italic;
  margin-bottom: 10px;
  line-height: 1.4;
}

.quote-author {
  font-size: 1rem;
  opacity: 0.8;
  text-align: right;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile-card {
    grid-column: span 2;
  }

  .quote-card {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }

  .profile-card,
  .social-card,
  .skills-card,
  .info-card,
  .quote-card {
    grid-column: span 1;
  }

  .profile-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .info .bio {
    margin: 0 auto;
  }

  .about-wrapper {
    padding-top: 100px;
  }
}
</style>
