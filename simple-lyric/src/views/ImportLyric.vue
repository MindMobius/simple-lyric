<!-- src/views/ImportLyric.vue -->
<template>
  <div class="import-lyric">
    <!-- 精简头部 -->
    <header class="top-header">
      <div class="container">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
          返回
        </button>
        <div class="header-info">
          <h1 class="page-title">导入歌词</h1>
          <p class="page-subtitle">支持 LRC 格式文件和纯文本歌词</p>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <div class="container">
        <!-- 导入方式选择 -->
        <section class="import-methods">
          <div class="method-tabs">
            <button 
              class="method-tab"
              :class="{ active: activeTab === 'paste' }"
              @click="activeTab = 'paste'"
            >
              <span class="tab-icon">📋</span>
              粘贴歌词
            </button>
            
            <button 
              class="method-tab"
              :class="{ active: activeTab === 'file' }"
              @click="activeTab = 'file'"
            >
              <span class="tab-icon">📁</span>
              上传文件
            </button>
          </div>
        </section>
        
        <!-- 导入内容区域 -->
        <section class="import-content">
          <!-- 粘贴歌词 -->
          <div v-if="activeTab === 'paste'" class="content-panel">
            <div class="input-group">
              <label for="rawLyrics" class="input-label">歌词内容</label>
              <textarea
                id="rawLyrics"
                v-model="rawLyrics"
                class="lyric-textarea"
                placeholder="在此粘贴歌词内容，支持纯文本或 LRC 格式

示例：
[00:00.00]第一行歌词
[00:05.00]第二行歌词

或者：
第一行歌词
第二行歌词"
                rows="12"
                @input="handleLyricsInput"
              ></textarea>
            </div>
          </div>
          
          <!-- 文件上传 -->
          <div v-else class="content-panel">
            <div class="upload-area" 
                 @dragover.prevent 
                 @drop.prevent="handleFileDrop"
                 :class="{ 'drag-over': isDragOver }"
                 @dragenter="isDragOver = true"
                 @dragleave="isDragOver = false"
            >
              <input 
                type="file" 
                ref="fileInput" 
                accept=".lrc" 
                @change="handleFileSelect" 
                style="display: none"
              />
              <div class="upload-content" @click="triggerFileSelect">
                <div class="upload-icon">📁</div>
                <h3 class="upload-title">选择 LRC 文件</h3>
                <p class="upload-description">点击选择文件或拖拽文件到此处</p>
                <button class="upload-button">浏览文件</button>
              </div>
            </div>
            
            <div v-if="fileName" class="file-info">
              <div class="file-success">
                <span class="success-icon">✓</span>
                <span class="file-name">{{ fileName }}</span>
              </div>
            </div>
          </div>
        </section>
        
        <!-- 歌曲信息 -->
        <section v-if="rawLyrics" class="song-info">
          <h2 class="section-title">歌曲信息</h2>
          <div class="info-form">
            <div class="input-group">
              <label for="title" class="input-label">歌曲标题 *</label>
              <input 
                id="title" 
                v-model="lyricInfo.title" 
                class="text-input"
                placeholder="请输入歌曲标题"
                required
              />
            </div>
            
            <div class="input-group">
              <label for="artist" class="input-label">艺术家</label>
              <input 
                id="artist" 
                v-model="lyricInfo.artist" 
                class="text-input"
                placeholder="请输入艺术家名称"
              />
            </div>
          </div>
        </section>
        
        <!-- 歌词预览和编辑 -->
        <section v-if="parsedLines.length > 0" class="preview-section">
          <div class="preview-header">
            <h2 class="section-title">歌词预览</h2>
            <div class="preview-stats">
              <span class="stats-item">{{ parsedLines.length }} 行</span>
              <span class="stats-item">{{ formatDuration() }}</span>
            </div>
          </div>
          
          <div class="editor-container">
            <div class="editor-header">
              <div class="header-cell time-header">时间</div>
              <div class="header-cell text-header">歌词内容</div>
              <div class="header-cell action-header">操作</div>
            </div>
            
            <div class="editor-body">
              <div 
                class="editor-row" 
                v-for="(line, index) in parsedLines" 
                :key="index"
              >
                <input 
                  class="time-input" 
                  :value="formatTimeToLrc(line.time)"
                  @input="updateLineTime(index, $event)"
                  type="text"
                  placeholder="[00:00.00]"
                />
                <input 
                  class="text-input" 
                  v-model="line.text" 
                  type="text"
                  placeholder="输入歌词内容"
                />
                <button 
                  class="remove-button" 
                  @click="removeLine(index)"
                  title="删除此行"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div class="editor-actions">
              <button class="add-line-button" @click="addNewLine">
                <span class="add-icon">+</span>
                添加新行
              </button>
            </div>
          </div>
        </section>
        
        <!-- 导入按钮 -->
        <div class="import-actions">
          <button 
            class="import-button" 
            :disabled="!canImport"
            :class="{ disabled: !canImport }"
            @click="importLyric"
          >
            <span class="import-icon">✓</span>
            导入歌词
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useLyricStore, type LyricLine } from '@/stores/lyrics'

