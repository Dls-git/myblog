
<script setup>
import { ref, computed, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown-light.css'
import { normalizeUrl } from '../utils'

const props = defineProps({
  articleForm: Object,
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

const md = new MarkdownIt()
const previewHtml = ref('')
let debounceTimer = null

// 防抖更新预览
const updatePreview = (content) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    previewHtml.value = md.render(content || '')
  }, 300)
}

watch(() => props.articleForm.content, (newContent) => {
  updatePreview(newContent)
}, { immediate: true })

const articleTagsInput = computed({
  get: () => (props.articleForm.tags || []).join(', '),
  set: (val) => {
    const tags = String(val || '').split(/[,，]/).map((t) => t.trim()).filter((t) => t)
    emit('update:articleForm', { ...props.articleForm, tags })
  }
})

const onPaste = (e) => {
  emit('handlePaste', e)
}

const triggerImport = () => emit('triggerMarkdownImport')
const onUploadCover = (e) => emit('uploadCover', e)
const onSubmit = () => emit('submitArticle')
</script>

<template>
  <div class="editor-container">
    <div class="editor-pane">
      <div class="editor-main">
        <textarea
          class="markdown-editor"
          v-model="articleForm.content"
          @paste="onPaste"
          placeholder="# 正文内容&#10;&#10;支持 Markdown 语法。&#10;支持直接粘贴图片上传。"
        ></textarea>
        <div class="editor-footer">
          {{ articleForm.content?.length || 0 }} 字
        </div>
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
            <input v-model="articleForm.title" placeholder="输入引人注目的标题..." />
          </div>
          <div class="form-group">
            <label>导入 Markdown</label>
            <button type="button" class="btn-secondary full-width" @click="triggerImport">
              选择 Markdown 文件
            </button>
          </div>
          <div class="form-group">
            <label>封面图</label>
            <div class="cover-upload-wrapper">
              <div v-if="articleForm.cover" class="cover-preview">
                <img :src="normalizeUrl(articleForm.cover)" />
                <button class="btn-remove-cover" @click="articleForm.cover = ''">×</button>
              </div>
              <div class="cover-input-row">
                <input v-model="articleForm.cover" placeholder="图片URL..." class="flex-grow" />
                <button type="button" class="btn-upload">
                  上传
                  <input type="file" @change="onUploadCover" class="file-input" />
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
            <input v-model="articleForm.category" list="categories-list" placeholder="选择分类..." />
            <datalist id="categories-list">
              <option v-for="c in categories" :key="c" :value="c"></option>
            </datalist>
          </div>
          <div class="form-group">
            <label>标签 (逗号分隔)</label>
            <input v-model="articleTagsInput" placeholder="Vue, React, Life..." />
            <div class="tags-preview" v-if="articleForm.tags?.length">
              <span v-for="t in articleForm.tags" :key="t" class="chip">{{ t }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>简短描述</label>
            <textarea v-model="articleForm.description" rows="4" placeholder="用于SEO和列表展示..."></textarea>
          </div>
          <button class="action-btn submit-btn" @click="onSubmit" :disabled="loading">
            {{ loading ? (selectedSlug ? '更新中...' : '发布中...') : (selectedSlug ? '更新文章' : '发布文章') }}
          </button>
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

.editor-main {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.markdown-editor {
  width: 100%;
  flex: 1;
  resize: none;
  border: 1px solid rgb(var(--color-border-primary) / 0.85);
  border-radius: 10px;
  padding: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.95rem;
  line-height: 1.6;
  outline: none;
  background: transparent;
  color: inherit;
}

.editor-footer {
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
  text-align: right;
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

.cover-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #eee;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.btn-remove-cover {
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-input-row {
  display: flex;
  gap: 8px;
}

.flex-grow {
  flex: 1;
}

.btn-upload {
  position: relative;
  overflow: hidden;
  width: 60px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgb(var(--color-bg-secondary));
  border: 1px solid rgb(var(--color-border-primary) / 0.9);
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
}

.file-input {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  cursor: pointer;
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
