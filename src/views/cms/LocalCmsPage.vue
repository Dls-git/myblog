
<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch, shallowRef, toRaw } from 'vue'
import { useRouter } from 'vue-router'
// 移除未使用的图标导入

// Import components
import CmsSidebar from './components/CmsSidebar.vue'
import CmsHeader from './components/CmsHeader.vue'
import ArticleList from './components/ArticleList.vue'
import ArticleEditor from './components/ArticleEditor.vue'
import FriendManager from './components/FriendManager.vue'
import PhotoManager from './components/PhotoManager.vue'
import QuoteManager from './components/QuoteManager.vue'
import ThoughtManager from './components/ThoughtManager.vue'
import AboutManager from './components/AboutManager.vue'
import MediaManager from './components/MediaManager.vue'
import Dashboard from './components/Dashboard.vue'
import TaxonomyManager from './components/TaxonomyManager.vue'
import KnowledgeGraph from './components/KnowledgeGraph.vue'
import SystemManager from './components/SystemManager.vue'
import FriendCard from '../friends/friend-card.vue'

// Import Utils & Constants
import { 
  apiFetch, 
  normalizeUrl, 
  parseFrontmatter
} from './utils'
import { 
  SCHEMAS, 
  VIEW_TITLES, 
  aboutTypeOptions 
} from './constants'

const router = useRouter()

// Git Publish Logic
const showGitModal = ref(false)
const gitCommitMessage = ref('')
const gitPublishing = ref(false)

const openGitModal = () => {
  gitCommitMessage.value = `Site update: ${new Date().toLocaleString()}`
  showGitModal.value = true
}

const handleGitPublish = async () => {
  if (!gitCommitMessage.value.trim()) {
    return showToast('请输入 Commit 内容', 'error')
  }

  gitPublishing.value = true
  try {
    const res = await apiFetch('/api/git/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: gitCommitMessage.value })
    })

    const result = await res.json()
    if (result.success) {
      showToast('一键发布成功！')
      showGitModal.value = false
    } else {
      showToast(`发布失败: ${result.message}`, 'error')
    }
  } catch (err) {
    showToast(`网络错误: ${err.message}`, 'error')
  } finally {
    gitPublishing.value = false
  }
}

// Global State
const currentView = ref('dashboard')
const loading = ref(false)
const mediaFiles = ref([])
const toast = reactive({ show: false, msg: '', type: 'success' })

const loadMedia = async () => {
  try {
    const res = await apiFetch('/api/media')
    if (res.ok) mediaFiles.value = await res.json()
  } catch (err) {
    console.error('Failed to load media:', err)
  }
}

const handleNavigate = (view, slug = null) => {
  currentView.value = view
  if (view === 'article' && slug) {
    openPost(slug)
  } else if (view === 'article' && !slug) {
    resetArticleForm()
  }
}

const showToast = (msg, type = 'success') => {
  toast.msg = msg
  toast.type = type
  toast.show = true
  setTimeout(() => (toast.show = false), 3000)
}

const pageTitle = computed(() => {
  if (currentView.value === 'article' && selectedSlug.value) {
    return `编辑文章: ${selectedSlug.value}`
  }
  return VIEW_TITLES[currentView.value] || 'Admin'
})

const isListView = computed(() => currentView.value.endsWith('.js') && currentView.value !== 'aboutData.js')
const currentFields = computed(() => SCHEMAS[currentView.value] || [])

// Article Logic
const articleForm = ref({
  title: '',
  description: '',
  cover: '',
  date: new Date().toISOString().split('T')[0],
  status: 'published',
  category: '',
  tags: [],
  content: ''
})

const selectedSlug = ref('')
const posts = shallowRef([]) // Use shallowRef for performance
const query = ref('')

const filteredPosts = computed(() => {
  const q = String(query.value || '').trim().toLowerCase()
  if (!q) return posts.value
  return posts.value.filter((p) => 
    String(p.title || '').toLowerCase().includes(q) || 
    String(p.slug || '').toLowerCase().includes(q) ||
    String(p.content || '').toLowerCase().includes(q) // 支持全文搜索
  )
})

const POST_ORDER_LS_KEY = 'cms_post_order_v1'
const HISTORY_STACKS_LS_KEY = 'cms_history_stacks_v1'

const readLocalPostOrder = () => {
  try {
    const raw = localStorage.getItem(POST_ORDER_LS_KEY)
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map((s) => String(s || '').trim()).filter(Boolean)
  } catch {
    return []
  }
}

const writeLocalPostOrder = (order) => {
  try {
    localStorage.setItem(POST_ORDER_LS_KEY, JSON.stringify(order))
    return true
  } catch {
    return false
  }
}

const clearLocalPostOrder = () => {
  try {
    localStorage.removeItem(POST_ORDER_LS_KEY)
  } catch {
  }
}

const applyPostOrder = (list, order) => {
  const arr = Array.isArray(list) ? [...list] : []
  const ord = Array.isArray(order) ? order : []
  if (!ord.length) return arr

  const orderIndex = new Map()
  ord.forEach((slug, idx) => {
    if (!orderIndex.has(slug)) orderIndex.set(slug, idx)
  })

  return arr.sort((a, b) => {
    const as = String(a?.slug || '')
    const bs = String(b?.slug || '')
    const ai = orderIndex.has(as) ? orderIndex.get(as) : null
    const bi = orderIndex.has(bs) ? orderIndex.get(bs) : null
    if (ai != null && bi != null) return ai - bi
    if (ai != null) return -1
    if (bi != null) return 1
    return 0
  })
}

const loadPosts = async (operation = '加载文章列表') => {
  try {
    const res = await apiFetch('/api/posts')
    if (!res.ok) throw new Error('load failed')
    const data = await res.json()
    const loaded = Array.isArray(data) ? data.map(p => ({ ...p, _cms_id: p.slug })) : []
    const localOrder = readLocalPostOrder()
    const newPosts = applyPostOrder(loaded, localOrder)
    
    pushHistory(newPosts, operation, 'posts')
    posts.value = newPosts
  } catch {
    posts.value = []
    showToast('文章列表加载失败', 'error')
  }
}

const savePostOrderToServer = async () => {
  const order = (posts.value || []).map((p) => String(p?.slug || '').trim()).filter(Boolean)
  try {
    const res = await apiFetch('/api/data?file=postOrder.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      if (res.status === 400 && String(text || '').includes('Invalid file')) {
        const ok = writeLocalPostOrder(order)
        if (ok) showToast('CMS 服务端未更新，已临时保存到浏览器', 'info')
        else showToast('CMS 服务端未更新，且浏览器存储失败', 'error')
        return ok
      }
      throw new Error(text || 'save failed')
    }
    const json = await res.json().catch(() => null)
    if (json?.success === false) throw new Error(json?.message || 'save failed')
    clearLocalPostOrder()
    return true
  } catch (e) {
    console.error('保存文章排序失败:', e)
    // 排序保存失败不影响文章内容的回滚
    return false
  }
}

const handleUpdatePosts = async (nextList) => {
  if (String(query.value || '').trim()) {
    showToast('请先清空搜索再进行排序', 'info')
    return
  }
  posts.value = (Array.isArray(nextList) ? nextList : []).map((p) => ({ ...p, _cms_id: p.slug }))
  pushHistory(posts.value, '重新排序文章', 'posts')
  const ok = await savePostOrderToServer()
  if (ok) showToast('文章排序已保存')
}

const deletePost = (slug) => handleBatchDeletePosts([slug])

const handleBatchDeletePosts = async (slugs) => {
  if (!slugs || slugs.length === 0) return
  if (!window.confirm(`确定要删除选中的 ${slugs.length} 篇文章吗？此操作不可撤销。`)) return
  
  loading.value = true
  try {
    // 串行或并行删除
    const results = await Promise.all(slugs.map(async (slug) => {
      try {
        const res = await apiFetch(`/api/post?slug=${encodeURIComponent(slug)}`, {
          method: 'DELETE'
        })
        return res.ok
      } catch {
        return false
      }
    }))
    
    const successCount = results.filter(Boolean).length
    if (successCount === slugs.length) {
      showToast(`成功删除 ${successCount} 篇文章`)
    } else {
      showToast(`部分文章删除失败 (成功: ${successCount}, 失败: ${slugs.length - successCount})`, 'error')
    }
    await loadPosts(`删除 ${successCount} 篇文章`)
  } catch (e) {
    showToast('批量删除失败: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

const resetArticleForm = () => {
  selectedSlug.value = ''
  articleForm.value = {
    title: '',
    description: '',
    cover: '',
    date: new Date().toISOString().split('T')[0],
    status: 'published',
    category: '',
    tags: [],
    content: ''
  }
}

const openPost = async (slug) => {
  const s = String(slug || '')
  if (!s) return
  loading.value = true
  try {
    // 先检查本地posts列表中是否有该文章
    const localPost = posts.value.find(p => p.slug === s)
    if (localPost) {
      // 如果本地有数据，直接使用，无需API请求
      selectedSlug.value = s
      articleForm.value = {
        title: String(localPost.title ?? ''),
        description: String(localPost.description ?? ''),
        cover: String(localPost.cover ?? ''),
        date: String(localPost.date ?? '').slice(0, 10),
        status: String(localPost.status ?? 'published'),
        category: String(localPost.category ?? ''),
        tags: Array.isArray(localPost.tags) ? localPost.tags : [],
        content: String(localPost.content ?? '')
      }
      currentView.value = 'article'
      loading.value = false
      return
    }
    
    // 本地没有数据时，才从API请求
    const res = await apiFetch(`/api/post?slug=${encodeURIComponent(s)}`)
    const json = await res.json()
    if (!res.ok || !json?.success) throw new Error(json?.message || 'load failed')
    const data = json.data || {}
    selectedSlug.value = s
    articleForm.value = {
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      cover: String(data.cover ?? ''),
      date: String(data.date ?? '').slice(0, 10),
      status: String(data.status ?? 'published'),
      category: String(data.category ?? ''),
      tags: Array.isArray(data.tags) ? data.tags : [],
      content: String(json.content ?? '')
    }
    currentView.value = 'article'
  } catch {
    showToast('文章读取失败', 'error')
  } finally {
    loading.value = false
  }
}

// Data Modules Logic
const listData = shallowRef([]) // Use shallowRef for performance
const showModal = ref(false)
const isEdit = ref(false)
const editingIndex = ref(-1)
const editingItem = ref({})
const jsonContent = ref('')

// History/Undo Logic
const historyStacks = reactive({
  listData: [],
  posts: []
})
const maxHistory = 30
const showHistoryDrawer = ref(false)
const compareMode = ref(false)
const compareVersions = ref({ left: null, right: null })

const activeHistoryStack = computed(() => {
  return currentView.value === 'article_list' || currentView.value === 'taxonomy_manager' ? historyStacks.posts : historyStacks.listData
})

const canUndo = computed(() => activeHistoryStack.value.length > 1)

const toggleCompareMode = () => {
  compareMode.value = !compareMode.value
  if (!compareMode.value) {
    compareVersions.value = { left: null, right: null }
  }
}

const selectCompareVersion = (version, position) => {
  if (position === 'left') {
    compareVersions.value.left = version
  } else {
    compareVersions.value.right = version
  }
}

const clearCompare = () => {
  compareVersions.value = { left: null, right: null }
}

const compareWithPrevious = () => {
  const stack = activeHistoryStack.value
  if (stack.length >= 2) {
    compareVersions.value = {
      left: stack[stack.length - 2],
      right: stack[stack.length - 1]
    }
    compareMode.value = true
  }
}

const compareWithInitial = () => {
  const stack = activeHistoryStack.value
  if (stack.length >= 1) {
    compareVersions.value = {
      left: stack[0],
      right: stack[stack.length - 1]
    }
    compareMode.value = true
  }
}

const getCompareDiff = () => {
  const left = compareVersions.value.left
  const right = compareVersions.value.right
  if (!left || !right) return null

  const leftData = left.data
  const rightData = right.data

  const diff = {
    leftOnly: [],
    rightOnly: [],
    changed: [],
    orderChanged: false,
    unchanged: 0
  }

  if (!Array.isArray(leftData) || !Array.isArray(rightData)) {
    return diff
  }

  // 检查数组长度是否相同
  if (leftData.length !== rightData.length) {
    // 长度不同，需要找出新增和删除的项目
    // 找到新增的项目
    rightData.forEach(rightItem => {
      const isInLeft = leftData.some(leftItem => {
        const leftKey = leftItem._cms_id || leftItem.id || leftItem.slug || leftItem.name
        const rightKey = rightItem._cms_id || rightItem.id || rightItem.slug || rightItem.name
        return leftKey === rightKey
      })
      if (!isInLeft) {
        diff.rightOnly.push(rightItem)
      }
    })

    // 找到删除的项目
    leftData.forEach(leftItem => {
      const isInRight = rightData.some(rightItem => {
        const leftKey = leftItem._cms_id || leftItem.id || leftItem.slug || leftItem.name
        const rightKey = rightItem._cms_id || rightItem.id || rightItem.slug || rightItem.name
        return leftKey === rightKey
      })
      if (!isInRight) {
        diff.leftOnly.push(leftItem)
      }
    })
  } else {
    // 长度相同，检查顺序和内容
    // 检查顺序是否变化
    let isOrderSame = true
    for (let i = 0; i < leftData.length; i++) {
      const leftItem = leftData[i]
      const rightItem = rightData[i]
      const leftKey = leftItem._cms_id || leftItem.id || leftItem.slug || leftItem.name
      const rightKey = rightItem._cms_id || rightItem.id || rightItem.slug || rightItem.name
      if (leftKey !== rightKey) {
        isOrderSame = false
        break
      }
    }
    diff.orderChanged = !isOrderSame

    // 检查内容是否变化
    if (!diff.orderChanged) {
      // 顺序相同，检查内容
      leftData.forEach((leftItem, idx) => {
        const rightItem = rightData[idx]
        const hasChanges = Object.keys(leftItem).some(key => {
          if (key.startsWith('_')) return false
          return JSON.stringify(leftItem[key]) !== JSON.stringify(rightItem[key])
        })
        if (hasChanges) {
          const changes = []
          const allKeys = new Set([...Object.keys(leftItem), ...Object.keys(rightItem)])
          allKeys.forEach(key => {
            if (key.startsWith('_')) return
            if (JSON.stringify(leftItem[key]) !== JSON.stringify(rightItem[key])) {
              changes.push({
                key,
                left: leftItem[key],
                right: rightItem[key]
              })
            }
          })
          if (changes.length > 0) {
            diff.changed.push({
              name: leftItem.name || leftItem.title || leftItem.question || leftItem.slug || '未命名',
              changes
            })
          }
        } else {
          diff.unchanged++
        }
      })
    } else {
      // 顺序变化，添加顺序变化的标记
      diff.changed.push({
        name: '项目顺序',
        changes: [{ key: '顺序', left: '原始顺序', right: '新顺序' }]
      })
    }
  }

  diff.stats = {
    leftCount: leftData.length,
    rightCount: rightData.length,
    added: diff.rightOnly.length,
    removed: diff.leftOnly.length,
    modified: diff.changed.length,
    unchanged: diff.unchanged
  }

  return diff
}

// 清理过期的历史记录（超过一小时）
const cleanExpiredHistory = () => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  
  // 清理posts历史记录
  const validPostsHistory = historyStacks.posts.filter(entry => {
    // 对于没有timestampMs字段的旧历史记录，保留它们
    // 对于有timestampMs字段的新历史记录，只保留一小时内的
    return !entry.timestampMs || entry.timestampMs >= oneHourAgo
  })
  historyStacks.posts = validPostsHistory
  
  // 清理listData历史记录
  const validListDataHistory = historyStacks.listData.filter(entry => {
    // 对于没有timestampMs字段的旧历史记录，保留它们
    // 对于有timestampMs字段的新历史记录，只保留一小时内的
    return !entry.timestampMs || entry.timestampMs >= oneHourAgo
  })
  historyStacks.listData = validListDataHistory
  
  // 保存到本地存储
  saveHistoryToLocalStorage()
}

// 保存历史记录到本地存储
const saveHistoryToLocalStorage = () => {
  try {
    // 只保存必要的历史记录数据
    const historyData = {
      posts: historyStacks.posts,
      listData: historyStacks.listData
    }
    localStorage.setItem(HISTORY_STACKS_LS_KEY, JSON.stringify(historyData))
  } catch (e) {
    console.error('保存历史记录到本地存储失败:', e)
  }
}

// 从本地存储加载历史记录
const loadHistoryFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem(HISTORY_STACKS_LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.posts)) {
        historyStacks.posts = parsed.posts
      }
      if (Array.isArray(parsed.listData)) {
        historyStacks.listData = parsed.listData
      }
      // 清理过期记录
      cleanExpiredHistory()
    }
  } catch (e) {
    console.error('从本地存储加载历史记录失败:', e)
  }
}

