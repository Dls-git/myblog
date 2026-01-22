
<script setup>
import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import { FileTextOutlined, FolderOutlined, TagOutlined, ZoomInOutlined, ZoomOutOutlined, ExpandOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  posts: { type: Array, default: () => [] }
})

const emit = defineEmits(['navigate'])

const svgRef = ref(null)
const containerRef = ref(null)
let simulation = null

const initGraph = () => {
  if (!props.posts.length) return
  if (simulation) simulation.stop()

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  // 1. 数据转换：提取节点和关系
  const nodes = []
  const links = []
  const nodeMap = new Map()

  // 辅助函数：添加唯一节点
  const addNode = (id, label, type, data = null) => {
    if (!nodeMap.has(id)) {
      const node = { id, label, type, data }
      nodes.push(node)
      nodeMap.set(id, node)
      return node
    }
    return nodeMap.get(id)
  }

  props.posts.forEach(post => {
    // 文章节点
    const postNode = addNode(`post-${post.slug}`, post.title, 'post', post)
    
    // 分类节点
    if (post.category) {
      const catNode = addNode(`cat-${post.category}`, post.category, 'category')
      links.push({ source: postNode.id, target: catNode.id, type: 'in-category' })
    }

    // 标签节点
    if (Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        const tagNode = addNode(`tag-${tag}`, tag, 'tag')
        links.push({ source: postNode.id, target: tagNode.id, type: 'has-tag' })
      })
    }
  })

  // 2. D3 画布初始化
  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])

  svg.selectAll('*').remove() // 清空旧内容

  const g = svg.append('g')

  // 缩放逻辑
  const zoom = d3.zoom()
    .scaleExtent([0.1, 8])
    .on('zoom', (event) => g.attr('transform', event.transform))

  svg.call(zoom)

  // 3. 力导向模拟
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(50))

  // 4. 绘制连接线
  const link = g.append('g')
    .attr('stroke', '#94a3b8')
    .attr('stroke-opacity', 0.4)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', 1)

  // 5. 绘制节点容器
  const node = g.append('g')
    .selectAll('.node')
    .data(nodes)
    .join('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))
    .on('click', (event, d) => {
      if (d.type === 'post') emit('navigate', 'article', d.data.slug)
    })

  // 节点背景圆
  node.append('circle')
    .attr('r', d => d.type === 'post' ? 8 : (d.type === 'category' ? 12 : 6))
    .attr('fill', d => {
      if (d.type === 'post') return '#0ea5e9'
      if (d.type === 'category') return '#10b981'
      return '#a855f7'
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // 节点标签
  node.append('text')
    .text(d => d.label)
    .attr('x', 12)
    .attr('y', 4)
    .style('font-size', '12px')
    .style('fill', 'rgb(var(--color-text-primary))')
    .style('pointer-events', 'none')
    .style('text-shadow', '0 1px 2px rgba(255,255,255,0.8)')

  // 6. 动画帧更新
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })

  // 拖拽函数
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }
  function dragged(event) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }

  // 初始自动缩放以适应屏幕
  svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1))
}

// 控制函数
const zoomIn = () => d3.select(svgRef.value).transition().call(d3.zoom().scaleBy, 1.3)
const zoomOut = () => d3.select(svgRef.value).transition().call(d3.zoom().scaleBy, 0.7)
const resetZoom = () => d3.select(svgRef.value).transition().call(d3.zoom().transform, d3.zoomIdentity)

onMounted(() => {
  setTimeout(initGraph, 100) // 确保容器尺寸已计算
})

watch(() => props.posts, initGraph, { deep: true })
</script>

<template>
  <div class="knowledge-graph-view">
    <div class="graph-header">
      <div class="header-left">
        <h3><ExpandOutlined /> 知识图谱 (Mind Map)</h3>
        <p>可视化展示文章、分类与标签之间的网状关联结构。</p>
      </div>
      <div class="legend">
        <div class="legend-item"><span class="dot post"></span> 文章</div>
        <div class="legend-item"><span class="dot category"></span> 分类</div>
        <div class="legend-item"><span class="dot tag"></span> 标签</div>
      </div>
    </div>

    <div class="graph-container" ref="containerRef">
      <svg ref="svgRef"></svg>
      
      <div class="graph-controls">
        <button @click="zoomIn" title="放大"><ZoomInOutlined /></button>
        <button @click="zoomOut" title="缩小"><ZoomOutOutlined /></button>
        <button @click="resetZoom" title="重置视图"><ExpandOutlined /></button>
      </div>

      <div class="graph-tip">
        💡 提示：可拖动节点，点击文章节点进入编辑页面。支持滚轮缩放。
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.knowledge-graph-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  
  h3 {
    margin: 0 0 4px 0;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    margin: 0;
    color: rgb(var(--color-text-secondary));
    font-size: 0.9rem;
  }
}

.legend {
  display: flex;
  gap: 16px;
  background: rgb(var(--color-bg-secondary) / 0.5);
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    
    &.post { background: #0ea5e9; }
    &.category { background: #10b981; }
    &.tag { background: #a855f7; }
  }
}

.graph-container {
  flex: 1;
  background: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.02);
  
  svg {
    cursor: grab;
    &:active { cursor: grabbing; }
  }
}

.graph-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  button {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgb(var(--color-border-primary) / 0.8);
    background: rgb(var(--color-bg-primary) / 0.9);
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(var(--color-text-secondary));
    transition: all 0.2s;
    
    &:hover {
      background: rgb(var(--color-bg-primary));
      color: rgb(var(--color-accent));
      border-color: rgb(var(--color-accent) / 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }
}

.graph-tip {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgb(var(--color-bg-primary) / 0.8);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.75rem;
  color: rgb(var(--color-text-secondary));
  border: 1px solid rgb(var(--color-border-primary) / 0.5);
  pointer-events: none;
}
</style>
