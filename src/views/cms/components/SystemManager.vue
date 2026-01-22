
<script setup>
import { ref, onMounted } from 'vue'
import { 
  HistoryOutlined, 
  CloudDownloadOutlined, 
  RollbackOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'
import { apiFetch, apiUrl } from '../utils'

const history = ref([])
const loadingHistory = ref(false)
const rollingBack = ref(null) // hash of commit being rolled back
const toast = ref({ show: false, msg: '', type: 'success' })

const showToast = (msg, type = 'success') => {
  toast.value = { show: true, msg, type }
  setTimeout(() => toast.value.show = false, 3000)
}

const fetchHistory = async () => {
  loadingHistory.value = true
  try {
    const res = await apiFetch('/api/git/history')
    const result = await res.json()
    if (result.success) {
      history.value = result.history
    }
  } catch (err) {
    console.error('Failed to fetch history:', err)
  } finally {
    loadingHistory.value = false
  }
}

const rollback = async (hash) => {
  if (!confirm(`确定要强制回滚到提交 ${hash.substring(0, 7)} 吗？\n这会丢弃该版本之后的所有未保存更改！`)) return
  
  rollingBack.value = hash
  try {
    const res = await apiFetch('/api/git/rollback', {
      method: 'POST',
      body: JSON.stringify({ hash })
    })
    const result = await res.json()
    if (result.success) {
      showToast('回滚成功，系统已重置')
      await fetchHistory()
    } else {
      showToast('回滚失败: ' + result.message, 'error')
    }
  } catch (err) {
    showToast('回滚失败，网络错误', 'error')
  } finally {
    rollingBack.value = null
  }
}

const downloadBackup = () => {
  window.open(apiUrl('/api/system/backup'), '_blank')
}

onMounted(fetchHistory)
</script>

<template>
  <div class="system-manager">
    <div class="system-section">
      <div class="section-header">
        <h3><CloudDownloadOutlined /> 数据备份与导出</h3>
        <p>将全站文章、数据和上传的媒体资源打包下载，确保数据安全。</p>
      </div>
      <div class="section-content">
        <button class="action-btn primary" @click="downloadBackup">
          <CloudDownloadOutlined /> 生成并下载全站备份 (.zip)
        </button>
      </div>
    </div>

    <div class="system-section">
      <div class="section-header">
        <h3><HistoryOutlined /> Git 版本历史与回滚</h3>
        <p>查看最近的提交记录，并在必要时回滚到之前的版本。</p>
      </div>
      <div class="section-content">
        <div v-if="loadingHistory" class="loading-state">
          <LoadingOutlined /> 正在读取 Git 日志...
        </div>
        <div v-else class="history-list">
          <div v-for="(item, index) in history" :key="item.hash" class="history-item" :class="{ current: index === 0 }">
            <div class="history-main">
              <div class="history-badge" v-if="index === 0">当前版本</div>
              <div class="history-msg">{{ item.message }}</div>
              <div class="history-meta">
                <span class="history-hash">{{ item.hash.substring(0, 7) }}</span>
                <span class="history-author">@{{ item.author }}</span>
                <span class="history-date">{{ item.date }}</span>
              </div>
            </div>
            <div class="history-actions">
              <button 
                v-if="index !== 0" 
                class="rollback-btn" 
                @click="rollback(item.hash)"
                :disabled="rollingBack"
              >
                <template v-if="rollingBack === item.hash">
                  <LoadingOutlined /> 回滚中...
                </template>
                <template v-else>
                  <RollbackOutlined /> 回滚到此版本
                </template>
              </button>
              <div v-else class="current-check"><CheckCircleOutlined /></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toast" :class="[toast.type, { show: toast.show }]">
      <ExclamationCircleOutlined v-if="toast.type === 'error'" />
      <CheckCircleOutlined v-else />
      {{ toast.msg }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.system-manager {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.system-section {
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  border-radius: 20px;
  padding: 32px;
}

.section-header {
  margin-bottom: 24px;
  h3 {
    margin: 0 0 8px 0;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  p {
    margin: 0;
    color: rgb(var(--color-text-secondary));
    font-size: 0.9rem;
  }
}

.action-btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgb(var(--color-border-primary));
  background: rgb(var(--color-bg-secondary) / 0.5);
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgb(var(--color-bg-secondary));
  }

  &.primary {
    background: rgb(var(--color-accent));
    color: white;
    border: none;
    &:hover {
      background: rgb(var(--color-accent) / 0.9);
      box-shadow: 0 4px 12px rgb(var(--color-accent) / 0.3);
    }
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgb(var(--color-bg-secondary) / 0.2);
  border-radius: 14px;
  border: 1px solid transparent;
  transition: all 0.2s;

  &:hover {
    background: rgb(var(--color-bg-secondary) / 0.4);
  }

  &.current {
    border-color: rgb(var(--color-accent) / 0.3);
    background: rgb(var(--color-accent) / 0.05);
  }
}

.history-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-badge {
  font-size: 0.7rem;
  background: rgb(var(--color-accent));
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
  font-weight: 800;
  margin-bottom: 4px;
}

.history-msg {
  font-weight: 600;
  font-size: 0.95rem;
}

.history-meta {
  font-size: 0.8rem;
  color: rgb(var(--color-text-secondary));
  display: flex;
  gap: 12px;
  font-family: monospace;
}

.history-hash {
  color: rgb(var(--color-accent));
}

.rollback-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ef4444;
  color: #ef4444;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #ef4444;
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.current-check {
  color: #10b981;
  font-size: 1.25rem;
}

.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  padding: 12px 24px;
  border-radius: 999px;
  background: #10b981;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  z-index: 10000;

  &.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  &.error {
    background: #ef4444;
  }
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: rgb(var(--color-text-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
</style>