const pushHistory = (data, operation = 'Unknown Operation', target = 'listData') => {
  if (!data) return
  
  const rawData = toRaw(data)
  const snapshot = JSON.parse(JSON.stringify(rawData))
  
  const stack = target === 'posts' ? historyStacks.posts : historyStacks.listData
  const lastEntry = stack[stack.length - 1]
  if (lastEntry && JSON.stringify(lastEntry.data) === JSON.stringify(snapshot)) return
  
  const now = Date.now()
  stack.push({
    id: now + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    timestampMs: now, // 保存完整的时间戳，用于过期检查
    operation,
    data: snapshot,
    target
  })
  
  // 清理过期记录
  cleanExpiredHistory()
  
  // 限制历史记录数量
  if (stack.length > maxHistory) {
    stack.shift()
  }
  
  // 保存到本地存储
  saveHistoryToLocalStorage()
}

const rollbackPostToServer = async (post) => {
  try {
    // 首先检查文章是否存在
    const checkRes = await apiFetch(`/api/post?slug=${encodeURIComponent(post.slug)}`)
    const exists = checkRes.ok
    
    let res
    if (exists) {
      // 如果存在，使用PUT更新
      const payload = {
        data: {
          title: post.title,
          description: post.description,
          cover: post.cover,
          date: post.date,
          status: post.status,
          category: post.category,
          tags: post.tags
        },
        content: post.content
      }
      
      res = await apiFetch(`/api/post?slug=${encodeURIComponent(post.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      // 如果不存在，使用创建文章的API
      const payload = {
        title: post.title,
        description: post.description,
        date: post.date,
        status: post.status || 'published',
        category: post.category || '未分类',
        tags: post.tags,
        cover: post.cover,
        content: post.content,
        wordCount: post.content ? post.content.length : 0,
        readingTime: Math.ceil((post.content ? post.content.length : 0) / 400)
      }
      
      res = await apiFetch(`/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }
    
    return res.ok
  } catch (e) {
    console.error(`保存文章 ${post.slug} 失败:`, e)
    return false
  }
}

const rollbackTo = async (historyEntry) => {
  if (!historyEntry) return
  const target = historyEntry.target === 'posts' ? 'posts' : 'listData'
  const stack = target === 'posts' ? historyStacks.posts : historyStacks.listData
  const restored = JSON.parse(JSON.stringify(historyEntry.data))
  
  if (target === 'posts') {
    // 对于文章，更新posts列表
    const previousPosts = posts.value || []
    // 确保每个文章都有唯一的_cms_id属性，用于Vue的key绑定
    posts.value = (Array.isArray(restored) ? restored : []).map(post => ({
      ...post,
      _cms_id: post.slug // 使用slug作为唯一标识符，确保稳定性
    }))
    
    // 保存到服务器
    await savePostOrderToServer()
    
    // 获取历史版本中存在的文章slug集合
    const historySlugs = new Set((posts.value || []).map(p => p.slug))
    
    // 获取当前版本中存在但历史版本中不存在的文章slug集合（需要删除的文章）
    const slugsToDelete = (previousPosts || []).filter(p => !historySlugs.has(p.slug)).map(p => p.slug)
    
    // 删除这些文章
    if (slugsToDelete.length > 0) {
      loading.value = true
      showToast(`正在删除 ${slugsToDelete.length} 篇文章...`, 'info')
      
      let deleteSuccessCount = 0
      for (const slug of slugsToDelete) {
        try {
          await apiFetch(`/api/post?slug=${encodeURIComponent(slug)}`, {
            method: 'DELETE'
          })
          deleteSuccessCount++
        } catch (e) {
          console.error(`删除文章 ${slug} 失败:`, e)
        }
      }
      
      showToast(`成功删除 ${deleteSuccessCount}/${slugsToDelete.length} 篇文章`, 'info')
    }
    
    // 将每篇文章保存到服务器
    if (posts.value.length > 0) {
      loading.value = true
      showToast('正在保存文章到服务器...', 'info')
      
      // 串行保存文章，避免服务器压力过大
      let successCount = 0
      for (const post of posts.value) {
        try {
          const saved = await rollbackPostToServer(post)
          if (saved) successCount++
        } catch (e) {
          console.error(`保存文章 ${post.slug} 失败:`, e)
        }
      }
      
      loading.value = false
      showToast(`成功保存 ${successCount}/${posts.value.length} 篇文章到服务器`)
    }
    
    // 如果当前正在编辑文章，检查是否需要更新
    if (selectedSlug.value) {
      const restoredPost = posts.value.find(p => p.slug === selectedSlug.value)
      if (restoredPost) {
        // 更新编辑表单
        articleForm.value = {
          title: String(restoredPost.title ?? ''),
          description: String(restoredPost.description ?? ''),
          cover: String(restoredPost.cover ?? ''),
          date: String(restoredPost.date ?? '').slice(0, 10),
          status: String(restoredPost.status ?? 'published'),
          category: String(restoredPost.category ?? ''),
          tags: Array.isArray(restoredPost.tags) ? restoredPost.tags : [],
          content: String(restoredPost.content ?? '')
        }
      }
    }
  } else {
    // 对于其他数据类型
    listData.value = Array.isArray(restored) ? restored : []
    await saveDataToServer()
    
    // 保存历史记录到本地存储
    saveHistoryToLocalStorage()
  }
  
  // Truncate history stack to this point
  const index = stack.findIndex(h => h.id === historyEntry.id)
  if (index !== -1) {
    // 使用splice方法修改数组，而不是直接替换，减少Vue的响应式更新
    if (target === 'posts') {
      historyStacks.posts.splice(index + 1)
    } else {
      historyStacks.listData.splice(index + 1)
    }
    
    // 保存到本地存储
    saveHistoryToLocalStorage()
  }
  
  showToast(`已回退到 ${historyEntry.timestamp} 的版本`)
}

const undo = async () => {
  const target = currentView.value === 'article_list' ? 'posts' : 'listData'
  const stack = target === 'posts' ? historyStacks.posts : historyStacks.listData
  if (stack.length <= 1) {
    showToast('没有更多可以回退的内容了', 'info')
    return
  }
  // Remove current state
  stack.pop()
  // Get previous state
  const prevState = stack[stack.length - 1]
  const restored = JSON.parse(JSON.stringify(prevState.data))
  
  if (target === 'posts') {
    // 对于文章
    const previousPosts = posts.value || []
    // 确保每个文章都有唯一的_cms_id属性，用于Vue的key绑定
    posts.value = (Array.isArray(restored) ? restored : []).map(post => ({
      ...post,
      _cms_id: post.slug // 使用slug作为唯一标识符，确保稳定性
    }))
    await savePostOrderToServer()
    
    // 保存历史记录到本地存储
    saveHistoryToLocalStorage()
    
    // 获取历史版本中存在的文章slug集合
    const historySlugs = new Set((posts.value || []).map(p => p.slug))
    
    // 获取当前版本中存在但历史版本中不存在的文章slug集合（需要删除的文章）
    const slugsToDelete = (previousPosts || []).filter(p => !historySlugs.has(p.slug)).map(p => p.slug)
    
    // 删除这些文章
    if (slugsToDelete.length > 0) {
      loading.value = true
      showToast(`正在删除 ${slugsToDelete.length} 篇文章...`, 'info')
      
      let deleteSuccessCount = 0
      for (const slug of slugsToDelete) {
        try {
          await apiFetch(`/api/post?slug=${encodeURIComponent(slug)}`, {
            method: 'DELETE'
          })
          deleteSuccessCount++
        } catch (e) {
          console.error(`删除文章 ${slug} 失败:`, e)
        }
      }
      
      showToast(`成功删除 ${deleteSuccessCount}/${slugsToDelete.length} 篇文章`, 'info')
    }
    
    // 将每篇文章保存到服务器
    if (posts.value.length > 0) {
      loading.value = true
      showToast('正在保存文章到服务器...', 'info')
      
      // 串行保存文章，避免服务器压力过大
      let successCount = 0
      for (const post of posts.value) {
        try {
          const saved = await rollbackPostToServer(post)
          if (saved) successCount++
        } catch (e) {
          console.error(`保存文章 ${post.slug} 失败:`, e)
        }
      }
      
      loading.value = false
      showToast(`成功保存 ${successCount}/${posts.value.length} 篇文章到服务器`)
    }
    
    // 如果当前正在编辑文章，检查是否需要更新
    if (selectedSlug.value) {
      const restoredPost = posts.value.find(p => p.slug === selectedSlug.value)
      if (restoredPost) {
        // 更新编辑表单
        articleForm.value = {
          title: String(restoredPost.title ?? ''),
          description: String(restoredPost.description ?? ''),
          cover: String(restoredPost.cover ?? ''),
          date: String(restoredPost.date ?? '').slice(0, 10),
          status: String(restoredPost.status ?? 'published'),
          category: String(restoredPost.category ?? ''),
          tags: Array.isArray(restoredPost.tags) ? restoredPost.tags : [],
          content: String(restoredPost.content ?? '')
        }
      }
    }
  } else {
    // 对于其他数据类型
    listData.value = Array.isArray(restored) ? restored : []
    await saveDataToServer()
  }
  showToast('已回退到上一个版本')
}

const getDiff = (stack, index) => {
  const s = Array.isArray(stack) ? stack : []
  if (index <= 0) return null
  if (!s[index] || !s[index - 1]) return null
  const current = s[index].data
  const prev = s[index - 1].data
  
  const diff = {
    added: [],
    removed: [],
    changed: []
  }

  // Find added and changed
  current.forEach(item => {
    const prevItem = prev.find(p => p._cms_id === item._cms_id || (p.id && p.id === item.id))
    if (!prevItem) {
      diff.added.push(item)
    } else if (JSON.stringify(item) !== JSON.stringify(prevItem)) {
      const changes = []
      Object.keys(item).forEach(key => {
        if (key.startsWith('_')) return
        if (JSON.stringify(item[key]) !== JSON.stringify(prevItem[key])) {
          changes.push({ key, from: prevItem[key], to: item[key] })
        }
      })
      if (changes.length > 0) {
        diff.changed.push({ name: item.name || item.title || item.question || '项目', changes })
      }
    }
  })

  // Find removed
  prev.forEach(item => {
    const currentItem = current.find(c => c._cms_id === item._cms_id || (c.id && c.id === item.id))
    if (!currentItem) {
      diff.removed.push(item)
    }
  })

  return diff
}

const getOperationClass = (operation) => {
  const op = operation.toLowerCase()
  if (op.includes('新增') || op.includes('添加') || op.includes('创建') || op.includes('新增项目') || op.includes('新增卡片')) return 'op-add'
  if (op.includes('删除') || op.includes('移除')) return 'op-delete'
  if (op.includes('编辑') || op.includes('修改') || op.includes('更新')) return 'op-edit'
  if (op.includes('排序') || op.includes('重新排序') || op.includes('移动')) return 'op-move'
  if (op.includes('保存') || op.includes('提交')) return 'op-save'
  if (op.includes('加载') || op.includes('刷新')) return 'op-load'
  return 'op-default'
}

const getOperationIcon = (operation) => {
  const op = operation.toLowerCase()
  if (op.includes('新增') || op.includes('添加') || op.includes('创建')) return 'IconAdd'
  if (op.includes('删除') || op.includes('移除')) return 'IconDelete'
  if (op.includes('编辑') || op.includes('修改') || op.includes('更新')) return 'IconEdit'
  if (op.includes('排序') || op.includes('重新排序')) return 'IconSort'
  if (op.includes('保存') || op.includes('提交')) return 'IconSave'
  return 'IconDefault'
}

const getOperationLabel = (operation) => {
  const op = operation.toLowerCase()
  if (op.includes('新增') || op.includes('添加') || op.includes('创建')) return '新增'
  if (op.includes('删除') || op.includes('移除')) return '删除'
  if (op.includes('编辑') || op.includes('修改') || op.includes('更新')) return '编辑'
  if (op.includes('排序') || op.includes('重新排序')) return '排序'
  if (op.includes('保存') || op.includes('提交')) return '保存'
  if (op.includes('加载') || op.includes('刷新')) return '加载'
  return '操作'
}

const formatTime = (timestamp) => {
  return timestamp
}

const formatFieldLabel = (key) => {
  const labels = {
    name: '名称',
    title: '标题',
    desc: '描述',
    link: '链接',
    avatar: '头像',
    content: '内容',
    category: '分类',
    tags: '标签',
    date: '日期',
    status: '状态',
    question: '问题',
    answer: '回答',
    type: '类型'
  }
  return labels[key] || key
}

const truncateValue = (value, maxLength = 30) => {
  if (!value) return '空'
  const str = String(value)
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

const getItemNames = (items, maxDisplay = 2) => {
  if (!items || items.length === 0) return ''
  const names = items.map(item => item.name || item.title || item.question || '未命名')
  if (names.length <= maxDisplay) {
    return names.join(', ')
  }
  return names.slice(0, maxDisplay).join(', ') + ` 等${names.length}项`
}

const getChangedNames = (changes, maxDisplay = 2) => {
  if (!changes || changes.length === 0) return ''
  const names = changes.map(c => c.name || '未命名')
  if (names.length <= maxDisplay) {
    return names.join(', ')
  }
  return names.slice(0, maxDisplay).join(', ') + ` 等${names.length}项`
}

const editingQuoteIndex = ref(-1)
const quoteDraft = ref(null)

const aboutNewType = ref('text')
const showAboutModal = ref(false)
const aboutIsEdit = ref(false)
const aboutEditingIndex = ref(-1)
const aboutEditingItem = ref({
  id: '',
  question: '',
  type: 'text',
  answer: '',
  detail: { text: '' }
})

const showAboutDetailModal = ref(false)
const activeAboutCardId = ref(null)
const activeAboutCard = computed(() => {
  if (!activeAboutCardId.value) return null
  return listData.value.find((item) => item.id === activeAboutCardId.value)
})

const openAboutDetail = (id) => {
  activeAboutCardId.value = id
  showAboutDetailModal.value = true
}

const makeAboutTemplate = (type, base = {}) => {
  const id = String(base.id ?? '').trim()
  const question = String(base.question ?? '').trim()
  const common = { id, question, type }
  if (type === 'profile') {
    return { ...common, name: '', role: '', answer: '', detail: { intro: '', experiences: [] } }
  }
  if (type === 'skills') {
    return { ...common, skills: [], detail: { main: [], tools: [] } }
  }
  if (type === 'quote') {
    return { ...common, answer: '', subAnswer: '', detail: { text: '' } }
  }
  if (type === 'social') {
    return { ...common, detail: { text: '' } }
  }
  if (type === 'hobbies') {
    return { ...common, answer: '', detail: { list: [] } }
  }
  return { ...common, answer: '', detail: { text: '' } }
}

const ensureAboutShape = (raw) => {
  const type = String(raw?.type ?? 'text')
  const base = makeAboutTemplate(type, { id: raw?.id, question: raw?.question })
  const merged = { ...base, ...raw }
  if (!merged.detail || typeof merged.detail !== 'object') merged.detail = { ...base.detail }
  if (type === 'profile') {
    if (!Array.isArray(merged.detail.experiences)) merged.detail.experiences = []
  }
  if (type === 'skills') {
    if (!Array.isArray(merged.skills)) merged.skills = []
    if (!Array.isArray(merged.detail.main)) merged.detail.main = []
    if (!Array.isArray(merged.detail.tools)) merged.detail.tools = []
  }
  if (type === 'quote') {
    if (typeof merged.subAnswer !== 'string') merged.subAnswer = ''
    if (typeof merged.detail.text !== 'string') merged.detail.text = ''
  }
  if (type === 'social') {
    if (typeof merged.detail.text !== 'string') merged.detail.text = ''
  }
  if (type === 'hobbies') {
    if (!Array.isArray(merged.detail.list)) merged.detail.list = []
  }
  if (type === 'text') {
    if (typeof merged.detail.text !== 'string') merged.detail.text = ''
  }
  if (typeof merged.answer !== 'string' && type !== 'social') merged.answer = ''
  return merged
}

const showPreview = ref(true)
const showMeta = ref(true)

const categories = ref([])
const loadCategories = async () => {
  try {
    const res = await apiFetch('/api/categories')
    if (!res.ok) throw new Error('load failed')
    const data = await res.json()
    if (Array.isArray(data)) categories.value = data
  } catch {
    categories.value = []
  }
}

const mdFileInput = ref(null)
const jsonFileInput = ref(null)

const applyImportedMarkdown = (markdownText, fileName = '') => {
  const parsed = parseFrontmatter(markdownText)
  if (parsed) {
    const fm = parsed.frontmatter || {}
    const nextForm = { ...articleForm.value }
    if (fm.title) nextForm.title = fm.title
    if (fm.description) nextForm.description = fm.description
    if (fm.cover) nextForm.cover = fm.cover
    if (fm.category) nextForm.category = fm.category
    if (fm.date) nextForm.date = String(fm.date).slice(0, 10)
    if (Array.isArray(fm.tags)) nextForm.tags = fm.tags
    nextForm.content = parsed.body
    articleForm.value = nextForm
  } else {
    const nextForm = { ...articleForm.value }
    if (!nextForm.title && fileName) {
      const base = fileName.replace(/\.(md|markdown)$/i, '')
      if (base) nextForm.title = base
    }
    nextForm.content = String(markdownText ?? '')
    articleForm.value = nextForm
  }
}

const triggerMarkdownImport = () => {
  mdFileInput.value?.click?.()
}

const handleMarkdownFileUpload = async (event) => {
  const file = event?.target?.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    applyImportedMarkdown(text, file.name)
    showToast('Markdown 已导入')
  } catch {
    showToast('Markdown 导入失败', 'error')
  } finally {
    if (event?.target) event.target.value = ''
  }
}

const loadData = async (file) => {
  loading.value = true
  try {
    const res = await apiFetch(`/api/data?file=${file}`)
    if (res.ok) {
      const data = await res.json()
      // Ensure unique IDs for all items to prevent key collisions
      const processedData = (Array.isArray(data) ? data : []).map(item => ({
        ...item,
        _cms_id: item.id || item._cms_id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
      listData.value = processedData
      
      const now = Date.now()
      // Reset history for new file
      historyStacks.listData = [{
        id: now,
        timestamp: new Date().toLocaleTimeString(),
        timestampMs: now, // 保存完整的时间戳，用于过期检查
        operation: 'Initial Load',
        data: JSON.parse(JSON.stringify(processedData)),
        target: 'listData'
      }]
      
      // 保存到本地存储
      saveHistoryToLocalStorage()
      
      if (file === 'aboutData.js') {
        jsonContent.value = JSON.stringify(processedData, null, 4)
      }
    }
  } catch {
    showToast('数据加载失败', 'error')
  } finally {
    loading.value = false
  }
}

watch(currentView, (newVal) => {
  if (String(newVal || '').endsWith('.js')) loadData(newVal)
})

const handlePaste = async (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      event.preventDefault()
      const file = item.getAsFile()
      await uploadFileGeneric(file, (url) => {
        const imgMd = `\n![image](${url})\n`
        articleForm.value.content += imgMd
      })
    }
  }
}

const uploadFile = async (event, fieldKey) => {
  const file = event.target.files[0]
  if (!file) return
  await uploadFileGeneric(file, (url) => {
    editingItem.value[fieldKey] = url
  })
}

const uploadCover = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  await uploadFileGeneric(file, (url) => {
    articleForm.value.cover = url
  })
}

const uploadFileGeneric = async (file, onSuccess) => {
  const fileName = `img-${Date.now()}-${file.name}`
  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      headers: { 
        'X-File-Name': encodeURIComponent(fileName) 
      },
      body: file
    })
    const result = await res.json()
    if (result.success) {
      onSuccess(result.url)
      showToast('上传成功')
    } else {
      showToast(`上传失败: ${result.message || ''}`, 'error')
    }
  } catch (err) {
    showToast(`网络错误: ${err.message}`, 'error')
  }
}

