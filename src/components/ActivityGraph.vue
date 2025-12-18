<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { posts } from '@/posts'
import { thoughts } from '@/posts/dataJs/thoughts.js'

// 1. 数据处理
const chartData = computed(() => {
  const stats = {}

  // 辅助函数：更新统计
  const updateStats = (dateStr) => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return
    const key = `${date.getFullYear()}.${date.getMonth() + 1}`
    stats[key] = (stats[key] || 0) + 1
  }

  // 统计文章
  Object.values(posts).forEach(post => {
    updateStats(post.frontmatter.date)
  })

  // 统计说说
  thoughts.forEach(thought => {
    updateStats(thought.date)
  })

  // 补全最近 12 个月（或者根据数据范围）
  // 这里为了效果好看，我们生成一个包含所有有数据月份的列表，并按时间排序
  const keys = Object.keys(stats).sort((a, b) => {
    const [y1, m1] = a.split('.').map(Number)
    const [y2, m2] = b.split('.').map(Number)
    return y1 === y2 ? m1 - m2 : y1 - y2
  })

  if (keys.length === 0) return []

  // 补全中间缺失的月份
  const fullData = []
  const [startYear, startMonth] = keys[0].split('.').map(Number)
  const [endYear, endMonth] = keys[keys.length - 1].split('.').map(Number)

  let currentYear = startYear
  let currentMonth = startMonth

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    const key = `${currentYear}.${currentMonth}`
    fullData.push({
      label: key,
      count: stats[key] || 0
    })

    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  // 如果数据太少，可以往前补几个月，保证图表长度
  while (fullData.length < 6) {
      const first = fullData[0]
      let [y, m] = first.label.split('.').map(Number)
      m--
      if (m < 1) { m = 12; y-- }
      fullData.unshift({ label: `${y}.${m}`, count: 0 })
  }

  return fullData
})

// 2. 绘图参数
const width = 800
const height = 200
const padding = { top: 40, bottom: 40, left: 20, right: 20 }
const contentHeight = height - padding.top - padding.bottom

const maxCount = computed(() => Math.max(...chartData.value.map(d => d.count), 5)) // 至少为5，防止太矮

// 计算坐标
const points = computed(() => {
  const count = chartData.value.length
  const step = (width - padding.left - padding.right) / (count - 1 || 1)

  return chartData.value.map((item, index) => {
    const x = padding.left + index * step
    // 高度比例：保留至少 10px 的高度给 0 (作为基准点)，最大高度对应 maxCount
    const barHeight = (item.count / maxCount.value) * (contentHeight - 20)
    const y = height - padding.bottom

    return {
      x,
      y, // 基准线 y 坐标
      barHeight: Math.max(barHeight, 0), // 柱子高度
      count: item.count,
      label: item.label
    }
  })
})

// 交互状态
const hoveredIndex = ref(-1)
</script>

<template>
  <div class="activity-graph">
    <div class="header">
      <h3>热力图的千篇一律，不如做成了时间线？</h3>
    </div>

    <div class="chart-container">
      <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="xMidYMid meet">
        <!-- 底部横轴 -->
        <line
          :x1="padding.left"
          :y1="height - padding.bottom"
          :x2="width - padding.right"
          :y2="height - padding.bottom"
          stroke="rgb(var(--color-border-primary))"
          stroke-width="1"
          opacity="0.5"
        />

        <!-- 数据点 -->
        <g v-for="(p, index) in points" :key="p.label">
          <!-- 垂直线 (柱子) -->
          <line
            :x1="p.x"
            :y1="p.y"
            :x2="p.x"
            :y2="p.y - p.barHeight - (p.count > 0 ? 10 : 0)"
            class="bar-line"
            :class="{ active: hoveredIndex === index }"
          />

          <!-- 顶部圆点 (只有 count > 0 才显示) -->
          <circle
            v-if="p.count > 0"
            :cx="p.x"
            :cy="p.y - p.barHeight - 10"
            r="3"
            class="top-dot"
            :class="{ active: hoveredIndex === index }"
          />

          <!-- 底部时间轴圆点 -->
          <circle
            :cx="p.x"
            :cy="p.y"
            r="4"
            class="base-dot"
            :class="{ active: hoveredIndex === index }"
            @mouseenter="hoveredIndex = index"
            @mouseleave="hoveredIndex = -1"
          />

          <!-- 时间标签 -->
          <text
            :x="p.x"
            :y="height - 10"
            text-anchor="middle"
            class="label-text"
            :class="{ active: hoveredIndex === index }"
          >
            {{ p.label }}
          </text>

          <!-- Tooltip (SVG 内部) -->
          <g v-if="hoveredIndex === index" :transform="`translate(${p.x}, ${p.y - p.barHeight - 30})`">
             <text text-anchor="middle" fill="#409eff" font-weight="bold" font-size="14">
               {{ p.count }} 篇
             </text>
          </g>

          <!-- 透明的交互区域，方便 Hover -->
          <rect
            :x="p.x - 10"
            :y="0"
            width="20"
            :height="height"
            fill="transparent"
            @mouseenter="hoveredIndex = index"
            @mouseleave="hoveredIndex = -1"
            style="cursor: pointer;"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped lang="scss">
.activity-graph {
  width: 100%;
  margin-top: 60px;
  padding: 20px 0;
  border-top: 1px dashed rgba(var(--color-border-primary), 0.3);
}

.header {
  text-align: center;
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
    font-weight: normal;
    color: rgb(var(--color-text-primary));
    opacity: 0.8;
  }
}

.chart-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* SVG Styles */
.bar-line {
  stroke: #4DB6AC; /* 青色 */
  stroke-width: 2;
  transition: all 0.3s ease;
  opacity: 0.6;

  &.active {
    stroke: #009688;
    stroke-width: 3;
    opacity: 1;
  }
}

.top-dot {
  fill: #4DB6AC;
  transition: all 0.3s ease;

  &.active {
    fill: #009688;
    r: 5;
  }
}

.base-dot {
  fill: #4DB6AC;
  transition: all 0.3s ease;

  &.active {
    fill: #009688;
    r: 6;
  }
}

.label-text {
  font-size: 12px;
  fill: rgb(var(--color-text-primary));
  opacity: 0.6;
  transition: all 0.3s ease;

  &.active {
    opacity: 1;
    font-weight: bold;
    fill: #009688;
  }
}
</style>
