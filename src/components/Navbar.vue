<template>
  <nav v-if="tabs && tabs.length > 0" class="navbar-navbar mb-3 d-flex justify-content-center">
    <div class="navbar-segmented-control">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="navbar-segment"
        :class="{ 'navbar-segment-active': isActive(tab.path) }"
      >
        {{ tab.label }}
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Получаем вкладки из метаданных текущего маршрута или родительского
const tabs = computed(() => {
  // Сначала проверяем текущий маршрут
  if (route.meta?.tabs) {
    return route.meta.tabs
  }
  
  // Если нет, ищем в родительских маршрутах
  const matched = route.matched
  for (let i = matched.length - 1; i >= 0; i--) {
    if (matched[i].meta?.tabs) {
      return matched[i].meta.tabs
    }
  }
  
  return null
})

// Проверка активной вкладки
const isActive = (path) => {
  const currentPath = route.path
  
  // Нормализуем пути (убираем завершающий слэш, кроме корня)
  const normalizedCurrent = currentPath === '/' 
    ? '/' 
    : (currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath)
  const normalizedPath = path === '/' 
    ? '/' 
    : (path.endsWith('/') ? path.slice(0, -1) : path)
  
  // Точное совпадение пути
  return normalizedCurrent === normalizedPath
}
</script>

<style scoped>
.navbar-navbar {
  border-bottom: none;
}

.navbar-segmented-control {
  display: inline-flex;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  gap: 0;
}

.navbar-segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  color: #212529;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  position: relative;
}

.navbar-segment:hover {
  color: rgb(0, 0, 128);
  transition: color 0.2s ease;
}

.navbar-segment-active,
:deep(.router-link-active) {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
}

.navbar-segment-active:hover,
:deep(.router-link-active:hover) {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
}
</style>

