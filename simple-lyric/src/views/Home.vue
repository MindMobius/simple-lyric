<!-- src/views/Home.vue -->
<template>
  <div class="home">
    <div class="header-section">
      <h1>我的歌词库</h1>
      <button class="import-btn" @click="goToImport">
        导入歌词
      </button>
    </div>
    
    <div class="tabs">
      <button 
        class="tab"
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        全部歌词
      </button>
      <button 
        class="tab"
        :class="{ active: activeTab === 'favorites' }"
        @click="activeTab = 'favorites'"
      >
        收藏
      </button>
    </div>
    
    <div class="lyrics-grid" v-if="filteredLyrics.length > 0">
      <div 
        class="lyric-card"
        v-for="lyric in filteredLyrics"
        :key="lyric.id"
        @click="goToLyric(lyric.id)"
      >
        <div class="card-content">
          <h3 class="lyric-title">{{ lyric.title }}</h3>
          <p class="lyric-artist">{{ lyric.artist }}</p>
          <p class="lyric-preview">{{ getPreviewText(lyric.lines) }}</p>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <p>暂无歌词，点击"导入歌词"按钮添加</p>
    </div>
    
    <!-- 导入歌词模态框 -->
    <div class="modal" v-if="showImportModal">
      <div class="modal-content">
        <h2>导入歌词</h2>
        <div class="form-group">
          <label for="title">歌曲标题</label>
          <input 
            id="title" 
            v-model="newLyric.title" 
            placeholder="请输入歌曲标题"
          />
        </div>
        
        <div class="form-group">
          <label for="artist">艺术家</label>
          <input 
            id="artist" 
            v-model="newLyric.artist" 
            placeholder="请输入艺术家"
          />
        </div>
        
        <div class="form-group">
          <label for="lrcContent">歌词内容 (LRC格式)</label>
          <textarea 
            id="lrcContent" 
            v-model="lrcContent" 
            placeholder="[00:00.00]第一行歌词&#10;[00:05.00]第二行歌词"
            rows="10"
          ></textarea>
        </div>
        
        <div class="modal-actions">
          <button class="cancel-btn" @click="showImportModal = false">取消</button>
          <button class="confirm-btn" @click="importLyric">导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLyricStore, type LyricLine } from '@/stores/lyrics'

const router = useRouter()
const lyricStore = useLyricStore()

const activeTab = ref('all')
const showImportModal = ref(false)
const lrcContent = ref('')

const newLyric = ref({
  title: '',
  artist: ''
})

const filteredLyrics = computed(() => {
  // 简化实现，实际项目中可以根据收藏状态过滤
  return lyricStore.lyrics
})

function getPreviewText(lines: LyricLine[]): string {
  if (lines.length === 0) return '暂无歌词内容'
  return lines.slice(0, 3).map(line => line.text).join(' / ')
}

function goToImport() {
  router.push('/import')
}


function goToLyric(id: string) {
  router.push(`/lyric/${id}`)
}

function parseLrcContent(content: string): LyricLine[] {
  const lines = content.split('\n')
  const lyricLines: LyricLine[] = []
  
  for (const line of lines) {
    // 匹配 LRC 时间戳格式 [mm:ss.xx]
    const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/)
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10)
      const seconds = parseInt(timeMatch[2], 10)
      const time = minutes * 60 + seconds
      const text = timeMatch[4].trim()
      
      if (text) {
        lyricLines.push({ time, text })
      }
    }
  }
  
  return lyricLines
}

function importLyric() {
  if (!newLyric.value.title || !lrcContent.value) {
    alert('请填写歌曲标题和歌词内容')
    return
  }
  
  const lines = parseLrcContent(lrcContent.value)
  
  if (lines.length === 0) {
    alert('歌词内容格式不正确，请检查')
    return
  }
  
  const lyric: Lyric = {
    id: Date.now().toString(),
    title: newLyric.value.title,
    artist: newLyric.value.artist || '未知艺术家',
    lines
  }
  
  lyricStore.addLyric(lyric)
  showImportModal.value = false
  
  // 重置表单
  newLyric.value.title = ''
  newLyric.value.artist = ''
  lrcContent.value = ''
}
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-section h1 {
  font-size: 2rem;
  font-weight: 300;
  color: #333;
}

.import-btn {
  background: #0078d4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.import-btn:hover {
  background: #106ebe;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab {
  background: transparent;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
}

.tab.active {
  background: rgba(0, 120, 212, 0.1);
  color: #0078d4;
  font-weight: 500;
}

.lyrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.lyric-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.lyric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  padding: 20px;
}

.lyric-title {
  font-size: 1.2rem;
  margin: 0 0 8px 0;
  color: #333;
}

.lyric-artist {
  font-size: 1rem;
  color: #666;
  margin: 0 0 12px 0;
}

.lyric-preview {
  font-size: 0.9rem;
  color: #888;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
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
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-btn {
  background: #f3f3f3;
  color: #666;
}

.cancel-btn:hover {
  background: #e6e6e6;
}

.confirm-btn {
  background: #0078d4;
  color: white;
}

.confirm-btn:hover {
  background: #106ebe;
}
</style>