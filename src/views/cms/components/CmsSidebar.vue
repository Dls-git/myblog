
<script setup>
import { 
  CloudUploadOutlined, 
  DashboardOutlined, 
  EditOutlined, 
  UnorderedListOutlined,
  PictureOutlined,
  TagOutlined,
  TeamOutlined,
  CameraOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  ClusterOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'

const props = defineProps({
  currentView: String,
  selectedSlug: String
})

const emit = defineEmits(['update:currentView', 'resetArticleForm', 'openGitModal'])

const setView = (view) => {
  emit('update:currentView', view)
  if (view === 'article') {
    emit('resetArticleForm')
  }
}
</script>

<template>
  <aside class="sidebar">
    <div class="logo">Blog Admin</div>

    <div class="nav-scroll">
      <div class="nav-group">
        <div class="nav-title">General</div>
        <div class="nav-item" :class="{ active: currentView === 'dashboard' }" @click="setView('dashboard')">
          <DashboardOutlined /> 控制面板
        </div>
        <div class="nav-item" :class="{ active: currentView === 'knowledge_graph' }" @click="setView('knowledge_graph')">
          <ClusterOutlined /> 知识图谱
        </div>
      </div>

      <div class="nav-group">
        <div class="nav-title">Content</div>
        <div class="nav-item" :class="{ active: currentView === 'article' && !selectedSlug }" @click="setView('article')">
          <EditOutlined /> 写文章
        </div>
        <div class="nav-item" :class="{ active: currentView === 'article_list' }" @click="setView('article_list')">
          <UnorderedListOutlined /> 文章管理
        </div>
        <div class="nav-item" :class="{ active: currentView === 'media_manager' }" @click="setView('media_manager')">
          <PictureOutlined /> 媒体库
        </div>
        <div class="nav-item" :class="{ active: currentView === 'taxonomy_manager' }" @click="setView('taxonomy_manager')">
          <TagOutlined /> 标签分类
        </div>
      </div>

      <div class="nav-group">
        <div class="nav-title">Data Modules</div>
        <div class="nav-item" :class="{ active: currentView === 'friendList.js' }" @click="setView('friendList.js')">
          <TeamOutlined /> 友链管理
        </div>
        <div class="nav-item" :class="{ active: currentView === 'photos.js' }" @click="setView('photos.js')">
          <CameraOutlined /> 摄影相册
        </div>
        <div class="nav-item" :class="{ active: currentView === 'quotes.js' }" @click="setView('quotes.js')">
          <MessageOutlined /> 语录收藏
        </div>
        <div class="nav-item" :class="{ active: currentView === 'thoughts.js' }" @click="setView('thoughts.js')">
          <ThunderboltOutlined /> 碎碎念
        </div>
        <div class="nav-item" :class="{ active: currentView === 'aboutData.js' }" @click="setView('aboutData.js')">
          <InfoCircleOutlined /> 关于页管理
        </div>
      </div>

      <div class="nav-group">
        <div class="nav-title">System</div>
        <div class="nav-item" :class="{ active: currentView === 'system_manager' }" @click="setView('system_manager')">
          <SettingOutlined /> 系统维护
        </div>
        <div class="nav-item git-publish-item" @click="emit('openGitModal')">
          <CloudUploadOutlined />
          一键发布
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  width: 260px;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 24px 16px;
  overflow: hidden;
}

.logo {
  font-family: inherit;
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--color-text-primary));
  margin-bottom: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-scroll {
  overflow-y: auto;
  padding-right: 6px;
  margin-right: -6px;
  padding-bottom: 8px;
}

.nav-group {
  margin-bottom: 18px;
}

.nav-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: rgb(var(--color-text-secondary));
  font-weight: 600;
  padding: 0 12px;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.nav-item {
  padding: 10px 12px;
  margin-bottom: 6px;
  cursor: pointer;
  border-radius: 14px;
  color: rgb(var(--color-text-secondary));
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background-color: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
}

.nav-item.active {
  background: rgb(var(--color-accent) / 0.12);
  color: rgb(var(--color-accent));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 22px;
  border-radius: 999px;
  background: rgb(var(--color-accent));
}

.git-publish-item {
  margin-top: 12px;
  color: rgb(var(--color-accent));
  border: 1px dashed rgb(var(--color-accent) / 0.4);
}

.git-publish-item:hover {
  background: rgb(var(--color-accent) / 0.05);
  border-style: solid;
}
</style>