const router = useRouter()
const lyricStore = useLyricStore()

const activeTab = ref('paste') // 'paste' 或 'file'
const rawLyrics = ref('')
const fileName = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

const lyricInfo = reactive({
  title: '',
  artist: ''
})

const parsedLines = ref<LyricLine[]>([])

const canImport = computed(() => {
  return lyricInfo.title.trim() && parsedLines.value.length > 0
})

function goBack() {
  router.back()
}

function triggerFileSelect() {
  fileInput.value?.click()
}

function handleLyricsInput() {
  parseLyrics()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    fileName.value = file.name
    readFileContent(file)
  }
}

function handleFileDrop(event: DragEvent) {
  isDragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (file.name.endsWith('.lrc')) {
      fileName.value = file.name
      readFileContent(file)
    } else {
      alert('请上传 LRC 格式的歌词文件')
    }
  }
}

function readFileContent(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    rawLyrics.value = content
    parseLyrics()
  }
  reader.readAsText(file)
}

function parseLyrics() {
  if (!rawLyrics.value.trim()) {
    parsedLines.value = []
    return
  }
  
  const lines = rawLyrics.value.split('\n')
  const lyricLines: LyricLine[] = []
  
  // 尝试从LRC文件中提取歌曲信息
  let title = ''
  let artist = ''
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // 检查是否包含歌曲信息标签
    const titleMatch = trimmedLine.match(/\[ti:(.*?)\]/)
    if (titleMatch) {
      title = titleMatch[1]
    }
    
    const artistMatch = trimmedLine.match(/\[ar:(.*?)\]/)
    if (artistMatch) {
      artist = artistMatch[1]
    }
    
    // 匹配 LRC 时间戳格式 [mm:ss.xx] 或 [mm:ss]
    const timeMatch = trimmedLine.match(/\[(\d{2}):(\d{2})([.:]\d{1,3})?\](.*)/)
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10)
      const seconds = parseInt(timeMatch[2], 10)
      let milliseconds = 0
      
      // 处理毫秒部分
      if (timeMatch[3]) {
        const msPart = timeMatch[3].substring(1) // 去掉前导的 . 或 :
        milliseconds = parseInt(msPart.padEnd(3, '0').substring(0, 3), 10)
      }
      
      const time = minutes * 60 + seconds + milliseconds / 1000
      const text = timeMatch[4].trim()
      
      if (text) {
        lyricLines.push({ time, text })
      }
    }
  }
  
  // 如果还没有时间标签，将文本按行处理
  if (lyricLines.length === 0) {
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('[')) { // 忽略标签行
        // 没有时间标签时，每5秒一行
        lyricLines.push({ 
          time: index * 5, 
          text: trimmedLine 
        })
      }
    })
  }
  
  parsedLines.value = lyricLines
  
  // 设置歌曲信息
  if (title && !lyricInfo.title) {
    lyricInfo.title = title
  } else if (!lyricInfo.title && lyricLines.length > 0) {
    lyricInfo.title = lyricLines[0].text.substring(0, 20) + (lyricLines[0].text.length > 20 ? '...' : '')
  }
  
  if (artist && !lyricInfo.artist) {
    lyricInfo.artist = artist
  }
}

