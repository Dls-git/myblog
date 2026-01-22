
<script setup>
import { ref, computed } from 'vue'
import { 
  TagOutlined, 
  FolderOpenOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined
} from '@ant-design/icons-vue'
import { apiFetch } from '../utils'

const props = defineProps({
  posts: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] }
})

const emit = defineEmits(['refresh'])

const loading = ref(false)
const activeTab = ref('categories') // 'categories', 'tags'

// 提取标签统计
const tags = computed(() => {
  const counts = {}
  props.posts.forEach(p => {
    if (Array.isArray(p.tags)) {
      p.tags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1
      })
    }
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
})

// 提取分类统计
const categoriesWithCount = computed(() => {
  const counts = {}
  props.posts.forEach(p => {
    const cat = p.category || '未分类'
    counts[cat] = (counts[cat] || 0) + 1
  })
  return props.categories.map(name => ({
    name,
    count: counts[name] || 0
  })).sort((a, b) => b.count - a.count)
})

// 编辑状态
const editingItem = ref(null) // { type: 'tag'|'category', oldName: '', newName: '' }

const startEdit = (type, name) => {
  editingItem.value = { type, oldName: name, newName: name }
}

const cancelEdit = () => {
  editingItem.value = null
}

const saveEdit = async () => {
  if (!editingItem.value || editingItem.value.oldName === editingItem.value.newName) {
    editingItem.value = null
    return
  }

  loading.value = true
  try {
    const res = await apiFetch('/api/taxonomy/rename', {
      method: 'POST',
      body: JSON.stringify(editingItem.value)
    })
    if (res.ok) {
      emit('refresh')
      editingItem.value = null
    } else {
      alert('重命名失败')
    }
  } catch (err) {
    alert('网络错误')
  } finally {
    loading.value = false
  }
}

const deleteTaxonomy = async (type, name) => {
  if (!confirm(`确定要删除 ${type === 'tag' ? '标签' : '分类'} "${name}" 吗？这会将相关文章中的该项移除。`)) return

  loading.value = true
  try {
    const res = await apiFetch('/api/taxonomy/delete', {
      method: 'POST',
      body: JSON.stringify({ type, name })
    })
    if (res.ok) {
      emit('refresh')
    } else {
      alert('删除失败')
    }
  } catch (err) {
    alert('网络错误')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="taxonomy-manager">
    <div class="taxonomy-header">
      <div class="tab-group">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'categories' }"
          @click="activeTab = 'categories'"
        >
          <FolderOpenOutlined /> 分类管理
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'tags' }"
          @click="activeTab = 'tags'"
        >
          <TagOutlined /> 标签管理
        </button>
      </div>
    </div>

    <div class="taxonomy-content">
      <div v-if="loading" class="loading-overlay">
        <LoadingOutlined /> 正在更新文章数据...
      </div>

      <div class="taxonomy-grid">
        <template v-if="activeTab === 'categories'">
          <div v-for="cat in categoriesWithCount" :key="cat.name" class="tax-card">
            <div class="tax-info" v-if="editingItem?.type === 'category' && editingItem.oldName === cat.name">
              <input v-model="editingItem.newName" class="edit-input" autofocus @keyup.enter="saveEdit" />
              <div class="edit-actions">
                <button class="icon-btn success" @click="saveEdit"><CheckOutlined /></button>
                <button class="icon-btn" @click="cancelEdit"><CloseOutlined /></button>
              </div>
            </div>
            <template v-else>
              <div class="tax-main">
                <span class="tax-name">{{ cat.name }}</span>
                <span class="tax-count">{{ cat.count }} 篇文章</span>
              </div>
              <div class="tax-actions">
                <button class="icon-btn" @click="startEdit('category', cat.name)"><EditOutlined /></button>
                <button class="icon-btn danger" @click="deleteTaxonomy('category', cat.name)"><DeleteOutlined /></button>
              </div>
            </template>
          </div>
        </template>

        <template v-if="activeTab === 'tags'">
          <div v-for="tag in tags" :key="tag.name" class="tax-card">
            <div class="tax-info" v-if="editingItem?.type === 'tag' && editingItem.oldName === tag.name">
              <input v-model="editingItem.newName" class="edit-input" autofocus @keyup.enter="saveEdit" />
              <div class="edit-actions">
                <button class="icon-btn success" @click="saveEdit"><CheckOutlined /></button>
                <button class="icon-btn" @click="cancelEdit"><CloseOutlined /></button>
              </div>
            </div>
            <template v-else>
              <div class="tax-main">
                <span class="tax-name"># {{ tag.name }}</span>
                <span class="tax-count">{{ tag.count }} 篇文章</span>
              </div>
              <div class="tax-actions">
                <button class="icon-btn" @click="startEdit('tag', tag.name)"><EditOutlined /></button>
                <button class="icon-btn danger" @click="deleteTaxonomy('tag', tag.name)"><DeleteOutlined /></button>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.taxonomy-manager {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.taxonomy-header {
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.5);
  padding-bottom: 16px;
}

.tab-group {
  display: flex;
  gap: 8px;
  background: rgb(var(--color-bg-secondary) / 0.5);
  padding: 4px;
  border-radius: 12px;
  width: fit-content;
}

.tab-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--color-text-secondary));
  transition: all 0.2s;

  &.active {
    background: rgb(var(--color-bg-primary));
    color: rgb(var(--color-accent));
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
}

.taxonomy-content {
  position: relative;
  min-height: 200px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  gap: 12px;
  font-weight: 600;
  color: rgb(var(--color-accent));
}

.taxonomy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tax-card {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: rgb(var(--color-accent) / 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }
}

.tax-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tax-name {
  font-weight: 700;
  font-size: 1rem;
}

.tax-count {
  font-size: 0.8rem;
  color: rgb(var(--color-text-secondary));
}

.tax-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--color-text-secondary));
  transition: all 0.2s;

  &:hover {
    background: rgb(var(--color-bg-secondary));
    color: rgb(var(--color-text-primary));
  }

  &.danger:hover {
    background: #fef2f2;
    color: #ef4444;
    border-color: #fecaca;
  }

  &.success:hover {
    background: #ecfdf5;
    color: #10b981;
    border-color: #a7f3d0;
  }
}

.tax-info {
  display: flex;
  gap: 12px;
  flex: 1;
  align-items: center;
}

.edit-input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid rgb(var(--color-accent));
  border-radius: 8px;
  outline: none;
  font-size: 0.9rem;
}

.edit-actions {
  display: flex;
  gap: 4px;
}
</style>
