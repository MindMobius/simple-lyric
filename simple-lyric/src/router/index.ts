// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import LyricDetail from '@/views/LyricDetail.vue'
import ImportLyric from '@/views/ImportLyric.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/lyric/:id',
      name: 'lyric-detail',
      component: LyricDetail,
      props: true
    },
    {
      path: '/import',
      name: 'import-lyric',
      component: ImportLyric
    }
  ]
})

export default router