function formatDuration(): string {
  if (parsedLines.value.length === 0) return '0:00'
  const lastLine = parsedLines.value[parsedLines.value.length - 1]
  const minutes = Math.floor(lastLine.time / 60)
  const seconds = Math.floor(lastLine.time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatTimeToLrc(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const milliseconds = Math.floor((time % 1) * 100)
  
  return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`
}

function updateLineTime(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const timeStr = input.value
  
  // 解析LRC时间格式
  const timeMatch = timeStr.match(/\[(\d{2}):(\d{2})[.:](\d{2,3})\]/)
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1], 10)
    const seconds = parseInt(timeMatch[2], 10)
    const milliseconds = parseInt(timeMatch[3].padEnd(3, '0').substring(0, 3), 10)
    
    const time = minutes * 60 + seconds + milliseconds / 1000
    parsedLines.value[index].time = time
  }
}

function removeLine(index: number) {
  parsedLines.value.splice(index, 1)
}

function addNewLine() {
  const lastLine = parsedLines.value[parsedLines.value.length - 1]
  const newTime = lastLine ? lastLine.time + 5 : 0
  parsedLines.value.push({ time: newTime, text: '' })
}

function importLyric() {
  if (!lyricInfo.title.trim() || parsedLines.value.length === 0) {
    alert('请填写歌曲标题并确保歌词内容不为空')
    return
  }
  
  const lyric = {
    id: Date.now().toString(),
    title: lyricInfo.title.trim(),
    artist: lyricInfo.artist.trim() || '未知艺术家',
    lines: parsedLines.value
  }
  
  lyricStore.addLyric(lyric)
  router.push('/')
}
</script>

<style scoped>
/* 全局设置 */
.import-lyric {
  min-height: 100vh;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 精简头部 */
.top-header {
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  padding: 24px 0;
}

.top-header .container {
  display: flex;
  align-items: center;
  gap: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 16px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f0f0f0;
  border-color: #d0d0d0;
}

.back-icon {
  font-size: 16px;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #666666;
  margin: 0;
}

/* 主内容区域 */
.main-content {
  padding: 32px 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px 0;
}

/* 导入方式选择 */
.import-methods {
  margin-bottom: 32px;
}

.method-tabs {
  display: flex;
  gap: 8px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 4px;
}

.method-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 12px 16px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.method-tab:hover {
  background: #f0f0f0;
}

.method-tab.active {
  background: #ffffff;
  color: #1a1a1a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  font-size: 16px;
}

/* 导入内容面板 */
.import-content {
  margin-bottom: 32px;
}

.content-panel {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 24px;
}

.input-group {
  margin-bottom: 16px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 8px;
}

.text-input {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.text-input:focus {
  outline: none;
  border-color: #1a1a1a;
}

.lyric-textarea {
  width: 100%;
  min-height: 300px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s ease;
}

.lyric-textarea:focus {
  outline: none;
  border-color: #1a1a1a;
}

/* 文件上传区域 */
.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #1a1a1a;
  background: #f5f5f5;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  color: #999999;
}

.upload-title {
  font-size: 18px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;
}

.upload-description {
  font-size: 14px;
  color: #666666;
  margin: 0;
}

.upload-button {
  background: #1a1a1a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-button:hover {
  background: #333333;
}

.file-info {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f0f8ff;
  border: 1px solid #e0f0ff;
  border-radius: 8px;
}

.file-success {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a73e8;
  font-weight: 500;
}

.success-icon {
  font-size: 16px;
}

/* 歌曲信息 */
.song-info {
  margin-bottom: 32px;
}

.info-form {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* 预览区域 */
.preview-section {
  margin-bottom: 32px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-stats {
  display: flex;
  gap: 12px;
}

.stats-item {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  color: #666666;
}

.editor-container {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
}

.editor-header {
  display: grid;
  grid-template-columns: 120px 1fr 60px;
  gap: 16px;
  background: #f9f9f9;
  padding: 12px 16px;
  font-weight: 500;
  color: #666666;
  font-size: 12px;
  text-transform: uppercase;
}

.header-cell {
  display: flex;
  align-items: center;
}

.editor-body {
  max-height: 400px;
  overflow-y: auto;
}

.editor-row {
  display: grid;
  grid-template-columns: 120px 1fr 60px;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.editor-row:last-child {
  border-bottom: none;
}

.time-input {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 6px 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
}

.remove-button {
  background: #ffe6e6;
  color: #d32f2f;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-button:hover {
  background: #ffcccc;
}

.editor-actions {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.add-line-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0f8ff;
  color: #1a73e8;
  border: 1px solid #e0f0ff;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-line-button:hover {
  background: #e6f4ff;
}

.add-icon {
  font-size: 16px;
  font-weight: bold;
}

/* 导入按钮 */
.import-actions {
  text-align: center;
}

.import-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1a1a1a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-button:hover:not(.disabled) {
  background: #333333;
}

.import-button.disabled {
  background: #f0f0f0;
  color: #999999;
  cursor: not-allowed;
}

.import-icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .top-header .container {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .method-tabs {
    flex-direction: column;
  }
  
  .info-form {
    grid-template-columns: 1fr;
  }
  
  .editor-header,
  .editor-row {
    grid-template-columns: 100px 1fr 50px;
    gap: 12px;
  }
  
  .content-panel,
  .info-form,
  .editor-container {
    padding: 16px;
  }
  
  .upload-area {
    padding: 32px 16px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 24px 0;
  }
  
  .back-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .upload-area {
    padding: 24px 12px;
  }
  
  .import-button {
    padding: 12px 24px;
    font-size: 14px;
  }
  
  .editor-header,
  .editor-row {
    grid-template-columns: 80px 1fr 40px;
    gap: 8px;
  }
  
  .time-input {
    font-size: 10px;
    padding: 4px 6px;
  }
}
</style>