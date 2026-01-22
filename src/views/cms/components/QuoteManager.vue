
<script setup>
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, HolderOutlined, CopyOutlined } from '@ant-design/icons-vue'
import draggable from 'vuedraggable'
import { computed, ref } from 'vue'

const props = defineProps({
  listData: {
    type: Array,
    required: true
  },
  editingQuoteIndex: Number,
  quoteDraft: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['startEditQuote', 'cloneItem', 'cancelEditQuote', 'saveEditQuote', 'deleteItem', 'update:listData', 'update:quoteDraft'])

const list = computed({
  get: () => props.listData,
  set: (value) => emit('update:listData', value)
})

const localDraft = computed({
  get: () => props.quoteDraft,
  set: (val) => emit('update:quoteDraft', val)
})

const isDragging = ref(false)

const onDragStart = () => {
  isDragging.value = true
}

const onDragEnd = () => {
  setTimeout(() => {
    isDragging.value = false
  }, 0)
}

const onCardClick = (index) => {
  if (isDragging.value) return
  emit('startEditQuote', index)
}
</script>

<template>
  <div class="cms-quotes-container">
    <draggable 
      v-if="list.length > 0"
      v-model="list" 
      class="cms-quotes-grid"
      item-key="_cms_id"
      :animation="300"
      :disabled="editingQuoteIndex !== -1"
      :filter="'.cms-card-actions, .cms-action-btn, button, input, textarea, select, option'"
      @start="onDragStart"
      @end="onDragEnd"
      ghost-class="ghost-card"
    >
      <template #item="{ element, index }">
        <div class="cms-quote-card-wrap cms-card-wrap">
          <div class="cms-quote-card" :class="{ editing: editingQuoteIndex === index }">
            <template v-if="editingQuoteIndex === index && localDraft">
              <div class="cms-quote-edit-grid">
                <div class="cms-quote-edit-field">
                  <label>语录内容</label>
                  <textarea
                    v-model="localDraft.content"
                    rows="4"
                    class="cms-quote-edit-textarea"
                    placeholder="输入语录内容..."
                  ></textarea>
                </div>
                <div class="cms-quote-edit-row">
                  <div class="cms-quote-edit-field">
                    <label>作者/出处</label>
                    <input v-model="localDraft.author" type="text" placeholder="例如：鲁迅" />
                  </div>
                  <div class="cms-quote-edit-field">
                    <label>来源</label>
                    <input v-model="localDraft.source" type="text" placeholder="例如：书名/文章/链接" />
                  </div>
                </div>
                <div class="cms-quote-edit-row">
                  <div class="cms-quote-edit-field">
                    <label>记录日期</label>
                    <input v-model="localDraft.date" type="date" />
                  </div>
                  <div class="cms-quote-edit-actions">
                    <button class="cms-pill-btn" @click="emit('saveEditQuote')" title="保存">
                      <CheckOutlined />
                      <span>保存</span>
                    </button>
                    <button class="cms-pill-btn ghost" @click="emit('cancelEditQuote')" title="取消">
                      <CloseOutlined />
                      <span>取消</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="quote-style-card" @click="onCardClick(index)">
                <div class="quote-content-text">
                  <span class="quote-text-span">{{ element.content }}</span>
                </div>
                <div class="quote-footer-info">
                  <div class="author-info-box">
                    <span v-if="element.author" class="quote-author-name">—— {{ element.author }}</span>
                    <span v-if="element.source" class="quote-source-name"> {{ element.source }}</span>
                  </div>
                  <div class="quote-date-text">{{ element.date }}</div>
                </div>
              </div>
            </template>
          </div>

          <div class="cms-quote-actions cms-card-actions">
            <div v-if="editingQuoteIndex !== index" class="cms-action-btn drag-handle" title="拖拽排序">
              <HolderOutlined />
            </div>
            <button
              v-if="editingQuoteIndex !== index"
              class="cms-action-btn"
              @click.stop="emit('startEditQuote', index)"
              title="编辑"
            >
              <EditOutlined />
            </button>
            <button
              v-if="editingQuoteIndex !== index"
              class="cms-action-btn"
              @click.stop="emit('cloneItem', index)"
              title="克隆"
            >
              <CopyOutlined />
            </button>
            <button class="cms-action-btn danger" @click.stop="emit('deleteItem', index)" title="删除">
              <DeleteOutlined />
            </button>
          </div>
        </div>
      </template>
    </draggable>
    <div v-else class="empty-state">暂无数据，请点击上方新增</div>
  </div>
</template>

<style scoped lang="scss">
.cms-quotes-container {
  padding: 0 40px;
}

.cms-quotes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.cms-card-wrap {
  position: relative;
}

.quote-style-card {
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  padding: 30px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  cursor: grab;
  height: 100%;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #9d9e9f 0%, #ebeded 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::before {
    opacity: 1;
  }
}

.quote-content-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: rgb(var(--color-text-primary));
  font-family: "Georgia", "Source Han Serif", serif;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
}

.quote-footer-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.85rem;
  border-top: 1px dashed rgba(var(--color-border-primary), 0.1);
  padding-top: 15px;

  .author-info-box {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .quote-author-name {
      font-weight: bold;
      color: rgb(var(--color-text-primary));
    }

    .quote-source-name {
      font-style: italic;
      color: rgb(var(--color-text-primary));
      opacity: 0.6;
      font-size: 0.75rem;
    }
  }

  .quote-date-text {
    color: rgb(var(--color-text-primary));
    opacity: 0.4;
    font-size: 0.75rem;
    font-family: monospace;
  }
}

.cms-quote-card {
  border-radius: 16px;
  background: rgb(var(--color-bg-primary));
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  height: 100%;
}

.cms-quote-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.cms-quote-card.editing {
  border-color: rgb(var(--color-accent) / 0.35);
  box-shadow: 0 8px 24px rgb(var(--color-accent) / 0.12);
  padding: 20px;
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
}

.cms-pill-btn.ghost {
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
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
}

.cms-card-wrap:hover .cms-card-actions {
  opacity: 1;
  transform: translateY(0);
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
}

.cms-action-btn.danger {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
}

.drag-handle {
  cursor: grab;
  color: rgb(var(--color-text-secondary));
  
  &:active {
    cursor: grabbing;
  }
}

.ghost-card {
  opacity: 0.5;
  background: rgb(var(--color-bg-secondary)) !important;
  border: 2px dashed rgb(var(--color-accent)) !important;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: rgb(var(--color-text-secondary));
}
</style>
