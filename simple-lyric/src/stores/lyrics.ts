// src/stores/lyrics.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface LyricLine {
  time: number
  text: string
}

export interface Lyric {
  id: string
  title: string
  artist: string
  lines: LyricLine[]
}

export const useLyricStore = defineStore('lyrics', () => {
  const lyrics = ref<Lyric[]>([
    {
      id: '1',
      title: '示例歌词',
      artist: '示例艺术家',
      lines: [
        { time: 0, text: '欢迎使用 Simple Lyric' },
        { time: 5, text: '这是一个极简风格的歌词展示网站' },
        { time: 10, text: '支持歌词自动滚动播放' },
        { time: 15, text: '也支持点击跳转到指定歌词' },
        { time: 20, text: '感谢使用' }
      ]
    }
  ])

  function addLyric(lyric: Lyric) {
    lyrics.value.push(lyric)
  }

  function removeLyric(id: string) {
    const index = lyrics.value.findIndex(lyric => lyric.id === id)
    if (index !== -1) {
      lyrics.value.splice(index, 1)
    }
  }

  function getLyricById(id: string) {
    return lyrics.value.find(lyric => lyric.id === id)
  }

  return { lyrics, addLyric, removeLyric, getLyricById }
})