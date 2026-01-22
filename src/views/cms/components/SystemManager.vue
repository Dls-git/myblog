
<script setup>
import { ref, onMounted } from 'vue'
import { 
  HistoryOutlined, 
  CloudDownloadOutlined, 
  RollbackOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { apiFetch, apiUrl } from '../utils'

const history = ref([])
const loadingHistory = ref(false)
const rollingBack = ref(null) // hash of commit being rolled back
const toast = ref({ show: false, msg: '', type: 'success' })

// 恢复备份相关状态
const showRestoreModal = ref(false)
const restoreFile = ref(null)
const restoring = ref(false)
const restoreProgress = ref(0)
const restoreStats = ref(null)

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

// 恢复备份相关函数
const openRestoreModal = () => {
  showRestoreModal.value = true
  restoreFile.value = null
  restoreProgress.value = 0
  restoreStats.value = null
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    restoreFile.value = file
  }
}

const handleRestore = async () => {
  if (!restoreFile.value) {
    showToast('请选择要恢复的备份文件', 'error')
    return
  }
  
  if (!confirm('确定要恢复备份吗？这将覆盖当前所有内容！')) {
    return
  }
  
  restoring.value = true
  restoreProgress.value = 10
  
  try {
    const formData = new FormData()
    formData.append('backup', restoreFile.value)
    
    const res = await fetch(apiUrl('/api/system/restore'), {
      method: 'POST',
      body: formData
    })
    
    restoreProgress.value = 80
    
    const result = await res.json()
    if (result.success) {
      restoreProgress.value = 100
      restoreStats.value = result.stats
      showToast('恢复成功', 'success')
      setTimeout(() => {
        showRestoreModal.value = false
        // 刷新页面以应用恢复的内容
        window.location.reload()
      }, 1500)
    } else {
      throw new Error(result.message || '恢复失败')
    }
  } catch (err) {
    showToast(`恢复失败: ${err.message}`, 'error')
    restoring.value = false
  }
}

const cancelRestore = () => {
  showRestoreModal.value = false
  restoreFile.value = null
  restoreProgress.value = 0
  restoreStats.value = null
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
        <div class="action-buttons">
          <button class="action-btn primary" @click="downloadBackup">
            <CloudDownloadOutlined /> 生成并下载全站备份 (.zip)
          </button>
          <button class="action-btn secondary" @click="openRestoreModal">
            <UploadOutlined /> 上传zip恢复内容
          </button>
        </div>
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
  </div>

  <div class="toast" :class="[toast.type, { show: toast.show }]">
    <ExclamationCircleOutlined v-if="toast.type === 'error'" />
    <CheckCircleOutlined v-else />
    {{ toast.msg }}
  </div>

  <!-- 恢复备份模态框 -->
  <div class="modal-mask" v-if="showRestoreModal" @click.self="!restoring && cancelRestore">
    <div class="modal-panel wide-modal">
      <div class="modal-header">
        <h3><UploadOutlined /> 恢复备份</h3>
        <button class="btn-icon" @click="!restoring && cancelRestore" :disabled="restoring">
          <CloseOutlined />
        </button>
      </div>
      
      <div class="modal-body">
        <div v-if="!restoring" class="restore-steps">
          <div class="step">
            <h4>1. 选择备份文件</h4>
            <div class="file-upload-area">
              <input 
                type="file" 
                accept=".zip" 
                @change="handleFileChange" 
                class="file-input"
              />
              <div v-if="restoreFile" class="file-info">
                <span class="file-name">{{ restoreFile.name }}</span>
                <span class="file-size">({{ (restoreFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
              </div>
            </div>
          </div>
          
          <div class="step">
            <h4>2. 开始恢复</h4>
            <p class="warning-text">⚠️ 恢复将覆盖当前所有内容，请谨慎操作！</p>
          </div>
        </div>
        
        <div v-else class="restore-progress">
          <div class="progress-header">
            <LoadingOutlined /> 正在恢复备份...
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: `${restoreProgress}%` }"></div>
          </div>
          <div class="progress-text">{{ restoreProgress }}%</div>
          
          <div v-if="restoreStats" class="restore-result">
            <h4>恢复成功！</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">文章数量：</span>
                <span class="stat-value">{{ restoreStats.posts }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">数据文件：</span>
                <span class="stat-value">{{ restoreStats.data }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">上传文件：</span>
                <span class="stat-value">{{ restoreStats.uploads }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">资源文件：</span>
                <span class="stat-value">{{ restoreStats.assets }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">配置文件：</span>
                <span class="stat-value">{{ restoreStats.config }}</span>
              </div>
            </div>
            <p class="reload-text">系统将自动刷新以应用恢复内容...</p>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" @click="cancelRestore" :disabled="restoring">
          取消
        </button>
        <button 
          class="action-btn primary" 
          @click="handleRestore" 
          :disabled="restoring || !restoreFile"
        >
          {{ restoring ? '恢复中...' : '开始恢复' }}
        </button>
      </div>
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

  &.secondary {
    background: rgb(var(--color-bg-secondary));
    color: rgb(var(--color-text-primary));
    border: 1px solid rgb(var(--color-border-primary));
    &:hover {
      background: rgb(var(--color-bg-primary));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 恢复备份样式 */
.restore-steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step h4 {
  margin: 0;
  font-size: 1rem;
  color: rgb(var(--color-text-primary));
}

.file-upload-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-input {
  padding: 12px;
  border: 1px dashed rgb(var(--color-border-primary));
  border-radius: 12px;
  background: rgb(var(--color-bg-secondary) / 0.5);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgb(var(--color-accent));
    background: rgb(var(--color-bg-secondary));
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgb(var(--color-bg-secondary) / 0.5);
  border-radius: 12px;
  border: 1px solid rgb(var(--color-border-primary));
}

.file-name {
  font-weight: 600;
  color: rgb(var(--color-text-primary));
}

.file-size {
  font-size: 0.85rem;
  color: rgb(var(--color-text-secondary));
}

.warning-text {
  color: #f59e0b;
  font-size: 0.9rem;
  margin: 0;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.restore-progress {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding: 20px 0;
}

.progress-header {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--color-text-primary));
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgb(var(--color-bg-secondary));
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: rgb(var(--color-accent));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgb(var(--color-accent));
}

.restore-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  text-align: center;
  width: 100%;
}

.restore-result h4 {
  margin: 0;
  font-size: 1.2rem;
  color: #10b981;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 600px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: rgb(var(--color-bg-secondary) / 0.5);
  border-radius: 12px;
  border: 1px solid rgb(var(--color-border-primary));
}

.stat-label {
  font-size: 0.85rem;
  color: rgb(var(--color-text-secondary));
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--color-text-primary));
}

.reload-text {
  font-size: 0.9rem;
  color: rgb(var(--color-text-secondary));
  margin: 0;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

.modal-panel {
  width: 600px;
  max-width: 100%;
  background: rgb(var(--color-bg-primary));
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
}

.modal-panel.wide-modal {
  width: 700px;
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
  }
}

.modal-body {
  padding: 24px;
  max-height: 70vh;
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

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  color: rgb(var(--color-text-primary));

  &:hover {
    background: rgb(var(--color-bg-secondary));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgb(var(--color-border-primary));
  background: rgb(var(--color-bg-secondary) / 0.5);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  color: rgb(var(--color-text-primary));

  &:hover {
    background: rgb(var(--color-bg-secondary));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
