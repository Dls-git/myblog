
<script setup>
import { ref, computed } from 'vue'
import { 
  TagOutlined, 
  FolderOpenOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  UndoOutlined,
  PlusOutlined
} from '@ant-design/icons-vue'
import { apiFetch } from '../utils'

const props = defineProps({
  posts: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] }
})

const emit = defineEmits(['refresh', 'openHistory', 'beforeTaxonomyChange'])

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

// 获取分类下的文章列表
const categoryArticles = computed(() => {
  const result = {}
  props.posts.forEach(p => {
    const cat = p.category || '未分类'
    if (!result[cat]) {
      result[cat] = []
    }
    result[cat].push(p)
  })
  return result
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

// 获取标签下的文章列表
const tagArticles = computed(() => {
  const result = {}
  props.posts.forEach(p => {
    if (Array.isArray(p.tags)) {
      p.tags.forEach(t => {
        if (!result[t]) {
          result[t] = []
        }
        result[t].push(p)
      })
    }
  })
  return result
})

// 编辑状态
const editingItem = ref(null) // { type: 'tag'|'category', oldName: '', newName: '' }

// 新增分类/标签状态
const addingItem = ref(null) // { type: 'tag'|'category', name: '' }

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

  // 触发历史记录保存事件
  emit('beforeTaxonomyChange', {
    operation: `重命名${editingItem.value.type === 'category' ? '分类' : '标签'}: ${editingItem.value.oldName} → ${editingItem.value.newName}`
  })

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

// 开始新增分类/标签
const startAdd = (type) => {
  addingItem.value = { type, name: '' }
}

// 取消新增
const cancelAdd = () => {
  addingItem.value = null
}

// 保存新增的分类/标签
const saveAdd = async () => {
  if (!addingItem.value || !addingItem.value.name.trim()) {
    addingItem.value = null
    return
  }

  // 触发历史记录保存事件
  emit('beforeTaxonomyChange', {
    operation: `新增${addingItem.value.type === 'category' ? '分类' : '标签'}: ${addingItem.value.name}`
  })

  loading.value = true
  try {
    // 创建一个临时文章，用于添加新分类/标签
    const tempArticle = {
      title: `临时文章-${Date.now()}`,
      description: '这是一个用于添加新分类/标签的临时文章，将被自动删除',
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      category: addingItem.value.type === 'category' ? addingItem.value.name : '未分类',
      tags: addingItem.value.type === 'tag' ? [addingItem.value.name] : [],
      content: '临时文章内容'
    }

    // 保存临时文章
    const res = await apiFetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(tempArticle)
    })

    if (res.ok) {
      // 获取保存的文章信息
      const result = await res.json()
      // 手动刷新文章列表，确保能获取到新添加的文章和标签
      await new Promise(resolve => setTimeout(resolve, 100))
      emit('refresh')
      addingItem.value = null
    } else {
      alert('新增失败')
    }
  } catch (err) {
    alert('网络错误: ' + err.message)
  } finally {
    loading.value = false
  }
}

// 添加文章到分类/标签的模态框状态
const showAddModal = ref(false)
const addModalType = ref(null) // 'category'|'tag'
const addModalTarget = ref(null) // 分类或标签名称
const availablePosts = ref([]) // 不在该分类/标签下的文章
const selectedPosts = ref([]) // 要添加到该分类/标签下的文章

// 显示添加文章模态框
const showAddArticleModal = (type, target) => {
  addModalType.value = type
  addModalTarget.value = target
  
  // 过滤出不在该分类/标签下的文章
  if (type === 'category') {
    availablePosts.value = props.posts.filter(post => post.category !== target)
  } else {
    availablePosts.value = props.posts.filter(post => !post.tags || !Array.isArray(post.tags) || !post.tags.includes(target))
  }
  
  selectedPosts.value = []
  showAddModal.value = true
}

// 关闭添加文章模态框
const closeAddArticleModal = () => {
  showAddModal.value = false
  addModalType.value = null
  addModalTarget.value = null
  availablePosts.value = []
  selectedPosts.value = []
}

// 切换文章选择状态
const togglePostSelection = (post) => {
  const index = selectedPosts.value.findIndex(p => p.slug === post.slug)
  if (index === -1) {
    selectedPosts.value.push(post)
  } else {
    selectedPosts.value.splice(index, 1)
  }
}

