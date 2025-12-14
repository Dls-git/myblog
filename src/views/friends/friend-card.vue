<script setup>
defineProps({
  name: {
    type: String,
    default: 'Friend'
  },
  desc: {
    type: String,
    default: 'A cool friend.'
  },
  avatar: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: '#'
  }
})
</script>

<template>
  <a :href="link" target="_blank" class="friend-card">
    <div class="avatar-wrapper">
      <img v-if="avatar" :src="avatar" :alt="name" class="avatar">
      <div v-else class="avatar-placeholder">{{ name.charAt(0).toUpperCase() }}</div>
    </div>
    <div class="info">
      <h3 class="name">{{ name }}</h3>
      <p class="desc" :title="desc">{{ desc }}</p>
    </div>
  </a>
</template>

<style scoped>
.friend-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.friend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1);
}

.avatar-wrapper {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 16px;
  border: 2px solid rgb(var(--color-bg-secondary));
  background: rgb(var(--color-bg-secondary));
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.friend-card:hover .avatar {
  transform: scale(1.1);
}

.avatar-placeholder {
  font-size: 24px;
  font-weight: bold;
  color: rgb(var(--color-text-primary));
  opacity: 0.5;
}

.info {
  flex: 1;
  min-width: 0; /* Enable truncation for flex child */
}

.name {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(var(--color-text-primary));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-card:hover .name {
  color: #409eff;
}

.desc {
  margin: 0;
  font-size: 0.9rem;
  color: rgb(var(--color-text-primary));
  opacity: 0.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
</style>