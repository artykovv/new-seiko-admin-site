<template>
  <div class="position-relative">
    <!-- Overlay для мобильных устройств -->
    <div 
      v-if="isOpen && isMobile" 
      class="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-50 d-md-none"
      style="z-index: 1040;"
      @click="toggle"
    ></div>
    
    <!-- Sidebar -->
    <aside 
      :class="[
        'bg-white text-dark d-flex flex-column shadow rounded position-fixed top-0 start-0',
        !isMobile && 'm-3'
      ]"
      :style="{
        width: isMobile 
          ? (isOpen ? '280px' : '0') 
          : (isOpen ? '280px' : '60px'),
        height: isMobile ? '100vh' : 'calc(100vh - 2rem)',
        zIndex: 1030,
        transition: 'width 0.3s ease, transform 0.3s ease',
        transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
        overflow: isMobile && !isOpen ? 'hidden' : 'visible'
      }"
    >
      <!-- 1. Логотип (верх) -->
      <div class="sidebar-header p-2 border-bottom">
        <a href="#" class="sidebar-menu-item d-flex align-items-center text-decoration-none px-2 py-2 rounded">
          <img 
            src="/logo.svg" 
            alt="Seiko Logo" 
            class="d-block"
            style="width: 30px; height: auto; object-fit: contain; flex-shrink: 0; text-align: center;"
          />
          <span class="sidebar-menu-text ms-2" :class="{ 'sidebar-menu-text-visible': isOpen || isMobile }">
            <div class="fw-bold small mb-0">Seiko Global Admin</div>
          </span>
        </a>
      </div>
      
      <!-- 2. Контент (середина) -->
      <nav class="flex-grow-1 overflow-auto p-2 sidebar-content">
        <ul class="list-unstyled mb-0">
          <li v-for="item in menuItems" :key="item.path">
            <router-link 
              :to="item.path"
              class="sidebar-menu-item d-flex align-items-center text-decoration-none px-2 py-2 rounded"
              :class="{ 'sidebar-menu-item-active': isActive(item.path) }"
            >
              <i :class="`bi ${item.icon}`" style="font-size: 1.1rem; min-width: 24px; text-align: center;"></i>
              <span class="sidebar-menu-text ms-2" :class="{ 'sidebar-menu-text-visible': isOpen || isMobile }">{{ item.title }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
      
      <!-- 3. Иконка админа (низ) -->
      <div class="sidebar-footer p-2 border-top">
        <a href="#" class="sidebar-menu-item d-flex align-items-center text-decoration-none px-2 py-2 rounded">
          <i class="bi bi-person-fill" style="font-size: 1.1rem; min-width: 24px; text-align: center;"></i>
          <span class="sidebar-menu-text ms-2" :class="{ 'sidebar-menu-text-visible': isOpen || isMobile }">
            <div class="fw-semibold small mb-0">{{ adminFullName }}</div>
            <div class="text-muted" style="font-size: 0.75rem;">{{ adminEmail }}</div>
          </span>
        </a>
      </div>
    </aside>
    
    <!-- Кнопка переключения на правом краю (только для десктопа) -->
    <button
      v-if="!isMobile"
      @click="toggle"
      class="btn rounded-circle position-fixed d-flex align-items-center justify-content-center sidebar-toggle-btn"
      :style="{
        left: isOpen ? 'calc(280px + 1rem - 16px)' : 'calc(60px + 1rem - 16px)',
        top: 'calc(1rem + 1rem + 40px - 16px)',
        width: '32px',
        height: '32px',
        zIndex: 1035,
        backgroundColor: '#000080',
        transition: 'left 0.3s ease'
      }"
      :aria-label="isOpen ? 'Закрыть меню' : 'Открыть меню'"
    >
      <i :class="isOpen ? 'bi bi-chevron-left' : 'bi bi-chevron-right'" class="text-white"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'
import { BACKEND_API_URL } from '../config'

const router = useRouter()
const route = useRoute()
const { isOpen, toggle } = useSidebar()
const windowWidth = ref(window.innerWidth)

const isMobile = computed(() => windowWidth.value < 768)

// Admin data
const adminData = ref(null)
const adminFullName = computed(() => {
  if (!adminData.value) return 'Администратор'
  const { lastname, name, patronymic } = adminData.value
  return [lastname, name, patronymic].filter(Boolean).join(' ') || 'Администратор'
})
const adminEmail = computed(() => adminData.value?.email || 'admin@example.com')

// Load admin data
const loadAdminData = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(`${BACKEND_API_URL}/api/admin/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      adminData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading admin data:', err)
  }
}

// Получаем маршруты из router
const menuItems = computed(() => {
  return router.options.routes
    .filter(route => route.meta && route.meta.title && !route.meta.hideInSidebar)
    .map(route => ({
      path: route.path,
      name: route.name,
      title: route.meta.title,
      icon: route.meta.icon
    }))
})

// Функция проверки активного пункта меню
const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  // Для вложенных путей (например /products/...) проверяем начало пути
  return route.path.startsWith(path)
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadAdminData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.sidebar-toggle-btn {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sidebar-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.sidebar-toggle-btn:active {
  transform: scale(0.95);
}

/* Плавные переходы для контента */
.sidebar-text {
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
}

.sidebar-text-visible {
  max-width: 200px;
  opacity: 1;
}

.sidebar-content {
  transition: opacity 0.3s ease;
}

.sidebar-footer-text {
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
}

.sidebar-footer-text-visible {
  max-width: 200px;
  opacity: 1;
}

.sidebar-logo {
  transition: transform 0.3s ease;
}

.sidebar-avatar {
  flex-shrink: 0;
  aspect-ratio: 1 / 1;
}

.sidebar-menu-item {
  color: #212529;
  transition: all 0.2s;
}

.sidebar-menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #000080;
}

.sidebar-menu-item-active,
:deep(.router-link-active) {
  background-color: rgba(0, 0, 128, 0.1) !important;
  color: rgb(0, 0, 128) !important;
}

.sidebar-menu-item-active:hover,
:deep(.router-link-active:hover) {
  background-color: rgba(0, 0, 128, 0.15) !important;
  color: rgb(0, 0, 128) !important;
}

.sidebar-menu-text {
  transition: max-width 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-menu-text.sidebar-menu-text-visible {
  max-width: 200px;
  opacity: 1;
}
</style>
