
<script setup>
import { ref, computed, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown-light.css'
import { normalizeUrl } from '../utils'
import MediaManager from './MediaManager.vue'
import { 
  FileImageOutlined,
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  BlockOutlined,
  CodeOutlined,
  UnorderedListOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SaveOutlined,
  MenuOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'

const props = defineProps({
  articleForm: {
    type: Object,
    required: true
  },
  showPreview: Boolean,
  showMeta: Boolean,
  categories: Array,
  loading: Boolean,
  selectedSlug: String
})

const emit = defineEmits([
  'update:articleForm',
  'update:showMeta',
  'submitArticle',
  'triggerMarkdownImport',
  'uploadCover',
  'handlePaste'
])

const localForm = ref({ ...props.articleForm })
const editorRef = ref(null)
const showMediaPicker = ref(false)
const isFullscreen = ref(false)
const showToc = ref(false)

// 提取目录
const toc = computed(() => {
  const content = localForm.value.content || ''
  const lines = content.split('\n')
  const headings = []
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: index
      })
    }
  })
  return headings
})

const scrollToLine = (lineIndex) => {
  const textarea = editorRef.value
  if (!textarea) return
  const lines = (localForm.value.content || '').split('\n')
  let charPos = 0
  for (let i = 0; i < lineIndex; i++) {
    charPos += lines[i].length + 1
  }
  textarea.focus()
  textarea.setSelectionRange(charPos, charPos)
  const lineHeight = 24 // 估算行高
  textarea.scrollTop = lineIndex * lineHeight - 100
}

// 拖拽上传
const onDrop = async (e) => {
  e.preventDefault()
  const files = e.dataTransfer.files
  if (files.length > 0) {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await uploadFileGeneric(file, (url) => {
          insertImage(url)
        })
      }
    }
  }
}

// 自动保存逻辑
const AUTO_SAVE_KEY = 'cms_article_autosave'
const lastAutoSave = ref(null)

const autoSave = () => {
  if (!props.selectedSlug && !localForm.value.title && !localForm.value.content) return
  const data = {
    form: localForm.value,
    timestamp: Date.now()
  }
  localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data))
  lastAutoSave.value = new Date().toLocaleTimeString()
}

// 恢复草稿
const recoverDraft = () => {
  const saved = localStorage.getItem(AUTO_SAVE_KEY)
  if (saved) {
    const { form } = JSON.parse(saved)
    if (confirm('发现未保存的本地草稿，是否恢复？')) {
      localForm.value = { ...localForm.value, ...form }
    }
    localStorage.removeItem(AUTO_SAVE_KEY)
  }
}

// 工具栏操作
const wrapText = (before, after = '') => {
  const textarea = editorRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = localForm.value.content || ''
  const selected = text.substring(start, end)
  
  const newText = text.substring(0, start) + before + selected + (after || before) + text.substring(end)
  localForm.value.content = newText
  
  setTimeout(() => {
    textarea.focus()
    textarea.selectionStart = start + before.length
    textarea.selectionEnd = end + before.length
  }, 0)
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 快捷键处理
const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    onSubmit()
  }
}

watch(() => localForm.value.content, () => {
  const timer = setTimeout(autoSave, 1000)
  return () => clearTimeout(timer)
})

watch(() => props.articleForm, (newVal) => {
  localForm.value = { ...newVal }
}, { deep: true })

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 自定义图片渲染
const defaultImageRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.image = function(tokens, idx, options, env, self) {
  const token = tokens[idx]
  const srcIndex = token.attrIndex('src')
  if (srcIndex >= 0) {
    const src = token.attrs[srcIndex][1]
    token.attrs[srcIndex][1] = normalizeUrl(src)
  }
  // 移除内联 style，改用 CSS 控制
  return defaultImageRender(tokens, idx, options, env, self)
}

const previewHtml = ref('')
let debounceTimer = null

// 防抖更新预览
const updatePreview = (content) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    previewHtml.value = md.render(content || '')
  }, 300)
}

