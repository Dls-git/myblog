
<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch, normalizeUrl, truncate } from '../utils'
import { 
  DeleteOutlined, 
  CopyOutlined, 
  CheckOutlined, 
  LoadingOutlined, 
  CloudUploadOutlined,
  SearchOutlined,
  FolderOutlined,
  FileUnknownOutlined
} from '@ant-design/icons-vue'

const props = defineProps({
  isPicker: Boolean
})

const emit = defineEmits(['select'])

const mediaFiles = ref([])
const loading = ref(false)
const copiedIndex = ref(-1)
const searchQuery = ref('')
const currentCategory = ref('all') // 'all', 'posts', 'data', 'unused'

const loadMedia = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/media')
    if (res.ok) {
      mediaFiles.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to load media:', err)
  } finally {
    loading.value = false
  }
}

const filteredMedia = computed(() => {
  let list = [...mediaFiles.value]

  // 排序逻辑：使用的排在前面，然后按时间倒序
  list.sort((a, b) => {
    const aUsed = a.usage?.length || 0
    const bUsed = b.usage?.length || 0
    if (aUsed !== bUsed) return bUsed - aUsed
    return new Date(b.mtime) - new Date(a.mtime)
  })

  // 1. 分类过滤
  if (currentCategory.value === 'posts') {
    list = list.filter(f => f.usage?.some(u => u.type === 'post'))
  } else if (currentCategory.value === 'data') {
    list = list.filter(f => f.usage?.some(u => u.type === 'data'))
  } else if (currentCategory.value === 'unused') {
    list = list.filter(f => !f.usage || f.usage.length === 0)
  } else if (currentCategory.value === 'uploads') {
    list = list.filter(f => f.source === 'uploads')
  } else if (currentCategory.value === 'assets') {
    list = list.filter(f => f.source === 'assets')
  }

  // 2. 搜索过滤
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.usage?.some(u => u.name.toLowerCase().includes(q))
    )
  }

  return list
})

const categories = [
  { key: 'all', label: '全部', icon: FolderOutlined },
  { key: 'uploads', label: '上传目录', icon: FolderOutlined },
  { key: 'assets', label: '资源目录', icon: FolderOutlined },
  { key: 'posts', label: '文章引用', icon: FolderOutlined },
  { key: 'data', label: '配置引用', icon: FolderOutlined },
  { key: 'unused', label: '未引用', icon: FileUnknownOutlined },
]

const handleUpload = async (e) => {
  const files = e.target.files
  if (!files.length) return

  loading.value = true
  try {
    for (const file of files) {
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-File-Name': encodeURIComponent(file.name)
        },
        body: file
      })
      if (!res.ok) throw new Error('Upload failed')
    }
    // 上传成功后，切换到“上传目录”分类以便查看新文件
    currentCategory.value = 'uploads'
    await loadMedia()
    alert('图片上传成功！')
  } catch (err) {
    alert('上传失败: ' + err.message)
  } finally {
    loading.value = false
  }
}