const submitArticle = async (formData) => {
  const currentForm = formData || articleForm.value
  if (!currentForm.title) return showToast('请填写标题', 'error')
  loading.value = true
  try {
    let res;
    if (selectedSlug.value) {
      const payload = {
        data: { ...currentForm },
        content: currentForm.content
      }
      res = await apiFetch(`/api/post?slug=${encodeURIComponent(selectedSlug.value)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      res = await apiFetch('/api/save', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentForm) 
      })
    }

    if (res.ok) {
      showToast(selectedSlug.value ? '文章更新成功！' : '文章发布成功！')
      if (!selectedSlug.value) {
        resetArticleForm()
      }
      await loadPosts('保存文章')
    } else {
      const errData = await res.json().catch(() => ({}))
      showToast(selectedSlug.value ? `更新失败: ${errData.message || ''}` : `发布失败: ${errData.message || ''}`, 'error')
    }
  } catch (err) {
    showToast(`网络错误: ${err.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEdit.value = false
  editingItem.value = {}
  if (currentView.value === 'thoughts.js') {
    editingItem.value.date = new Date().toISOString().split('T')[0]
    editingItem.value.likes = 0
    editingItem.value.comments = 0
  }
  showModal.value = true
}

const importFromJson = () => {
  const input = window.prompt('请粘贴友链 JSON 数据 (支持 new URL 格式):')
  if (!input) return
  
  try {
    const success = processJsonImport(input)
    if (success) {
      showToast('JSON 粘贴导入成功')
    } else {
      showToast('JSON 解析失败', 'error')
    }
  } catch (err) {
    showToast('JSON 解析失败: ' + err.message, 'error')
  }
}

const exportToJson = () => {
  if (currentView.value !== 'friendList.js') return
  
  try {
    const jsonData = {
      name: editingItem.value.name || '',
      desc: editingItem.value.desc || '',
      link: editingItem.value.link || '',
      avatar: editingItem.value.avatar || ''
    }
    
    const jsonString = JSON.stringify(jsonData, null, 2)
    
    // 创建下载链接
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${jsonData.name || 'friend'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showToast('JSON 导出成功')
  } catch (err) {
    showToast('JSON 导出失败: ' + err.message, 'error')
  }
}

const triggerFileImport = () => {
  jsonFileInput.value?.click?.()
}

const handleJsonFileImport = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    processJsonImport(text)
    showToast('JSON 文件导入成功')
  } catch (err) {
    showToast('JSON 文件解析失败: ' + err.message, 'error')
  } finally {
    // 重置文件输入，允许重新选择同一文件
    event.target.value = ''
  }
}

const processJsonImport = (jsonText) => {
  try {
    let cleanJson = jsonText.trim()
    // 移除注释
    cleanJson = cleanJson.replace(/\/\/.*$/gm, '')
    
    // 直接解析 JSON
    const jsonData = JSON.parse(cleanJson)
    
    // 验证并提取字段
    if (jsonData.name) editingItem.value.name = jsonData.name
    if (jsonData.desc) editingItem.value.desc = jsonData.desc
    if (jsonData.link) editingItem.value.link = jsonData.link
    if (jsonData.avatar) {
      let avatar = jsonData.avatar
      // 提取 new URL 中的路径
      const pathMatch = avatar.match(/new URL\(['"](.*?)['"]/)
      if (pathMatch) {
        editingItem.value.avatar = pathMatch[1]
      } else {
        editingItem.value.avatar = avatar
      }
    }
    
    return true
  } catch (err) {
    // 如果直接解析失败，尝试使用原有的正则提取方法
    let cleanJson = jsonText.trim()
    cleanJson = cleanJson.replace(/\/\/.*$/gm, '')
    
    const nameMatch = cleanJson.match(/"name":\s*"([^"]*)"/)
    const descMatch = cleanJson.match(/"desc":\s*"([^"]*)"/)
    const linkMatch = cleanJson.match(/"link":\s*"([^"]*)"/)
    const avatarMatch = cleanJson.match(/"avatar":\s*"(.*?)"/)

    if (nameMatch) editingItem.value.name = nameMatch[1]
    if (descMatch) editingItem.value.desc = descMatch[1]
    if (linkMatch) editingItem.value.link = linkMatch[1]
    
    if (avatarMatch) {
      const val = avatarMatch[1]
      const pathMatch = val.match(/new URL\(['"](.*?)['"]/)
      if (pathMatch) {
        editingItem.value.avatar = pathMatch[1]
      } else {
        editingItem.value.avatar = val
      }
    }
    
    return true
  }
}

const editItem = (index) => {
  isEdit.value = true
  editingIndex.value = index
  editingItem.value = JSON.parse(JSON.stringify(listData.value[index]))
  showModal.value = true
}

const cloneItem = (index) => {
  isEdit.value = false
  editingIndex.value = -1
  const source = JSON.parse(JSON.stringify(listData.value[index]))
  // 移除唯一标识
  delete source._cms_id
  if (source.id) source.id = Date.now()
  if (source.title) source.title += ' (副本)'
  if (source.name) source.name += ' (副本)'
  
  editingItem.value = source
  showModal.value = true
}

const deleteItem = async (index) => {
  if (!window.confirm('确认删除此项吗？')) return
  const item = listData.value[index]
  const nextData = [...listData.value]
  nextData.splice(index, 1)
  listData.value = nextData
  pushHistory(nextData, `删除项目: ${item.name || item.title || '未命名'}`)
  await saveDataToServer()
}

const startEditQuote = (index) => {
  if (currentView.value !== 'quotes.js') return
  editingQuoteIndex.value = index
  quoteDraft.value = JSON.parse(JSON.stringify(listData.value[index] || {}))
}

const cancelEditQuote = () => {
  editingQuoteIndex.value = -1
  quoteDraft.value = null
}

const saveEditQuote = async () => {
  const index = editingQuoteIndex.value
  if (currentView.value !== 'quotes.js') return
  if (index < 0) return
  const nextData = [...listData.value]
  nextData[index] = { ...(nextData[index] || {}), ...(quoteDraft.value || {}) }
  listData.value = nextData
  pushHistory(nextData, `编辑语录: ${nextData[index].content?.substring(0, 10)}...`)
  await saveDataToServer()
  cancelEditQuote()
  showToast('保存成功')
}

const saveList = async () => {
  if (currentView.value === 'thoughts.js') {
    if (!editingItem.value.id && !isEdit.value) editingItem.value.id = Date.now()
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    if (editingItem.value.date) {
      editingItem.value.week = days[new Date(editingItem.value.date).getDay()]
    }
    if (typeof editingItem.value.comments !== 'number') editingItem.value.comments = Number(editingItem.value.comments || 0)
  }
  if (currentView.value === 'photos.js' && !editingItem.value.id) {
    editingItem.value.id = Date.now()
  }

  const nextData = [...listData.value]
  const newItem = { 
    ...editingItem.value,
    _cms_id: editingItem.value._cms_id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  if (isEdit.value) {
    nextData[editingIndex.value] = newItem
    pushHistory(nextData, `编辑项目: ${newItem.name || newItem.title || '未命名'}`)
  } else {
    nextData.unshift(newItem)
    pushHistory(nextData, `新增项目: ${newItem.name || newItem.title || '未命名'}`)
  }
  listData.value = nextData

  await saveDataToServer()
  showModal.value = false
  showToast('保存成功')
}

const saveDataToServer = async () => {
  try {
    await apiFetch(`/api/data?file=${currentView.value}`, {
      method: 'POST',
      body: JSON.stringify(listData.value)
    })
  } catch {
    showToast('保存失败', 'error')
  }
}

const openAboutAddModal = () => {
  aboutIsEdit.value = false
  aboutEditingIndex.value = -1
  const next = makeAboutTemplate(aboutNewType.value, { id: `card-${Date.now()}` })
  aboutEditingItem.value = ensureAboutShape(next)
  showAboutModal.value = true
}

const editAboutItem = (index) => {
  aboutIsEdit.value = true
  aboutEditingIndex.value = index
  aboutEditingItem.value = ensureAboutShape(JSON.parse(JSON.stringify(listData.value[index] || {})))
  showAboutModal.value = true
}

const deleteAboutItem = async (index) => {
  if (!window.confirm('确认删除此卡片吗？')) return
  const item = listData.value[index]
  const nextData = [...listData.value]
  nextData.splice(index, 1)
  listData.value = nextData
  pushHistory(nextData, `删除卡片: ${item.question || '未命名'}`)
  
  // 直接保存数据到服务器
  try {
    await apiFetch('/api/data?file=aboutData.js', { method: 'POST', body: JSON.stringify(listData.value) })
    showToast('关于页已保存')
  } catch {
    showToast('保存失败', 'error')
  }
}

const onAboutTypeChange = () => {
  const prev = aboutEditingItem.value || {}
  // 直接使用当前的type创建新模板，不保留旧的detail属性
  const newTemplate = makeAboutTemplate(prev.type, { 
    id: prev.id, 
    question: prev.question 
  })
  // 只保留id和question，其他属性使用新模板的
  aboutEditingItem.value = ensureAboutShape(newTemplate)
}

// 自定义下拉菜单状态
const isDropdownOpen = ref(false)

// 技能和工具输入框
const skillInput = ref('')
const toolInput = ref('')

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.custom-dropdown')
  if (dropdown && !dropdown.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})



const saveAboutItem = async () => {
  const item = ensureAboutShape(aboutEditingItem.value)
  if (!String(item.question || '').trim()) return showToast('请填写问题', 'error')
  if (!String(item.id || '').trim()) item.id = `card-${Date.now()}`

  const nextData = [...listData.value]
  if (aboutIsEdit.value) {
    nextData[aboutEditingIndex.value] = item
    pushHistory(nextData, `编辑卡片: ${item.question}`)
  } else {
    nextData.unshift(item)
    pushHistory(nextData, `新增卡片: ${item.question}`)
  }
  listData.value = nextData

  // 直接保存数据到服务器，不再调用 saveAboutData
  try {
    await apiFetch('/api/data?file=aboutData.js', { method: 'POST', body: JSON.stringify(listData.value) })
    showToast('关于页已保存')
  } catch {
    showToast('保存失败', 'error')
  }
  showAboutModal.value = false
}

// 添加自动清理过期历史记录的定时器
let historyCleanupTimer = null

onMounted(() => {
  loadCategories()
  loadPosts()
  loadMedia()
  
  // 从本地存储加载历史记录
  loadHistoryFromLocalStorage()
  
  // 初始清理一次
  cleanExpiredHistory()
  
  // 设置定时器，每10分钟清理一次过期记录
  historyCleanupTimer = setInterval(() => {
    cleanExpiredHistory()
  }, 10 * 60 * 1000)
})

onUnmounted(() => {
  // 清理定时器
  if (historyCleanupTimer) {
    clearInterval(historyCleanupTimer)
    historyCleanupTimer = null
  }
})
</script>

<template>
  <div class="cms-root">
    <div class="cms-app">
      <CmsSidebar 
        v-model:currentView="currentView" 
        :selectedSlug="selectedSlug"
        @resetArticleForm="resetArticleForm"
        @openGitModal="openGitModal"
      />

      <main class="main-content">
        <CmsHeader 
          :pageTitle="pageTitle"
          :currentView="currentView"
          v-model:showPreview="showPreview"
          v-model:showMeta="showMeta"
          :isListView="isListView"
          :canUndo="canUndo"
          @openAddModal="openAddModal"
          @openHistory="showHistoryDrawer = true"
        />

        <div class="content-area">
          <Dashboard 
            v-if="currentView === 'dashboard'"
            :posts="posts"
            :media="mediaFiles"
            :categories="categories"
            @navigate="handleNavigate"
          />

          <KnowledgeGraph 
            v-else-if="currentView === 'knowledge_graph'"
            :posts="posts"
            @navigate="handleNavigate"
          />

          <ArticleList 
            v-else-if="currentView === 'article_list'"
            :filteredPosts="filteredPosts"
            v-model:query="query"
            @openPost="openPost"
            @deletePost="deletePost"
            @batchDelete="handleBatchDeletePosts"
            @createNewArticle="currentView = 'article'; resetArticleForm()"
            @update:filteredPosts="handleUpdatePosts"
          />

          <ArticleEditor 
            v-else-if="currentView === 'article'"
            v-model:articleForm="articleForm"
            :showPreview="showPreview"
            v-model:showMeta="showMeta"
            :categories="categories"
            :loading="loading"
            :selectedSlug="selectedSlug"
            @submitArticle="submitArticle"
            @triggerMarkdownImport="triggerMarkdownImport"
            @uploadCover="uploadCover"
            @handlePaste="handlePaste"
          />

          <template v-else-if="isListView">
            <FriendManager 
              v-if="currentView === 'friendList.js'"
              :listData="listData"
              @editItem="editItem"
              @cloneItem="cloneItem"
              @deleteItem="deleteItem"
              @update:listData="val => { listData = val; pushHistory(val, '重新排序友链'); saveDataToServer() }"
            />
            <PhotoManager 
              v-else-if="currentView === 'photos.js'"
              :listData="listData"
              @editItem="editItem"
              @cloneItem="cloneItem"
              @deleteItem="deleteItem"
              @update:listData="val => { listData = val; pushHistory(val, '重新排序相册'); saveDataToServer() }"
            />
            <QuoteManager 
              v-else-if="currentView === 'quotes.js'"
              :listData="listData"
              :editingQuoteIndex="editingQuoteIndex"
              v-model:quoteDraft="quoteDraft"
              @startEditQuote="startEditQuote"
              @cloneItem="cloneItem"
              @cancelEditQuote="cancelEditQuote"
              @saveEditQuote="saveEditQuote"
              @deleteItem="deleteItem"
              @update:listData="val => { listData = val; pushHistory(val, '重新排序语录'); saveDataToServer() }"
            />
            <ThoughtManager 
              v-else-if="currentView === 'thoughts.js'"
              :listData="listData"
              @editItem="editItem"
              @deleteItem="deleteItem"
              @update:listData="val => { listData = val; pushHistory(val, '重新排序说说'); saveDataToServer() }"
            />
          </template>

          <AboutManager 
            v-else-if="currentView === 'aboutData.js'"
            :listData="listData"
            v-model:aboutNewType="aboutNewType"
            @openAboutDetail="openAboutDetail"
            @editAboutItem="editAboutItem"
            @deleteAboutItem="deleteAboutItem"
            @openAboutAddModal="openAboutAddModal"
            @update:listData="async (val) => {
              listData = val;
              pushHistory(val, '重新排序关于卡片');
              // 直接保存数据到服务器
              try {
                await apiFetch('/api/data?file=aboutData.js', { method: 'POST', body: JSON.stringify(val) });
                showToast('关于页已保存');
              } catch {
                showToast('保存失败', 'error');
              }
            }"
          />

          <MediaManager 
            v-else-if="currentView === 'media_manager'"
          />

          <TaxonomyManager 
            v-else-if="currentView === 'taxonomy_manager'"
            :posts="posts"
            :categories="categories"
            @refresh="() => { loadPosts('刷新文章列表'); loadCategories(); }"
            @beforeTaxonomyChange="(data) => { pushHistory(posts, data.operation, 'posts') }"
          />

          <SystemManager 
            v-else-if="currentView === 'system_manager'"
          />
        </div>
      </main>

      <!-- Modals remain in main page for simplicity of state management -->
      <!-- Add/Edit Modal -->
      <div class="modal-mask" v-if="showModal" @click.self="showModal = false">
        <div class="modal-panel" :class="{ 'friend-modal': currentView === 'friendList.js' }">
          <div class="modal-header">
            <h3>{{ isEdit ? '编辑项目' : '新建项目' }}</h3>
            <div class="header-actions">
              <div class="button-with-tooltip" v-if="currentView === 'friendList.js'">
                <div class="import-json-buttons">
                  <button class="btn-secondary" @click="importFromJson" style="margin-right: 8px">粘贴 JSON</button>
                  <button class="btn-secondary" @click="triggerFileImport" style="margin-right: 12px">选择文件</button>
                  <input type="file" ref="jsonFileInput" @change="handleJsonFileImport" accept=".json" style="display: none">
                </div>
                <div class="tooltip">
                  <span class="tooltip-title">JSON 格式示例：</span>
                  <pre>{
  "name": "友链名称",
  "desc": "个性签名",
  "link": "博客链接",
  "avatar": "头像URL"
}</pre>
                  <span class="tooltip-hint">支持粘贴 JSON 或选择 JSON 文件</span>
                </div>
              </div>
              <button v-if="currentView === 'friendList.js' && isEdit" class="btn-secondary" @click="exportToJson" style="margin-right: 12px">导出 JSON</button>
              <button class="btn-icon" @click="showModal = false">关闭</button>
            </div>
          </div>
          <div class="modal-body" :class="{ 'friend-modal-body': currentView === 'friendList.js' }">
            <template v-if="currentView === 'friendList.js'">
              <div class="form-section">
                <div class="form-group" v-for="field in currentFields" :key="field.key">
                  <label>{{ field.label }}</label>
                  <div v-if="field.type === 'image'">
                    <div class="image-upload-area">
                      <input type="text" v-model="editingItem[field.key]" placeholder="图片URL或路径..." />
                      <button type="button" class="btn-secondary file-upload-btn">
                        选择本地图片
                        <input type="file" @change="(e) => uploadFile(e, field.key)" class="hidden-file-input" />
                      </button>
                    </div>
                  </div>
                  <input v-else type="text" v-model="editingItem[field.key]" :placeholder="'请输入' + field.label" />
                </div>
              </div>
              <div class="preview-section">
                <h4 class="preview-title">卡片预览</h4>
                <div class="preview-card-container">
                  <FriendCard 
                    :name="editingItem.name || 'Your Name'"
                    :desc="editingItem.desc || 'Your description here...'"
                    :link="editingItem.link || '#'"
                    :avatar="normalizeUrl(editingItem.avatar)"
                  />
                </div>
              </div>
            </template>
            <template v-else>
              <div class="form-grid">
                <div class="form-group" v-for="field in currentFields" :key="field.key">
                  <label>{{ field.label }}</label>
                  <div v-if="field.type === 'image'">
                    <div style="display: flex; gap: 12px; align-items: center">
                      <img :src="normalizeUrl(editingItem[field.key])" v-if="editingItem[field.key]" class="img-thumb" />
                      <div style="flex: 1">
                        <input type="text" v-model="editingItem[field.key]" placeholder="图片URL..." style="margin-bottom: 8px" />
                        <button type="button" class="btn-secondary file-upload-btn">
                          选择本地图片
                          <input type="file" @change="(e) => uploadFile(e, field.key)" class="hidden-file-input" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <textarea v-else-if="field.type === 'textarea'" v-model="editingItem[field.key]" rows="3"></textarea>
                  <input v-else-if="field.type === 'date'" type="date" v-model="editingItem[field.key]" />
                  <input v-else-if="field.type === 'number'" type="number" v-model.number="editingItem[field.key]" />
                  <input v-else type="text" v-model="editingItem[field.key]" />
                </div>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showModal = false">取消</button>
            <button class="action-btn" @click="saveList">保存提交</button>
          </div>
        </div>
      </div>

      <!-- About Edit Modal -->
      <div class="modal-mask" v-if="showAboutModal" @click.self="showAboutModal = false">
        <div class="modal-panel wide-modal">
          <div class="modal-header">
            <h3>{{ aboutIsEdit ? '编辑关于卡片' : '新建关于卡片' }}</h3>
            <button class="btn-icon" @click="showAboutModal = false">关闭</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-row">
                <div class="form-group">
                  <label>卡片类型</label>
                  <!-- 自定义下拉菜单 -->
                  <div class="custom-dropdown">
                    <button 
                      class="dropdown-toggle"
                      :class="{ 'active': isDropdownOpen }"
                      @click="isDropdownOpen = !isDropdownOpen"
                    >
                      {{ aboutTypeOptions.find(t => t.value === aboutEditingItem.type)?.label || '选择卡片类型' }}
                      <span class="dropdown-arrow">▼</span>
                    </button>
                    <div 
                      class="dropdown-menu"
                      :class="{ 'open': isDropdownOpen }"
                    >
                      <div 
                        v-for="t in aboutTypeOptions" 
                        :key="t.value"
                        class="dropdown-item"
                        :class="{ 'selected': t.value === aboutEditingItem.type }"
                        @click="aboutEditingItem.type = t.value; onAboutTypeChange(); isDropdownOpen = false"
                      >
                        {{ t.label }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label>卡片 ID</label>
                  <input v-model="aboutEditingItem.id" placeholder="例如 who / stack / quote" />
                </div>
              </div>
              <div class="form-group">
                <label>问题</label>
                <input v-model="aboutEditingItem.question" placeholder="例如：你是谁？" />
              </div>

              <!-- Type specific fields -->
              
              <!-- Profile Type -->
              <div v-if="aboutEditingItem.type === 'profile'">
                <div class="form-row">
                  <div class="form-group">
                    <label>名字</label>
                    <input v-model="aboutEditingItem.name" placeholder="例如：YouthY" />
                  </div>
                  <div class="form-group">
                    <label>角色</label>
                    <input v-model="aboutEditingItem.role" placeholder="例如：Frontend Developer" />
                  </div>
                </div>
                <div class="form-group">
                  <label>一句话回答</label>
                  <input v-model="aboutEditingItem.answer" placeholder="例如：目前还是一条咸鱼..." />
                </div>
                <div class="form-group">
                  <label>个人介绍</label>
                  <textarea v-model="aboutEditingItem.detail.intro" rows="3" placeholder="介绍一下自己..."></textarea>
                </div>
                <div class="form-group">
                  <label>经历</label>
                  <div class="dynamic-list">
                    <div v-for="(exp, idx) in aboutEditingItem.detail.experiences" :key="idx" class="dynamic-item">
                      <input v-model="exp.year" placeholder="年份" class="small-input" />
                      <input v-model="exp.event" placeholder="经历内容" class="flex-input" />
                      <button class="remove-btn" @click="aboutEditingItem.detail.experiences.splice(idx, 1)">×</button>
                    </div>
                    <button class="add-btn" @click="aboutEditingItem.detail.experiences.push({ year: '', event: '' })">+ 添加经历</button>
                  </div>
                </div>
              </div>
              
              <!-- Skills Type -->
              <div v-else-if="aboutEditingItem.type === 'skills'">
                <div class="form-group">
                  <label>主要技能</label>
                  <div class="dynamic-list">
                    <div v-for="(skill, idx) in aboutEditingItem.detail.main" :key="idx" class="dynamic-item">
                      <input v-model="skill.name" placeholder="技能名称" class="flex-input" />
                      <input v-model.number="skill.level" type="number" min="0" max="100" placeholder="熟练度%" class="small-input" />
                      <button class="remove-btn" @click="aboutEditingItem.detail.main.splice(idx, 1)">×</button>
                    </div>
                    <button class="add-btn" @click="aboutEditingItem.detail.main.push({ name: '', level: 0 })">+ 添加主要技能</button>
                  </div>
                </div>
                <div class="form-group">
                  <label>主要使用工具</label>
                  <div class="dynamic-list">
                    <div v-for="(tool, idx) in aboutEditingItem.detail.tools" :key="idx" class="dynamic-item">
                      <input v-model="aboutEditingItem.detail.tools[idx]" placeholder="工具名称" class="flex-input" />
                      <button class="remove-btn" @click="aboutEditingItem.detail.tools.splice(idx, 1)">×</button>
                    </div>
                    <button class="add-btn" @click="aboutEditingItem.detail.tools.push('')">+ 添加主要使用工具</button>
                  </div>
                </div>
              </div>
              
              <!-- Quote Type -->
              <div v-else-if="aboutEditingItem.type === 'quote'">
                <div class="form-group">
                  <label>引用内容</label>
                  <textarea v-model="aboutEditingItem.answer" rows="3" placeholder="输入引用内容"></textarea>
                </div>
                <div class="form-group">
                  <label>引用来源</label>
                  <input v-model="aboutEditingItem.subAnswer" placeholder="例如：—— 《金缕衣》" />
                </div>
                <div class="form-group">
                  <label>引用说明</label>
                  <textarea v-model="aboutEditingItem.detail.text" rows="2" placeholder="添加一些说明..."></textarea>
                </div>
              </div>
              
              <!-- Hobbies Type -->
              <div v-else-if="aboutEditingItem.type === 'hobbies'">
                <div class="form-group">
                  <label>爱好描述</label>
                  <input v-model="aboutEditingItem.answer" placeholder="用一句话描述你的爱好" />
                </div>
                <div class="form-group">
                  <label>爱好列表</label>
                  <div class="dynamic-list">
                    <div v-for="(hobby, idx) in aboutEditingItem.detail.list" :key="idx" class="dynamic-item">
                      <input v-model="hobby.icon" placeholder="图标" class="icon-input" />
                      <input v-model="hobby.name" placeholder="爱好名称" class="flex-input" />
                      <input v-model="hobby.desc" placeholder="描述" class="flex-input" />
                      <button class="remove-btn" @click="aboutEditingItem.detail.list.splice(idx, 1)">×</button>
                    </div>
                    <button class="add-btn" @click="aboutEditingItem.detail.list.push({ icon: '✨', name: '', desc: '' })">+ 添加爱好</button>
                  </div>
                </div>
              </div>
              
              <!-- Social Type -->
              <div v-else-if="aboutEditingItem.type === 'social'">
                <div class="form-group">
                  <label>社交说明</label>
                  <textarea v-model="aboutEditingItem.detail.text" rows="3" placeholder="介绍一下你的社交媒体..."></textarea>
                </div>
              </div>
              
              <!-- Text Type -->
              <div v-else>
                <div class="form-group">
                  <label>回答</label>
                  <textarea v-model="aboutEditingItem.answer" rows="3" placeholder="输入你的回答"></textarea>
                </div>
                <div class="form-group">
                  <label>补充说明</label>
                  <textarea v-model="aboutEditingItem.detail.text" rows="2" placeholder="添加额外说明"></textarea>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showAboutModal = false">取消</button>
            <button class="action-btn" @click="saveAboutItem">保存提交</button>
          </div>
        </div>
      </div>

      <!-- About Detail Modal -->
      <div class="modal-mask" v-if="showAboutDetailModal" @click.self="showAboutDetailModal = false">
        <div class="modal-panel about-detail-panel">
          <div class="modal-header">
            <h3>卡片详情预览</h3>
            <button class="btn-icon" @click="showAboutDetailModal = false">关闭</button>
          </div>
          <div class="modal-body">
            <div v-if="activeAboutCard" class="about-detail-content">
              <h2 class="modal-question">{{ activeAboutCard.question }}</h2>
              
              <!-- Profile Detail -->
              <div v-if="activeAboutCard.type === 'profile'" class="detail-profile">
                <img src="@/assets/img/Mikasa.jpg" class="large-avatar" />
                <h3>{{ activeAboutCard.name }}</h3>
                <p class="role">{{ activeAboutCard.role }}</p>
                <div class="timeline">
                  <div v-for="(exp, idx) in activeAboutCard.detail.experiences" :key="idx" class="timeline-item">
                    <span class="year">{{ exp.year }}</span>
                    <span class="event">{{ exp.event }}</span>
                  </div>
                </div>
                <p class="intro-text">{{ activeAboutCard.detail.intro }}</p>
              </div>

              <!-- Skills Detail -->
              <div v-else-if="activeAboutCard.type === 'skills'" class="detail-skills">
                <div class="skill-bars">
                  <div v-for="skill in activeAboutCard.detail.main" :key="skill.name" class="skill-bar-item">
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
                    <span v-for="tool in activeAboutCard.detail.tools" :key="tool">{{ tool }}</span>
                  </div>
                </div>
              </div>

              <!-- Hobbies Detail -->
              <div v-else-if="activeAboutCard.type === 'hobbies'" class="detail-hobbies">
                <div class="hobby-grid">
                  <div v-for="hobby in activeAboutCard.detail.list" :key="hobby.name" class="hobby-item">
                    <span class="hobby-icon">{{ hobby.icon }}</span>
                    <h4>{{ hobby.name }}</h4>
                    <p>{{ hobby.desc }}</p>
                  </div>
                </div>
              </div>

              <!-- Social Detail -->
              <div v-else-if="activeAboutCard.type === 'social'" class="detail-social">
                <p class="social-text">{{ activeAboutCard.detail.text }}</p>
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
              <div v-else-if="activeAboutCard.type === 'quote'" class="detail-quote">
                <blockquote class="big-quote">{{ activeAboutCard.answer }}</blockquote>
                <cite>{{ activeAboutCard.subAnswer }}</cite>
                <div class="quote-divider"></div>
                <p class="quote-note">{{ activeAboutCard.detail.text }}</p>
              </div>

              <!-- Generic Text Detail -->
              <div v-else class="detail-text">
                <p class="main-answer">{{ activeAboutCard.answer }}</p>
                <p v-if="activeAboutCard.detail && activeAboutCard.detail.text" class="sub-text">{{ activeAboutCard.detail.text }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="action-btn" @click="showAboutDetailModal = false">确定</button>
          </div>
        </div>
      </div>

      <!-- Git Publish Modal -->
      <div class="modal-mask" v-if="showGitModal" @click.self="!gitPublishing && (showGitModal = false)">
        <div class="modal-panel small-modal">
          <div class="modal-header">
            <h3>一键发布到 Git</h3>
            <button class="btn-icon" @click="showGitModal = false" :disabled="gitPublishing">关闭</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Commit 内容</label>
              <textarea v-model="gitCommitMessage" rows="4" :disabled="gitPublishing"></textarea>
            </div>
            <div v-if="gitPublishing" class="publishing-hint">
              正在执行 Git 操作... 请稍候
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showGitModal = false" :disabled="gitPublishing">取消</button>
            <button class="action-btn" @click="handleGitPublish" :disabled="gitPublishing">
              {{ gitPublishing ? '发布中...' : '确认发布' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Markdown Import Hidden Input -->
      <input ref="mdFileInput" type="file" accept=".md,.markdown" style="display: none" @change="handleMarkdownFileUpload" />

      <!-- History Drawer -->
      <div v-if="showHistoryDrawer" class="history-drawer-overlay" @click.self="showHistoryDrawer = false">
        <div class="history-drawer">
          <div class="drawer-header">
            <div class="drawer-title">
              <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3>{{ compareMode ? '版本对比' : '操作历史记录' }}</h3>
            </div>
            <div class="header-actions">
              <button 
                v-if="!compareMode && activeHistoryStack.length >= 2" 
                class="compare-toggle-btn" 
                @click="compareWithPrevious"
                title="对比上一版本"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5"/>
                  <path d="M16 21l-4-4-4 4M12 17l4 4 4-4"/>
                </svg>
                对比上一版
              </button>
              <button 
                v-if="!compareMode && activeHistoryStack.length >= 2" 
                class="compare-toggle-btn" 
                @click="compareWithInitial"
                title="对比初始版本"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                对比初始版
              </button>
              <button 
                v-if="!compareMode && activeHistoryStack.length > 1" 
                class="compare-toggle-btn" 
                @click="toggleCompareMode"
                title="自定义对比"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M12 3v18M3 12h18"/>
                </svg>
                版本对比
              </button>
              <button 
                v-if="compareMode" 
                class="compare-exit-btn" 
                @click="toggleCompareMode"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="11 17 6 12 11 7"/>
                  <polyline points="18 17 13 12 18 7"/>
                </svg>
                返回列表
              </button>
              <button class="btn-icon" @click="showHistoryDrawer = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="drawer-content">
            <div v-if="activeHistoryStack.length <= 1" class="empty-history">
              <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p>暂无历史操作记录</p>
              <span>对你的数据进行的所有修改都将显示在这里</span>
            </div>
            <div 
              v-for="(entry, idx) in [...activeHistoryStack].reverse()" 
              :key="entry.id" 
              class="history-entry"
              :class="{ 'current-state': idx === 0 }"
            >
              <div class="entry-timeline">
                <div class="timeline-dot" :class="getOperationClass(entry.operation)"></div>
                <div class="timeline-line" v-if="idx < [...activeHistoryStack].reverse().length - 1"></div>
              </div>
              
              <div class="entry-content">
                <div class="entry-header">
                  <div class="entry-main-info">
                    <span class="entry-badge" :class="getOperationClass(entry.operation)">
                      <component :is="getOperationIcon(entry.operation)" />
                      {{ getOperationLabel(entry.operation) }}
                    </span>
                    <span class="entry-time">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {{ formatTime(entry.timestamp) }}
                    </span>
                  </div>
                  <button 
                    v-if="idx > 0" 
                    class="rollback-btn" 
                    @click="rollbackTo(entry)"
                    title="回滚到此版本"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    回滚
                  </button>
                  <span v-else class="current-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    当前版本
                  </span>
                </div>
                
                <div class="entry-operation">
                  <span class="operation-text">{{ entry.operation }}</span>
                </div>
                
                <!-- Diff View -->
                <div v-if="activeHistoryStack.length - 1 - idx > 0" class="diff-container">
                  <div class="diff-summary">
                    <span class="summary-label">变更详情</span>
                    <div class="summary-stats">
                      <span v-if="getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx)?.added?.length" class="stat added">
                        +{{ getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).added.length }} {{ getItemNames(getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).added) }}
                      </span>
                      <span v-if="getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx)?.removed?.length" class="stat removed">
                        -{{ getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).removed.length }} {{ getItemNames(getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).removed) }}
                      </span>
                      <span v-if="getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx)?.changed?.length" class="stat modified">
                        ~{{ getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).changed.length }} {{ getChangedNames(getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).changed) }}
                      </span>
                    </div>
                  </div>
                  
                  <div v-if="getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx)" class="diff-content">
                    <div v-for="item in getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).added" :key="item._cms_id" class="diff-line added">
                      <div class="diff-line-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span class="diff-target">{{ item.name || item.title || item.question || '未命名项目' }}</span>
                      </div>
                      <span class="diff-type">新增</span>
                    </div>
                    
                    <div v-for="item in getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).removed" :key="item._cms_id" class="diff-line removed">
                      <div class="diff-line-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span class="diff-target">{{ item.name || item.title || item.question || '未命名项目' }}</span>
                      </div>
                      <span class="diff-type">已删除</span>
                    </div>
                    
                    <div v-for="change in getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).changed" :key="change.name" class="diff-line modified">
                      <div class="modified-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span class="diff-target">{{ change.name }}</span>
                      </div>
                      <div class="modified-details">
                        <div v-for="field in change.changes" :key="field.key" class="change-row">
                          <div class="field-info">
                            <span class="field-icon">●</span>
                            <span class="field-label">{{ formatFieldLabel(field.key) }}</span>
                          </div>
                          <div class="change-values">
                            <span class="val-old">{{ truncateValue(field.from) }}</span>
                            <span class="val-arrow">→</span>
                            <span class="val-new">{{ truncateValue(field.to) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-else-if="idx === 0" class="no-changes">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>当前状态，无变更</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Comparison View -->
          <template v-if="compareMode">
            <!-- Version Selection -->
            <div class="compare-selection" v-if="!compareVersions.left || !compareVersions.right">
              <div class="compare-pane">
                <div class="pane-header">
                  <span class="pane-title">选择左侧版本</span>
                </div>
                <div class="version-list">
                  <div 
                    v-for="(entry, idx) in [...activeHistoryStack].reverse()" 
                    :key="entry.id"
                    class="version-item"
                    :class="{ selected: compareVersions.left?.id === entry.id }"
                    @click="selectCompareVersion(entry, 'left')"
                  >
                    <div class="version-dot" :class="getOperationClass(entry.operation)"></div>
                    <div class="version-info">
                      <span class="version-op">{{ entry.operation }}</span>
                      <span class="version-time">{{ entry.timestamp }}</span>
                    </div>
                    <svg v-if="compareVersions.left?.id === entry.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="compare-divider">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
                </svg>
              </div>
              <div class="compare-pane">
                <div class="pane-header">
                  <span class="pane-title">选择右侧版本</span>
                </div>
                <div class="version-list">
                  <div 
                    v-for="(entry, idx) in [...activeHistoryStack].reverse()" 
                    :key="entry.id"
                    class="version-item"
                    :class="{ selected: compareVersions.right?.id === entry.id }"
                    @click="selectCompareVersion(entry, 'right')"
                  >
                    <div class="version-dot" :class="getOperationClass(entry.operation)"></div>
                    <div class="version-info">
                      <span class="version-op">{{ entry.operation }}</span>
                      <span class="version-time">{{ entry.timestamp }}</span>
                    </div>
                    <svg v-if="compareVersions.right?.id === entry.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Comparison Result -->
            <div v-else class="compare-result">
              <div class="compare-header-info">
                <div class="compare-version-info">
                  <div class="version-badge left">
                    <span class="version-time">{{ compareVersions.left.timestamp }}</span>
                    <span class="version-op">{{ compareVersions.left.operation }}</span>
                  </div>
                  <div class="compare-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <div class="version-badge right">
                    <span class="version-time">{{ compareVersions.right.timestamp }}</span>
                    <span class="version-op">{{ compareVersions.right.operation }}</span>
                  </div>
                  <button class="clear-compare-btn" @click="clearCompare" title="重新选择">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Statistics -->
              <div class="compare-stats">
                <div class="stat-card">
                  <div class="stat-value">{{ getCompareDiff()?.stats?.leftCount || 0 }}</div>
                  <div class="stat-label">左侧版本</div>
                </div>
                <div class="stat-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14"/>
                    <path d="M12 5l7 7-7 7"/>
                  </svg>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ getCompareDiff()?.stats?.rightCount || 0 }}</div>
                  <div class="stat-label">右侧版本</div>
                </div>
                <div class="stat-change" v-if="getCompareDiff()?.stats">
                  <span class="change-added" v-if="getCompareDiff().stats.added > 0">+{{ getCompareDiff().stats.added }}</span>
                  <span class="change-removed" v-if="getCompareDiff().stats.removed > 0">-{{ getCompareDiff().stats.removed }}</span>
                  <span class="change-modified" v-if="getCompareDiff().stats.modified > 0">~{{ getCompareDiff().stats.modified }}</span>
                </div>
              </div>
              
              <!-- Detailed Diff -->
              <div class="compare-diff-content" v-if="getCompareDiff()">
                <div class="diff-section" v-if="getCompareDiff().rightOnly.length > 0">
                  <div class="diff-section-header added">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    新增的项目 ({{ getCompareDiff().rightOnly.length }})
                  </div>
                  <div v-for="item in getCompareDiff().rightOnly" :key="item._cms_id" class="compare-diff-line added">
                    <span class="diff-name">{{ item.name || item.title || item.question || item.link || '未命名项目' }}</span>
                    <span class="diff-badge">新增</span>
                  </div>
                </div>
                
                <div class="diff-section" v-if="getCompareDiff().leftOnly.length > 0">
                  <div class="diff-section-header removed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    删除的项目 ({{ getCompareDiff().leftOnly.length }})
                  </div>
                  <div v-for="item in getCompareDiff().leftOnly" :key="item._cms_id" class="compare-diff-line removed">
                    <span class="diff-name">{{ item.name || item.title || item.question || item.link || '未命名项目' }}</span>
                    <span class="diff-badge">已删除</span>
                  </div>
                </div>
                
                <div class="diff-section" v-if="getCompareDiff().changed.length > 0">
                  <div class="diff-section-header modified">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    修改的项目 ({{ getCompareDiff().changed.length }})
                  </div>
                  <div v-for="(change, idx) in getCompareDiff().changed" :key="idx" class="compare-diff-line modified">
                    <div class="modified-item">
                      <span class="diff-name">{{ change.name }}</span>
                      <div class="changed-fields">
                        <div v-for="field in change.changes" :key="field.key" class="field-change">
                          <div class="field-header">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span class="field-name">{{ formatFieldLabel(field.key) }}</span>
                          </div>
                          <div class="field-values">
                            <span class="val-old" :title="String(field.left)">{{ truncateValue(field.left, 40) }}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-icon">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            <span class="val-new" :title="String(field.right)">{{ truncateValue(field.right, 40) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="getCompareDiff().rightOnly.length === 0 && getCompareDiff().leftOnly.length === 0 && getCompareDiff().changed.length === 0" class="no-differences">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>两个版本完全相同，无差异</span>
                </div>
                
                <div v-if="getCompareDiff().unchanged > 0" class="unchanged-info">
                  <span>{{ getCompareDiff().unchanged }} 个项目未变更</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="toast" :class="{ show: toast.show, error: toast.type === 'error' }">
        {{ toast.msg }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cms-root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: rgb(var(--color-bg-root));
  color: rgb(var(--color-text-primary));
  margin: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.cms-app {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, rgb(var(--color-bg-root)) 0%, rgb(var(--color-bg-secondary) / 0.5) 100%);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.content-area {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  background: linear-gradient(180deg, rgb(var(--color-bg-primary)) 0%, rgb(var(--color-bg-secondary) / 0.3) 100%);
}

/* 自定义下拉菜单样式 */
.custom-dropdown {
  position: relative;
  display: inline-block;
  z-index: 10;
}

.dropdown-toggle {
  height: 36px;
  padding: 0 16px;
  border-radius: 20px;
  border: 1px solid rgb(var(--color-border-primary) / 0.85);
  background: linear-gradient(145deg, rgb(var(--color-bg-primary)), rgb(var(--color-bg-secondary)));
  color: rgb(var(--color-text-primary));
  font-weight: 500;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 140px;
  width: 100%;
  
  &:hover {
    border-color: rgb(var(--color-accent) / 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(var(--color-accent), 0.15), 0 0 0 1px rgb(var(--color-accent) / 0.2);
  }
  
  &:active,
  &.active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(var(--color-accent), 0.12);
    border-color: rgb(var(--color-accent));
  }
  
  .dropdown-arrow {
    font-size: 0.75rem;
    transition: transform 0.25s ease;
    color: rgb(var(--color-text-secondary));
  }
  
  &.active .dropdown-arrow {
    transform: rotate(180deg);
    color: rgb(var(--color-accent));
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
  min-width: 180px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.25s ease;
  overflow: hidden;
  width: 100%;
  
  &.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  color: rgb(var(--color-text-primary));
  font-weight: 500;
  
  &:hover {
    background: rgba(var(--color-accent), 0.1);
    color: rgb(var(--color-accent));
    transform: translateX(4px);
  }
  
  &.selected {
    background: rgba(var(--color-accent), 0.15);
    color: rgb(var(--color-accent));
    font-weight: 600;
  }
  
  &:active {
    transform: translateX(2px);
    background: rgba(var(--color-accent), 0.2);
  }
}

/* 动态列表样式 */
.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dynamic-item {
  display: flex;
  gap: 8px;
  align-items: center;
  
  .small-input {
    width: 80px;
    padding: 8px 12px;
    border: 1px solid rgb(var(--color-border-primary) / 0.9);
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
    background: rgb(var(--color-bg-secondary) / 0.5);
    
    &:focus {
      border-color: rgb(var(--color-accent));
      box-shadow: 0 0 0 3px rgba(var(--color-accent), 0.1);
      background: rgb(var(--color-bg-primary));
    }
  }
  
  .icon-input {
    width: 60px;
    padding: 8px 12px;
    border: 1px solid rgb(var(--color-border-primary) / 0.9);
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
    background: rgb(var(--color-bg-secondary) / 0.5);
    text-align: center;
    
    &:focus {
      border-color: rgb(var(--color-accent));
      box-shadow: 0 0 0 3px rgba(var(--color-accent), 0.1);
      background: rgb(var(--color-bg-primary));
    }
  }
  
  .flex-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid rgb(var(--color-border-primary) / 0.9);
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
    background: rgb(var(--color-bg-secondary) / 0.5);
    
    &:focus {
      border-color: rgb(var(--color-accent));
      box-shadow: 0 0 0 3px rgba(var(--color-accent), 0.1);
      background: rgb(var(--color-bg-primary));
    }
  }
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(1.05);
  }
}

.add-btn {
  padding: 8px 16px;
  border: 1px dashed rgb(var(--color-border-primary) / 0.9);
  border-radius: 8px;
  background: transparent;
  color: rgb(var(--color-accent));
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: 4px;
  
  &:hover {
    background: rgba(var(--color-accent), 0.1);
    border-color: rgb(var(--color-accent));
  }
}

/* 标签输入容器样式 */
.tag-input-container {
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 12px;
  padding: 12px;
  background: rgb(var(--color-bg-secondary) / 0.5);
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: rgb(var(--color-accent));
    box-shadow: 0 0 0 3px rgba(var(--color-accent), 0.1);
    background: rgb(var(--color-bg-primary));
  }
  
  input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 8px;
    font-size: 0.9rem;
    color: rgb(var(--color-text-primary));
    
    &::placeholder {
      color: rgb(var(--color-text-secondary));
    }
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(var(--color-accent), 0.1);
  color: rgb(var(--color-accent));
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.tag-remove {
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compare-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-accent) / 0.4);
  background: transparent;
  color: rgb(var(--color-accent));
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgb(var(--color-accent));
    color: white;
    border-color: rgb(var(--color-accent));
  }
}

