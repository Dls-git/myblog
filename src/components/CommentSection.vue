<script setup>
import Giscus from '@giscus/vue'

// Giscus 配置
// ⚠️ 重要：你需要去 https://giscus.app/zh-CN 获取你自己的仓库配置
// 然后替换下面的 repo, repoId, category, categoryId
const giscusConfig = {
  repo:"Dls-git/myblog",
  repoId:"R_kgDOQoFYMA",
  category:"Announcements",
  categoryId:"DIC_kwDOQoFYMM4Cz8z6",
  mapping: "pathname",
  strict: "0",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "top",
  theme: "preferred_color_scheme",
  lang: "zh-CN",
  loading: "lazy"
}
</script>

<template>
  <div class="comment-section">
    <div class="divider">
      <span>END</span>
    </div>
    
    <h3>💬 评论区</h3>
    
    <!-- 提示信息 (配置好后可以删除这个提示框) -->
    <div class="comment-tip" v-if="giscusConfig.repo === 'your-github-username/your-repo-name'">
      <h4>🚧 评论区未配置</h4>
      <p>要启用评论功能，请按照以下步骤操作：</p>
      <ol>
        <li>访问 <a href="https://giscus.app/zh-CN" target="_blank">giscus.app</a></li>
        <li>输入你的 GitHub 仓库信息 (需公开仓库且开启 Discussions)</li>
        <li>获取生成的配置代码</li>
        <li>修改项目中的 <code>src/components/CommentSection.vue</code> 文件，填入 <code>repo</code>, <code>repoId</code>, <code>category</code>, <code>categoryId</code></li>
      </ol>
    </div>
    
    <div class="giscus-wrapper">
      <Giscus v-bind="giscusConfig" />
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  margin-top: 80px;
  padding-top: 20px;
  max-width: 800px; /* 限制评论区宽度 */
  margin-left: auto;
  margin-right: auto;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  opacity: 0.3;
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: currentColor;
  }
  
  span {
    padding: 0 15px;
    font-size: 14px;
    letter-spacing: 2px;
  }
}

h3 {
  margin-bottom: 20px;
  color: rgb(var(--color-text-primary));
}

.comment-tip {
  background: rgba(var(--color-bg-secondary), 0.5);
  border: 1px solid rgba(var(--color-border-primary), 0.3);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  color: rgb(var(--color-text-primary));
  
  h4 {
    margin-top: 0;
    color: #e6a23c;
  }
  
  ol {
    padding-left: 20px;
    margin-bottom: 0;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  a {
    color: #409eff;
    text-decoration: underline;
  }
}

.giscus-wrapper {
  min-height: 200px;
}
</style>
