<!-- src/App.vue -->
<template>
  <div class="app">
    <div class="app-background"></div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
/* CSS变量定义 - Fluent Design系统色彩 */
:root {
  /* 主色调 - 黑白灰系统 */
  --color-primary: #000000;
  --color-secondary: #323130;
  --color-tertiary: #605e5c;
  --color-quaternary: #8a8886;
  --color-neutralLighterAlt: #faf9f8;
  --color-neutralLighter: #f3f2f1;
  --color-neutralLight: #edebe9;
  --color-neutralQuaternaryAlt: #e1dfdd;
  --color-neutralQuaternary: #d2d0ce;
  --color-neutralTertiaryAlt: #c8c6c4;
  --color-neutralTertiary: #a19f9d;
  --color-neutralSecondary: #605e5c;
  --color-neutralPrimaryAlt: #3b3a39;
  --color-neutralPrimary: #323130;
  --color-neutralDark: #201f1e;
  --color-black: #000000;
  --color-white: #ffffff;
  
  /* 透明度系统 */
  --bg-glass: rgba(255, 255, 255, 0.72);
  --bg-glass-dark: rgba(0, 0, 0, 0.72);
  --bg-overlay-light: rgba(255, 255, 255, 0.85);
  --bg-overlay-medium: rgba(255, 255, 255, 0.6);
  --bg-overlay-strong: rgba(255, 255, 255, 0.95);
  
  /* 阴影系统 */
  --shadow-depth-2: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
  --shadow-depth-4: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.11), 0 0.25rem 1rem rgba(0, 0, 0, 0.13);
  --shadow-depth-8: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.12), 0 0.5rem 1.5rem rgba(0, 0, 0, 0.15);
  --shadow-depth-16: 0 0.5rem 1rem rgba(0, 0, 0, 0.13), 0 1rem 2rem rgba(0, 0, 0, 0.16);
  --shadow-depth-64: 0 2rem 4rem rgba(0, 0, 0, 0.24), 0 4rem 8rem rgba(0, 0, 0, 0.32);
  
  /* 边框半径 */
  --border-radius-small: 0.125rem;
  --border-radius-medium: 0.25rem;
  --border-radius-large: 0.5rem;
  --border-radius-xlarge: 0.75rem;
  
  /* 字体系统 */
  --font-family-primary: 'Segoe UI', 'Microsoft YaHei UI', system-ui, -apple-system, sans-serif;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}

/* 全局重置 */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  line-height: 1.5;
}

body {
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-regular);
  color: var(--color-neutralPrimary);
  background: var(--color-neutralLighterAlt);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* 全局按钮样式 */
button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 全局输入框样式 */
input, textarea {
  font-family: inherit;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 滚动条样式 - Fluent Design */
::-webkit-scrollbar {
  width: 0.75rem;
  height: 0.75rem;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-neutralTertiary);
  border-radius: 0.375rem;
  border: 0.125rem solid transparent;
  background-clip: content-box;
  transition: background-color 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-neutralSecondary);
  background-clip: content-box;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

/* 选择文本样式 */
::selection {
  background: var(--color-neutralQuaternary);
  color: var(--color-neutralDark);
}

/* 聚焦指示器 */
:focus-visible {
  outline: 0.125rem solid var(--color-neutralDark);
  outline-offset: 0.125rem;
}

/* 动画预设 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 工具类 */
.fluent-card {
  background: var(--bg-glass);
  backdrop-filter: blur(1rem) saturate(1.8);
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-depth-8);
}

.fluent-button {
  background: var(--bg-overlay-light);
  border: 0.0625rem solid var(--color-neutralQuaternary);
  border-radius: var(--border-radius-medium);
  color: var(--color-neutralPrimary);
  font-weight: var(--font-weight-semibold);
  padding: 0.5rem 1rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fluent-button:hover {
  background: var(--bg-overlay-strong);
  border-color: var(--color-neutralSecondary);
  transform: translateY(-0.0625rem);
  box-shadow: var(--shadow-depth-4);
}

.fluent-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-depth-2);
}

.fluent-input {
  background: var(--bg-overlay-medium);
  border: 0.0625rem solid var(--color-neutralQuaternary);
  border-radius: var(--border-radius-medium);
  color: var(--color-neutralPrimary);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.fluent-input:focus {
  border-color: var(--color-neutralDark);
  background: var(--bg-overlay-strong);
  box-shadow: 0 0 0 0.125rem rgba(0, 0, 0, 0.1);
}
</style>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, 
    var(--color-neutralLighterAlt) 0%, 
    var(--color-neutralLighter) 50%, 
    var(--color-neutralLight) 100%);
}

.app-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(0, 0, 0, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(0, 0, 0, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}
</style>