.compare-exit-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-text-secondary) / 0.4);
  background: transparent;
  color: rgb(var(--color-text-secondary));
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgb(var(--color-bg-secondary));
    color: rgb(var(--color-text-primary));
  }
}

/* Comparison Styles */
.compare-selection {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.compare-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgb(var(--color-bg-secondary) / 0.2);
  border: 1px solid rgb(var(--color-border-primary) / 0.4);
  border-radius: 12px;
  overflow: hidden;
}

.pane-header {
  padding: 12px 16px;
  background: rgb(var(--color-bg-secondary) / 0.4);
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.3);

  .pane-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgb(var(--color-text-secondary));
  }
}

.version-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.version-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;

  &:hover {
    background: rgb(var(--color-bg-secondary) / 0.4);
  }

  &.selected {
    background: rgb(var(--color-accent) / 0.1);
    border: 1px solid rgb(var(--color-accent) / 0.4);
  }
}

.version-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid;
  flex-shrink: 0;

  &.op-add {
    border-color: #10b981;
    background: #ecfdf5;
  }

  &.op-delete {
    border-color: #ef4444;
    background: #fef2f2;
  }

  &.op-edit {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  &.op-move {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.op-save {
    border-color: #8b5cf6;
    background: #f5f3ff;
  }

  &.op-load {
    border-color: #6b7280;
    background: #f3f4f6;
  }

  &.op-default {
    border-color: rgb(var(--color-accent));
    background: rgba(var(--color-accent), 0.1);
  }
}

.version-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  .version-op {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgb(var(--color-text-primary));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .version-time {
    font-size: 0.7rem;
    color: rgb(var(--color-text-secondary));
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
}

.compare-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--color-text-secondary));
  opacity: 0.4;
}

