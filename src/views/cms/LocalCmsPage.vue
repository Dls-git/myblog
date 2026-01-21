<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown-light.css'
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, CloudUploadOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const CMS_BASE = import.meta.env.VITE_CMS_API_BASE || 'http://localhost:3003'

const apiUrl = (pathname) => {
  const p = String(pathname || '')
  if (!p) return CMS_BASE
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  if (p.startsWith('/')) return `${CMS_BASE}${p}`
  return `${CMS_BASE}/${p}`
}

const apiFetch = (pathname, init) => fetch(apiUrl(pathname), init)

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

const SCHEMAS = {
  'friendList.js': [
    { key: 'name', label: '昵称' },
    { key: 'desc', label: '个性签名' },
    { key: 'link', label: '博客链接' },
    { key: 'avatar', label: '头像', type: 'image' }
  ],
  'photos.js': [
    { key: 'title', label: '照片标题' },
    { key: 'date', label: '拍摄日期', type: 'date' },
    { key: 'category', label: '分类' },
    { key: 'description', label: '背后的故事', type: 'textarea' },
    { key: 'url', label: '照片文件', type: 'image' }
  ],
  'quotes.js': [
    { key: 'content', label: '语录内容', type: 'textarea' },
    { key: 'author', label: '作者/出处' },
    { key: 'source', label: '来源' },
    { key: 'date', label: '记录日期', type: 'date' }
  ],
  'thoughts.js': [
    { key: 'content', label: '此刻的想法...', type: 'textarea' },
    { key: 'date', label: '发布日期', type: 'date' },
    { key: 'comments', label: '初始评论', type: 'number' },
    { key: 'likes', label: '初始点赞', type: 'number' }
  ]
}

const VIEW_TITLES = {
  article: '撰写新文章',
  'friendList.js': '友情',
  'photos.js': '照片',
  'quotes.js': '语录收藏',
  'thoughts.js': '动态',
  'aboutData.js': '关于我 (配置)'
}

const currentView = ref('article')
const loading = ref(false)
const toast = reactive({ show: false, msg: '', type: 'success' })

const showToast = (msg, type = 'success') => {
  toast.msg = msg
  toast.type = type
  toast.show = true
  setTimeout(() => (toast.show = false), 3000)
}

const pageTitle = computed(() => VIEW_TITLES[currentView.value] || 'Admin')
const isListView = computed(() => currentView.value.endsWith('.js') && currentView.value !== 'aboutData.js')
const currentFields = computed(() => SCHEMAS[currentView.value] || [])

const articleForm = reactive({
  title: '',
  description: '',
  cover: '',
  date: new Date().toISOString().split('T')[0],
  category: '',
  tags: [],
  content: ''
})

const articleTagsInput = computed({
  get: () => articleForm.tags.join(', '),
  set: (val) => (articleForm.tags = String(val || '').split(/[,，]/).map((t) => t.trim()).filter((t) => t))
})

const listData = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const editingIndex = ref(-1)
const editingItem = ref({})
const jsonContent = ref('')

const editingQuoteIndex = ref(-1)
const quoteDraft = ref(null)

const aboutTypeOptions = [
  { value: 'profile', label: '个人介绍' },
  { value: 'text', label: '文本卡片' },
  { value: 'skills', label: '技能卡片' },
  { value: 'quote', label: '引用卡片' },
  { value: 'social', label: '社交卡片' },
  { value: 'hobbies', label: '爱好卡片' }
]

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

const aboutSkillsInput = computed({
  get: () => (aboutEditingItem.value?.skills || []).join(', '),
  set: (val) => {
    const next = String(val ?? '')
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    if (!aboutEditingItem.value) return
    aboutEditingItem.value.skills = next
  }
})

const aboutToolsInput = computed({
  get: () => (aboutEditingItem.value?.detail?.tools || []).join(', '),
  set: (val) => {
    const next = String(val ?? '')
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    if (!aboutEditingItem.value) return
    if (!aboutEditingItem.value.detail) aboutEditingItem.value.detail = {}
    aboutEditingItem.value.detail.tools = next
  }
})

const showPreview = ref(true)
const showMeta = ref(true)

const md = new MarkdownIt()
const previewHtml = computed(() => md.render(articleForm.content))

const normalizeUrl = (val) => {
  const u = String(val ?? '').trim()
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/uploads/') || u.startsWith('/assets/')) return apiUrl(u)
  return u
}

const linkify = (text) => {
  const raw = String(text ?? '')
  return raw.replace(/(https?:\/\/[^\s]+)/g, "<a href='$1' target='_blank' rel='noopener'>$1</a>")
}

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

