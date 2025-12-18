<script setup>
import { onMounted, onUnmounted } from 'vue'

const initEffect = () => {
  const colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C']
  let particles = []
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none' // 确保不阻挡点击
  canvas.style.zIndex = '99999'
  
  document.body.appendChild(canvas)
  
  const setSize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  
  setSize()
  window.addEventListener('resize', setSize)
  
  const createParticle = (x, y) => {
    const p = {
      x: x,
      y: y,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: Math.random() * 4 + 2, // 粒子大小
      vx: Math.random() * 4 - 2, // 速度 X
      vy: Math.random() * 4 - 2, // 速度 Y
      life: Math.random() * 30 + 30 // 存活时间
    }
    particles.push(p)
  }
  
  const handleMouseDown = (e) => {
    const x = e.clientX
    const y = e.clientY
    // 每次点击产生 12 个粒子
    for (let i = 0; i < 12; i++) {
      createParticle(x, y)
    }
  }
  
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      
      p.x += p.vx
      p.y += p.vy
      p.radius *= 0.95 // 逐渐变小
      p.life--
      
      if (p.life <= 0 || p.radius <= 0.5) {
        particles.splice(i, 1)
        i--
      }
    }
    
    requestAnimationFrame(animate)
  }
  
  animate()
  window.addEventListener('mousedown', handleMouseDown)
  
  return () => {
    window.removeEventListener('resize', setSize)
    window.removeEventListener('mousedown', handleMouseDown)
    if (document.body.contains(canvas)) {
      document.body.removeChild(canvas)
    }
  }
}

let cleanup = null

onMounted(() => {
  cleanup = initEffect()
})

onUnmounted(() => {
  if (cleanup) cleanup()
})
</script>

<template>
  <!-- 这是一个功能性组件，没有实际 DOM 结构 -->
  <div style="display: none;"></div>
</template>