.compare-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: rgb(var(--color-bg-secondary) / 0.15);
  border-radius: 12px;
  border: 1px solid rgb(var(--color-border-primary) / 0.4);
}

.compare-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compare-version-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.version-badge {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  border-radius: 10px;
  flex: 1;

  &.left {
    background: #fef2f2;
    border: 1px solid rgba(239, 68, 68, 0.3);

    .version-time { color: #dc2626; }
    .version-op { color: #991b1b; }
  }

  &.right {
    background: #ecfdf5;
    border: 1px solid rgba(16, 185, 129, 0.3);

    .version-time { color: #059669; }
    .version-op { color: #166534; }
  }

  .version-time {
    font-size: 0.7rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .version-op {
    font-size: 0.85rem;
    font-weight: 600;
  }
}

.compare-arrow {
  color: rgb(var(--color-text-secondary));
  opacity: 0.5;
}

.clear-compare-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-border-primary) / 0.4);
  background: transparent;
  color: rgb(var(--color-text-secondary));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgb(var(--color-bg-secondary));
    color: rgb(var(--color-text-primary));
  }
}

.compare-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 16px;
  background: rgb(var(--color-bg-secondary) / 0.3);
  border-radius: 10px;
}

.stat-card {
  text-align: center;
  min-width: 80px;

  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: rgb(var(--color-text-primary));
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgb(var(--color-text-secondary));
    margin-top: 4px;
  }
}

