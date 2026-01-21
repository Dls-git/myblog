<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown-light.css'
import { CheckOutlined, CloseOutlined, EditOutlined, ReloadOutlined, ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons-vue'

const CMS_BASE = import.meta.env.VITE_CMS_API_BASE || 'http://localhost:3003'

const apiUrl = (pathname) => {
  const p = String(pathname || '')
  if (!p) return CMS_BASE
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  if (p.startsWith('/')) return `${CMS_BASE}${p}`
  return `${CMS_BASE}/${p}`
}

const apiFetch = (pathname, init) => fetch(apiUrl(pathname), init)

const loading = ref(false)
const toast = reactive({ show: false, msg: '', type: 'success' })

const showToast = (msg, type = 'success') => {
  toast.msg = msg
  toast.type = type
  toast.show = true
  setTimeout(() => (toast.show = false), 2600)
}

const normalizeUrl = (val) => {
  const u = String(val ?? '').trim()
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/uploads/') || u.startsWith('/assets/')) return apiUrl(u)
  return u
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

const posts = ref([])
const query = ref('')
const selectedSlug = ref('')
const showPreview = ref(true)
const showMeta = ref(true)

const editor = reactive({
  title: '',
  description: '',
  cover: '',
  date: '',
  category: '',
  tags: [],
  content: ''
})

const tagsInput = computed({
  get: () => editor.tags.join(', '),
  set: (val) => (editor.tags = String(val || '').split(/[,，]/).map((t) => t.trim()).filter((t) => t))
})

const md = new MarkdownIt()
const previewHtml = computed(() => md.render(editor.content))

const filteredPosts = computed(() => {
  const q = String(query.value || '').trim().toLowerCase()
  if (!q) return posts.value
  return posts.value.filter((p) => String(p.title || '').toLowerCase().includes(q) || String(p.slug || '').toLowerCase().includes(q))
})

const loadPosts = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/posts')
    if (!res.ok) throw new Error('load failed')
    const data = await res.json()
    posts.value = Array.isArray(data) ? data : []
  } catch {
    posts.value = []
    showToast('文章列表加载失败', 'error')
  } finally {
    loading.value = false
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
    editor.title = String(data.title ?? '')
    editor.description = String(data.description ?? '')
    editor.cover = String(data.cover ?? '')
    editor.date = String(data.date ?? '').slice(0, 10)
    editor.category = String(data.category ?? '')
    editor.tags = Array.isArray(data.tags) ? data.tags : []
    editor.content = String(json.content ?? '')
  } catch {
    showToast('文章读取失败', 'error')
  } finally {
    loading.value = false
  }
}

