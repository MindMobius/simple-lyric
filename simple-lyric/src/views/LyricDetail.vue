<!-- src/views/LyricDetail.vue -->
<template>
  <div class="lyric-detail">
    <div class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="lyric-info">
        <h1>{{ currentLyric?.title }}</h1>
        <p>{{ currentLyric?.artist }}</p>
      </div>
      <button 
        class="favorite-btn"
        :class="{ favorited: isFavorited }"
        @click="toggleFavorite"
      >
        {{ isFavorited ? '★ 已收藏' : '☆ 收藏' }}
      </button>
    </div>
    
    <!-- 播放进度条 -->
    <div class="progress-container">
      <span class="time-label">{{ formatTime(currentTime) }}</span>
      <div class="progress-bar-container" @click="onProgressClick">
        <div 
          class="progress-bar" 
          ref="progressBar"
        >
          <div 
            class="progress-fill" 
            :style="{ width: progressPercent + '%' }"
          ></div>
          <div 
            class="progress-handle" 
            :style="{ left: progressPercent + '%' }"
            @mousedown="startDrag"
          ></div>
        </div>
      </div>
      <span class="time-label">{{ formatTime(totalDuration) }}</span>
    </div>
    
    <div class="lyric-display-container">
      <div 
        ref="lyricContainer"
        class="lyric-container"
        @click="handleContainerClick"
      >
        <div 
          class="lyric-line" 
          v-for="(line, index) in currentLyric?.lines" 
          :key="index"
          :class="{ 
            active: currentLine === index,
            passed: index < currentLine
          }"
          @click.stop="jumpToLine(index)"
        >
          <div class="lyric-text">
            <span 
              class="lyric-progress"
              v-if="currentLine === index"
              :style="{ width: lineProgressPercent + '%' }"
            ></span>
            <span class="lyric-content">{{ line.text }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="controls">
      <button @click="togglePlayback" class="control-btn">
        {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
      </button>
      <button @click="resetPlayback" class="control-btn">
        ↻ 重置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLyricStore } from '@/stores/lyrics'

const route = useRoute()
const router = useRouter()
const lyricStore = useLyricStore()

const lyricContainer = ref<HTMLElement | null>(null)
const progressBar = ref<HTMLElement | null>(null)

const currentLine = ref(0)
const currentTime = ref(0)
const isPlaying = ref(false)
let timer: number | null = null
let isDragging = ref(false)

const isFavorited = ref(false)

const currentLyric = computed(() => {
  const id = route.params.id as string
  return lyricStore.getLyricById(id)
})

const totalDuration = computed(() => {
  if (!currentLyric.value || currentLyric.value.lines.length === 0) return 0
  const lastLine = currentLyric.value.lines[currentLyric.value.lines.length - 1]
  return lastLine.time + 5 // 添加5秒缓冲时间
})

const progressPercent = computed(() => {
  if (totalDuration.value === 0) return 0
  return (currentTime.value / totalDuration.value) * 100
})

const lineProgressPercent = computed(() => {
  if (!currentLyric.value || currentLine.value >= currentLyric.value.lines.length) return 0
  
  const current = currentLyric.value.lines[currentLine.value]
  const next = currentLine.value + 1 < currentLyric.value.lines.length 
    ? currentLyric.value.lines[currentLine.value + 1]
    : { time: totalDuration.value }
  
  const lineDuration = next.time - current.time
  const timePassed = currentTime.value - current.time
  
  if (lineDuration <= 0) return 100
  return Math.min(100, Math.max(0, (timePassed / lineDuration) * 100))
})

watch(currentLine, () => {
  scrollToCurrentLine()
})

onMounted(() => {
  if (!currentLyric.value) {
    router.push('/')
    return
  }
  startPlayback()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

function goBack() {
  router.push('/')
}

function toggleFavorite() {
  isFavorited.value = !isFavorited.value
}

function startPlayback() {
  if (timer) {
    clearInterval(timer)
  }
  
  timer = window.setInterval(() => {
    if (isPlaying.value && !isDragging.value) {
      currentTime.value += 0.1
      updateCurrentLine()
      
      // 播放完成时停止
      if (currentTime.value >= totalDuration.value) {
        isPlaying.value = false
        currentTime.value = totalDuration.value
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
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function updateCurrentLine() {
  if (!currentLyric.value) return
  
  const nextLineIndex = currentLyric.value.lines.findIndex(
    line => line.time > currentTime.value
  )
  
  if (nextLineIndex > 0) {
    currentLine.value = nextLineIndex - 1
  } else if (nextLineIndex === -1) {
    currentLine.value = currentLyric.value.lines.length - 1
  }
}

function scrollToCurrentLine() {
  if (lyricContainer.value) {
    const activeElement = lyricContainer.value.querySelector('.lyric-line.active')
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }
}

function jumpToLine(index: number) {
  if (!currentLyric.value) return
  
  currentLine.value = index
  currentTime.value = currentLyric.value.lines[index].time
}

function handleContainerClick() {
  // 点击容器空白处暂停/播放
  togglePlayback()
}

// 进度条相关函数
function onProgressClick(event: MouseEvent) {
  if (!progressBar.value) return
  
  const rect = progressBar.value.getBoundingClientRect()
  const pos = (event.clientX - rect.left) / rect.width
  currentTime.value = pos * totalDuration.value
  updateCurrentLine()
}

function startDrag(event: MouseEvent) {
  isDragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  
  event.preventDefault()
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value || !progressBar.value) return
  
  const rect = progressBar.value.getBoundingClientRect()
  const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  currentTime.value = pos * totalDuration.value
  updateCurrentLine()
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
</script>

<style scoped>
.lyric-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #0078d4;
  padding: 8px 16px;
  border-radius: 4px;
}

.back-btn:hover {
  background: rgba(0, 120, 212, 0.1);
}

.lyric-info h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.lyric-info p {
  margin: 5px 0 0;
  color: #666;
}

.favorite-btn {
  background: transparent;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.favorite-btn.favorited {
  color: #ffb900;
  border-color: #ffb900;
}

/* 进度条样式 */
.progress-container {
  display: flex;
  align-items: center;
  padding: 0 20px 10px;
  gap: 10px;
}

.time-label {
  font-size: 0.9rem;
  color: #666;
  width: 40px;
  text-align: center;
}

.progress-bar-container {
  flex: 1;
  cursor: pointer;
}

.progress-bar {
  position: relative;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.progress-fill {
  position: absolute;
  height: 100%;
  background: #0078d4;
  border-radius: 3px;
  transition: width 0.1s;
}

.progress-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #0078d4;
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-handle:active {
  cursor: grabbing;
}

.lyric-display-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.lyric-container {
  flex: 1;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.lyric-line {
  padding: 12px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
}

.lyric-line.passed {
  color: #999;
}

.lyric-line.active {
  color: #000;
}

.lyric-line:hover:not(.active) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.lyric-text {
  position: relative;
  display: inline-block;
}

.lyric-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(0, 120, 212, 0.2);
  z-index: -1;
}

.lyric-content {
  position: relative;
}

.lyric-line.active .lyric-content {
  font-size: 22px;
  font-weight: bold;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.control-btn {
  background: #0078d4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn:hover {
  background: #106ebe;
}
</style>