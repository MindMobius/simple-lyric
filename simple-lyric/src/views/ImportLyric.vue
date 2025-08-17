<!-- src/views/ImportLyric.vue -->
<template>
  <div class="import-lyric">
    <div class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>导入歌词</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="import-container">
      <div class="import-options">
        <div class="option-card" @click="activeTab = 'paste'">
          <div class="option-icon">📋</div>
          <h3>粘贴歌词</h3>
          <p>粘贴文本或LRC格式歌词</p>
        </div>
        
        <div class="option-card" @click="activeTab = 'file'">
          <div class="option-icon">📁</div>
          <h3>导入文件</h3>
          <p>上传LRC格式歌词文件</p>
        </div>
      </div>
      
      <div class="import-content">
        <!-- 粘贴歌词 -->
        <div v-if="activeTab === 'paste'" class="paste-content">
          <div class="form-group">
            <label for="rawLyrics">歌词内容</label>
            <textarea
              id="rawLyrics"
              v-model="rawLyrics"
              placeholder="在此粘贴歌词内容，支持纯文本或LRC格式&#10;示例：&#10;[00:00.00]第一行歌词&#10;[00:05.00]第二行歌词&#10;或者：&#10;第一行歌词&#10;第二行歌词"
              rows="10"
              @input="handleLyricsInput"
            ></textarea>
          </div>
        </div>
        
        <!-- 文件导入 -->
        <div v-else class="file-content">
          <div class="file-upload-area" @dragover.prevent @drop.prevent="handleFileDrop">
            <input 
              type="file" 
              ref="fileInput" 
              accept=".lrc" 
              @change="handleFileSelect" 
              style="display: none"
            />
            <div class="upload-content" @click="triggerFileSelect">
              <div class="upload-icon">📁</div>
              <p>点击选择LRC文件或拖拽文件到此处</p>
              <button class="upload-btn">选择文件</button>
            </div>
          </div>
          
          <div v-if="fileName" class="file-info">
            <p>已选择文件: {{ fileName }}</p>
          </div>
        </div>
        
        <!-- 歌曲信息 -->
        <div class="song-info">
          <div class="form-group">
            <label for="title">歌曲标题</label>
            <input 
              id="title" 
              v-model="lyricInfo.title" 
              placeholder="请输入歌曲标题"
            />
          </div>
          
          <div class="form-group">
            <label for="artist">艺术家</label>
            <input 
              id="artist" 
              v-model="lyricInfo.artist" 
              placeholder="请输入艺术家"
            />
          </div>
        </div>
        
        <!-- 歌词预览和编辑 -->
        <div v-if="parsedLines.length > 0" class="preview-section">
          <h2>歌词预览</h2>
          <div class="preview-header">
            <div class="time-header">时间</div>
            <div class="text-header">歌词内容</div>
          </div>
          <div class="lyrics-editor">
            <div 
              class="lyric-line-editor" 
              v-for="(line, index) in parsedLines" 
              :key="index"
            >
              <input 
                class="time-input" 
                :value="formatTimeToLrc(line.time)"
                @input="updateLineTime(index, $event)"
                type="text"
              />
              <input 
                class="text-input" 
                v-model="line.text" 
                type="text"
              />
              <button 
                class="remove-line-btn" 
                @click="removeLine(index)"
                title="删除此行"
              >
                ×
              </button>
            </div>
          </div>
          
          <div class="editor-actions">
            <button class="add-line-btn" @click="addNewLine">+ 添加新行</button>
          </div>
        </div>
        
        <div class="import-actions">
          <button 
            class="import-btn" 
            :disabled="!canImport"
            @click="importLyric"
          >
            导入歌词
          </button>
        </div>
      </div>
    </div>
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

const lyricInfo = reactive({
  title: '',
  artist: ''
})

const parsedLines = ref<LyricLine[]>([])

const canImport = computed(() => {
  return lyricInfo.title && parsedLines.value.length > 0
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
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (file.name.endsWith('.lrc')) {
      fileName.value = file.name
      readFileContent(file)
    } else {
      alert('请上传LRC格式的歌词文件')
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
  if (!lyricInfo.title || parsedLines.value.length === 0) {
    alert('请填写歌曲标题并确保歌词内容不为空')
    return
  }
  
  const lyric = {
    id: Date.now().toString(),
    title: lyricInfo.title,
    artist: lyricInfo.artist || '未知艺术家',
    lines: parsedLines.value
  }
  
  lyricStore.addLyric(lyric)
  router.push('/')
}
</script>

<style scoped>
.import-lyric {
  min-height: 100vh;
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

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.spacer {
  width: 40px; /* 与返回按钮宽度相当，保持标题居中 */
}

.import-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.import-options {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.option-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.option-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

.option-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.option-card h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.option-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.8);
}

.form-group textarea {
  resize: vertical;
  min-height: 150px;
}

.file-upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: border-color 0.3s;
}

.file-upload-area:hover {
  border-color: #0078d4;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.upload-btn {
  background: #0078d4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 15px;
}

.upload-btn:hover {
  background: #106ebe;
}

.file-info {
  margin-top: 15px;
  padding: 10px;
  background: rgba(0, 120, 212, 0.1);
  border-radius: 4px;
}

.file-info p {
  margin: 0;
  color: #0078d4;
}

.preview-section {
  margin-top: 30px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.preview-header {
  display: flex;
  background: rgba(0, 0, 0, 0.05);
  padding: 10px;
  border-radius: 4px;
  font-weight: bold;
  margin-bottom: 10px;
}

.time-header,
.time-input {
  width: 100px;
  margin-right: 10px;
}

.text-header,
.text-input {
  flex: 1;
}

.lyrics-editor {
  max-height: 400px;
  overflow-y: auto;
}

.lyric-line-editor {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
}

.time-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace; /* 使用等宽字体显示时间 */
  font-size: 1rem;
  width: 100px;
  margin-right: 10px;
}

.text-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

.remove-line-btn {
  background: #ffebee;
  color: #c62828;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-left: 10px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-line-btn:hover {
  background: #ffcdd2;
}

.editor-actions {
  margin-top: 15px;
  text-align: center;
}

.add-line-btn {
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.add-line-btn:hover {
  background: #bbdefb;
}

.import-actions {
  margin-top: 30px;
  text-align: center;
}

.import-btn {
  background: #0078d4;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
}

.import-btn:hover:not(:disabled) {
  background: #106ebe;
}

.import-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .import-options {
    flex-direction: column;
  }
  
  .lyric-line-editor {
    flex-direction: column;
    align-items: stretch;
  }
  
  .time-input {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .remove-line-btn {
    align-self: flex-end;
    margin-left: 0;
    margin-top: 10px;
  }
}
</style>