// 添加文章到分类/标签
const addArticlesToTaxonomy = async () => {
  if (selectedPosts.value.length === 0) {
    closeAddArticleModal()
    return
  }

  // 触发历史记录保存事件
  emit('beforeTaxonomyChange', {
    operation: `添加${selectedPosts.value.length}篇文章到${addModalType.value === 'category' ? '分类' : '标签'}: ${addModalTarget.value}`
  })

  loading.value = true
  try {
    // 遍历选中的文章，添加到分类/标签
    for (const post of selectedPosts.value) {
      // 获取文章当前数据
      const res = await apiFetch(`/api/post?slug=${encodeURIComponent(post.slug)}`)
      const result = await res.json()
      
      if (result.success) {
        const updatedPost = {
          ...result.data,
          tags: Array.isArray(result.data.tags) ? [...result.data.tags] : []
        }
        
        // 更新分类或标签
        if (addModalType.value === 'category') {
          updatedPost.category = addModalTarget.value
        } else {
          if (!updatedPost.tags.includes(addModalTarget.value)) {
            updatedPost.tags.push(addModalTarget.value)
          }
        }
        
        // 保存更新后的文章
        await apiFetch(`/api/post?slug=${encodeURIComponent(post.slug)}`, {
          method: 'PUT',
          body: JSON.stringify({
            data: updatedPost,
            content: result.content
          })
        })
      }
    }
    
    emit('refresh')
    closeAddArticleModal()
  } catch (err) {
    alert('网络错误')
  } finally {
    loading.value = false
  }
}

// 从分类中移除文章
const removeArticleFromCategory = async (article, categoryName) => {
  if (!confirm(`确定要将文章 "${article.title}" 从分类 "${categoryName}" 中移除吗？`)) {
    return
  }

  // 触发历史记录保存事件
  emit('beforeTaxonomyChange', {
    operation: `将文章 "${article.title}" 从分类 "${categoryName}" 中移除`
  })

  loading.value = true
  try {
    // 获取文章当前数据
    const res = await apiFetch(`/api/post?slug=${encodeURIComponent(article.slug)}`)
    const result = await res.json()
    
    if (result.success) {
      // 更新文章分类为"未分类"
      await apiFetch(`/api/post?slug=${encodeURIComponent(article.slug)}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: {
            ...result.data,
            category: '未分类'
          },
          content: result.content
        })
      })
      
      emit('refresh')
    }
  } catch (err) {
    alert('网络错误')
  } finally {
    loading.value = false
  }
}

// 从标签中移除文章
const removeArticleFromTag = async (article, tagName) => {
  if (!confirm(`确定要将文章 "${article.title}" 从标签 "${tagName}" 中移除吗？`)) {
    return
  }

  // 触发历史记录保存事件
  emit('beforeTaxonomyChange', {
    operation: `将文章 "${article.title}" 从标签 "${tagName}" 中移除`
  })

  loading.value = true
  try {
    // 获取文章当前数据
    const res = await apiFetch(`/api/post?slug=${encodeURIComponent(article.slug)}`)
    const result = await res.json()
    
    if (result.success) {
      // 更新文章标签，移除指定标签
      const updatedTags = Array.isArray(result.data.tags) 
        ? result.data.tags.filter(t => t !== tagName) 
        : []
      
      await apiFetch(`/api/post?slug=${encodeURIComponent(article.slug)}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: {
            ...result.data,
            tags: updatedTags
          },
          content: result.content
        })
      })
      
      emit('refresh')
    }
  } catch (err) {
    alert('网络错误')
  } finally {
    loading.value = false
  }
}

