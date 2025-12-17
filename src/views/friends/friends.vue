<script setup>
import { ref, computed } from 'vue'
import FriendCard from "@/views/friends/friend-card.vue";
import FriendApplyModal from "@/views/friends/FriendApplyModal.vue";

const showApplyModal = ref(false)

// 示例数据，你可以根据需要修改
const friendsList = ref([
  {
    name: 'GSSD_NrxRobot404',
    desc: '茉莉花茶我还喜欢',
    avatar: new URL('../../assets/friendsAvatar/GSSD_NrxRobot404.jpg', import.meta.url).href,
    link: '#'
  },
  {
    name: 'Lemon &X.',
    desc: '自由的鸟哪怕身处牢笼也闪烁着自由的光芒',
    avatar: new URL('../../assets/friendsAvatar/Lemon&X.jpg', import.meta.url).href,
    link: '#'
  },
  {
    name: 'hsns128',
    desc: '或选择你的个性签名',
    avatar: new URL('../../assets/friendsAvatar/hsns128.jpg', import.meta.url).href,
    link: '#'
  },
    {
      name: "FLCL",
      desc: "200%",
      avatar: new URL('../../assets/friendsAvatar/FLCL.jpg', import.meta.url).href,
      link: "#"
    },
    {
      name: "翁呀跋",
      desc: "DBAA",
      avatar: new URL('../../assets/friendsAvatar/wyb.jpg', import.meta.url).href,
      link: "#"
    },
    {
      name: "Tulmo",
      desc: "sui!",
      avatar: new URL('../../assets/friendsAvatar/Tulmo.jpg', import.meta.url).href,
      link: "#"
    },
    {
      name: "Friend 4",
      desc: "A cool friend passionate about music.",
      avatar: "",
      link: "#"
    },
    {
      name: "Friend 5",
      desc: "A cool friend who likes cooking.",
      avatar: "",
      link: "#"
    },
    {
      name: "Friend 6",
      desc: "A cool friend into coding.",
      avatar: "",
      link: "#"
    },
    {
      name: "Friend 7",
      desc: "A cool friend who loves traveling.",
      avatar: "",
      link: "#"
    },
    {
      name: "Friend 8",
      desc: "A cool friend passionate about art.",
      avatar: "",
      link: "#"
    },
    {
      name: "Friend 9",
      desc: "A cool friend who likes gaming.",
      avatar: "",
      link: "#"
    },
    {
      name: "Friend 10",
      desc: "A cool friend into fitness.",
      avatar: "",
      link: "#"
    },
    {
      name: "Friend 11",
      desc: "A cool friend who enjoys writing.",
      avatar: "",
      link: "#"
    },
    {
      name: "Friend 12",
      desc: "A cool friend passionate about movies.",
      avatar: "",
      link: "#"
    }
])

// 分页逻辑
const currentPage = ref(1)
const pageSize = 12 // 每页显示12个好友
const totalPages = computed(() => Math.ceil(friendsList.value.length / pageSize))

const displayFriends = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return friendsList.value.slice(start, start + pageSize)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="friends-wrapper">
    <div class="content-container">
      <div class="header-section">
        <h1 class="title">我的好友</h1>
        <p class="subtitle">
          这里是我的好友列表。欢迎申请友链<br>
          <button class="apply-btn" @click="showApplyModal = true">
            + 申请友链
          </button>
        </p>
      </div>

      <div class="friends-grid">
        <FriendCard
          v-for="(friend, index) in displayFriends"
          :key="index"
          :name="friend.name"
          :desc="friend.desc"
          :avatar="friend.avatar"
          :link="friend.link"
        />
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          &lt;
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          class="page-btn"
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          &gt;
        </button>
      </div>

      <FriendApplyModal
        :visible="showApplyModal"
        @close="showApplyModal = false"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ... (保留原有样式) ... */
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.apply-btn {
  padding: 8px 24px;
  border-radius: 99px;
  border: 1px solid rgba(var(--color-border-primary), 0.2);
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #409eff;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 80px;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 40px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #409eff;
    color: white;
  }

  &.active {
    background: #409eff;
    color: white;
    font-weight: bold;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
