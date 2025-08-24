<!-- src/components/LyricDisplay.vue -->
<template>
  <div class="lyric-display">
    <div class="display-header">
      <h2 class="display-title">Simple Lyric</h2>
      <p class="display-subtitle">歌词展示组件演示</p>
    </div>
    
    <div class="lyric-container">
      <div 
        class="lyric-line" 
        v-for="(line, index) in lyrics" 
        :key="index"
        :class="{ 
          active: currentLine === index,
          passed: index < currentLine,
          upcoming: index === currentLine + 1
        }"
        @click="jumpToLine(index)"
      >
        <div class="line-wrapper">
          <div 
            class="line-progress"
            v-if="currentLine === index"
            :style="{ width: getLineProgress(index) + '%' }"
          ></div>
          <span class="line-text">{{ line.text }}</span>
        </div>
      </div>
    </div>
    
    <div class="display-controls">
      <button 
        class="control-btn"
        :class="{ active: isPlaying }"
        @click="togglePlayback"
      >
        <span class="btn-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
        <span class="btn-text">{{ isPlaying ? '暂停' : '播放' }}</span>
      </button>
      
      <button class="control-btn" @click="resetPlayback">
        <span class="btn-icon">↻</span>
        <span class="btn-text">重置</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface LyricLine {
  time: number
  text: string
}

const lyrics = ref<LyricLine[]>([
  { time: 0, text: '欢迎使用 Simple Lyric' },
  { time: 3, text: '这是一个极简风格的歌词展示网站' },
  { time: 6, text: '支持歌词自动滚动播放' },
  { time: 9, text: '也支持点击跳转到指定歌词' },
  { time: 12, text: '采用 Fluent UI 设计语言' },
  { time: 15, text: '黑白极简色调，透明模糊效果' },
  { time: 18, text: '感谢使用 Simple Lyric' }
])

const currentLine = ref(0)
const currentTime = ref(0)
const isPlaying = ref(false)
let timer: number | null = null

const totalDuration = computed(() => {
  return lyrics.value[lyrics.value.length - 1]?.time + 3 || 21
})

onMounted(() => {
  // 自动开始播放演示
  setTimeout(() => {
    startPlayback()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

function startPlayback() {
  if (timer) {
    clearInterval(timer)
  }
  
  isPlaying.value = true
  timer = window.setInterval(() => {
    if (isPlaying.value) {
      currentTime.value += 0.1
      updateCurrentLine()
      
      // 播放完成时重置
      if (currentTime.value >= totalDuration.value) {
        resetPlayback()
        // 自动重新开始
        setTimeout(() => {
          startPlayback()
        }, 2000)
      }
    }
  }, 100)
}

function togglePlayback() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startPlayback()
  }
}

function resetPlayback() {
  currentTime.value = 0
  currentLine.value = 0
  isPlaying.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function updateCurrentLine() {
  const nextLineIndex = lyrics.value.findIndex(
    line => line.time > currentTime.value
  )
  
  if (nextLineIndex > 0) {
    currentLine.value = nextLineIndex - 1
  } else if (nextLineIndex === -1) {
    currentLine.value = lyrics.value.length - 1
  }
}

function jumpToLine(index: number) {
  currentLine.value = index
  currentTime.value = lyrics.value[index].time
}

function getLineProgress(index: number): number {
  if (index !== currentLine.value) return 0
  
  const current = lyrics.value[index]
  const next = lyrics.value[index + 1]
  
  if (!next) return 100
  
  const lineDuration = next.time - current.time
  const elapsed = currentTime.value - current.time
  
  return Math.min(100, Math.max(0, (elapsed / lineDuration) * 100))
}
</script>

<style scoped>
/* 组件容器 */
.lyric-display {
  max-width: 45rem;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-glass);
  backdrop-filter: blur(1rem) saturate(1.8);
  border-radius: var(--border-radius-xlarge);
  border: 0.0625rem solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-depth-16);
  animation: scaleIn 0.6s ease-out;
}

/* 头部信息 */
.display-header {
  text-align: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 0.0625rem solid var(--color-neutralQuaternary);
}

.display-title {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-neutralDark);
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}

.display-subtitle {
  font-size: 1rem;
  color: var(--color-neutralSecondary);
  margin: 0;
  font-weight: var(--font-weight-regular);
}