watch(() => localForm.value.content, (newContent) => {
  updatePreview(newContent)
}, { immediate: true })

const articleTagsInput = computed({
  get: () => (localForm.value.tags || []).join(', '),
  set: (val) => {
    const tags = String(val || '').split(/[,，]/).map((t) => t.trim()).filter((t) => t)
    localForm.value = { ...localForm.value, tags }
  }
})

const onPaste = (e) => {
  emit('handlePaste', e)
}

const triggerImport = () => emit('triggerMarkdownImport')
const onUploadCover = (e) => emit('uploadCover', e)
const onSubmit = () => emit('submitArticle', { ...localForm.value })

watch(() => localForm.value, (newVal) => {
  emit('update:articleForm', { ...newVal })
}, { deep: true })

const setStatus = (status) => {
  localForm.value.status = status
}

const insertImage = (url) => {
  const imgMd = `\n![image](${url})\n`
  const textarea = editorRef.value
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = localForm.value.content || ''
    localForm.value.content = text.substring(0, start) + imgMd + text.substring(end)
    // 恢复焦点
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + imgMd.length
    }, 0)
  } else {
    localForm.value.content += imgMd
  }
  showMediaPicker.value = false
}
</script>

<template>
  <div class="editor-container" :class="{ 'is-fullscreen': isFullscreen, 'meta-panel-hidden': !showMeta, 'no-preview': !showMeta && !showPreview }" @keydown="handleKeydown">
    <div class="editor-pane">
      <div class="editor-toolbar">
        <div class="toolbar-group">
          <button class="toolbar-btn" @click="wrapText('**')" title="加粗">
            <BoldOutlined />
          </button>
          <button class="toolbar-btn" @click="wrapText('*')" title="斜体">
            <ItalicOutlined />
          </button>
          <button class="toolbar-btn" @click="wrapText('[', '](url)')" title="链接">
            <LinkOutlined />
          </button>
          <button class="toolbar-btn" @click="wrapText('\n> ')" title="引用">
            <BlockOutlined />
          </button>
          <button class="toolbar-btn" @click="wrapText('`')" title="代码">
            <CodeOutlined />
          </button>
          <button class="toolbar-btn" @click="wrapText('\n- ')" title="列表">
            <UnorderedListOutlined />
          </button>
        </div>
        
        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <button class="toolbar-btn" :class="{ active: showToc }" @click="showToc = !showToc" title="显示目录">
            <MenuOutlined /> 目录
          </button>
          <button class="toolbar-btn" @click="showMediaPicker = true" title="插入图片">
            <FileImageOutlined /> 图片
          </button>
        </div>

        <div class="toolbar-spacer"></div>

        <div class="toolbar-group">
          <span class="auto-save-tag" v-if="lastAutoSave">已自动保存 {{ lastAutoSave }}</span>
          <button class="toolbar-btn" @click="onSubmit" title="保存 (Ctrl+S)">
            <SaveOutlined />
          </button>
          <button class="toolbar-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏模式'">
            <FullscreenExitOutlined v-if="isFullscreen" />
            <FullscreenOutlined v-else />
          </button>
        </div>
      </div>

      <div class="editor-main" :class="{ 'with-toc': showToc }">
        <div class="toc-sidebar" v-if="showToc">
          <div class="toc-title">文章目录</div>
          <div class="toc-list">
            <div 
              v-for="item in toc" 
              :key="item.line" 
              class="toc-item" 
              :style="{ paddingLeft: (item.level - 1) * 12 + 'px' }"
              @click="scrollToLine(item.line)"
            >
              {{ item.text }}
            </div>
            <div v-if="toc.length === 0" class="toc-empty">暂无标题</div>
          </div>
        </div>
        <textarea
          ref="editorRef"
          class="markdown-editor"
          v-model="localForm.content"
          @paste="onPaste"
          @drop="onDrop"
          @dragover.prevent
          placeholder="# 正文内容&#10;&#10;支持 Markdown 语法。&#10;支持直接粘贴或拖拽图片上传。"
        ></textarea>
      </div>
    </div>

    <div class="preview-pane" v-if="showPreview">
      <div class="preview-header">实时预览</div>
      <div class="markdown-body" v-html="previewHtml"></div>
    </div>

    <div class="meta-panel" v-show="showMeta">
      <div class="card meta-card">
        <div class="meta-card-header">
          <h3 class="meta-title">文章设置</h3>
          <button class="btn-close" @click="emit('update:showMeta', false)">关闭</button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>文章标题</label>
            <input v-model="localForm.title" placeholder="输入引人注目的标题..." />
          </div>
          <div class="form-group">
            <label>导入 Markdown</label>
            <button type="button" class="btn-secondary full-width" @click="triggerImport">
              选择 Markdown 文件
            </button>
          </div>
          <div class="form-group">
            <label>发布日期</label>
            <input type="date" v-model="localForm.date" />
          </div>
          <div class="form-group">
            <label>文章状态</label>
            <div class="status-toggle">
              <button 
                type="button" 
                class="status-btn" 
                :class="{ active: (localForm.status || 'published') === 'published' }"
                @click="setStatus('published')"
              >已发布</button>
              <button 
                type="button" 
                class="status-btn" 
                :class="{ active: localForm.status === 'draft' }"
                @click="setStatus('draft')"
              >草稿</button>
            </div>
          </div>
          <div class="form-group">
            <label>分类专栏</label>
            <input v-model="localForm.category" list="categories-list" placeholder="选择分类..." />
            <datalist id="categories-list">
              <option v-for="c in categories" :key="c" :value="c"></option>
            </datalist>
          </div>
          <div class="form-group">
            <label>标签 (逗号分隔)</label>
            <input v-model="articleTagsInput" placeholder="Vue, React, Life..." />
            <div class="tags-preview" v-if="localForm.tags?.length">
              <span v-for="t in localForm.tags" :key="t" class="chip">{{ t }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>简短描述</label>
            <textarea v-model="localForm.description" rows="4" placeholder="用于SEO和列表展示..."></textarea>
          </div>
          <button 
            class="action-btn submit-btn" 
            :class="[(localForm.status || 'published'), { 'loading': loading }]" 
            @click="onSubmit" 
            :disabled="loading"
          >
            <template v-if="loading">
              {{ selectedSlug ? '保存中...' : '提交中...' }}
            </template>
            <template v-else>
              {{ (localForm.status || 'published') === 'published' ? (selectedSlug ? '更新文章' : '发布文章') : '保存为草稿' }}
            </template>
          </button>
        </div>
      </div>
    </div>

    <!-- 媒体选择器弹窗 -->
    <div class="modal-overlay" v-if="showMediaPicker" @click.self="showMediaPicker = false">
      <div class="modal-content media-picker-modal">
        <div class="modal-header">
          <h3>选择图片</h3>
          <button class="btn-close" @click="showMediaPicker = false">×</button>
        </div>
        <div class="modal-body">
          <MediaManager isPicker @select="insertImage" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr 360px;
  gap: 18px;
  height: 100%;
  transition: all 0.3s ease;

  &.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgb(var(--color-bg-root));
    padding: 20px;
    grid-template-columns: 1fr 1fr;
    
    .meta-panel {
      display: none !important;
    }
  }
}

