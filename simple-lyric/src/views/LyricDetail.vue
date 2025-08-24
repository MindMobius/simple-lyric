<!-- src/views/LyricDetail.vue -->
<template>
  <div class="lyric-player">
    <!-- 顶部控制区 -->
    <div class="header-controls">
      <!-- 顶部信息栏 -->
      <div class="info-bar">
        <button class="back-btn" @click="goBack">← 返回</button>
        <div class="song-info">
          <div class="song-title">{{ currentLyric?.title }}</div>
          <div class="song-artist">{{ currentLyric?.artist }}</div>
        </div>
        <div class="header-right">
          <button class="mode-toggle" @click="toggleDisplayMode" :title="isPlayMode ? '切换到阅读模式' : '切换到播放模式'">
            <span class="toggle-icon">{{ isPlayMode ? '📖' : '▶️' }}</span>
            {{ isPlayMode ? '阅读' : '播放' }}
          </button>
          <div class="time-info" v-if="isPlayMode">{{ formatTime(currentTime) }}</div>
        </div>
      </div>
      
      <!-- 进度条 -->
      <div class="progress-container" v-if="isPlayMode">
        <div class="progress-track" ref="progressTrack" @click="seekTo">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          <div class="progress-handle" :style="{ left: progressPercent + '%' }" @mousedown="startDrag"></div>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="control-buttons" v-if="isPlayMode">
        <button class="control-btn" @click="previousLine" :disabled="currentLine <= 0">
          <span class="btn-icon">←</span>
          上一句
        </button>
        <button class="play-btn" @click="togglePlay">
          <span class="play-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
          {{ isPlaying ? '暂停' : '播放' }}
        </button>
        <button class="control-btn" @click="nextLine" :disabled="!currentLyric || currentLine >= currentLyric.lines.length - 1">
          <span class="btn-icon">→</span>
          下一句
        </button>
        <button class="control-btn" @click="restart">
          <span class="btn-icon">↻</span>
          重新开始
        </button>
      </div>
    </div>

    <!-- 歌词显示区域 -->
    <div class="lyrics-container" ref="lyricsContainer">
      <!-- 播放模式 -->
      <div v-if="isPlayMode" class="lyrics-content play-mode">
        <div 
          v-for="(line, index) in currentLyric?.lines" 
          :key="index"
          class="lyric-line"
          :class="{
            'is-current': currentLine === index,
            'is-passed': index < currentLine
          }"
          @click="jumpToLine(index)"
        >
          <!-- 歌词文本作为进度条容器 -->
          <span class="lyric-text">
            <span 
              class="lyric-progress" 
              :style="{ width: currentLine === index ? lineProgressPercent + '%' : (index < currentLine ? '100%' : '0%') }"
            >{{ line.text }}</span>
            <span class="lyric-bg">{{ line.text }}</span>
          </span>
        </div>
      </div>
      
      <!-- 阅读模式 -->
      <div v-else class="lyrics-content reading-mode">
        <div class="reading-header">
          <h2 class="reading-title">{{ currentLyric?.title }}</h2>
          <p class="reading-artist" v-if="currentLyric?.artist">{{ currentLyric?.artist }}</p>
        </div>
        <div class="reading-lyrics">
          <p 
            v-for="(line, index) in currentLyric?.lines" 
            :key="index"
            class="reading-line"
          >
            {{ line.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLyricStore } from '@/stores/lyrics'

const route = useRoute()
const router = useRouter()
const lyricStore = useLyricStore()

// DOM 引用
const lyricsContainer = ref<HTMLElement | null>(null)
const progressTrack = ref<HTMLElement | null>(null)

// 状态
const currentLine = ref(0)
const currentTime = ref(0)
const isPlaying = ref(false)
const isDragging = ref(false)
const isPlayMode = ref(false) // 默认为阅读模式

let playTimer: number | null = null

// 计算属性
const currentLyric = computed(() => {
  const id = route.params.id as string
  return lyricStore.getLyricById(id)
})

const totalDuration = computed(() => {
  if (!currentLyric.value?.lines.length) return 0
  return currentLyric.value.lines[currentLyric.value.lines.length - 1].time + 10
})

const progressPercent = computed(() => {
  return totalDuration.value > 0 ? (currentTime.value / totalDuration.value) * 100 : 0
})

// 根据歌词字数计算进度条长度
const lineProgressPercent = computed(() => {
  if (!currentLyric.value || currentLine.value >= currentLyric.value.lines.length) return 0
  
  const current = currentLyric.value.lines[currentLine.value]
  const next = currentLyric.value.lines[currentLine.value + 1] || { time: totalDuration.value }
  const duration = next.time - current.time
  const elapsed = currentTime.value - current.time
  
  return duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0
})

// 监听当前行变化，自动滚动
watch(currentLine, () => {
  if (isPlayMode.value) {
    nextTick(scrollToCurrent)
  }
})

// 监听播放模式变化，切换到播放模式时滚动到当前位置
watch(isPlayMode, (newMode) => {
  if (newMode) {
    nextTick(scrollToCurrent)
  }
})

// 组件生命周期
onMounted(() => {
  if (!currentLyric.value) {
    router.push('/')
    return
  }
  // 默认不自动播放，等待用户手动播放
})

onUnmounted(() => {
  if (playTimer) clearInterval(playTimer)
})

// 功能函数
function goBack() {
  router.push('/')
}

// 切换显示模式
function toggleDisplayMode() {
  isPlayMode.value = !isPlayMode.value
  if (!isPlayMode.value) {
    // 切换到阅读模式时停止播放
    isPlaying.value = false
    if (playTimer) clearInterval(playTimer)
  } else {
    // 切换到播放模式时滚动到当前位置
    nextTick(() => {
      scrollToCurrent()
    })
  }
}

function startPlay() {
  if (playTimer) clearInterval(playTimer)
  
  isPlaying.value = true
  playTimer = window.setInterval(() => {
    if (isPlaying.value && !isDragging.value) {
      currentTime.value += 0.1
      updateCurrentLine()
      
      if (currentTime.value >= totalDuration.value) {
        isPlaying.value = false
      }
    }
  }, 100)
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startPlay()
  }
}