const deleteTaxonomy = async (type, name) => {
  // 获取该分类/标签下的文章
  const articles = type === 'category' 
    ? categoryArticles.value[name] || []
    : tagArticles.value[name] || [];
  
  let confirmMsg = `确定要删除 ${type === 'tag' ? '标签' : '分类'} "${name}" 吗？`;
  
  if (articles.length > 0) {
    confirmMsg += `\n\n该${type === 'tag' ? '标签' : '分类'}下有 ${articles.length} 篇文章：`;
    confirmMsg += `\n${articles.slice(0, 3).map(a => `- ${a.title}`).join('\n')}`;
    if (articles.length > 3) {
      confirmMsg += `\n... 还有 ${articles.length - 3} 篇文章`;
    }
    confirmMsg += `\n\n删除后，这些文章将${type === 'tag' ? '被移除该标签' : '被删除'}！`;
  }
  
  if (!confirm(confirmMsg)) return

  // 触发历史记录保存事件
  emit('beforeTaxonomyChange', {
    operation: `删除${type === 'category' ? '分类' : '标签'}: ${name}`
  })

  loading.value = true
  try {
    if (type === 'category') {
      // 删除分类包括文章
      for (const article of articles) {
        await apiFetch(`/api/post?slug=${encodeURIComponent(article.slug)}`, {
          method: 'DELETE'
        });
      }
    }
    
    // 删除分类/标签
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
      <!-- 操作按钮组 -->
      <div style="display: flex; gap: 12px; align-items: center">
        <button 
          class="action-btn" 
          @click="startAdd(activeTab)" 
          title="新增"
        >
          <PlusOutlined />
          <span>新增</span>
        </button>
      </div>
    </div>

    <div class="taxonomy-content">
      <div v-if="loading" class="loading-overlay">
        <LoadingOutlined /> 正在更新文章数据...
      </div>

      <div class="taxonomy-grid">
        <!-- 新增分类/标签卡片 -->
        <div v-if="addingItem" class="tax-card add-card">
          <div class="tax-info">
            <input 
              v-model="addingItem.name" 
              class="edit-input" 
              placeholder="输入新的{{ addingItem.type === 'category' ? '分类' : '标签' }}名称" 
              autofocus 
              @keyup.enter="saveAdd" 
            />
            <div class="edit-actions">
              <button class="icon-btn success" @click="saveAdd"><CheckOutlined /></button>
              <button class="icon-btn" @click="cancelAdd"><CloseOutlined /></button>
            </div>
          </div>
        </div>

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
              
              <!-- Hover 显示文章列表 -->
              <div class="articles-preview">
                <div class="preview-header">
                  <span>包含的文章：</span>
                  <button class="icon-btn small" @click="showAddArticleModal('category', cat.name)" title="添加更多文章">
                    <PlusOutlined /> 添加
                  </button>
                </div>
                <ul class="article-list">
                  <li v-for="article in categoryArticles[cat.name]" :key="article.slug" class="article-item">
                    <a :href="'#/post/' + article.slug" target="_blank">{{ article.title }}</a>
                    <button class="icon-btn small danger" @click="removeArticleFromCategory(article, cat.name)" title="从分类中移除">
                      <CloseOutlined />
                    </button>
                  </li>
                  <li v-if="!categoryArticles[cat.name] || categoryArticles[cat.name].length === 0" class="no-articles">
                    暂无文章
                  </li>
                </ul>
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
              
              <!-- Hover 显示文章列表 -->
              <div class="articles-preview">
                <div class="preview-header">
                  <span>包含的文章：</span>
                  <button class="icon-btn small" @click="showAddArticleModal('tag', tag.name)" title="添加更多文章">
                    <PlusOutlined /> 添加
                  </button>
                </div>
                <ul class="article-list">
                  <li v-for="article in tagArticles[tag.name]" :key="article.slug" class="article-item">
                    <a :href="'#/post/' + article.slug" target="_blank">{{ article.title }}</a>
                    <button class="icon-btn small danger" @click="removeArticleFromTag(article, tag.name)" title="从标签中移除">
                      <CloseOutlined />
                    </button>
                  </li>
                  <li v-if="!tagArticles[tag.name] || tagArticles[tag.name].length === 0" class="no-articles">
                    暂无文章
                  </li>
                </ul>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
    
    <!-- 添加文章到分类/标签的模态框 -->
    <div class="modal-mask" v-if="showAddModal" @click.self="closeAddArticleModal">
      <div class="modal-panel">
        <div class="modal-header">
          <h3>
            <PlusOutlined /> 添加文章到{{ addModalType === 'category' ? '分类' : '标签' }}
          </h3>
          <button class="icon-btn" @click="closeAddArticleModal"><CloseOutlined /></button>
        </div>
        
        <div class="modal-body">
          <div class="modal-info">
            目标{{ addModalType === 'category' ? '分类' : '标签' }}：<strong>{{ addModalTarget }}</strong>
          </div>
          
          <div class="modal-subtitle">
            可选文章列表（共{{ availablePosts.length }}篇）：
          </div>
          
          <div class="post-select-list">
            <div 
              v-for="post in availablePosts" 
              :key="post.slug" 
              class="post-select-item"
              :class="{ selected: selectedPosts.some(p => p.slug === post.slug) }"
              @click="togglePostSelection(post)"
            >
              <div class="post-select-info">
                <div class="post-select-title">{{ post.title }}</div>
                <div class="post-select-meta">
                  <span class="post-select-date">{{ post.date }}</span>
                  <span class="post-select-category">{{ post.category || '未分类' }}</span>
                </div>
              </div>
              <div class="post-select-checkbox">
                <CheckOutlined v-if="selectedPosts.some(p => p.slug === post.slug)" />
              </div>
            </div>
            
            <div v-if="availablePosts.length === 0" class="empty-state">
              没有可添加的文章
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAddArticleModal">取消</button>
          <button 
            class="action-btn" 
            @click="addArticlesToTaxonomy"
            :disabled="selectedPosts.length === 0"
          >
            添加 {{ selectedPosts.length }} 篇文章
          </button>
        </div>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 历史记录按钮样式 */
.undo-btn {
  background: transparent;
  color: rgb(var(--color-text-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.8);
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-size: 0.85rem;
  opacity: 0.8;

  &:hover {
    background: rgb(var(--color-bg-secondary));
    opacity: 1;
    border-color: rgb(var(--color-accent) / 0.5);
    color: rgb(var(--color-accent));
  }
}

.tab-group {
  display: flex;
  gap: 12px;
  background: rgb(var(--color-bg-secondary) / 0.6);
  padding: 6px;
  border-radius: 16px;
  width: fit-content;
  backdrop-filter: blur(4px);
}

.tab-btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(var(--color-text-secondary));
  transition: all 0.3s ease;

  &:hover {
    color: rgb(var(--color-text-primary));
  }

  &.active {
    background: rgb(var(--color-bg-primary));
    color: rgb(var(--color-accent));
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.tax-card {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  border-radius: 18px;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  z-index: 1;

  &:hover {
    border-color: rgb(var(--color-accent) / 0.4);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
    z-index: 200;
    
    .articles-preview {
      opacity: 1;
      visibility: visible;
      transform: translateY(8px);
    }
  }
}

/* 文章预览样式 */
.articles-preview {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transform: translateY(0);
  transition: all 0.3s ease;
  max-height: 240px;
  overflow-y: auto;
  backdrop-filter: blur(4px);
}

.preview-header {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: rgb(var(--color-text-primary));
}

.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.article-item {
  padding: 6px 0;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.3);
  
  &:last-child {
    border-bottom: none;
  }
}

.article-item a {
  text-decoration: none;
  color: rgb(var(--color-text-primary));
  font-size: 0.85rem;
  transition: color 0.2s;
  
  &:hover {
    color: rgb(var(--color-accent));
  }
}

.no-articles {
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
  padding: 6px 0;
  text-align: center;
}

/* 自定义滚动条 */
.articles-preview::-webkit-scrollbar {
  width: 6px;
}

.articles-preview::-webkit-scrollbar-track {
  background: rgb(var(--color-bg-secondary) / 0.5);
  border-radius: 3px;
}

.articles-preview::-webkit-scrollbar-thumb {
  background: rgb(var(--color-border-primary));
  border-radius: 3px;
  
  &:hover {
    background: rgb(var(--color-accent) / 0.5);
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
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-border-primary) / 0.6);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--color-text-secondary));
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgb(var(--color-bg-secondary) / 0.8);
    color: rgb(var(--color-text-primary));
    border-color: rgb(var(--color-border-primary) / 0.8);
    transform: translateY(-1px);
  }

  &.danger:hover {
    background: #fef2f2;
    color: #ef4444;
    border-color: #fecaca;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
  }

  &.success:hover {
    background: #ecfdf5;
    color: #10b981;
    border-color: #a7f3d0;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
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

/* 新增分类/标签卡片样式 */
.add-card {
  border-style: dashed;
  background: rgb(var(--color-bg-secondary) / 0.1);
  
  &:hover {
    border-color: rgb(var(--color-accent) / 0.5);
    background: rgb(var(--color-bg-secondary) / 0.2);
  }
}

/* 小图标按钮样式 */
.icon-btn.small {
  width: 30px;
  height: 30px;
  font-size: 0.85rem;
  border-radius: 8px;
}

/* 模态框样式 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 20px;
}

.modal-panel {
  width: 680px;
  max-width: 100%;
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px;
  background: rgb(var(--color-bg-secondary));
  border-top: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 模态框内容样式 */
.modal-info {
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: rgb(var(--color-text-primary));
}

.modal-subtitle {
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  color: rgb(var(--color-text-secondary));
}

/* 文章选择列表样式 */
.post-select-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  border-radius: 8px;
  padding: 8px;
}

