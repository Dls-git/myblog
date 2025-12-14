<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { posts } from '@/posts';
import Card from "@/views/home/component/card.vue";

const route = useRoute();
const categoryName = computed(() => route.params.name);

// 处理文章数据
const allPosts = computed(() => {
  return Object.keys(posts).map(slug => {
    const post = posts[slug];
    const fm = post.frontmatter || {};
    return {
      slug,
      title: fm.title || slug,
      date: fm.date || '',
      description: fm.description || '',
      tags: fm.tags || [],
      category: fm.category || '未分类'
    };
  }).sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
});

// 过滤当前分类的文章
const categoryPosts = computed(() => {
  if (!categoryName.value) return [];
  return allPosts.value.filter(post => post.category === categoryName.value);
});

// 分页逻辑
const currentPage = ref(1);
const pageSize = 6;
const totalPages = computed(() => Math.ceil(categoryPosts.value.length / pageSize));
const displayPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return categoryPosts.value.slice(start, start + pageSize);
});

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// 监听路由变化重置分页
watch(categoryName, () => {
  currentPage.value = 1;
});

// 统计分类 (用于侧边栏)
const categories = computed(() => {
  const counts = {};
  allPosts.value.forEach(post => {
    const cat = post.category;
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return Object.keys(counts).map(name => ({
    name,
    count: counts[name]
  })).sort((a, b) => b.count - a.count);
});

// 统计标签 (用于侧边栏)
const tags = computed(() => {
  const counts = {};
  allPosts.value.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    }
  });
  return Object.keys(counts).map(name => ({
    name,
    count: counts[name]
  })).sort((a, b) => b.count - a.count);
});
</script>

<template>
  <div class="content-wrapper">
    <!-- 左侧：文章列表 -->
    <div class="main-content">
      <h2 class="section-title">分类: {{ categoryName }}</h2>
      
      <div class="post-list">
        <template v-if="displayPosts.length > 0">
          <Card 
            v-for="post in displayPosts" 
            :key="post.slug"
            :title="post.title"
            :date="post.date"
            :description="post.description"
            :slug="post.slug"
          />
        </template>
        <div v-else class="empty-state">
          <p>该分类下暂无文章</p>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          &lt;
        </button>
        <button 
          v-for="page in totalPages" 
          :key="page"
          class="page-btn" 
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          &gt;
        </button>
      </div>
    </div>

    <!-- 右侧：侧边栏 -->
    <div class="sidebar">
      <!-- 分类模块 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">分类</h3>
        <div class="category-list">
          <router-link 
            v-for="cat in categories" 
            :key="cat.name" 
            :to="`/layout/category/${cat.name}`"
            class="category-item"
            :class="{ active: cat.name === categoryName }"
          >
            <div class="cat-name">
              <img src="@/assets/img/seo-folder.png" alt="folder">
              <span>{{ cat.name }}</span>
            </div>
            <span class="cat-count">{{ cat.count }}</span>
          </router-link>
        </div>
      </div>

      <!-- 标签模块 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">标签</h3>
        <div class="tag-cloud">
          <router-link 
            v-for="tag in tags" 
            :key="tag.name" 
            :to="`/layout/tag/${tag.name}`"
            class="tag-item"
          >
            {{ tag.name }} 
            <span class="tag-count">{{ tag.count }}</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-wrapper {
  display: flex;
  justify-content: center;
  gap: 40px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.section-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 24px;
  color: rgb(var(--color-text-primary));
  position: relative;
  padding-left: 15px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 24px;
    background: #409eff;
    border-radius: 2px;
  }
}

/* 左侧主内容 */
.main-content {
  flex: 1;
  max-width: 900px;
}

.post-list {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: rgb(var(--color-text-primary));
  opacity: 0.5;
  font-size: 18px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 40px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: rgb(var(--color-bg-secondary));
  color: rgb(var(--color-text-primary));
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #409eff;
    color: white;
  }

  &.active {
    background: #409eff;
    color: white;
    font-weight: bold;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* 右侧侧边栏 */
.sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 30px;
  position: sticky;
  top: 100px;
  height: fit-content;
}

.sidebar-widget {
  background: rgb(var(--color-bg-primary));
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.widget-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: rgb(var(--color-text-primary));
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
}

/* 分类列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgb(var(--color-bg-secondary) / 0.5);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;

  &:hover {
    background: #e6f7ff;
    transform: translateX(5px);
  }

  &.active {
    background: #e6f7ff;
    border-left: 4px solid #409eff;
  }

  .cat-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: rgb(var(--color-text-primary));

    img {
      width: 20px;
      height: 20px;
      opacity: 0.8;
    }
  }

  .cat-count {
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    color: rgb(var(--color-text-primary));
    opacity: 0.6;
  }
}

/* 标签云 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  padding: 6px 12px;
  background: rgb(var(--color-bg-secondary));
  border-radius: 8px;
  font-size: 14px;
  color: rgb(var(--color-text-primary));
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;

  &:hover {
    background: #409eff;
    color: white;
  }

  .tag-count {
    font-size: 12px;
    opacity: 0.6;
  }
}

/* 响应式 */
@media (max-width: 900px) {
  .content-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: static;
  }

  .main-content {
    max-width: 100%;
  }
}
</style>