const deleteFile = async (file) => {
  if (file.source === 'assets') {
    alert('资源目录 (assets) 下的文件受代码版本管理，请在代码中手动删除。')
    return
  }

  const usageCount = file.usage?.length || 0
  let message = `确定要删除文件 ${file.name} 吗？`
  if (usageCount > 0) {
    message = `警告：该文件正在被 ${usageCount} 处引用（${file.usage.map(u => u.name).join(', ')}）。删除可能导致图片无法显示！\n\n确定要继续删除吗？`
  }

  if (!window.confirm(message)) return
  
  try {
    const res = await apiFetch(`/api/media?name=${encodeURIComponent(file.name)}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      await loadMedia()
    } else {
      const err = await res.json()
      alert('删除失败: ' + (err.message || '未知错误'))
    }
  } catch (err) {
    console.error('Failed to delete file:', err)
    alert('网络错误，删除失败')
  }
}

const cleanUnusedMedia = async () => {
  const unusedFiles = mediaFiles.value.filter(f => f.source === 'uploads' && (!f.usage || f.usage.length === 0))
  if (unusedFiles.length === 0) {
    alert('没有发现未使用的上传图片。')
    return
  }

  if (!confirm(`发现 ${unusedFiles.length} 张未引用的上传图片，确定要全部删除吗？`)) return

  loading.value = true
  try {
    const names = unusedFiles.map(f => f.name)
    const res = await apiFetch('/api/media?batch=true', {
      method: 'DELETE',
      body: JSON.stringify({ names })
    })
    if (res.ok) {
      await loadMedia()
      alert(`成功清理 ${unusedFiles.length} 张图片。`)
    }
  } catch (err) {
    alert('清理失败')
  } finally {
    loading.value = false
  }
}

const copyUrl = (url, index) => {
  if (props.isPicker) {
    emit('select', url)
    return
  }
  navigator.clipboard.writeText(url)
  copiedIndex.value = index
  setTimeout(() => {
    copiedIndex.value = -1
  }, 2000)
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(loadMedia)
</script>

<template>
  <div class="media-manager">
    <div class="media-header">
      <div class="header-left">
        <div class="search-box">
          <SearchOutlined />
          <input v-model="searchQuery" placeholder="搜索文件名或引用位置..." />
        </div>
      </div>
      <div class="header-right">
        <button class="clean-btn" @click="cleanUnusedMedia" v-if="!isPicker">
          <DeleteOutlined /> 清理未使用
        </button>
        <label class="upload-btn">
          <CloudUploadOutlined />
          上传图片
          <input type="file" multiple accept="image/*" @change="handleUpload" hidden />
        </label>
      </div>
    </div>

    <div class="media-content">
      <div class="category-sidebar">
        <div 
          v-for="cat in categories" 
          :key="cat.key"
          class="cat-item"
          :class="{ active: currentCategory === cat.key }"
          @click="currentCategory = cat.key"
        >
          <component :is="cat.icon" />
          <span>{{ cat.label }}</span>
        </div>
      </div>

      <div class="media-main">
        <div v-if="loading && mediaFiles.length === 0" class="loading-state">
          <LoadingOutlined />
          加载中...
        </div>
        <div v-else-if="filteredMedia.length === 0" class="empty-state">
          没有找到匹配的媒体文件
        </div>
        <div v-else class="media-grid">
          <div v-for="(file, index) in filteredMedia" :key="file.name" class="media-card">
            <div class="media-preview">
              <img :src="normalizeUrl(file.url)" :alt="file.name" loading="lazy" />
              <div class="media-overlay">
                <button class="action-icon-btn" @click="copyUrl(file.url, index)" :title="isPicker ? '选择图片' : (copiedIndex === index ? '已复制' : '复制链接')">
                  <CheckOutlined v-if="copiedIndex === index" />
                  <CopyOutlined v-else-if="!isPicker" />
                  <CloudUploadOutlined v-else />
                </button>
                <button v-if="!isPicker" class="action-icon-btn danger" :class="{ disabled: file.source === 'assets' }" @click="deleteFile(file)" :title="file.source === 'assets' ? '代码资源不可删除' : '删除'">
                  <DeleteOutlined />
                </button>
              </div>
              <div class="usage-badge" v-if="file.usage?.length">
                {{ file.usage.length }} 处使用
              </div>
            </div>
            <div class="media-info">
              <div class="file-name" :title="file.name">{{ truncate(file.name, 15) }}</div>
              <div class="usage-list" v-if="file.usage?.length">
                <span v-for="u in file.usage.slice(0, 2)" :key="u.name" class="usage-tag">
                  {{ u.name }}
                </span>
                <span v-if="file.usage.length > 2" class="usage-more">+{{ file.usage.length - 2 }}</span>
              </div>
              <div class="usage-list" v-else>
                <span class="usage-tag unused">未使用</span>
              </div>
              <div class="file-meta">
                <span>{{ formatSize(file.size) }}</span>
                <span>{{ formatDate(file.mtime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.media-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.media-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgb(var(--color-bg-secondary));
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  width: 300px;

  input {
    border: none;
    background: transparent;
    outline: none;
    color: rgb(var(--color-text-primary));
    width: 100%;
    font-size: 0.9rem;
  }
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.clean-btn {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #ef4444;
    color: white;
  }
}

.upload-btn {
  background: rgb(var(--color-accent));
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgb(var(--color-accent) / 0.3);
  }
}

.media-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.category-sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  color: rgb(var(--color-text-secondary));
  transition: all 0.2s;

  &:hover {
    background: rgb(var(--color-bg-secondary));
  }

  &.active {
    background: rgb(var(--color-accent) / 0.1);
    color: rgb(var(--color-accent));
    font-weight: 600;
  }
}

.media-main {
  overflow-y: auto;
  padding-right: 8px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.media-card {
  background: rgb(var(--color-bg-primary));
  border-radius: 12px;
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);

    .media-overlay {
      opacity: 1;
    }
    
    .media-info {
      transform: translateY(0);
      opacity: 1;
    }
  }
}

.media-preview {
  position: relative;
  aspect-ratio: 1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.usage-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgb(var(--color-accent));
  color: white;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 2;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 3;
}

.action-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: white;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &.danger {
    color: #ef4444;
    &:hover:not(.disabled) {
      background: #ef4444;
      color: white;
    }
    &.disabled {
      opacity: 0.3;
      cursor: not-allowed;
      filter: grayscale(1);
    }
  }
}

.media-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  color: white;
  transform: translateY(5px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 4;
}

.file-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.usage-tag {
  font-size: 0.65rem;
  padding: 0 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: white;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: none; // 默认隐藏详细信息以保持简洁
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: rgb(var(--color-text-secondary));
  gap: 12px;
  font-size: 1rem;
}
</style>