function restart() {
  currentTime.value = 0
  currentLine.value = 0
  isPlaying.value = false
  if (playTimer) clearInterval(playTimer)
}

// 上一句歌词
function previousLine() {
  if (currentLine.value > 0) {
    currentLine.value -= 1
    currentTime.value = currentLyric.value!.lines[currentLine.value].time
    updateCurrentLine()
    // 立即滚动到新位置
    if (isPlayMode.value) {
      nextTick(scrollToCurrent)
    }
  }
}

// 下一句歌词
function nextLine() {
  if (currentLyric.value && currentLine.value < currentLyric.value.lines.length - 1) {
    currentLine.value += 1
    currentTime.value = currentLyric.value.lines[currentLine.value].time
    updateCurrentLine()
    // 立即滚动到新位置
    if (isPlayMode.value) {
      nextTick(scrollToCurrent)
    }
  }
}

function seekTo(event: MouseEvent) {
  if (!progressTrack.value) return
  
  const rect = progressTrack.value.getBoundingClientRect()
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
  if (!isDragging.value || !progressTrack.value) return
  
  const rect = progressTrack.value.getBoundingClientRect()
  const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  currentTime.value = pos * totalDuration.value
  updateCurrentLine()
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function updateCurrentLine() {
  if (!currentLyric.value) return
  
  const lines = currentLyric.value.lines
  const nextIndex = lines.findIndex(line => line.time > currentTime.value)
  
  if (nextIndex > 0) {
    currentLine.value = nextIndex - 1
  } else if (nextIndex === -1) {
    currentLine.value = lines.length - 1
  }
}

function scrollToCurrent() {
  if (!lyricsContainer.value || !isPlayMode.value) return
  
  // 查找当前歌词元素
  const currentEl = lyricsContainer.value.querySelector('.lyric-line.is-current')
  if (currentEl) {
    // 使用更平滑的滚动效果
    currentEl.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    })
  }
}