/* 歌词容器 */
.lyric-container {
  min-height: 20rem;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lyric-line {
  padding: 1rem 0;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  margin: 0.25rem 0;
  border-radius: var(--border-radius-medium);
}

.lyric-line:hover:not(.active) {
  background: var(--bg-overlay-light);
  transform: translateY(-0.125rem);
}

.lyric-line.passed {
  opacity: 0.4;
}

.lyric-line.active {
  opacity: 1;
  transform: scale(1.05) translateY(-0.25rem);
}

.lyric-line.upcoming {
  opacity: 0.7;
  font-weight: var(--font-weight-semibold);
}

.line-wrapper {
  position: relative;
  display: inline-block;
  padding: 1rem 1.5rem;
  background: var(--bg-overlay-medium);
  border-radius: var(--border-radius-large);
  border: 0.0625rem solid transparent;
  overflow: hidden;
  transition: all 0.3s ease;
}

.lyric-line.active .line-wrapper {
  background: var(--bg-overlay-strong);
  border-color: var(--color-neutralDark);
  box-shadow: var(--shadow-depth-8);
}

.line-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, 
    rgba(0, 0, 0, 0.1) 0%, 
    rgba(0, 0, 0, 0.05) 100%);
  transition: width 0.1s ease;
  border-radius: var(--border-radius-large);
}

.line-text {
  position: relative;
  font-size: 1.25rem;
  font-weight: var(--font-weight-regular);
  color: var(--color-neutralSecondary);
  line-height: 1.5;
  white-space: nowrap;
}

.lyric-line.active .line-text {
  font-size: 1.5rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutralDark);
}

.lyric-line.upcoming .line-text {
  color: var(--color-neutralPrimary);
}

/* 控制按钮 */
.display-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 0.0625rem solid var(--color-neutralQuaternary);
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-overlay-light);
  border: 0.0625rem solid var(--color-neutralQuaternary);
  border-radius: var(--border-radius-large);
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 5rem;
  color: var(--color-neutralSecondary);
}

.control-btn:hover {
  background: var(--bg-overlay-strong);
  border-color: var(--color-neutralSecondary);
  color: var(--color-neutralPrimary);
  transform: translateY(-0.125rem);
  box-shadow: var(--shadow-depth-4);
}

.control-btn:active {
  transform: translateY(0);
}

.control-btn.active {
  background: var(--color-neutralDark);
  border-color: var(--color-neutralDark);
  color: var(--color-white);
}

.control-btn.active:hover {
  background: var(--color-black);
  border-color: var(--color-black);
}

.btn-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.btn-text {
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .lyric-display {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .display-title {
    font-size: 1.5rem;
  }
  
  .display-subtitle {
    font-size: 0.875rem;
  }
  
  .lyric-container {
    min-height: 15rem;
  }
  
  .line-text {
    font-size: 1rem;
  }
  
  .lyric-line.active .line-text {
    font-size: 1.25rem;
  }
  
  .control-btn {
    padding: 0.75rem 1rem;
    min-width: 4rem;
  }
  
  .btn-icon {
    font-size: 1rem;
  }
  
  .btn-text {
    font-size: 0.625rem;
  }
}

@media (max-width: 480px) {
  .lyric-display {
    margin: 0.5rem;
    padding: 1rem;
  }
  
  .display-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
  }
  
  .display-title {
    font-size: 1.25rem;
  }
  
  .line-wrapper {
    padding: 0.75rem 1rem;
  }
  
  .line-text {
    font-size: 0.875rem;
    white-space: normal;
    text-align: center;
  }
  
  .lyric-line.active .line-text {
    font-size: 1rem;
  }
  
  .display-controls {
    margin-top: 1.5rem;
    padding-top: 1rem;
  }
}

/* 动画增强 */
@keyframes glow {
  0%, 100% {
    box-shadow: var(--shadow-depth-8);
  }
  50% {
    box-shadow: var(--shadow-depth-16), 0 0 1rem rgba(0, 0, 0, 0.1);
  }
}

.lyric-line.active .line-wrapper {
  animation: glow 3s ease-in-out infinite;
}

.lyric-line.active:hover .line-wrapper {
  animation: none;
}
</style>