const stripQuotes = (val) => {
  const trimmed = String(val ?? '').trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

const parseFrontmatter = (raw) => {
  const text = String(raw ?? '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) return null
  const endIndex = text.indexOf('\n---', 4)
  if (endIndex === -1) return null
  const fmBlock = text.slice(4, endIndex).trimEnd()
  let contentStart = endIndex + '\n---'.length
  if (text[contentStart] === '\n') contentStart += 1
  const body = text.slice(contentStart).replace(/^\n+/, '')

  const fm = {}
  const tags = []
  let currentKey = null
  for (const line of fmBlock.split('\n')) {
    if (!line.trim()) continue
    const listMatch = line.match(/^\s*-\s+(.*)\s*$/)
    if (listMatch && currentKey === 'tags') {
      const t = stripQuotes(listMatch[1])
      if (t) tags.push(t)
      continue
    }

    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/)
    if (!kv) continue
    const key = kv[1]
    let value = kv[2] ?? ''
    currentKey = key

    if (!value.trim()) continue
    value = stripQuotes(value)

    if (key === 'tags') {
      const normalized = value.replace(/^\[|\]$/g, '')
      const inlineTags = normalized
        .split(/[,，]/)
        .map((t) => stripQuotes(t))
        .map((t) => t.trim())
        .filter(Boolean)
      tags.push(...inlineTags)
    } else {
      fm[key] = value
    }
  }

  if (tags.length) {
    fm.tags = Array.from(new Set(tags))
  }

  return { frontmatter: fm, body }
}

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

onMounted(() => {
  loadCategories()
})

const loadData = async (file) => {
  loading.value = true
  try {
    const res = await apiFetch(`/api/data?file=${file}`)
    if (res.ok) {
      const data = await res.json()
      if (file === 'aboutData.js') {
        jsonContent.value = JSON.stringify(data, null, 4)
        listData.value = data
      } else {
        listData.value = data
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

const handlePaste = async (event, callback) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      event.preventDefault()
      const file = item.getAsFile()
      await uploadFileGeneric(file, (url) => callback(url))
    }
  }
}

const insertImageToEditor = (url) => {
  const imgMd = `\n![image](${url})\n`
  articleForm.content += imgMd
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
    const res = await apiFetch('/api/save', { method: 'POST', body: JSON.stringify(articleForm) })
    if (res.ok) {
      showToast('文章发布成功！')
      articleForm.title = ''
      articleForm.content = ''
    } else {
      showToast('文章发布失败', 'error')
    }
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
  listData.value.splice(index, 1)
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
  const next = { ...(listData.value[index] || {}), ...(quoteDraft.value || {}) }
  listData.value[index] = next
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

  if (isEdit.value) {
    listData.value[editingIndex.value] = { ...editingItem.value }
  } else {
    listData.value.unshift({ ...editingItem.value })
  }

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

const saveJsonData = async () => {
  try {
    const data = JSON.parse(jsonContent.value)
    await apiFetch('/api/data?file=aboutData.js', { method: 'POST', body: JSON.stringify(data) })
    showToast('配置已保存')
  } catch {
    showToast('JSON 格式有误', 'error')
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
  listData.value.splice(index, 1)
  await saveAboutData()
}

const onAboutTypeChange = () => {
  const prev = aboutEditingItem.value || {}
  const next = makeAboutTemplate(prev.type, { id: prev.id, question: prev.question })
  aboutEditingItem.value = ensureAboutShape({ ...next, id: prev.id, question: prev.question })
}

const addAboutExperience = () => {
  if (!aboutEditingItem.value.detail) aboutEditingItem.value.detail = {}
  if (!Array.isArray(aboutEditingItem.value.detail.experiences)) aboutEditingItem.value.detail.experiences = []
  aboutEditingItem.value.detail.experiences.push({ year: '', event: '' })
}

const removeAboutExperience = (idx) => {
  aboutEditingItem.value.detail.experiences.splice(idx, 1)
}

const addAboutMainSkill = () => {
  if (!aboutEditingItem.value.detail) aboutEditingItem.value.detail = {}
  if (!Array.isArray(aboutEditingItem.value.detail.main)) aboutEditingItem.value.detail.main = []
  aboutEditingItem.value.detail.main.push({ name: '', level: 50 })
}

const removeAboutMainSkill = (idx) => {
  aboutEditingItem.value.detail.main.splice(idx, 1)
}

const addAboutHobby = () => {
  if (!aboutEditingItem.value.detail) aboutEditingItem.value.detail = {}
  if (!Array.isArray(aboutEditingItem.value.detail.list)) aboutEditingItem.value.detail.list = []
  aboutEditingItem.value.detail.list.push({ icon: '✨', name: '', desc: '' })
}

const removeAboutHobby = (idx) => {
  aboutEditingItem.value.detail.list.splice(idx, 1)
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

  if (aboutIsEdit.value) {
    listData.value[aboutEditingIndex.value] = item
  } else {
    listData.value.unshift(item)
  }

  await saveAboutData()
  showAboutModal.value = false
}

const truncate = (str) => {
  if (typeof str !== 'string') return str
  return str.length > 40 ? str.substring(0, 40) + '...' : str
}
</script>

<template>
  <div class="cms-root">
    <div class="cms-app">
      <aside class="sidebar">
        <div class="logo">Blog Admin</div>

        <div class="nav-scroll">
          <div class="nav-group">
            <div class="nav-title">Content</div>
            <div class="nav-item" :class="{ active: currentView === 'article' }" @click="currentView = 'article'">
              写文章
            </div>
            <div class="nav-item" @click="router.push('/cms/articles')">
              文章管理
            </div>
          </div>

          <div class="nav-group">
            <div class="nav-title">Data Modules</div>
            <div class="nav-item" :class="{ active: currentView === 'friendList.js' }" @click="currentView = 'friendList.js'">
              友链管理
            </div>
            <div class="nav-item" :class="{ active: currentView === 'photos.js' }" @click="currentView = 'photos.js'">
              摄影相册
            </div>
            <div class="nav-item" :class="{ active: currentView === 'quotes.js' }" @click="currentView = 'quotes.js'">
              收藏语录
            </div>
            <div class="nav-item" :class="{ active: currentView === 'thoughts.js' }" @click="currentView = 'thoughts.js'">
              碎碎念
            </div>
          </div>

          <div class="nav-group">
            <div class="nav-title">System</div>
            <div class="nav-item" :class="{ active: currentView === 'aboutData.js' }" @click="currentView = 'aboutData.js'">
              关于页 (JSON)
            </div>
            <div class="nav-item git-publish-item" @click="openGitModal">
              <CloudUploadOutlined />
              一键发布
            </div>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <header class="top-bar">
          <div class="page-title">{{ pageTitle }}</div>
          <div class="actions">
            <div v-if="currentView === 'article'" style="display: flex; gap: 8px; margin-right: 16px">
              <button class="btn-icon" :class="{ active: showPreview }" @click="showPreview = !showPreview" title="预览">
                预览
              </button>
              <button class="btn-icon" :class="{ active: showMeta }" @click="showMeta = !showMeta" title="设置">
                设置
              </button>
            </div>
            <button v-if="isListView" class="action-btn" @click="openAddModal">新增项目</button>
          </div>
        </header>

        <div class="content-area">
          <div v-if="currentView === 'article'" class="editor-container">
            <div class="editor-pane">
              <div class="editor-main">
                <textarea
                  class="markdown-editor"
                  v-model="articleForm.content"
                  @paste="handlePaste($event, (url) => insertImageToEditor(url))"
                  placeholder="# 正文内容&#10;&#10;支持 Markdown 语法。&#10;支持直接粘贴图片上传。"
                ></textarea>
                <div style="color: rgb(var(--color-text-secondary)); font-size: 0.85rem; text-align: right">
                  {{ articleForm.content.length }} 字
                </div>
              </div>
            </div>

            <div class="preview-pane" v-if="showPreview">
              <div class="preview-header">实时预览</div>
              <div class="markdown-body" v-html="previewHtml"></div>
            </div>

            <div class="meta-panel" v-show="showMeta">
              <div class="card" style="margin: 0; height: 100%; overflow-y: auto; border: none; shadow: none">
                <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center">
                  <h3 style="margin: 0; font-size: 1rem">文章设置</h3>
                  <button class="btn-icon" @click="showMeta = false">关闭</button>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label>文章标题</label>
                    <input v-model="articleForm.title" placeholder="输入引人注目的标题..." />
                  </div>
                  <div class="form-group">
                    <label>导入 Markdown</label>
                    <button
                      type="button"
                      class="btn-secondary"
                      style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px"
                      @click="triggerMarkdownImport"
                    >
                      选择 Markdown 文件
                    </button>
                    <input
                      ref="mdFileInput"
                      type="file"
                      accept=".md,.markdown,text/markdown"
                      style="display: none"
                      @change="handleMarkdownFileUpload"
                    />
                  </div>
                  <div class="form-group">
                    <label>封面图</label>
                    <div style="display: flex; flex-direction: column; gap: 8px">
                      <div v-if="articleForm.cover" style="position: relative">
                        <img
                          :src="normalizeUrl(articleForm.cover)"
                          style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid #eee"
                        />
                        <button
                          @click="articleForm.cover = ''"
                          style="
                            position: absolute;
                            top: 4px;
                            right: 4px;
                            background: rgba(0, 0, 0, 0.5);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 24px;
                            height: 24px;
                            cursor: pointer;
                          "
                        >
                          ×
                        </button>
                      </div>
                      <div style="display: flex; gap: 8px">
                        <input v-model="articleForm.cover" placeholder="图片URL..." style="flex: 1" />
                        <button
                          type="button"
                          class="btn-secondary"
                          style="
                            position: relative;
                            overflow: hidden;
                            width: 40px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                          "
                          title="上传封面"
                        >
                          上传
                          <input
                            type="file"
                            @change="uploadCover"
                            style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; opacity: 0; cursor: pointer"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>发布日期</label>
                    <input type="date" v-model="articleForm.date" />
                  </div>
                  <div class="form-group">
                    <label>分类专栏</label>
                    <input v-model="articleForm.category" list="categories" placeholder="选择分类..." />
                    <datalist id="categories">
                      <option v-for="c in categories" :key="c" :value="c"></option>
                    </datalist>
                  </div>
                  <div class="form-group">
                    <label>标签 (逗号分隔)</label>
                    <input v-model="articleTagsInput" placeholder="Vue, React, Life..." />
                    <div style="margin-top: 8px">
                      <span v-for="t in articleForm.tags" :key="t" class="chip">{{ t }}</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>简短描述</label>
                    <textarea v-model="articleForm.description" rows="4" placeholder="用于SEO和列表展示..."></textarea>
                  </div>
                  <button class="action-btn" style="width: 100%; justify-content: center" @click="submitArticle" :disabled="loading">
                    {{ loading ? '发布中...' : '发布文章' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="isListView">
            <div v-if="currentView === 'friendList.js'" class="cms-friends-container">
              <div class="cms-friends-grid" v-if="listData.length > 0">
                <div class="cms-friend-card-wrap cms-card-wrap" v-for="(item, index) in listData" :key="index">
                  <a class="cms-friend-card" :href="item.link" target="_blank" rel="noopener">
                    <div class="avatar-wrapper">
                      <img v-if="item.avatar" :src="normalizeUrl(item.avatar)" :alt="item.name" class="avatar" />
                      <div v-else class="avatar-placeholder">{{ (item.name || 'F').charAt(0).toUpperCase() }}</div>
                    </div>
                    <div class="info">
                      <h3 class="name">{{ item.name || 'Friend' }}</h3>
                      <p class="desc" :title="item.desc">{{ item.desc }}</p>
                    </div>
                  </a>
                  <div class="cms-friend-actions cms-card-actions">
                    <button class="cms-action-btn" @click.prevent="editItem(index)" title="编辑" aria-label="编辑">
                      <EditOutlined />
                    </button>
                    <button class="cms-action-btn danger" @click.prevent="deleteItem(index)" title="删除" aria-label="删除">
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              </div>
              <div v-else style="text-align: center; padding: 40px; color: rgb(var(--color-text-secondary))">暂无数据，请点击上方新增</div>
            </div>

            <div v-else-if="currentView === 'quotes.js'" class="cms-quotes-container">
              <div class="cms-quotes-grid" v-if="listData.length > 0">
                <div class="cms-quote-card-wrap cms-card-wrap" v-for="(item, index) in listData" :key="index">
                  <div class="cms-quote-card" :class="{ editing: currentView === 'quotes.js' && editingQuoteIndex === index }">
                    <template v-if="currentView === 'quotes.js' && editingQuoteIndex === index">
                      <div class="cms-quote-edit-grid">
                        <div class="cms-quote-edit-field">
                          <label>语录内容</label>
                          <textarea
                            v-model="quoteDraft.content"
                            rows="4"
                            class="cms-quote-edit-textarea"
                            placeholder="输入语录内容..."
                          ></textarea>
                        </div>
                        <div class="cms-quote-edit-row">
                          <div class="cms-quote-edit-field">
                            <label>作者/出处</label>
                            <input v-model="quoteDraft.author" type="text" placeholder="例如：鲁迅" />
                          </div>
                          <div class="cms-quote-edit-field">
                            <label>来源</label>
                            <input v-model="quoteDraft.source" type="text" placeholder="例如：书名/文章/链接" />
                          </div>
                        </div>
                        <div class="cms-quote-edit-row">
                          <div class="cms-quote-edit-field">
                            <label>记录日期</label>
                            <input v-model="quoteDraft.date" type="date" />
                          </div>
                          <div class="cms-quote-edit-actions">
                            <button class="cms-pill-btn" @click="saveEditQuote" title="保存" aria-label="保存">
                              <CheckOutlined />
                              <span>保存</span>
                            </button>
                            <button class="cms-pill-btn ghost" @click="cancelEditQuote" title="取消" aria-label="取消">
                              <CloseOutlined />
                              <span>取消</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="cms-quote-content">{{ item.content }}</div>
                      <div class="cms-quote-footer">
                        <div class="cms-quote-author-info">
                          <div class="cms-quote-author" v-if="item.author">—— {{ item.author }}</div>
                          <div class="cms-quote-source" v-if="item.source">{{ item.source }}</div>
                        </div>
                        <div class="cms-quote-date">{{ item.date }}</div>
                      </div>
                    </template>
                  </div>

                  <div class="cms-quote-actions cms-card-actions">
                    <button
                      v-if="currentView === 'quotes.js' && editingQuoteIndex !== index"
                      class="cms-action-btn"
                      @click="startEditQuote(index)"
                      title="编辑"
                      aria-label="编辑"
                    >
                      <EditOutlined />
                    </button>
                    <button class="cms-action-btn danger" @click="deleteItem(index)" title="删除" aria-label="删除">
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              </div>
              <div v-else style="text-align: center; padding: 40px; color: rgb(var(--color-text-secondary))">暂无数据，请点击上方新增</div>
            </div>

            <div v-else-if="currentView === 'thoughts.js'" class="cms-thinking-container">
              <div class="cms-thinking-list" v-if="listData.length > 0">
                <div class="cms-thought-item cms-card-wrap" v-for="(item, index) in listData" :key="index">
                  <div class="cms-thought-avatar">Y</div>
                  <div class="cms-thought-content">
                    <div class="cms-thought-meta">
                      <span class="cms-thought-nickname">Youth</span>
                      <span class="cms-thought-date">{{ item.date }} {{ item.week }}</span>
                    </div>
                    <div class="cms-thought-bubble">
                      <div v-html="linkify(item.content)"></div>
                    </div>
                    <div class="cms-thought-actions-row">
                      <span class="cms-thought-action">评论 {{ item.comments ?? 0 }}</span>
                      <span class="cms-thought-action">点赞 {{ item.likes ?? 0 }}</span>
                    </div>
                  </div>
                  <div class="cms-thought-actions cms-card-actions">
                    <button class="cms-action-btn" @click="editItem(index)" title="编辑" aria-label="编辑">
                      <EditOutlined />
                    </button>
                    <button class="cms-action-btn danger" @click="deleteItem(index)" title="删除" aria-label="删除">
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              </div>
              <div v-else style="text-align: center; padding: 40px; color: rgb(var(--color-text-secondary))">暂无数据，请点击上方新增</div>
            </div>

            <div v-else class="table-container">
              <table>
                <thead>
                  <tr>
                    <th v-for="field in currentFields" :key="field.key">{{ field.label }}</th>
                    <th style="width: 100px; text-align: right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in listData" :key="index">
                    <td v-for="field in currentFields" :key="field.key">
                      <div v-if="field.type === 'image'">
                        <img :src="normalizeUrl(item[field.key])" class="img-thumb" v-if="item[field.key]" />
                        <span v-else style="color: #ccc; font-size: 0.8rem">No Image</span>
                      </div>
                      <div v-else>{{ truncate(item[field.key]) }}</div>
                    </td>
                    <td style="text-align: right">
                      <button class="cms-action-btn" @click="editItem(index)" title="编辑" aria-label="编辑">
                        <EditOutlined />
                      </button>
                      <button class="cms-action-btn danger" @click="deleteItem(index)" title="删除" aria-label="删除">
                        <DeleteOutlined />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="listData.length === 0">
                    <td :colspan="currentFields.length + 1" style="text-align: center; padding: 40px; color: rgb(var(--color-text-secondary))">
                      暂无数据，请点击上方新增
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="currentView === 'aboutData.js'">
            <div class="cms-about-container">
              <div
                style="
                  margin-bottom: 16px;
                  color: rgb(var(--color-text-secondary));
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 12px;
                "
              >
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: rgb(var(--color-text-primary))">关于页卡片</div>
                <div style="font-size: 0.85rem">在下方选择卡片类型后，点击“新增卡片 / 发布关于页”</div>
              </div>

              <div class="cms-about-grid" v-if="listData.length > 0">
                <div class="cms-about-card-wrap cms-card-wrap" v-for="(item, index) in listData" :key="item.id || index">
                  <div class="cms-about-card">
                    <div class="cms-about-q">Q.</div>
                    <div class="cms-about-question">{{ item.question }}</div>
                    <div class="cms-about-preview">
                      <div v-if="item.type === 'profile'" style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%">
                        <span class="cms-about-preview-avatar">
                          <img :src="normalizeUrl('/assets/img/Mikasa.jpg')" alt="avatar" />
                        </span>
                        <div style="font-weight: 800; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%">
                          {{ item.name || 'Me' }}
                        </div>
                      </div>
                      <p v-else-if="item.type === 'quote'" class="cms-about-preview-quote">“{{ item.answer }}”</p>
                      <div v-else-if="item.type === 'skills'" class="cms-about-preview-skills">
                        <span v-for="s in (item.skills || []).slice(0, 3)" :key="s">{{ s }}</span>
                        <span v-if="(item.skills || []).length > 3">...</span>
                      </div>
                      <div v-else-if="item.type === 'social'" class="cms-about-preview-social">
                        <span style="font-weight: 800; opacity: 0.7">...</span>
                      </div>
                      <div v-else-if="item.type === 'hobbies'" class="cms-about-preview-skills">
                        <span v-for="h in item.detail?.list ? item.detail.list.slice(0, 3) : []" :key="h.name">{{ h.icon || '✨' }}</span>
                        <span v-if="item.detail?.list && item.detail.list.length > 3">...</span>
                      </div>
                      <p v-else class="cms-about-preview-text">{{ item.answer }}</p>
                    </div>
                  </div>
                  <div class="cms-about-actions cms-card-actions">
                    <button class="cms-action-btn" @click="editAboutItem(index)" title="编辑" aria-label="编辑">
                      <EditOutlined />
                    </button>
                    <button class="cms-action-btn danger" @click="deleteAboutItem(index)" title="删除" aria-label="删除">
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              </div>
              <div v-else style="text-align: center; padding: 40px; color: rgb(var(--color-text-secondary))">暂无数据，请在下方新增卡片</div>
            </div>

            <div class="cms-bottom-bar">
              <div class="cms-bottom-actions">
                <select v-model="aboutNewType" class="about-type-select" title="卡片类型">
                  <option v-for="t in aboutTypeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
                <button class="action-btn" @click="openAboutAddModal">新增卡片</button>
                <button class="action-btn" @click="saveAboutData">发布关于页</button>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                  <p class="desc" :title="editingItem.desc || ''">{{ editingItem.desc || 'A cool friend.' }}</p>
                </div>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group" v-for="field in currentFields" :key="field.key">
                <label>{{ field.label }}</label>

                <div v-if="field.type === 'image'">
                  <div style="display: flex; gap: 12px; align-items: center">
                    <img
                      :src="normalizeUrl(editingItem[field.key])"
                      v-if="editingItem[field.key]"
                      style="width: 60px; height: 60px; border-radius: 6px; object-fit: cover; border: 1px solid #eee"
                    />
                    <div style="flex: 1">
                      <div style="display: flex; gap: 8px">
                        <input type="text" v-model="editingItem[field.key]" placeholder="图片URL..." style="margin-bottom: 8px" />
                      </div>
                      <button type="button" class="btn-secondary" style="font-size: 0.85rem; position: relative; overflow: hidden">
                        选择本地图片
                        <input
                          type="file"
                          @change="(e) => uploadFile(e, field.key)"
                          style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; opacity: 0; cursor: pointer"
                        />
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

      <div class="modal-mask" v-if="showAboutModal" @click.self="showAboutModal = false">
        <div class="modal-panel" style="width: 720px">
          <div class="modal-header">
            <h3>{{ aboutIsEdit ? '编辑关于卡片' : '新建关于卡片' }}</h3>
            <button class="btn-icon" @click="showAboutModal = false">关闭</button>
          </div>
          <div class="modal-body">
            <div class="cms-about-card" style="margin-bottom: 18px">
              <div class="cms-about-q">Q.</div>
              <div class="cms-about-question">{{ aboutEditingItem.question || '你的问题会显示在这里' }}</div>
              <div class="cms-about-preview">
                <p v-if="aboutEditingItem.type === 'quote'" class="cms-about-preview-quote">“{{ aboutEditingItem.answer || '你的回答...' }}”</p>
                <div v-else-if="aboutEditingItem.type === 'skills'" class="cms-about-preview-skills">
                  <span v-for="s in (aboutEditingItem.skills || []).slice(0, 3)" :key="s">{{ s }}</span>
                  <span v-if="(aboutEditingItem.skills || []).length > 3">...</span>
                </div>
                <div v-else-if="aboutEditingItem.type === 'social'" class="cms-about-preview-social">
                  <span style="font-weight: 800; opacity: 0.7">...</span>
                </div>
                <div v-else-if="aboutEditingItem.type === 'profile'" style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%">
                  <span class="cms-about-preview-avatar">
                    <img :src="normalizeUrl('/assets/img/Mikasa.jpg')" alt="avatar" />
                  </span>
                  <div style="font-weight: 800; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%">
                    {{ aboutEditingItem.name || 'Me' }}
                  </div>
                </div>
                <p v-else class="cms-about-preview-text">{{ aboutEditingItem.answer || '你的回答...' }}</p>
              </div>
            </div>

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

              <div v-if="aboutEditingItem.type === 'profile'">
                <div class="form-row">
                  <div class="form-group">
                    <label>名字</label>
                    <input v-model="aboutEditingItem.name" placeholder="例如 YouthY" />
                  </div>
                  <div class="form-group">
                    <label>角色</label>
                    <input v-model="aboutEditingItem.role" placeholder="例如 Frontend Developer" />
                  </div>
                </div>
                <div class="form-group">
                  <label>一句话回答</label>
                  <textarea v-model="aboutEditingItem.answer" rows="3" placeholder="简短介绍"></textarea>
                </div>
                <div class="form-group">
                  <label>详细介绍</label>
                  <textarea v-model="aboutEditingItem.detail.intro" rows="3" placeholder="更详细的介绍"></textarea>
                </div>
                <div class="form-group">
                  <label>经历</label>
                  <div class="cms-about-detail-list">
                    <div class="cms-about-inline-row" v-for="(exp, idx) in aboutEditingItem.detail.experiences" :key="idx">
                      <input v-model="exp.year" placeholder="年份" />
                      <input v-model="exp.event" placeholder="事件" />
                      <button class="btn-icon danger" @click="removeAboutExperience(idx)" title="删除">删除</button>
                    </div>
                    <button type="button" class="btn-secondary" @click="addAboutExperience">添加经历</button>
                  </div>
                </div>
              </div>

              <div v-else-if="aboutEditingItem.type === 'skills'">
                <div class="form-group">
                  <label>技能标签 (逗号分隔)</label>
                  <input v-model="aboutSkillsInput" placeholder="Vue 3, TypeScript, Node.js" />
                </div>
                <div class="form-group">
                  <label>主技能条</label>
                  <div class="cms-about-detail-list">
                    <div
                      class="cms-about-inline-row"
                      v-for="(s, idx) in aboutEditingItem.detail.main"
                      :key="idx"
                      style="grid-template-columns: 2fr 1fr auto"
                    >
                      <input v-model="s.name" placeholder="技能名" />
                      <input type="number" v-model.number="s.level" min="0" max="100" placeholder="0-100" />
                      <button class="btn-icon danger" @click="removeAboutMainSkill(idx)" title="删除">删除</button>
                    </div>
                    <button type="button" class="btn-secondary" @click="addAboutMainSkill">添加技能条</button>
                  </div>
                </div>
                <div class="form-group">
                  <label>工具标签 (逗号分隔)</label>
                  <input v-model="aboutToolsInput" placeholder="Git, Vite, VS Code" />
                </div>
              </div>

              <div v-else-if="aboutEditingItem.type === 'quote'">
                <div class="form-group">
                  <label>引用内容</label>
                  <textarea v-model="aboutEditingItem.answer" rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label>署名/出处</label>
                  <input v-model="aboutEditingItem.subAnswer" placeholder="例如 ——《金缕衣》" />
                </div>
                <div class="form-group">
                  <label>补充说明</label>
                  <textarea v-model="aboutEditingItem.detail.text" rows="3"></textarea>
                </div>
              </div>

              <div v-else-if="aboutEditingItem.type === 'social'">
                <div class="form-group">
                  <label>说明文字</label>
                  <textarea v-model="aboutEditingItem.detail.text" rows="3" placeholder="例如：你可以通过以下方式找到我"></textarea>
                </div>
              </div>

              <div v-else-if="aboutEditingItem.type === 'hobbies'">
                <div class="form-group">
                  <label>一句话回答</label>
                  <textarea v-model="aboutEditingItem.answer" rows="3" placeholder="例如：敲代码、阅读、听音乐"></textarea>
                </div>
                <div class="form-group">
                  <label>爱好列表</label>
                  <div class="cms-about-detail-list">
                    <div
                      class="cms-about-inline-row"
                      v-for="(h, idx) in aboutEditingItem.detail.list"
                      :key="idx"
                      style="grid-template-columns: 0.7fr 1fr 2fr auto"
                    >
                      <input v-model="h.icon" placeholder="图标" />
                      <input v-model="h.name" placeholder="名称" />
                      <input v-model="h.desc" placeholder="描述" />
                      <button class="btn-icon danger" @click="removeAboutHobby(idx)" title="删除">删除</button>
                    </div>
                    <button type="button" class="btn-secondary" @click="addAboutHobby">添加爱好</button>
                  </div>
                </div>
              </div>

              <div v-else>
                <div class="form-group">
                  <label>回答</label>
                  <textarea v-model="aboutEditingItem.answer" rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label>补充说明</label>
                  <textarea v-model="aboutEditingItem.detail.text" rows="3"></textarea>
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

      <div class="modal-mask" v-if="showGitModal" @click.self="!gitPublishing && (showGitModal = false)">
        <div class="modal-panel" style="width: 500px">
          <div class="modal-header">
            <h3>一键发布到 Git</h3>
            <button class="btn-icon" @click="showGitModal = false" :disabled="gitPublishing">关闭</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Commit 内容</label>
              <textarea
                v-model="gitCommitMessage"
                rows="4"
                placeholder="请输入本次更新的内容描述..."
                :disabled="gitPublishing"
              ></textarea>
            </div>
            <div v-if="gitPublishing" style="margin-top: 16px; text-align: center; color: rgb(var(--color-text-secondary))">
              正在执行 git add, commit, push... 请稍候
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

      <div class="toast" :class="{ show: toast.show, error: toast.type === 'error' }">
        {{ toast.msg }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cms-root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: rgb(var(--color-bg-root));
  color: rgb(var(--color-text-primary));
  margin: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.cms-root * {
  box-sizing: border-box;
}

.cms-app {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 16px;
  gap: 16px;
}

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

.about-type-select {
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgb(var(--color-border-primary) / 0.85);
  background: rgb(var(--color-bg-primary));
  color: rgb(var(--color-text-primary));
  font-weight: 600;
  font-size: 0.9rem;
  outline: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.top-bar {
  height: 64px;
  background: rgb(var(--color-bg-primary) / 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
}

.page-title {
  font-family: inherit;
  font-size: 1.25rem;
  font-weight: 600;
}

.action-btn {
  background: rgb(var(--color-accent));
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: rgb(var(--color-accent));
  filter: brightness(0.95);
}

.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.content-area {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.card {
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  padding: 24px;
  margin-bottom: 24px;
}

.form-grid {
  display: grid;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgb(var(--color-text-secondary));
  margin-bottom: 8px;
  display: block;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  background: rgb(var(--color-bg-primary));
  color: rgb(var(--color-text-primary));
}

.btn-icon {
  background: rgb(var(--color-bg-secondary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  color: rgb(var(--color-text-primary));
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-icon.active {
  background: rgb(var(--color-accent) / 0.14);
  border-color: rgb(var(--color-accent) / 0.3);
  color: rgb(var(--color-accent));
}

.btn-icon.danger {
  color: #ef4444;
}

.btn-secondary {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  color: rgb(var(--color-text-primary));
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
}

.editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr 360px;
  gap: 18px;
  height: 100%;
}

.editor-pane,
.preview-pane,
.meta-panel {
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  overflow: hidden;
  min-height: 0;
}

.preview-pane {
  display: flex;
  flex-direction: column;
}

.editor-main {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.markdown-editor {
  width: 100%;
  height: 100%;
  resize: none;
  border: 1px solid rgb(var(--color-border-primary) / 0.85);
  border-radius: 10px;
  padding: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.95rem;
  line-height: 1.6;
}

.preview-header {
  padding: 14px 16px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  font-weight: 700;
}

.preview-pane .markdown-body {
  padding: 18px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
  max-width: 100%;
  overscroll-behavior: contain;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: rgb(var(--color-text-secondary));
  background: rgb(var(--color-bg-secondary));
}

.table-container table {
  width: 100%;
  border-collapse: collapse;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  border-radius: 14px;
  overflow: hidden;
}

.table-container th,
.table-container td {
  padding: 12px 14px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.65);
  vertical-align: top;
  font-size: 0.92rem;
}

.img-thumb {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
}

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
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
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

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  padding: 16px 36px;
  background: #10b981;
  color: white;
  border-radius: 999px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.3);
  transform: translate(-50%, calc(-50% + 12px));
  opacity: 0;
  transition: all 0.22s ease;
  z-index: 1000;
  pointer-events: none;
  max-width: min(520px, calc(100vw - 36px));
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
}

.toast.show {
  opacity: 1;
  transform: translate(-50%, -50%);
}

.toast.error {
  background: #ef4444;
}

.cms-friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.cms-friend-card-wrap {
  position: relative;
}

.cms-friend-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.cms-friend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1);
}

.avatar-wrapper {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgb(var(--color-bg-secondary));
  flex-shrink: 0;
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

.cms-friend-card:hover .avatar {
  transform: scale(1.1);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: rgb(var(--color-text-primary));
  opacity: 0.5;
  background: rgb(var(--color-bg-secondary));
}

.cms-quotes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.cms-quote-card {
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  background: rgb(var(--color-bg-primary));
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.cms-quote-card.editing {
  border-color: rgb(var(--color-accent) / 0.35);
  box-shadow: 0 8px 24px rgb(var(--color-accent) / 0.12);
  transform: translateY(-3px);
}

.cms-quote-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1);
}

.cms-quote-card.editing:hover {
  transform: translateY(-3px);
}

.cms-quote-content {
  font-size: 0.98rem;
  line-height: 1.7;
  white-space: pre-wrap;
}

.cms-quote-edit-grid {
  display: grid;
  gap: 12px;
}

.cms-quote-edit-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.cms-quote-edit-field label {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgb(var(--color-text-secondary));
  margin-bottom: 6px;
  display: block;
}

.cms-quote-edit-field input,
.cms-quote-edit-field textarea {
  width: 100%;
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgb(var(--color-bg-primary));
  color: rgb(var(--color-text-primary));
  outline: none;
  transition: all 0.2s ease;
}

.cms-quote-edit-field input:focus,
.cms-quote-edit-field textarea:focus {
  border-color: rgb(var(--color-accent) / 0.55);
  box-shadow: 0 0 0 4px rgb(var(--color-accent) / 0.12);
}

.cms-quote-edit-textarea {
  resize: vertical;
  min-height: 96px;
  line-height: 1.65;
}

.cms-quote-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: end;
}

.cms-pill-btn {
  height: 38px;
  border-radius: 999px;
  padding: 0 14px;
  border: 1px solid rgb(var(--color-border-primary) / 0.85);
  background: rgb(var(--color-accent));
  color: #fff;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 6px 16px rgb(var(--color-accent) / 0.22);
}

.cms-pill-btn:hover {
  filter: brightness(0.96);
  transform: translateY(-1px);
}

.cms-pill-btn.ghost {
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
  box-shadow: none;
}

.cms-pill-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.cms-quote-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
}

.cms-thinking-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cms-thought-item {
  position: relative;
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  padding: 12px 12px 12px 0;
}

.cms-thought-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgb(var(--color-accent) / 0.14);
  color: rgb(var(--color-accent));
  display: grid;
  place-items: center;
  font-weight: 800;
}

.cms-thought-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}

.cms-thought-nickname {
  font-weight: 800;
}

.cms-thought-date {
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
}

.cms-thought-bubble {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  padding: 12px 14px;
  line-height: 1.7;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.cms-thought-item:hover .cms-thought-bubble {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1);
}

.cms-thought-actions-row {
  margin-top: 8px;
  display: flex;
  gap: 14px;
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
}

.cms-about-container {
  padding-bottom: 20px;
}

.cms-about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.cms-about-card-wrap {
  position: relative;
}

.cms-about-card {
  position: relative;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  background: rgb(var(--color-bg-primary));
  min-height: 160px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.cms-about-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1);
}

.cms-about-q {
  font-weight: 900;
  color: rgb(var(--color-accent) / 0.75);
  font-size: 1.15rem;
}

.cms-about-question {
  margin-top: 6px;
  font-weight: 800;
  line-height: 1.35;
}

.cms-about-preview {
  margin-top: 14px;
  color: rgb(var(--color-text-secondary));
  font-size: 0.92rem;
}

.cms-about-preview-quote {
  margin: 0;
  font-style: italic;
  line-height: 1.6;
}

.cms-about-preview-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cms-about-preview-skills span {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  background: rgb(var(--color-bg-secondary));
  font-size: 0.82rem;
}

.cms-about-preview-social {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cms-about-preview-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid rgb(var(--color-bg-secondary));
  background: rgb(var(--color-bg-secondary));
  display: grid;
  place-items: center;
}

.cms-about-preview-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-about-preview-text {
  margin: 0;
  line-height: 1.6;
}

.cms-about-detail-list {
  display: grid;
  gap: 10px;
}

.cms-about-inline-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 10px;
  align-items: center;
}

.cms-bottom-bar {
  position: sticky;
  bottom: 0;
  margin-top: 18px;
  padding: 12px 0;
  background: rgb(var(--color-bg-primary) / 0.92);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgb(var(--color-border-primary) / 0.75);
}

.cms-bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
}

@media (max-width: 1100px) {
  .editor-container {
    grid-template-columns: 1fr;
  }
}

.cms-card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease;
  z-index: 2;
  pointer-events: none;
}

.cms-card-wrap {
  position: relative;
}

.cms-card-wrap:hover .cms-card-actions {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.cms-card-wrap:focus-within .cms-card-actions {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.cms-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgb(var(--color-border-primary) / 0.85);
  background: rgb(var(--color-bg-primary) / 0.92);
  color: rgb(var(--color-text-primary));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cms-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.cms-action-btn.danger {
  color: #ef4444;
  border-color: rgb(239 68 68 / 0.35);
  background: rgb(239 68 68 / 0.08);
}

.cms-action-btn :deep(svg) {
  width: 16px;
  height: 16px;
}
</style>
