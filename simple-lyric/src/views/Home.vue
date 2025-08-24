<!-- src/views/Home.vue -->
<template>
  <div class="home">
    <!-- 精简头部 -->
    <header class="top-header">
      <div class="container">
        <h1 class="app-title">Simple Lyric</h1>
        <div class="stats">
          <span class="stat-item">🎵 {{ lyricStore.lyrics.length }} 首歌词</span>
        </div>
      </div>
    </header>

    <!-- 标签页导航区域 -->
    <div class="nav-section">
      <div class="container">
        <nav class="nav-tabs">
          <button 
            class="nav-tab"
            :class="{ active: activeTab === 'random' }"
            @click="switchToRandom"
          >
            <span class="tab-icon">🎲</span>
            随机推荐
          </button>
          <button 
            class="nav-tab"
            :class="{ active: activeTab === 'playlists' }"
            @click="activeTab = 'playlists'"
          >
            <span class="tab-icon">📁</span>
            我的歌单
            <span class="tab-count">{{ playlists.length }}</span>
          </button>
          <button 
            class="nav-tab"
            @click="goToImport"
          >
            <span class="tab-icon">➕</span>
            导入歌词
          </button>
        </nav>
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <main class="main-content">
      <div class="container">
        <!-- 随机推荐模式 -->
        <div v-if="activeTab === 'random'" class="random-section">
          <div v-if="randomLyric" class="random-display">
            <div class="random-card" @click="goToLyric(randomLyric.id)">
              <div class="random-header">
                <h3 class="random-title">{{ randomLyric.title }}</h3>
                <p class="random-artist">{{ randomLyric.artist }}</p>
              </div>
              <div class="random-preview">
                <p 
                  v-for="(line, index) in randomLyric.lines.slice(0, 6)" 
                  :key="index"
                  class="preview-line"
                >
                  {{ line.text }}
                </p>
                <p v-if="randomLyric.lines.length > 6" class="preview-more">
                  ...还有 {{ randomLyric.lines.length - 6 }} 行
                </p>
              </div>
              <div class="random-footer">
                <span class="duration">{{ formatDuration(randomLyric.lines) }}</span>
                <span class="line-count">{{ randomLyric.lines.length }} 行</span>
              </div>
            </div>
            
            <div class="random-actions">
              <button class="refresh-btn" @click="getRandomLyric" :disabled="lyricStore.lyrics.length === 0">
                <span class="btn-icon">🔄</span>
                换一首
              </button>
            </div>
          </div>
          
          <div v-else class="empty-random">
            <div class="empty-icon">🎵</div>
            <h2 class="empty-title">暂无歌词</h2>
            <p class="empty-desc">请先导入一些歌词</p>
            <button class="import-btn" @click="goToImport">导入歌词</button>
          </div>
        </div>

        <!-- 我的歌单模式 -->
        <div v-if="activeTab === 'playlists'" class="playlist-section">
          <!-- 歌单管理 -->
          <div class="playlist-header">
            <h2 class="section-title">歌单管理</h2>
            <div class="header-actions">
              <button 
                v-if="selectedPlaylistId !== 'all'" 
                class="action-btn" 
                @click="showAddLyrics = true"
              >
                <span class="btn-icon">➕</span>
                添加歌词
              </button>
              <button class="action-btn" @click="showCreatePlaylist = !showCreatePlaylist">
                <span class="btn-icon">📁</span>
                新建歌单
              </button>
            </div>
          </div>
          
          <!-- 新建歌单表单 -->
          <div v-if="showCreatePlaylist" class="create-form">
            <div class="form-group">
              <input 
                v-model="newPlaylistName" 
                type="text" 
                placeholder="请输入歌单名称"
                class="form-input"
                @keyup.enter="createPlaylist"
              />
              <button class="confirm-btn" @click="createPlaylist">创建</button>
              <button class="cancel-btn" @click="cancelCreatePlaylist">取消</button>
            </div>
          </div>
          
          <!-- 歌单列表 -->
          <div class="playlists">
            <div 
              v-for="playlist in playlists" 
              :key="playlist.id"
              class="playlist-item"
              @click="selectPlaylist(playlist.id)"
              :class="{ active: selectedPlaylistId === playlist.id }"
            >
              <div class="playlist-info">
                <h3 class="playlist-name">{{ playlist.name }}</h3>
                <span class="playlist-count">{{ playlist.lyricIds.length }} 首</span>
              </div>
              <button 
                v-if="playlist.id !== 'all'" 
                class="delete-btn" 
                @click.stop="deletePlaylist(playlist.id)"
              >
                ×
              </button>
            </div>
          </div>
          
          <!-- 歌词列表 -->
          <div v-if="selectedPlaylistLyrics.length > 0" class="lyrics-list">
            <div 
              class="lyric-item"
              v-for="lyric in selectedPlaylistLyrics"
              :key="lyric.id"
              @click="goToLyric(lyric.id)"
            >
              <div class="lyric-info">
                <h3 class="lyric-title">{{ lyric.title }}</h3>
                <p class="lyric-artist">{{ lyric.artist }}</p>
                <p class="lyric-preview">{{ getPreviewText(lyric.lines) }}</p>
              </div>
              <div class="lyric-meta">
                <span class="duration">{{ formatDuration(lyric.lines) }}</span>
                <button 
                  v-if="selectedPlaylistId !== 'all'"
                  class="remove-btn" 
                  @click.stop="removeLyricFromPlaylist(lyric.id)"
                >
                  −
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-playlist">
            <div class="empty-icon">📁</div>
            <h3 class="empty-title">此歌单为空</h3>
            <p class="empty-desc">请先导入歌词，然后添加到歌单中</p>
            <button class="import-btn" @click="goToImport">导入歌词</button>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加歌词模态框 -->
    <div v-if="showAddLyrics" class="modal">
      <div class="modal-backdrop" @click="closeAddLyrics"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">添加歌词到「{{ getCurrentPlaylistName() }}」</h3>
          <button class="modal-close" @click="closeAddLyrics">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 搜索框 -->
          <div class="search-section">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索歌词标题或艺术家..."
              class="search-input"
            />
          </div>
          
          <!-- 选择控制 -->
          <div class="selection-controls">
            <button class="select-btn" @click="selectAll">全选</button>
            <button class="select-btn" @click="selectNone">取消全选</button>
            <span class="selection-count">已选择 {{ selectedLyricIds.length }} 首</span>
          </div>
          
          <!-- 歌词列表 -->
          <div class="selection-list">
            <div 
              v-for="lyric in filteredAvailableLyrics" 
              :key="lyric.id"
              class="selection-item"
              :class="{ selected: selectedLyricIds.includes(lyric.id) }"
              @click="toggleLyricSelection(lyric.id)"
            >
              <input 
                type="checkbox" 
                :checked="selectedLyricIds.includes(lyric.id)"
                @click.stop
                @change="toggleLyricSelection(lyric.id)"
                class="selection-checkbox"
              />
              <div class="selection-info">
                <h4 class="selection-title">{{ lyric.title }}</h4>
                <p class="selection-artist">{{ lyric.artist }}</p>
              </div>
              <div class="selection-meta">
                <span class="selection-duration">{{ formatDuration(lyric.lines) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="filteredAvailableLyrics.length === 0" class="no-lyrics">
            <p v-if="searchQuery">没有找到匹配的歌词</p>
            <p v-else>没有可添加的歌词</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeAddLyrics">取消</button>
          <button 
            class="confirm-btn" 
            @click="addSelectedLyrics"
            :disabled="selectedLyricIds.length === 0"
          >
            添加 {{ selectedLyricIds.length }} 首歌词
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLyricStore, type LyricLine } from '@/stores/lyrics'

// 类型定义
interface Playlist {
  id: string
  name: string
  lyricIds: string[]
}

interface Lyric {
  id: string
  title: string
  artist: string
  lines: LyricLine[]
}

const router = useRouter()
const lyricStore = useLyricStore()

// 状态
const activeTab = ref('random') // 默认显示随机推荐
const showCreatePlaylist = ref(false)
const newPlaylistName = ref('')
const selectedPlaylistId = ref('all')
const randomLyric = ref<Lyric | null>(null)

// 添加歌词相关状态
const showAddLyrics = ref(false)
const searchQuery = ref('')
const selectedLyricIds = ref<string[]>([])

// 歌单列表（使用 localStorage 存储）
const playlists = ref<Playlist[]>([
  { id: 'all', name: '全部歌词', lyricIds: [] }
])

// 当前选中歌单的歌词
const selectedPlaylistLyrics = computed(() => {
  const playlist = playlists.value.find(p => p.id === selectedPlaylistId.value)
  if (!playlist) return []
  
  if (playlist.id === 'all') {
    return lyricStore.lyrics
  }
  
  return lyricStore.lyrics.filter(lyric => playlist.lyricIds.includes(lyric.id))
})

// 可添加的歌词（排除已在当前歌单中的）
const availableLyrics = computed(() => {
  const playlist = playlists.value.find(p => p.id === selectedPlaylistId.value)
  if (!playlist || playlist.id === 'all') return []
  
  return lyricStore.lyrics.filter(lyric => !playlist.lyricIds.includes(lyric.id))
})

// 过滤后的可添加歌词
const filteredAvailableLyrics = computed(() => {
  if (!searchQuery.value.trim()) {
    return availableLyrics.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return availableLyrics.value.filter(lyric => 
    lyric.title.toLowerCase().includes(query) || 
    lyric.artist.toLowerCase().includes(query)
  )
})

// 生命周期
onMounted(() => {
  loadPlaylists()
  updateAllPlaylist()
  // 初始化随机推荐
  if (activeTab.value === 'random') {
    getRandomLyric()
  }
})

// 歌单管理函数
function loadPlaylists() {
  const saved = localStorage.getItem('simple-lyric-playlists')
  if (saved) {
    const savedPlaylists: Playlist[] = JSON.parse(saved)
    // 确保包含"全部歌词"歌单
    if (!savedPlaylists.find((p: Playlist) => p.id === 'all')) {
      savedPlaylists.unshift({ id: 'all', name: '全部歌词', lyricIds: [] })
    }
    playlists.value = savedPlaylists
  }
}

function savePlaylists() {
  localStorage.setItem('simple-lyric-playlists', JSON.stringify(playlists.value))
}

function updateAllPlaylist() {
  const allPlaylist = playlists.value.find(p => p.id === 'all')
  if (allPlaylist) {
    allPlaylist.lyricIds = lyricStore.lyrics.map(lyric => lyric.id)
  }
}

function createPlaylist() {
  if (!newPlaylistName.value.trim()) return
  
  const newPlaylist: Playlist = {
    id: Date.now().toString(),
    name: newPlaylistName.value.trim(),
    lyricIds: []
  }
  
  playlists.value.push(newPlaylist)
  savePlaylists()
  
  newPlaylistName.value = ''
  showCreatePlaylist.value = false
}

function cancelCreatePlaylist() {
  newPlaylistName.value = ''
  showCreatePlaylist.value = false
}

function selectPlaylist(playlistId: string) {
  selectedPlaylistId.value = playlistId
}

function deletePlaylist(playlistId: string) {
  if (playlistId === 'all') return
  
  playlists.value = playlists.value.filter(p => p.id !== playlistId)
  savePlaylists()
  
  if (selectedPlaylistId.value === playlistId) {
    selectedPlaylistId.value = 'all'
  }
}

function removeLyricFromPlaylist(lyricId: string) {
  if (selectedPlaylistId.value === 'all') return
  
  const playlist = playlists.value.find(p => p.id === selectedPlaylistId.value)
  if (playlist) {
    playlist.lyricIds = playlist.lyricIds.filter(id => id !== lyricId)
    savePlaylists()
  }
}

// 添加歌词功能
function getCurrentPlaylistName(): string {
  const playlist = playlists.value.find(p => p.id === selectedPlaylistId.value)
  return playlist?.name || ''
}

function closeAddLyrics() {
  showAddLyrics.value = false
  searchQuery.value = ''
  selectedLyricIds.value = []
}

function toggleLyricSelection(lyricId: string) {
  const index = selectedLyricIds.value.indexOf(lyricId)
  if (index > -1) {
    selectedLyricIds.value.splice(index, 1)
  } else {
    selectedLyricIds.value.push(lyricId)
  }
}

function selectAll() {
  selectedLyricIds.value = [...filteredAvailableLyrics.value.map(lyric => lyric.id)]
}

function selectNone() {
  selectedLyricIds.value = []
}

function addSelectedLyrics() {
  const playlist = playlists.value.find(p => p.id === selectedPlaylistId.value)
  if (!playlist || playlist.id === 'all') return
  
  // 添加选中的歌词到歌单
  selectedLyricIds.value.forEach(lyricId => {
    if (!playlist.lyricIds.includes(lyricId)) {
      playlist.lyricIds.push(lyricId)
    }
  })
  
  savePlaylists()
  closeAddLyrics()
}

// 随机推荐函数
function switchToRandom() {
  activeTab.value = 'random'
  getRandomLyric()
}

function getRandomLyric() {
  const lyrics = lyricStore.lyrics
  if (lyrics.length === 0) {
    randomLyric.value = null
    return
  }
  
  const randomIndex = Math.floor(Math.random() * lyrics.length)
  randomLyric.value = lyrics[randomIndex] as Lyric
}

// 工具函数
function getPreviewText(lines: LyricLine[]): string {
  if (lines.length === 0) return '暂无歌词内容'
  const previewLines = lines.slice(0, 2).map(line => line.text.slice(0, 20))
  return previewLines.join(' / ')
}

function formatDuration(lines: LyricLine[]): string {
  if (lines.length === 0) return '0:00'
  const lastLine = lines[lines.length - 1]
  const minutes = Math.floor(lastLine.time / 60)
  const seconds = Math.floor(lastLine.time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function goToImport() {
  router.push('/import')
}

function goToLyric(id: string) {
  router.push(`/lyric/${id}`)
}
</script>

<style scoped>
/* 全局设置 */
.home {
  min-height: 100vh;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.container {
  max-width: 1200px;
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
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  color: #666666;
  font-size: 14px;
}

/* 导航区域 */
.nav-section {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 0;
}

.nav-tabs {
  display: flex;
  gap: 8px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 20px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-tab:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.nav-tab.active {
  background: #1a1a1a;
  border-color: #1a1a1a;
  color: #ffffff;
}

.tab-icon {
  font-size: 16px;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
}

/* 主内容区域 */
.main-content {
  padding: 32px 0;
}

/* 随机推荐样式 */
.random-section {
  max-width: 600px;
  margin: 0 auto;
}

.random-display {
  text-align: center;
}

.random-card {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.random-card:hover {
  border-color: #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.random-header {
  margin-bottom: 24px;
}

.random-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.random-artist {
  font-size: 16px;
  color: #666666;
  margin: 0;
}

.random-preview {
  margin-bottom: 24px;
  text-align: left;
}

.preview-line {
  font-size: 16px;
  line-height: 1.6;
  color: #333333;
  margin: 8px 0;
}

.preview-more {
  color: #999999;
  font-style: italic;
  margin-top: 16px;
}

.random-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  color: #666666;
  font-size: 14px;
}

.random-actions {
  display: flex;
  justify-content: center;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1a1a1a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #333333;
}

.refresh-btn:disabled {
  background: #f0f0f0;
  color: #999999;
  cursor: not-allowed;
}

/* 空状态样式 */
.empty-random,
.empty-playlist {
  text-align: center;
  padding: 64px 32px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.empty-desc {
  color: #666666;
  margin: 0 0 24px 0;
}

.import-btn {
  background: #1a1a1a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-btn:hover {
  background: #333333;
}

/* 歌单区域样式 */
.playlist-section {
  max-width: 800px;
  margin: 0 auto;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f0f0f0;
  border-color: #d0d0d0;
}

/* 创建表单 */
.create-form {
  background: #f9f9f9;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
}

.confirm-btn {
  background: #1a1a1a;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666666;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

/* 歌单列表 */
.playlists {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.playlist-item {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.playlist-item:hover {
  border-color: #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.playlist-item.active {
  border-color: #1a1a1a;
  background: #fafafa;
}

.playlist-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.playlist-name {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;
}

.playlist-count {
  font-size: 12px;
  color: #999999;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  color: #999999;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.delete-btn:hover {
  background: #ff4444;
  color: #ffffff;
}

/* 歌词列表 */
.lyrics-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lyric-item {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.lyric-item:hover {
  border-color: #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.lyric-info {
  flex: 1;
}

.lyric-title {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.lyric-artist {
  font-size: 14px;
  color: #666666;
  margin: 0 0 8px 0;
}

.lyric-preview {
  font-size: 13px;
  color: #999999;
  margin: 0;
  line-height: 1.4;
}

.lyric-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.duration {
  font-size: 12px;
  color: #999999;
}

.remove-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  color: #999999;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.remove-btn:hover {
  background: #ff4444;
  color: #ffffff;
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ffffff;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.search-input {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  margin-bottom: 16px;
}

.selection-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.select-btn {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.selection-count {
  font-size: 12px;
  color: #666666;
}

.selection-list {
  max-height: 300px;
  overflow-y: auto;
}

.selection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
}

.selection-item:hover {
  background: #f9f9f9;
}

.selection-item.selected {
  background: #f0f8ff;
  border-color: #1a1a1a;
}

.selection-info {
  flex: 1;
}

.selection-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.selection-artist {
  font-size: 12px;
  color: #666666;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .nav-tabs {
    flex-wrap: wrap;
  }
  
  .nav-tab {
    font-size: 13px;
    padding: 10px 16px;
  }
  
  .playlists {
    grid-template-columns: 1fr;
  }
  
  .random-card {
    padding: 24px 16px;
  }
  
  .modal-content {
    width: 95%;
  }
}
</style>