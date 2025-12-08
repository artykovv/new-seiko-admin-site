<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import { useSidebar } from './composables/useSidebar'

const route = useRoute()
const { isOpen, toggle } = useSidebar()

const pageTitle = computed(() => {
  return route.meta?.title || 'Админ панель'
})

const isLoginPage = computed(() => {
  return route.path === '/login'
})

const isPublicPage = computed(() => {
  return route.path === '/login' || route.path === '/test/participant/register'
})
</script>

<template>
  <div id="app" class="d-flex min-vh-100">
    <template v-if="!isPublicPage">
      <Sidebar />
      
      <main 
        class="flex-grow-1 main-content"
        :class="{ 'main-content-expanded': isOpen }"
        :style="{
          marginLeft: isOpen ? 'calc(280px + 2rem)' : 'calc(60px + 2rem)',
          transition: 'margin-left 0.3s ease'
        }"
      >
        <div class="container-fluid p-4">
          <div class="d-flex align-items-center mb-3">
            <button 
              class="btn btn-outline-secondary d-md-none me-2"
              @click="toggle"
              aria-label="Открыть меню"
            >
              <i class="bi bi-list"></i>
            </button>
            <h1 class="mb-0">{{ pageTitle }}</h1>
          </div>
          
          <Navbar />
          
          <router-view />
        </div>
      </main>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<style scoped>
.main-content {
  transition: margin-left 0.3s ease;
}

@media (max-width: 767.98px) {
  .main-content {
    margin-left: 0 !important;
  }
}
</style>