.post-select-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--color-bg-secondary) / 0.2);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgb(var(--color-bg-secondary) / 0.4);
  }
  
  &.selected {
    background: rgb(var(--color-accent) / 0.1);
    border-color: rgb(var(--color-accent) / 0.3);
  }
}

.post-select-info {
  flex: 1;
  min-width: 0;
}

.post-select-title {
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-select-meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: rgb(var(--color-text-secondary));
}

.post-select-date {
  color: rgb(var(--color-text-secondary));
}

.post-select-category {
  color: rgb(var(--color-accent));
}

.post-select-checkbox {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  border-radius: 6px;
  color: rgb(var(--color-accent));
  font-size: 1.1rem;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: rgb(var(--color-text-secondary));
  font-size: 0.9rem;
}

/* 按钮样式 */
.btn-secondary {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgb(var(--color-border-primary) / 0.8);
  background: rgb(var(--color-bg-secondary) / 0.6);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  color: rgb(var(--color-text-primary));
  backdrop-filter: blur(4px);
  
  &:hover {
    background: rgb(var(--color-bg-secondary) / 0.9);
    border-color: rgb(var(--color-border-primary));
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.action-btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: rgb(var(--color-accent));
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgb(var(--color-accent) / 0.9);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

/* 预览头部样式 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* 文章项样式 */
.article-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.3);
  
  &:last-child {
    border-bottom: none;
  }
  
  a {
    flex: 1;
    margin-right: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