function jumpToLine(index: number) {
  if (!currentLyric.value) return
  
  currentLine.value = index
  currentTime.value = currentLyric.value.lines[index].time
  // 跳转后立即滚动到新位置
  if (isPlayMode.value) {
    nextTick(scrollToCurrent)
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* 整体布局 */
.lyric-player {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

/* 顶部控制区 */
.header-controls {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px) saturate(1.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 顶部信息栏 */
.info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555555;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
}

.back-btn:hover {
  background: rgba(248, 248, 248, 0.9);
  border-color: rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.song-info {
  flex: 1;
  text-align: center;
  margin: 0 32px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(248, 248, 248, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #555555;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  font-weight: 500;
}

.mode-toggle:hover {
  background: rgba(240, 240, 240, 0.95);
  border-color: rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.toggle-icon {
  font-size: 14px;
}

.song-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.song-artist {
  font-size: 15px;
  color: #666666;
  font-weight: 500;
}

.time-info {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 15px;
  color: #555555;
  background: rgba(248, 248, 248, 0.8);
  backdrop-filter: blur(8px);
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-weight: 600;
}

/* 进度条 */
.progress-container {
  margin-bottom: 20px;
}

.progress-track {
  position: relative;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.progress-track:hover {
  height: 8px;
  background: rgba(0, 0, 0, 0.12);
}

.progress-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #000000 0%, #333333 100%);
  border-radius: 6px;
  transition: width 0.1s linear;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-handle {
  position: absolute;
  width: 18px;
  height: 18px;
  background: #000000;
  border: 3px solid #ffffff;
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.progress-track:hover .progress-handle {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

.progress-handle:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8f8f8;
  border: 1px solid #d9d9d9;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #666666;
  transition: all 0.2s ease;
  min-width: 80px;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #b3b3b3;
  color: #333333;
  transform: translateY(-1px);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
}

.control-btn:disabled {
  background: #f5f5f5;
  border-color: #e8e8e8;
  color: #c0c0c0;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
  font-weight: bold;
}

.play-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #000000;
  color: #ffffff;
  border: 1px solid #000000;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 100px;
  justify-content: center;
}

.play-btn:hover {
  background: #333333;
  border-color: #333333;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.play-btn:active {
  transform: translateY(0);
}

.play-icon {
  font-size: 16px;
  display: flex;
  align-items: center;
}

/* 歌词显示区域 */
.lyrics-container {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  scroll-behavior: smooth;
}

/* 播放模式 */
.lyrics-content.play-mode {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 24px 80px;
  line-height: 2.8;
  scroll-margin-top: 100px; /* 为固定顶部留出空间 */
}

/* 阅读模式 */
.lyrics-content.reading-mode {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px 60px;
  line-height: 1.8;
}

.reading-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.reading-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.reading-artist {
  font-size: 16px;
  color: #666666;
  margin: 0;
  font-weight: 500;
}

.reading-lyrics {
  display: grid;
  gap: 16px;
}

.reading-line {
  font-size: 18px;
  color: #2c2c2c;
  margin: 0;
  padding: 8px 0;
  line-height: 1.7;
  font-weight: 400;
  transition: color 0.2s ease;
}

.reading-line:hover {
  color: #000000;
}

.lyric-line {
  position: relative;
  margin-bottom: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 12px 0;
  border-radius: 8px;
}

.lyric-line:hover {
  transform: translateX(6px);
  background: rgba(0, 0, 0, 0.02);
  padding-left: 16px;
}

/* 当前歌词突出显示 */
.lyric-line.is-current {
  margin: 40px 0;
  transform: scale(1.08);
  background: rgba(0, 0, 0, 0.03);
  padding: 20px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.lyric-line.is-current:hover {
  transform: scale(1.08) translateX(0);
  padding-left: 16px;
}

/* 歌词文本作为进度条 */
.lyric-text {
  position: relative;
  display: inline-block;
  font-size: 19px;
  font-weight: 400;
  overflow: hidden;
  line-height: 1.6;
}

/* 已唱过的歌词 */
.lyric-line.is-passed .lyric-text {
  opacity: 0.6;
}

/* 当前歌词 */
.lyric-line.is-current .lyric-text {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.5;
}

/* 进度条效果 - 前景文字 */
.lyric-progress {
  position: absolute;
  top: 0;
  left: 0;
  color: #000000;
  background: linear-gradient(90deg, #000000 0%, #2c2c2c 50%, #000000 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
  overflow: hidden;
  transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 背景文字 */
.lyric-bg {
  color: #b0b0b0;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

/* 当前歌词的背景文字 */
.lyric-line.is-current .lyric-bg {
  color: #d5d5d5;
}

/* 已唱过歌词的特殊样式 */
.lyric-line.is-passed .lyric-progress {
  width: 100% !important;
  color: #888888;
  background: linear-gradient(90deg, #888888 0%, #aaaaaa 50%, #888888 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.lyric-line.is-passed .lyric-bg {
  color: #e0e0e0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-controls {
    padding: 16px 16px;
  }
  
  .info-bar {
    margin-bottom: 16px;
  }
  
  .song-info {
    margin: 0 20px;
  }
  
  .header-right {
    gap: 8px;
  }
  
  .mode-toggle {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .song-title {
    font-size: 18px;
  }
  
  .song-artist {
    font-size: 14px;
  }
  
  .lyrics-content.play-mode {
    padding: 40px 16px 60px;
    line-height: 2.4;
  }
  
  .lyrics-content.reading-mode {
    padding: 30px 16px 50px;
  }
  
  .reading-title {
    font-size: 24px;
  }
  
  .reading-artist {
    font-size: 15px;
  }
  
  .reading-line {
    font-size: 17px;
  }
  
  .lyric-text {
    font-size: 17px;
  }
  
  .lyric-line.is-current .lyric-text {
    font-size: 21px;
  }
  
  .control-buttons {
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .control-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 70px;
  }
  
  .btn-icon {
    font-size: 12px;
  }
  
  .play-btn {
    padding: 10px 16px;
    font-size: 13px;
    min-width: 85px;
  }
  
  .play-icon {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .header-controls {
    padding: 12px;
  }
  
  .info-bar {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .song-info {
    margin: 0;
    order: -1;
  }
  
  .header-right {
    align-self: flex-start;
    width: 100%;
    justify-content: space-between;
  }
  
  .lyrics-content.play-mode {
    padding: 30px 12px 50px;
    line-height: 2.2;
  }
  
  .lyrics-content.reading-mode {
    padding: 20px 12px 40px;
  }
  
  .reading-header {
    margin-bottom: 30px;
  }
  
  .reading-title {
    font-size: 22px;
  }
  
  .reading-line {
    font-size: 16px;
  }
  
  .lyric-text {
    font-size: 16px;
  }
  
  .lyric-line.is-current .lyric-text {
    font-size: 19px;
  }
  
  .control-buttons {
    gap: 8px;
    justify-content: space-between;
  }
  
  .control-btn {
    flex: 1;
    padding: 10px 8px;
    font-size: 11px;
    min-width: auto;
  }
  
  .play-btn {
    flex: 1.2;
    padding: 12px 8px;
    font-size: 12px;
    min-width: auto;
  }
}

/* 滚动条美化 */
.lyrics-container::-webkit-scrollbar {
  width: 4px;
}

.lyrics-container::-webkit-scrollbar-track {
  background: transparent;
}

.lyrics-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.lyrics-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
</style>