// 当设置面板隐藏时，编辑区域和预览区域占据剩余宽度
.meta-panel-hidden {
  grid-template-columns: 1fr 1fr;
  
  .preview-pane {
    display: flex !important;
  }
  
  .editor-pane {
    max-width: none;
  }
}

// 当设置面板和预览都隐藏时，编辑区域占据全部宽度
.meta-panel-hidden.no-preview {
  grid-template-columns: 1fr;
  
  .preview-pane {
    display: none !important;
  }
}

.editor-pane,
.preview-pane,
.meta-panel {
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  padding: 6px 12px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.5);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgb(var(--color-bg-secondary) / 0.2);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background: rgb(var(--color-border-primary) / 0.5);
  margin: 0 4px;
}

.toolbar-spacer {
  flex: 1;
}

.auto-save-tag {
  font-size: 0.75rem;
  color: rgb(var(--color-text-secondary));
  margin-right: 8px;
  opacity: 0.7;
}

.toolbar-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: rgb(var(--color-text-secondary));
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgb(var(--color-bg-secondary));
    color: rgb(var(--color-accent));
    border-color: rgb(var(--color-accent) / 0.2);
  }
}

.editor-main {
  padding: 16px;
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  position: relative;
  
  &.with-toc {
    padding-left: 0;
  }
}

