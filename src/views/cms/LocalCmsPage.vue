
<script setup>
import { computed, onMounted, reactive, ref, watch, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { 
  CheckOutlined, 
  CloseOutlined, 
  DeleteOutlined, 
  EditOutlined,
  CloudUploadOutlined 
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
const currentView = ref('article')
const loading = ref(false)
const toast = reactive({ show: false, msg: '', type: 'success' })

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
const articleForm = reactive({
  title: '',
  description: '',
  cover: '',
  date: new Date().toISOString().split('T')[0],
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
    String(p.slug || '').toLowerCase().includes(q)
  )
})

const loadPosts = async () => {
  try {
    const res = await apiFetch('/api/posts')
    if (!res.ok) throw new Error('load failed')
    const data = await res.json()
    posts.value = Array.isArray(data) ? data : []
  } catch {
    posts.value = []
    showToast('文章列表加载失败', 'error')
  }
}

const deletePost = async (slug) => {
  if (!window.confirm(`确定要删除文章 "${slug}" 吗？此操作不可撤销。`)) return
  loading.value = true
  try {
    const res = await apiFetch(`/api/post?slug=${encodeURIComponent(slug)}`, {
      method: 'DELETE'
    })
    const json = await res.json()
    if (!res.ok || !json?.success) throw new Error(json?.message || 'delete failed')
    showToast('文章已删除')
    await loadPosts()
  } catch (e) {
    showToast('删除失败: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

const resetArticleForm = () => {
  selectedSlug.value = ''
  articleForm.title = ''
  articleForm.description = ''
  articleForm.cover = ''
  articleForm.date = new Date().toISOString().split('T')[0]
  articleForm.category = ''
  articleForm.tags = []
  articleForm.content = ''
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
    articleForm.title = String(data.title ?? '')
    articleForm.description = String(data.description ?? '')
    articleForm.cover = String(data.cover ?? '')
    articleForm.date = String(data.date ?? '').slice(0, 10)
    articleForm.category = String(data.category ?? '')
    articleForm.tags = Array.isArray(data.tags) ? data.tags : []
    articleForm.content = String(json.content ?? '')
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
    if (fm.title) articleForm.title = fm.title
    if (fm.description) articleForm.description = fm.description
    if (fm.cover) articleForm.cover = fm.cover
    if (fm.category) articleForm.category = fm.category
    if (fm.date) articleForm.date = String(fm.date).slice(0, 10)
    if (Array.isArray(fm.tags)) articleForm.tags = fm.tags
    articleForm.content = parsed.body
  } else {
    if (!articleForm.title && fileName) {
      const base = fileName.replace(/\.(md|markdown)$/i, '')
      if (base) articleForm.title = base
    }
    articleForm.content = String(markdownText ?? '')
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
      listData.value = data
      if (file === 'aboutData.js') {
        jsonContent.value = JSON.stringify(data, null, 4)
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
        articleForm.content += imgMd
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
    articleForm.cover = url
  })
}

const uploadFileGeneric = async (file, onSuccess) => {
  const fileName = `img-${Date.now()}-${file.name}`
  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      headers: { 'X-File-Name': fileName },
      body: file
    })
    const result = await res.json()
    if (result.success) onSuccess(result.url)
    else showToast('上传失败', 'error')
  } catch {
    showToast('网络错误', 'error')
  }
}

const submitArticle = async () => {
  if (!articleForm.title) return showToast('请填写标题', 'error')
  loading.value = true
  try {
    let res;
    if (selectedSlug.value) {
      const payload = {
        data: { ...articleForm },
        content: articleForm.content
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
        body: JSON.stringify(articleForm) 
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

const editItem = (index) => {
  isEdit.value = true
  editingIndex.value = index
  editingItem.value = JSON.parse(JSON.stringify(listData.value[index]))
  showModal.value = true
}

const deleteItem = async (index) => {
  if (!window.confirm('确认删除此项吗？')) return
  const nextData = [...listData.value]
  nextData.splice(index, 1)
  listData.value = nextData
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
  if (isEdit.value) {
    nextData[editingIndex.value] = { ...editingItem.value }
  } else {
    nextData.unshift({ ...editingItem.value })
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
  const nextData = [...listData.value]
  nextData.splice(index, 1)
  listData.value = nextData
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
  } else {
    nextData.unshift(item)
  }
  listData.value = nextData

  await saveAboutData()
  showAboutModal.value = false
}

onMounted(() => {
  loadCategories()
  loadPosts()
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
          @openAddModal="openAddModal"
        />

        <div class="content-area">
          <ArticleList 
            v-if="currentView === 'article_list'"
            :filteredPosts="filteredPosts"
            v-model:query="query"
            @openPost="openPost"
            @deletePost="deletePost"
            @createNewArticle="currentView = 'article'; resetArticleForm()"
          />

          <ArticleEditor 
            v-else-if="currentView === 'article'"
            v-model:articleForm="articleForm"
            :showPreview="showPreview"
            :showMeta="showMeta"
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
              @deleteItem="deleteItem"
            />
            <PhotoManager 
              v-else-if="currentView === 'photos.js'"
              :listData="listData"
              @editItem="editItem"
              @deleteItem="deleteItem"
            />
            <QuoteManager 
              v-else-if="currentView === 'quotes.js'"
              :listData="listData"
              :editingQuoteIndex="editingQuoteIndex"
              :quoteDraft="quoteDraft"
              @startEditQuote="startEditQuote"
              @cancelEditQuote="cancelEditQuote"
              @saveEditQuote="saveEditQuote"
              @deleteItem="deleteItem"
            />
            <ThoughtManager 
              v-else-if="currentView === 'thoughts.js'"
              :listData="listData"
              @editItem="editItem"
              @deleteItem="deleteItem"
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
          />
        </div>
      </main>

      <!-- Modals remain in main page for simplicity of state management -->
      <!-- Add/Edit Modal -->
      <div class="modal-mask" v-if="showModal" @click.self="showModal = false">
        <div class="modal-panel">
          <div class="modal-header">
            <h3>{{ isEdit ? '编辑项目' : '新建项目' }}</h3>
            <button class="btn-icon" @click="showModal = false">关闭</button>
          </div>
          <div class="modal-body">
            <div v-if="currentView === 'friendList.js'" class="cms-friend-preview">
              <div class="friend-card">
                <div class="avatar-wrapper">
                  <img v-if="editingItem.avatar" :src="normalizeUrl(editingItem.avatar)" :alt="editingItem.name || 'Friend'" class="avatar" />
                  <div v-else class="avatar-placeholder">{{ (editingItem.name || 'F').charAt(0).toUpperCase() }}</div>
                </div>
                <div class="info">
                  <h3 class="name">{{ editingItem.name || 'Friend' }}</h3>
                  <p class="desc">{{ editingItem.desc || 'A cool friend.' }}</p>
                </div>
              </div>
            </div>
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
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.content-area {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
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
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 { margin: 0; font-size: 1.1rem; }
}

.modal-body {
  padding: 24px;
  max-height: min(70vh, 760px);
  overflow: auto;
}

.modal-footer {
  padding: 16px 24px;
  background: rgb(var(--color-bg-secondary));
  border-top: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
