<!-- src/components/LyricDisplay.vue -->
<template>
  <div class="lyric-container">
    <div class="lyric-line" 
         v-for="(line, index) in lyrics" 
         :key="index"
         :class="{ active: currentLine === index }">
      {{ line.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface LyricLine {
  time: number
  text: string
}

const lyrics = ref<LyricLine[]>([
  { time: 0, text: '欢迎使用 Simple Lyric' },
  { time: 5, text: '这是一个极简风格的歌词展示网站' },
  { time: 10, text: '支持歌词自动滚动播放' },
  { time: 15, text: '也支持点击跳转到指定歌词' },
  { time: 20, text: '感谢使用' }
])

const currentLine = ref(0)
const currentTime = ref(0)
let timer: number | null = null

onMounted(() => {
  startPlayback()
})

function startPlayback() {
  timer = window.setInterval(() => {
    currentTime.value += 1
    updateCurrentLine()
  }, 1000)
}

function updateCurrentLine() {
  const nextLineIndex = lyrics.value.findIndex(line => line.time > currentTime.value)
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
</script>

<style scoped>
.lyric-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.lyric-line {
  padding: 8px 0;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lyric-line.active {
  color: #000;
  font-size: 22px;
  font-weight: bold;
}

.lyric-line:hover {
  color: #333;
}
</style>