.toc-sidebar {
  width: 200px;
  background: rgb(var(--color-bg-secondary) / 0.2);
  border-right: 1px solid rgb(var(--color-border-primary) / 0.5);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toc-title {
  padding: 12px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgb(var(--color-text-secondary));
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.3);
}

.toc-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.toc-item {
  padding: 6px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  color: rgb(var(--color-text-secondary));
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: rgb(var(--color-bg-secondary) / 0.5);
    color: rgb(var(--color-accent));
  }
}

.toc-empty {
  padding: 20px;
  text-align: center;
  font-size: 0.8rem;
  color: rgb(var(--color-text-secondary));
  opacity: 0.5;
}

.markdown-editor {
  width: 100%;
  flex: 1;
  resize: none;
  border: 1px solid rgb(var(--color-border-primary) / 0.6);
  border-radius: 12px;
  padding: 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 1rem;
  line-height: 1.7;
  outline: none;
  background: transparent;
  color: inherit;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);

  &:focus {
    border-color: rgb(var(--color-accent) / 0.4);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02), 0 0 0 3px rgb(var(--color-accent) / 0.05);
  }
}

// 弹窗样式
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
}

.modal-content {
  background: rgb(var(--color-bg-primary));
  border-radius: 20px;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.7);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1.1rem;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.preview-pane {
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 14px 16px;
  border-bottom: 1px solid rgb(var(--color-border-primary) / 0.75);
  font-weight: 700;
}

.markdown-body {
  padding: 18px;
  flex: 1;
  overflow-y: auto;
  background: transparent;

  :deep(img) {
    max-width: 80%;
    height: auto;
    max-height: 320px;
    display: block;
    margin: 1.2rem auto;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease;
    cursor: zoom-in;

    &:hover {
      transform: scale(1.02);
    }
  }
}

.meta-card {
  margin: 0;
  height: 100%;
  overflow-y: auto;
  border: none;
  box-shadow: none;
  padding: 24px;
}

.meta-card-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-title {
  margin: 0;
  font-size: 1rem;
}

.btn-close {
  background: rgb(var(--color-bg-secondary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  color: rgb(var(--color-text-primary));
  border-radius: 999px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.8rem;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgb(var(--color-text-secondary));
  margin-bottom: 8px;
  display: block;
}

.status-toggle {
  display: flex;
  background: rgb(var(--color-bg-secondary));
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}

.status-btn {
  flex: 1;
  padding: 6px;
  border: none;
  background: transparent;
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: rgb(var(--color-bg-primary));
    color: rgb(var(--color-accent));
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: transparent;
  color: inherit;
}

.btn-secondary {
  background: rgb(var(--color-bg-secondary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  color: rgb(var(--color-text-primary));
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
}

.full-width {
  width: 100%;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgb(var(--color-border-primary) / 0.7);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.flex-grow {
  flex: 1;
}

.tags-preview {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgb(var(--color-border-primary) / 0.75);
  margin-right: 6px;
  margin-bottom: 6px;
  font-size: 0.75rem;
  color: rgb(var(--color-text-secondary));
  background: rgb(var(--color-bg-secondary));
}

.submit-btn {
  width: 100%;
  justify-content: center;
  margin-top: 10px;
}

.action-btn {
  background: rgb(var(--color-accent));
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &.published {
    background: #10b981; // 绿色
    &:hover { background: #059669; }
  }

  &.draft {
    background: #f59e0b; // 橙色/黄色
    &:hover { background: #d97706; }
  }
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .editor-container {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}
</style>
