
<script setup>
import { computed, onMounted, reactive, ref, watch, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { 
  CheckOutlined, 
  CloseOutlined, 
  DeleteOutlined, 
  EditOutlined,
  CloudUploadOutlined,
  CopyOutlined 
} from '@ant-design/icons-vue'

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
  apiUrl, 
  apiFetch, 
  normalizeUrl, 
  truncate, 
  linkify,
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

const loadPosts = async () => {
  try {
    const res = await apiFetch('/api/posts')
    if (!res.ok) throw new Error('load failed')
    const data = await res.json()
    const loaded = Array.isArray(data) ? data.map(p => ({ ...p, _cms_id: p.slug })) : []
    const localOrder = readLocalPostOrder()
    posts.value = applyPostOrder(loaded, localOrder)
    
    if (historyStacks.posts.length === 0) {
      historyStacks.posts = [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        operation: 'Initial Load',
        data: JSON.parse(JSON.stringify(posts.value)),
        target: 'posts'
      }]
    }
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
    showToast(`文章排序保存失败: ${e.message}`, 'error')
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
    await loadPosts()
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

const activeHistoryStack = computed(() => {
  return currentView.value === 'article_list' || currentView.value === 'taxonomy_manager' ? historyStacks.posts : historyStacks.listData
})

const canUndo = computed(() => activeHistoryStack.value.length > 1)

const pushHistory = (data, operation = 'Unknown Operation', target = 'listData') => {
  if (!data) return
  const snapshot = JSON.parse(JSON.stringify(data))
  
  // Only push if data is different from last state
  const stack = target === 'posts' ? historyStacks.posts : historyStacks.listData
  const lastEntry = stack[stack.length - 1]
  if (lastEntry && JSON.stringify(lastEntry.data) === JSON.stringify(snapshot)) return
  
  stack.push({
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    operation,
    data: snapshot,
    target
  })
  
  if (stack.length > maxHistory) {
    stack.shift()
  }
}

const rollbackTo = async (historyEntry) => {
  if (!historyEntry) return
  const target = historyEntry.target === 'posts' ? 'posts' : 'listData'
  const stack = target === 'posts' ? historyStacks.posts : historyStacks.listData
  const restored = JSON.parse(JSON.stringify(historyEntry.data))
  if (target === 'posts') {
    posts.value = Array.isArray(restored) ? restored : []
  } else {
    listData.value = Array.isArray(restored) ? restored : []
  }
  
  // Truncate history stack to this point
  const index = stack.findIndex(h => h.id === historyEntry.id)
  if (index !== -1) {
    const next = stack.slice(0, index + 1)
    if (target === 'posts') historyStacks.posts = next
    else historyStacks.listData = next
  }
  
  if (target === 'posts') {
    await savePostOrderToServer()
  } else {
    await (currentView.value === 'aboutData.js' ? saveAboutData() : saveDataToServer())
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
    posts.value = Array.isArray(restored) ? restored : []
    await savePostOrderToServer()
  } else {
    listData.value = Array.isArray(restored) ? restored : []
    await (currentView.value === 'aboutData.js' ? saveAboutData() : saveDataToServer())
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
      
      // Reset history for new file
      historyStacks.listData = [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        operation: 'Initial Load',
        data: JSON.parse(JSON.stringify(processedData)),
        target: 'listData'
      }]
      
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
      await loadPosts()
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
    let cleanJson = input.trim()
    // 移除注释
    cleanJson = cleanJson.replace(/\/\/.*$/gm, '')
    
    // 提取字段的正则表达式
    const nameMatch = cleanJson.match(/"name":\s*"([^"]*)"/)
    const descMatch = cleanJson.match(/"desc":\s*"([^"]*)"/)
    const linkMatch = cleanJson.match(/"link":\s*"([^"]*)"/)
    const avatarMatch = cleanJson.match(/"avatar":\s*"(.*?)"/)

    if (nameMatch) editingItem.value.name = nameMatch[1]
    if (descMatch) editingItem.value.desc = descMatch[1]
    if (linkMatch) editingItem.value.link = linkMatch[1]
    
    if (avatarMatch) {
      const val = avatarMatch[1]
      // 提取 new URL 中的路径
      const pathMatch = val.match(/new URL\(['"](.*?)['"]/)
      if (pathMatch) {
        editingItem.value.avatar = pathMatch[1]
      } else {
        editingItem.value.avatar = val
      }
    }
    
    showToast('JSON 导入成功')
  } catch (err) {
    showToast('JSON 解析失败: ' + err.message, 'error')
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
  await saveAboutData()
}

const onAboutTypeChange = () => {
  const prev = aboutEditingItem.value || {}
  const next = makeAboutTemplate(prev.type, { id: prev.id, question: prev.question })
  aboutEditingItem.value = ensureAboutShape({ ...next, id: prev.id, question: prev.question })
}

const saveAboutData = async () => {
  try {
    await apiFetch('/api/data?file=aboutData.js', { method: 'POST', body: JSON.stringify(listData.value) })
    showToast('关于页已发布')
  } catch {
    showToast('发布失败', 'error')
  }
}

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

  await saveAboutData()
  showAboutModal.value = false
}

onMounted(() => {
  loadCategories()
  loadPosts()
  loadMedia()
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
            @saveAboutData="saveAboutData"
            @update:listData="val => { listData = val; pushHistory(val, '重新排序关于卡片'); saveAboutData() }"
          />

          <MediaManager 
            v-else-if="currentView === 'media_manager'"
          />

          <TaxonomyManager 
            v-else-if="currentView === 'taxonomy_manager'"
            :posts="posts"
            :categories="categories"
            @refresh="() => { loadPosts(); loadCategories(); }"
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
              <button v-if="currentView === 'friendList.js'" class="btn-secondary" @click="importFromJson" style="margin-right: 12px">导入 JSON</button>
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
                  <select v-model="aboutEditingItem.type" @change="onAboutTypeChange">
                    <option v-for="t in aboutTypeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
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
              <div v-if="aboutEditingItem.type === 'profile'">
                <div class="form-row">
                  <div class="form-group">
                    <label>名字</label>
                    <input v-model="aboutEditingItem.name" />
                  </div>
                  <div class="form-group">
                    <label>角色</label>
                    <input v-model="aboutEditingItem.role" />
                  </div>
                </div>
                <div class="form-group">
                  <label>一句话回答</label>
                  <textarea v-model="aboutEditingItem.answer" rows="2"></textarea>
                </div>
              </div>
              <div v-else>
                <div class="form-group">
                  <label>回答</label>
                  <textarea v-model="aboutEditingItem.answer" rows="3"></textarea>
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
              <div class="detail-text">
                <p class="main-answer">{{ activeAboutCard.answer }}</p>
                <p v-if="activeAboutCard.detail?.text" class="sub-text">{{ activeAboutCard.detail.text }}</p>
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
            <h3>操作历史记录</h3>
            <button class="btn-icon" @click="showHistoryDrawer = false">关闭</button>
          </div>
          <div class="drawer-content">
            <div v-if="activeHistoryStack.length <= 1" class="empty-history">
              暂无历史操作记录
            </div>
            <div 
              v-for="(entry, idx) in [...activeHistoryStack].reverse()" 
              :key="entry.id" 
              class="history-entry"
              :class="{ 'current-state': idx === 0 }"
            >
              <div class="entry-main">
                <div class="entry-info">
                  <span class="entry-time">{{ entry.timestamp }}</span>
                  <span class="entry-op">{{ entry.operation }}</span>
                </div>
                <button 
                  v-if="idx > 0" 
                  class="rollback-btn" 
                  @click="rollbackTo(entry)"
                >
                  回滚
                </button>
                <span v-else class="current-tag">当前</span>
              </div>
              
              <!-- Diff View -->
              <div v-if="activeHistoryStack.length - 1 - idx > 0" class="diff-container">
                <div v-if="getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx)" class="diff-content">
                  <!-- Added -->
                  <div v-for="item in getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).added" :key="item._cms_id" class="diff-line added">
                    <span class="diff-sign">+</span>
                    <span class="diff-text">新增: {{ item.name || item.title || item.question || '项目' }}</span>
                  </div>
                  <!-- Removed -->
                  <div v-for="item in getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).removed" :key="item._cms_id" class="diff-line removed">
                    <span class="diff-sign">-</span>
                    <span class="diff-text">删除: {{ item.name || item.title || item.question || '项目' }}</span>
                  </div>
                  <!-- Changed -->
                  <div v-for="change in getDiff(activeHistoryStack, activeHistoryStack.length - 1 - idx).changed" :key="change.name" class="diff-line modified">
                    <div class="modified-header">
                      <span class="diff-sign">M</span>
                      <span class="diff-text">修改: {{ change.name }}</span>
                    </div>
                    <div class="modified-details">
                      <div v-for="field in change.changes" :key="field.key" class="change-row">
                        <span class="field-label">{{ field.key }}</span>
                        <div class="change-values">
                          <span class="val-old">{{ field.from || '空' }}</span>
                          <span class="val-arrow">→</span>
                          <span class="val-new">{{ field.to || '空' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
  overflow: auto;

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
  background: rgba(0, 0, 0, 0.2);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

.history-drawer {
  width: 420px;
  height: 100%;
  background: rgb(var(--color-bg-primary));
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
}

.drawer-header {
  padding: 24px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 { margin: 0; font-size: 1.1rem; }
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-entry {
  border: 1px solid rgb(var(--color-border-primary) / 0.6);
  border-radius: 12px;
  padding: 16px;
  background: rgb(var(--color-bg-secondary) / 0.2);
  transition: all 0.2s;

  &.current-state {
    border-color: rgb(var(--color-accent) / 0.4);
    background: rgb(var(--color-accent) / 0.03);
  }

  &:hover {
    border-color: rgb(var(--color-accent) / 0.3);
  }
}

.entry-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.entry-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entry-time {
  font-size: 0.75rem;
  color: rgb(var(--color-text-secondary));
  font-family: monospace;
}

.entry-op {
  font-weight: 600;
  font-size: 0.9rem;
}

.rollback-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgb(var(--color-accent) / 0.5);
  background: transparent;
  color: rgb(var(--color-accent));
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgb(var(--color-accent));
    color: white;
  }
}

.current-tag {
  font-size: 0.75rem;
  color: rgb(var(--color-accent));
  background: rgb(var(--color-accent) / 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.diff-container {
  font-size: 0.8rem;
  border-top: 1px dashed rgb(var(--color-border-primary) / 0.5);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diff-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.diff-line {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1.4;

  &.added {
    background: #ecfdf5;
    color: #065f46;
    .diff-sign { color: #10b981; }
  }

  &.removed {
    background: #fef2f2;
    color: #991b1b;
    .diff-sign { color: #ef4444; }
  }

  &.modified {
    background: #fdfcea;
    color: #854d0e;
    flex-direction: column;
    .diff-sign { color: #eab308; }
  }
}

.diff-sign {
  font-family: monospace;
  font-weight: 900;
  width: 12px;
}

.modified-header {
  display: flex;
  gap: 8px;
}

.modified-details {
  margin-left: 20px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.change-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.field-label {
  color: rgb(var(--color-text-secondary));
  font-size: 0.75rem;
  min-width: 40px;
}

.change-values {
  display: flex;
  gap: 6px;
  align-items: baseline;
  word-break: break-all;
}

.val-old {
  text-decoration: line-through;
  opacity: 0.6;
}

.val-arrow {
  opacity: 0.4;
}

.val-new {
  font-weight: 600;
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
</style>
