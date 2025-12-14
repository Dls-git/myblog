<template>
  <div class="toc-container">
    <div class="toc">
      <h2>TABLE OF CONTENTS</h2>
      <ul>
        <li v-for="item in toc"
            :key="item.id"
            :class="['level-' + item.level, { active: item.id === (activeId || localActiveId) }]"
            :data-id="item.id"
        >
          <a href="javascript:void(0)" @click.prevent="scrollTo(item.id)">{{ item.text }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({
  toc: Array,
  activeId: String
})

function scrollTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const HEADER_OFFSET = 100
  const top = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET - 16
  window.scrollTo({ top, behavior: 'smooth' })
  localActiveId.value = id
}

const localActiveId = ref('')
onMounted(() => {
  if (props.activeId) {
    localActiveId.value = props.activeId
  } else if (props.toc && props.toc.length) {
    localActiveId.value = props.toc[0].id
  }
})
</script>

<style scoped>
.toc-container {
  position: sticky;
  top: 100px; /* 距离页面顶部100px */
  width: 240px;
  padding: 20px;
  background-color: transparent;
  border-radius: 12px;
  height: calc(100vh - 120px); /* 保证 TOC 竖直长度适应页面 */
  overflow-y: auto;  /* 添加垂直滚动 */
}

.toc {
  font-family: Arial, sans-serif;
  color: rgb(var(--color-text-primary));
}

.toc h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1em;
  color: rgb(var(--color-text-secondary));
  border-bottom: 2px solid rgb(var(--color-border-primary));
  padding-bottom: 8px;
}

.toc ul {
  list-style: none;
  padding-left: 0;
}

.toc li {
  margin: 0.6em 0;
  transition: all 0.2s ease;
  border-radius: 10px;
}

/* 层级缩进 */
.toc li.level-2 {
  padding-left: 0;
  font-weight: 500;
}

.toc li.level-3 {
  padding-left: 1.2rem;
  font-size: 0.95rem;
}

.toc li.level-4 {
  padding-left: 2.4rem;
  font-size: 0.9rem;
}

.toc li.level-5 {
  padding-left: 3.6rem;
  font-size: 0.85rem;
}

.toc li a {
  text-decoration: none;
  color: rgb(var(--color-text-secondary));
  font-size: 1rem;
}

.toc li.active a {
  color: rgb(var(--color-accent, 37 99 235));
}

.toc li:hover a {
  color: rgb(var(--color-text-primary));
}
.toc li:hover {
  background-color: rgb(var(--color-bg-secondary) / .12);
}


</style>
<style>
.toc-container {
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--color-border-primary) / .5) transparent;
}
.toc-container::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.toc-container::-webkit-scrollbar-track {
  background: transparent;
}
.toc-container::-webkit-scrollbar-thumb {
  background-image: linear-gradient(180deg, rgb(var(--color-accent) / .7), rgb(var(--color-accent) / .4));
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow: inset 0 0 2px rgb(var(--color-border-primary) / .35);
}
.toc-container::-webkit-scrollbar-thumb:hover {
  background-image: linear-gradient(180deg, rgb(var(--color-accent) / .9), rgb(var(--color-accent) / .6));
}
.toc-container::-webkit-scrollbar-button {
  width: 0;
  height: 0;
  display: none;
}
.toc-container::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