const savePost = async () => {
  if (!selectedSlug.value) return
  if (!editor.title.trim()) return showToast('请填写标题', 'error')
  loading.value = true
  try {
    const payload = {
      data: {
        title: editor.title,
        description: editor.description,
        date: editor.date,
        category: editor.category,
        tags: editor.tags,
        cover: editor.cover
      },
      content: editor.content
    }
    const res = await apiFetch(`/api/post?slug=${encodeURIComponent(selectedSlug.value)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.success) throw new Error(json?.message || 'save failed')
    showToast('保存成功，已重新发布')
    await loadPosts()
  } catch {
    showToast('保存失败', 'error')
  } finally {
    loading.value = false
  }
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

const handlePaste = async (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      event.preventDefault()
      const file = item.getAsFile()
      await uploadFileGeneric(file, (url) => {
        editor.content += `\n![image](${url})\n`
      })
    }
  }
}

const uploadCover = async (event) => {
  const file = event?.target?.files?.[0]
  if (!file) return
  await uploadFileGeneric(file, (url) => {
    editor.cover = url
  })
  if (event?.target) event.target.value = ''
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadPosts()])
})
</script>

<template>
  <div class="cms-root">
    <div class="cms-app">
      <aside class="sidebar">
        <div class="logo">Blog Admin</div>
        <div class="nav-scroll">
          <div class="nav-group">
            <div class="nav-title">Content</div>
            <RouterLink class="nav-item" to="/cms">写文章</RouterLink>
            <div class="nav-item active">文章管理</div>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <header class="top-bar">
          <div class="page-title">文章管理</div>
          <div class="actions">
            <div style="display: flex; gap: 8px; margin-right: 16px">
              <button class="btn-icon" :class="{ active: showPreview }" @click="showPreview = !showPreview" title="预览">预览</button>
              <button class="btn-icon" :class="{ active: showMeta }" @click="showMeta = !showMeta" title="设置">设置</button>
            </div>
            <button class="action-btn" @click="loadPosts" :disabled="loading" title="刷新">
              <ReloadOutlined />
              <span>刷新</span>
            </button>
          </div>
        </header>

        <div class="content-area">
          <div class="manager-grid">
            <section class="list-panel" v-if="!selectedSlug">
              <div class="list-toolbar">
                <input v-model="query" class="search-input" placeholder="搜索标题或 slug..." />
              </div>
              <div class="table-container" v-if="filteredPosts.length">
                <table>
                  <thead>
                    <tr>
                      <th>标题</th>
                      <th style="width: 120px">日期</th>
                      <th style="width: 120px">分类</th>
                      <th style="width: 160px">标签</th>
                      <th style="width: 90px; text-align: right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in filteredPosts" :key="p.slug" :class="{ active: p.slug === selectedSlug }">
                      <td>
                        <div class="post-title">{{ p.title }}</div>
                        <div class="post-sub">{{ p.slug }}</div>
                      </td>
                      <td>{{ p.date }}</td>
                      <td>{{ p.category }}</td>
                      <td class="tags-cell">{{ (p.tags || []).join(' / ') }}</td>
                      <td style="text-align: right">
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px">
                          <button class="cms-action-btn" @click="openPost(p.slug)" title="编辑" aria-label="编辑">
                            <EditOutlined />
                          </button>
                          <button class="cms-action-btn danger" @click="deletePost(p.slug)" title="删除" aria-label="删除">
                            <DeleteOutlined />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty">暂无文章</div>
            </section>

            <section class="editor-panel" v-if="selectedSlug">
              <div class="editor-container">
                <div class="editor-pane">
                  <div class="editor-main">
                    <textarea
                      class="markdown-editor"
                      v-model="editor.content"
                      @paste="handlePaste"
                      placeholder="# 正文内容&#10;&#10;支持 Markdown，支持粘贴图片上传。"
                    ></textarea>
                    <div class="editor-footer">
                      <div class="muted">{{ editor.content.length }} 字</div>
                      <div class="editor-actions">
                        <button class="cms-pill-btn" @click="savePost" :disabled="loading" title="保存并发布" aria-label="保存并发布">
                          <CheckOutlined />
                          <span>保存并发布</span>
                        </button>
                        <button class="cms-pill-btn ghost" @click="selectedSlug = ''" title="返回列表" aria-label="返回列表">
                          <ArrowLeftOutlined />
                          <span>返回列表</span>
                        </button>
                      </div>
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
                        <input v-model="editor.title" placeholder="输入文章标题..." />
                      </div>
                      <div class="form-group">
                        <label>简短描述</label>
                        <textarea v-model="editor.description" rows="3" placeholder="用于 SEO 和列表展示..."></textarea>
                      </div>
                      <div class="form-group">
                        <label>发布日期</label>
                        <input type="date" v-model="editor.date" />
                      </div>
                      <div class="form-row">
                        <div class="form-group">
                          <label>分类专栏</label>
                          <input v-model="editor.category" list="categories" placeholder="选择分类..." />
                          <datalist id="categories">
                            <option v-for="c in categories" :key="c" :value="c"></option>
                          </datalist>
                        </div>
                        <div class="form-group">
                          <label>标签 (逗号分隔)</label>
                          <input v-model="tagsInput" placeholder="Vue, React, Life..." />
                        </div>
                      </div>
                      <div class="form-group">
                        <label>封面图</label>
                        <div style="display: flex; flex-direction: column; gap: 8px">
                          <img
                            v-if="editor.cover"
                            :src="normalizeUrl(editor.cover)"
                            style="width: 100%; height: 120px; object-fit: cover; border-radius: 10px; border: 1px solid rgb(var(--color-border-primary) / 0.75)"
                          />
                          <button type="button" class="btn-secondary" style="position: relative; overflow: hidden">
                            上传封面
                            <input
                              type="file"
                              @change="uploadCover"
                              style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; opacity: 0; cursor: pointer"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>

    <div class="toast" :class="{ show: toast.show, error: toast.type === 'error' }">{{ toast.msg }}</div>
  </div>
</template>

<style scoped>
.cms-root {
  height: 100vh;
  overflow: hidden;
  background: rgb(var(--color-bg-secondary));
}

.cms-app {
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100%;
}

.sidebar {
  background: rgb(var(--color-bg-primary));
  border-right: 1px solid rgb(var(--color-border-primary) / 0.75);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.logo {
  font-weight: 900;
  font-size: 1.05rem;
  letter-spacing: 0.4px;
}

.nav-scroll {
  overflow-y: auto;
  padding-right: 6px;
}

.nav-group {
  margin-bottom: 18px;
}

.nav-title {
  font-size: 0.75rem;
  color: rgb(var(--color-text-secondary));
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nav-item {
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  color: rgb(var(--color-text-primary));
  text-decoration: none;
  display: block;
}

.nav-item.active,
.nav-item.router-link-active {
  background: rgb(var(--color-accent) / 0.12);
  color: rgb(var(--color-accent));
}

.main-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  padding: 16px 20px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgb(var(--color-bg-primary));
}

.page-title {
  font-size: 1.05rem;
  font-weight: 900;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-area {
  padding: 18px 20px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.manager-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-panel,
.editor-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.list-panel {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.list-toolbar {
  padding: 12px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
}

.search-input {
  width: 100%;
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  background: rgb(var(--color-bg-primary));
  color: rgb(var(--color-text-primary));
}

.table-container {
  overflow: auto;
  height: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 12px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.55);
  font-size: 0.92rem;
  vertical-align: top;
}

tbody tr.active {
  background: rgb(var(--color-accent) / 0.06);
}

.post-title {
  font-weight: 900;
}

.post-sub {
  font-size: 0.8rem;
  color: rgb(var(--color-text-secondary));
  margin-top: 4px;
}

.tags-cell {
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
}

.editor-panel {
  min-height: 0;
  overflow: hidden;
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

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.muted {
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
}

.preview-header {
  padding: 14px 16px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  font-weight: 900;
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

.card {
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  padding: 18px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 800;
  color: rgb(var(--color-text-secondary));
  margin-bottom: 8px;
  display: block;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 12px;
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
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.btn-icon.active {
  background: rgb(var(--color-accent) / 0.14);
  border-color: rgb(var(--color-accent) / 0.3);
  color: rgb(var(--color-accent));
}

.btn-secondary {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  color: rgb(var(--color-text-primary));
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
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
  text-decoration: none;
}

.cms-pill-btn.ghost {
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
}

.cms-pill-btn :deep(svg) {
  width: 16px;
  height: 16px;
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
  cursor: pointer;
  transition: all 0.2s ease;
}

.cms-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cms-action-btn.danger {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.cms-action-btn.danger:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.cms-action-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.empty {
  padding: 24px;
  color: rgb(var(--color-text-secondary));
  text-align: center;
}

.editor-empty {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  border-radius: 16px;
  display: grid;
  place-items: center;
}

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% + 12px));
  opacity: 0;
  padding: 16px 36px;
  background: #10b981;
  color: white;
  border-radius: 999px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.3);
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

@media (max-width: 1100px) {
  .manager-grid {
    grid-template-columns: 1fr;
  }
  .editor-container {
    grid-template-columns: 1fr;
  }
}
</style>

