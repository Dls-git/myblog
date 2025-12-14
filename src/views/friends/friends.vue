<script setup>
import { ref } from 'vue'
import FriendCard from "@/views/friends/friend-card.vue";

// 示例数据，你可以根据需要修改
const friendsList = ref([
  {
    name: '张三',
    desc: '介绍你自己',
    avatar: '', // 可以填入图片路径，例如 new URL('@/assets/img/Mikasa.jpg', import.meta.url).href
    link: 'https://github.com'
  },
  {
    name: '李四',
    desc: '选择你喜欢的格言',
    avatar: '',
    link: '#'
  },
  {
    name: 'My Blog',
    desc: '或选择你的个性签名',
    avatar: '',
    link: '/'
  }
])
</script>

<template>
  <div class="friends-wrapper">
    <div class="content-container">
      <div class="header-section">
        <h1 class="title">我的好友</h1>
        <p class="subtitle">
          这里是我的好友列表。<br>
        </p>
      </div>

      <div class="friends-grid">
        <FriendCard
          v-for="(friend, index) in friendsList"
          :key="index"
          :name="friend.name"
          :desc="friend.desc"
          :avatar="friend.avatar"
          :link="friend.link"
        />
      </div>

      <!-- 友链申请说明区域，可选 -->
      <!-- <div class="apply-section">
        <h3>友链申请</h3>
        <p>名称：My Blog</p>
        <p>简介：一个记录学习与生活的个人博客</p>
        <p>链接：https://myblog.com</p>
        <p>头像：https://myblog.com/avatar.png</p>
      </div> -->
    </div>
  </div>
</template>

<style scoped lang="scss">
.friends-wrapper {
  padding-top: 120px;
  padding-bottom: 60px;
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
}

.content-container {
  width: 90%;
  max-width: 1200px;
}

.header-section {
  text-align: center;
  margin-bottom: 60px;
}

.title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 20px;
  color: rgb(var(--color-text-primary));
}

.subtitle {
  font-size: 1.2rem;
  line-height: 1.6;
  color: rgb(var(--color-text-primary));
  opacity: 0.8;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 80px;
}

.apply-section {
  background: rgb(var(--color-bg-secondary) / 0.3);
  padding: 40px;
  border-radius: 24px;
  text-align: center;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: rgb(var(--color-text-primary));
  }

  p {
    margin: 10px 0;
    color: rgb(var(--color-text-primary));
    opacity: 0.8;
    font-size: 1rem;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .friends-wrapper {
    padding-top: 100px;
  }

  .title {
    font-size: 2.5rem;
  }

  .friends-grid {
    grid-template-columns: 1fr;
  }
}
</style>
