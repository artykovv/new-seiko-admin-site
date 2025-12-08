import { ref, watch } from 'vue'

const STORAGE_KEY = 'sidebar-state'

// Загружаем состояние из localStorage при инициализации
const getInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved !== null ? JSON.parse(saved) : true
  } catch {
    return true
  }
}

const isOpen = ref(getInitialState())

// Сохраняем состояние в localStorage при изменении
watch(isOpen, (newValue) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
  } catch (error) {
    console.error('Ошибка при сохранении состояния sidebar:', error)
  }
})

const toggle = () => {
  isOpen.value = !isOpen.value
}

const open = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

export function useSidebar() {
  return {
    isOpen,
    toggle,
    open,
    close
  }
}