.stat-arrow {
  color: rgb(var(--color-text-secondary));
  opacity: 0.4;
}

.stat-change {
  display: flex;
  gap: 8px;

  span {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .change-added {
    background: #ecfdf5;
    color: #059669;
  }

  .change-removed {
    background: #fef2f2;
    color: #dc2626;
  }

  .change-modified {
    background: #fffbeb;
    color: #d97706;
  }
}

.compare-diff-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.compare-diff-line {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid;

  &.added {
    background: #f0fdf4;
    border-color: #22c55e;

    .diff-icon { color: #15803d; }
    .diff-badge { background: #dcfce7; color: #166534; }
  }

  &.removed {
    background: #fef2f2;
    border-color: #f87171;

    .diff-icon { color: #b91c1c; }
    .diff-badge { background: #fee2e2; color: #991b1b; }
  }

  &.modified {
    background: #fffbeb;
    border-color: #fbbf24;

    .diff-icon { color: #b45309; }
  }

  .diff-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .diff-name {
    flex: 1;
    font-weight: 500;
    font-size: 0.85rem;
    color: rgb(var(--color-text-primary));
  }

  .diff-badge {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
    flex-shrink: 0;
  }
}

.changed-fields {
  margin-left: 24px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.field-change {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;

  .field-name {
    font-size: 0.75rem;
    color: rgb(var(--color-text-secondary));
    font-weight: 500;
  }

  .field-values {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .val-old {
    text-decoration: line-through;
    color: #dc2626;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .val-arrow {
    color: rgb(var(--color-text-secondary));
    opacity: 0.5;
  }

  .val-new {
    color: #059669;
    font-weight: 600;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.no-differences {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 20px;
  color: #059669;
  font-size: 1rem;
  font-weight: 500;
}

.unchanged-info {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: rgb(var(--color-bg-secondary) / 0.3);
  border-radius: 8px;
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
  margin-top: 8px;
}

.diff-section {
  margin-bottom: 12px;
}

.diff-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px 6px 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  
  &.added {
    background: #ecfdf5;
    color: #059669;
  }
  
  &.removed {
    background: #fef2f2;
    color: #dc2626;
  }
  
  &.modified {
    background: #fffbeb;
    color: #d97706;
  }
}

.modified-item {
  width: 100%;
  
  .diff-name {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
  }
}

.field-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  color: rgb(var(--color-text-secondary));
  font-size: 0.75rem;
}

.arrow-icon {
  flex-shrink: 0;
  color: rgb(var(--color-text-secondary));
  opacity: 0.5;
}

/* Common UI Elements */
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
  
  &.wide-modal { width: 720px; }
  &.small-modal { width: 500px; }
  &.about-detail-panel { width: 600px; border-radius: 30px; }
  &.friend-modal { width: 850px; }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 { margin: 0; font-size: 1.1rem; }
}

.header-actions {
  display: flex;
  align-items: center;
}

.modal-body {
  padding: 24px;
  max-height: min(70vh, 760px);
  overflow: hidden;

  &.friend-modal-body {
    display: flex;
    gap: 32px;
    padding: 32px;
    overflow: visible;

    .form-section {
      flex: 1.2;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .preview-section {
      flex: 1;
      background: rgb(var(--color-bg-secondary) / 0.3);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px dashed rgb(var(--color-border-primary) / 0.5);

      .preview-title {
        margin: 0 0 20px 0;
        color: rgb(var(--color-text-secondary));
        font-size: 0.9rem;
        font-weight: 600;
      }

      .preview-card-container {
        width: 100%;
        pointer-events: none;
      }
    }
  }
}

.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 8px;

  input {
    margin-bottom: 0 !important;
  }
}

.modal-footer {
  padding: 16px 24px;
  background: rgb(var(--color-bg-secondary));
  border-top: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* History Drawer Styles */
.history-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  backdrop-filter: blur(4px);
}

.history-drawer {
  width: 520px;
  max-width: 100%;
  height: 100%;
  background: rgb(var(--color-bg-primary));
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
}

.drawer-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgb(var(--color-bg-secondary) / 0.3);
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 12px;

  .header-icon {
    width: 24px;
    height: 24px;
    color: rgb(var(--color-accent));
  }

  h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    color: rgb(var(--color-text-primary));
  }
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;

  .empty-icon {
    width: 64px;
    height: 64px;
    color: rgb(var(--color-text-secondary));
    opacity: 0.3;
    margin-bottom: 20px;
  }

  p {
    margin: 0 0 8px 0;
    font-size: 1.05rem;
    color: rgb(var(--color-text-secondary));
    font-weight: 500;
  }

  span {
    font-size: 0.85rem;
    color: rgb(var(--color-text-secondary));
    opacity: 0.6;
  }
}

.history-entry {
  display: flex;
  gap: 16px;
  padding: 20px;
  margin-bottom: 8px;
  background: rgb(var(--color-bg-secondary) / 0.15);
  border: 1px solid rgb(var(--color-border-primary) / 0.4);
  border-radius: 16px;
  transition: all 0.25s ease;

  &.current-state {
    border-color: rgb(var(--color-accent) / 0.35);
    background: rgb(var(--color-accent) / 0.04);
    box-shadow: 0 4px 20px rgba(var(--color-accent), 0.08);
  }

  &:hover {
    border-color: rgb(var(--color-accent) / 0.25);
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }
}

.entry-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
  background: rgb(var(--color-bg-primary));
  z-index: 1;
  flex-shrink: 0;

  &.op-add {
    border-color: #10b981;
    background: #ecfdf5;
  }

  &.op-delete {
    border-color: #ef4444;
    background: #fef2f2;
  }

  &.op-edit {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  &.op-move {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.op-save {
    border-color: #8b5cf6;
    background: #f5f3ff;
  }

  &.op-load {
    border-color: #6b7280;
    background: #f3f4f6;
  }

  &.op-default {
    border-color: rgb(var(--color-accent));
    background: rgba(var(--color-accent), 0.1);
  }
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: rgb(var(--color-border-primary) / 0.3);
  margin-top: 8px;
  min-height: 20px;
}

.entry-content {
  flex: 1;
  min-width: 0;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 12px;
}

.entry-main-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.entry-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  &.op-add {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  &.op-delete {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  &.op-edit {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  &.op-move {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  &.op-save {
    background: #f5f3ff;
    color: #7c3aed;
    border: 1px solid rgba(139, 92, 246, 0.3);
  }

  &.op-load {
    background: #f3f4f6;
    color: #4b5563;
    border: 1px solid rgba(107, 114, 128, 0.3);
  }

  &.op-default {
    background: rgba(var(--color-accent), 0.1);
    color: rgb(var(--color-accent));
    border: 1px solid rgba(var(--color-accent), 0.3);
  }
}

.entry-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: rgb(var(--color-text-secondary));
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.rollback-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-accent) / 0.4);
  background: transparent;
  color: rgb(var(--color-accent));
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: rgb(var(--color-accent));
    color: white;
    border-color: rgb(var(--color-accent));
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
}

.current-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #059669;
  background: #ecfdf5;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.entry-operation {
  margin-bottom: 12px;

  .operation-text {
    font-size: 0.9rem;
    color: rgb(var(--color-text-primary));
    font-weight: 500;
    line-height: 1.5;
  }
}

.diff-container {
  margin-top: 12px;
}

.diff-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: rgb(var(--color-bg-secondary) / 0.3);
  border-radius: 8px;
  margin-bottom: 12px;

  .summary-label {
    font-size: 0.7rem;
    color: rgb(var(--color-text-secondary));
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .summary-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .stat {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 4px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.added {
      background: #ecfdf5;
      color: #059669;
    }

    &.removed {
      background: #fef2f2;
      color: #dc2626;
    }

    &.modified {
      background: #fffbeb;
      color: #d97706;
    }
  }
}

.diff-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diff-line {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.5;
  border-left: 3px solid;

  &.added {
    background: #f0fdf4;
    color: #166534;
    border-color: #22c55e;

    .diff-line-header {
      color: #15803d;
    }

    .diff-type {
      background: #dcfce7;
      color: #166534;
    }
  }

  &.removed {
    background: #fef2f2;
    color: #991b1b;
    border-color: #f87171;

    .diff-line-header {
      color: #b91c1c;
    }

    .diff-type {
      background: #fee2e2;
      color: #991b1b;
    }
  }

  &.modified {
    background: #fffbeb;
    color: #92400e;
    border-color: #fbbf24;

    .modified-header {
      color: #b45309;
    }
  }
}

.diff-line-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  .diff-target {
    flex: 1;
    word-break: break-all;
  }
}

.diff-type {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
}

.modified-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-bottom: 8px;

  .diff-target {
    flex: 1;
    word-break: break-all;
  }
}

.modified-details {
  margin-left: 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.change-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 6px;

  .field-icon {
    font-size: 0.6rem;
    color: rgb(var(--color-text-secondary));
    opacity: 0.6;
  }

  .field-label {
    font-size: 0.75rem;
    color: rgb(var(--color-text-secondary));
    font-weight: 500;
  }
}

.change-values {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  margin-left: 18px;
}

.val-old {
  text-decoration: line-through;
  opacity: 0.6;
  color: #dc2626;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.val-arrow {
  opacity: 0.5;
  color: rgb(var(--color-text-secondary));
}

.val-new {
  font-weight: 600;
  color: #059669;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-changes {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #ecfdf5;
  border-radius: 8px;
  color: #059669;
  font-size: 0.8rem;
  font-weight: 500;
}

.empty-history {
  text-align: center;
  padding: 60px 0;
  color: rgb(var(--color-text-secondary));
  opacity: 0.6;
}

.form-grid { display: grid; gap: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.form-group {
  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: rgb(var(--color-text-secondary));
    margin-bottom: 8px;
    display: block;
  }
  input, textarea, select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid rgb(var(--color-border-primary) / 0.9);
    border-radius: 10px;
    font-size: 0.95rem;
    outline: none;
    background: transparent;
    color: inherit;
  }
}

.btn-icon {
  background: rgb(var(--color-bg-secondary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  color: rgb(var(--color-text-primary));
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn-secondary {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  color: rgb(var(--color-text-primary));
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
}

.action-btn {
  background: rgb(var(--color-accent));
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 500;
  cursor: pointer;
}

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  padding: 16px 36px;
  background: #10b981;
  color: white;
  border-radius: 999px;
  transform: translate(-50%, calc(-50% + 12px));
  opacity: 0;
  transition: all 0.22s ease;
  z-index: 1000;
  pointer-events: none;
  &.show { opacity: 1; transform: translate(-50%, -50%); }
  &.error { background: #ef4444; }
}

.publishing-hint {
  margin-top: 16px;
  text-align: center;
  color: rgb(var(--color-text-secondary));
}

.img-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #eee;
}

.file-upload-btn {
  font-size: 0.85rem;
  position: relative;
  overflow: hidden;
  display: block;
}

.hidden-file-input {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  cursor: pointer;
}

/* Button with Tooltip Styles */
.button-with-tooltip {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 12px;
  background: linear-gradient(135deg, rgb(var(--color-bg-primary)) 0%, rgb(var(--color-bg-secondary)) 100%);
  border: 1px solid rgb(var(--color-border-primary));
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18), 0 8px 24px rgba(15, 23, 42, 0.12);
  z-index: 1000;
  font-size: 0.85rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateY(8px) scale(0.95);
  max-width: 320px;
  overflow: visible;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--color-border-primary), 0.8);

  /* 添加三角指示器 */
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 24px;
    width: 16px;
    height: 16px;
    background: inherit;
    border-top: 1px solid rgba(var(--color-border-primary), 0.8);
    border-left: 1px solid rgba(var(--color-border-primary), 0.8);
    transform: rotate(45deg);
    z-index: -1;
  }

  .tooltip-title {
    font-weight: 600;
    color: rgb(var(--color-text-primary));
    margin-bottom: 8px;
    font-size: 0.9rem;
    display: block;
  }

  pre {
    margin: 0;
    font-family: 'Fira Code', 'Consolas', monospace;
    color: rgb(var(--color-text-primary));
    background: rgba(var(--color-bg-secondary), 0.8);
    padding: 12px;
    border-radius: 8px;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.5;
    font-size: 0.8rem;
    border: 1px solid rgba(var(--color-border-primary), 0.5);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
  }

  .tooltip-hint {
    font-size: 0.75rem;
    color: rgb(var(--color-text-secondary));
    margin-top: 8px;
    display: block;
    text-align: center;
  }
}

/* Import JSON Buttons Styles */
.import-json-buttons {
  display: flex;
  align-items: center;
}

.btn-secondary {
  background: linear-gradient(135deg, rgb(var(--color-bg-secondary)) 0%, rgb(var(--color-bg-primary)) 100%);
  border: 1px solid rgb(var(--color-border-primary));
  color: rgb(var(--color-text-primary));
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, rgb(var(--color-bg-primary)) 0%, rgb(var(--color-bg-secondary)) 100%);
  border-color: rgb(var(--color-accent) / 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.btn-secondary:active {
  transform: translateY(0);
}

.button-with-tooltip:hover .tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}

/* About Detail Modal Styles */
.about-detail-content {
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
}
</style>
