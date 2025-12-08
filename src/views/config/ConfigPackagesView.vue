<template>
  <div class="d-flex flex-column h-100">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
      <div class="position-relative" style="flex: 1; max-width: 400px;">
        <i class="bi bi-search position-absolute" style="left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; z-index: 10;"></i>
        <input 
          type="text" 
          v-model="searchQuery"
          class="form-control ps-5"
          placeholder="Поиск..."
          style="font-size: 14px;"
          @input="applySearch"
        />
      </div>
      <div class="d-flex align-items-center gap-2">
        <!-- Filters Dropdown -->
        <div class="dropdown">
          <button 
            class="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
            style="font-size: 14px;"
          >
            <i class="bi bi-funnel"></i>
            Фильтры
          </button>
          <ul class="dropdown-menu dropdown-menu-end p-3" style="min-width: 250px;">
            <li class="text-muted small">Фильтры будут добавлены позже</li>
          </ul>
        </div>
        
        <button 
          class="btn btn-primary d-flex align-items-center gap-2"
          style="font-size: 14px; background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
          @click="openAddModal"
        >
          <i class="bi bi-plus-circle"></i>
          Добавить пакет
        </button>
        
        <span class="text-muted small">Показать:</span>
        <select 
          v-model="pageSize" 
          @change="changePageSize"
          class="form-select form-select-sm page-size-select"
        >
          <option :value="20">20</option>
          <option :value="30">30</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger flex-shrink-0" role="alert">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-5 flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else class="d-flex flex-column flex-grow-1 overflow-hidden">
      <div class="flex-grow-1 overflow-auto">
        <DataTable
          :columns="columns"
          :items="filteredItems"
          :actions="actions"
          class="h-100"
        >
          <template #cell-color="{ value }">
            <div 
              v-if="value" 
              class="color-preview"
              :style="getColorStyle(value)"
            ></div>
            <span v-else>-</span>
          </template>
        </DataTable>
      </div>

      <!-- Pagination -->
      <div class="flex-shrink-0 mt-3 d-flex justify-content-center">
        <nav v-if="totalPages > 1" aria-label="Page navigation">
          <ul class="pagination mb-0">
            <li 
              v-for="page in displayedPages" 
              :key="page" 
              class="page-item"
              :class="{ active: currentPage === page, disabled: page === '...' }"
            >
              <button class="page-link" @click="page !== '...' && changePage(page)">
                {{ page }}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования -->
    <FormModal
      :is-open="formModalOpen"
      :title="formModalTitle"
      :save-button-text="formModalTitle.includes('Добавить') ? 'Добавить' : 'Сохранить'"
      @save="handleSave"
      @close="closeFormModal"
    >
      <template #body>
        <form @submit.prevent="handleSave">
          <div class="mb-3">
            <label for="name" class="form-label">Название <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="name" 
              v-model="formData.name"
              placeholder="Например: VIP START"
              required
            />
          </div>
          <div class="mb-3">
            <label for="price" class="form-label">Цена <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="price" 
              v-model.number="formData.price"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div class="mb-3">
            <label for="referral_bonus" class="form-label">Реферальный бонус <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="referral_bonus" 
              v-model.number="formData.referral_bonus"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div class="mb-3">
            <label for="binary_bonus_percentage" class="form-label">Бинарный бонус (%) <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="binary_bonus_percentage" 
              v-model.number="formData.binary_bonus_percentage"
              placeholder="0.0000"
              step="0.0001"
              min="0"
              max="1"
              required
            />
            <small class="form-text text-muted">Введите значение от 0 до 1 (например, 0.0400 для 4%)</small>
          </div>
          <div class="mb-3">
            <label class="form-label">Цвет (градиент) <span class="text-danger">*</span></label>
            <div class="row g-3">
              <div class="col-6">
                <label for="color1" class="form-label small">Верхний цвет</label>
                <div class="d-flex align-items-center gap-2">
                  <input 
                    type="color" 
                    class="form-control form-control-color" 
                    id="color1" 
                    v-model="gradientColor1"
                    @input="updateGradientColor"
                    style="width: 60px; height: 38px;"
                  />
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="gradientColor1"
                    @input="updateGradientColor"
                    placeholder="#8AA5D4"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
              <div class="col-6">
                <label for="color2" class="form-label small">Нижний цвет</label>
                <div class="d-flex align-items-center gap-2">
                  <input 
                    type="color" 
                    class="form-control form-control-color" 
                    id="color2" 
                    v-model="gradientColor2"
                    @input="updateGradientColor"
                    style="width: 60px; height: 38px;"
                  />
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="gradientColor2"
                    @input="updateGradientColor"
                    placeholder="#2F4D81"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            </div>
            <small class="form-text text-muted d-block mt-2">Выберите два цвета для создания градиента (сверху вниз)</small>
            <div v-if="formData.color" class="mt-3">
              <label class="form-label small">Предпросмотр градиента:</label>
              <div 
                class="gradient-preview"
                :style="getColorStyle(formData.color)"
              >
                <div class="gradient-preview-text">{{ formData.color }}</div>
              </div>
            </div>
          </div>
        </form>
      </template>
    </FormModal>

    <!-- Модальное окно просмотра -->
    <div 
      class="modal fade" 
      :class="{ show: viewModalOpen, 'd-block': viewModalOpen }" 
      :style="{ display: viewModalOpen ? 'block' : 'none' }"
      tabindex="-1"
      role="dialog"
      @click.self="closeViewModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Просмотр пакета</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="closeViewModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="viewLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            <div v-else>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">ID</label>
                  <div class="form-control-plaintext">{{ viewData.id || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Название</label>
                  <div class="form-control-plaintext">{{ viewData.name || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Цена</label>
                  <div class="form-control-plaintext">{{ formatPrice(viewData.price) || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Реферальный бонус</label>
                  <div class="form-control-plaintext">{{ formatPrice(viewData.referral_bonus) || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Бинарный бонус (%)</label>
                  <div class="form-control-plaintext">{{ formatPercentage(viewData.binary_bonus_percentage) || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Цвет (градиент)</label>
                  <div class="d-flex align-items-center gap-2">
                    <div 
                      v-if="viewData.color" 
                      class="color-preview-large"
                      :style="getColorStyle(viewData.color)"
                    ></div>
                    <span>{{ viewData.color || '-' }}</span>
                  </div>
                </div>
                <!-- Дополнительные поля будут добавлены здесь -->
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeViewModal"
            >
              Закрыть
            </button>
            <button 
              type="button" 
              class="btn btn-primary"
              style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
              @click="openEditModalFromView"
            >
              Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="viewModalOpen" 
      class="modal-backdrop fade show"
      @click="closeViewModal"
    ></div>

    <!-- Модальное окно подтверждения удаления -->
    <ConfirmModal
      :is-open="deleteModalOpen"
      title="Удаление пакета"
      :message="deleteConfirmMessage"
      @confirm="handleDelete"
      @close="deleteModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DataTable from '../../components/DataTable.vue'
import FormModal from '../../components/FormModal.vue'
import ConfirmModal from '../../components/ConfirmModal.vue'
import { BACKEND_API_URL } from '../../config'

const items = ref([])
const allItems = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')

const formModalOpen = ref(false)
const formModalTitle = ref('Добавить пакет')
const formData = ref({
  name: '',
  price: 0,
  referral_bonus: 0,
  binary_bonus_percentage: 0,
  color: ''
})
const editingId = ref(null)

// Gradient color pickers
const gradientColor1 = ref('#8AA5D4')
const gradientColor2 = ref('#2F4D81')

const deleteModalOpen = ref(false)
const deleteItemId = ref(null)
const deleteItemName = ref('')

const viewModalOpen = ref(false)
const viewLoading = ref(false)
const viewData = ref({})
const viewItemId = ref(null)

const deleteConfirmMessage = computed(() => {
  return `Вы уверены, что хотите удалить пакет "${deleteItemName.value}"? Это действие нельзя отменить.`
})

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Название' },
  { key: 'price', label: 'Цена' },
  { key: 'referral_bonus', label: 'Реферальный бонус' },
  { key: 'binary_bonus_percentage', label: 'Бинарный бонус (%)' },
  { key: 'color', label: 'Цвет' }
]

const actions = [
  { 
    label: 'Просмотр', 
    icon: 'bi-eye', 
    handler: (item) => openViewModal(item)
  },
  { 
    label: 'Редактировать', 
    icon: 'bi-pencil', 
    handler: (item) => openEditModal(item)
  },
  { 
    label: 'Удалить', 
    icon: 'bi-trash', 
    class: 'text-danger',
    handler: (item) => openDeleteModal(item)
  }
]

const filteredItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return items.value.slice(start, end)
})

const displayedPages = computed(() => {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || (i >= currentPage.value - delta && i <= currentPage.value + delta)) {
      range.push(i)
    }
  }

  range.forEach(i => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
})

const getColorStyle = (colorString) => {
  if (!colorString) return {}
  const colors = colorString.split(',').map(c => c.trim())
  if (colors.length === 2) {
    return {
      background: `linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%)`
    }
  } else if (colors.length === 1) {
    return {
      backgroundColor: colors[0]
    }
  }
  return {}
}

const formatPrice = (price) => {
  if (!price && price !== 0) return '-'
  return parseFloat(price).toFixed(2)
}

const formatPercentage = (percentage) => {
  if (!percentage && percentage !== 0) return '-'
  return (parseFloat(percentage) * 100).toFixed(2) + '%'
}

const fetchPackages = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/pakets/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите снова.')
      }
      throw new Error(`Ошибка загрузки данных: ${response.status}`)
    }

    const data = await response.json()
    allItems.value = data
    applySearch()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке пакетов'
    console.error('Error fetching packages:', err)
  } finally {
    loading.value = false
  }
}

const applySearch = () => {
  if (!searchQuery.value.trim()) {
    items.value = allItems.value
  } else {
    const query = searchQuery.value.toLowerCase()
    items.value = allItems.value.filter(item => 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.price && item.price.toString().includes(query)) ||
      (item.color && item.color.toLowerCase().includes(query))
    )
  }
  
  totalPages.value = Math.ceil(items.value.length / pageSize.value)
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const changePageSize = () => {
  currentPage.value = 1
  totalPages.value = Math.ceil(items.value.length / pageSize.value)
}

watch(pageSize, () => {
  totalPages.value = Math.ceil(items.value.length / pageSize.value)
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1
  }
})

const updateGradientColor = () => {
  // Обновляем formData.color при изменении любого из цветов
  if (gradientColor1.value && gradientColor2.value) {
    formData.value.color = `${gradientColor1.value}, ${gradientColor2.value}`
  }
}

const parseGradientColors = (colorString) => {
  if (!colorString) {
    gradientColor1.value = '#8AA5D4'
    gradientColor2.value = '#2F4D81'
    return
  }
  
  const colors = colorString.split(',').map(c => c.trim())
  if (colors.length >= 2) {
    gradientColor1.value = colors[0]
    gradientColor2.value = colors[1]
  } else if (colors.length === 1) {
    gradientColor1.value = colors[0]
    gradientColor2.value = colors[0]
  }
}

const openAddModal = () => {
  formData.value = {
    name: '',
    price: 0,
    referral_bonus: 0,
    binary_bonus_percentage: 0,
    color: ''
  }
  gradientColor1.value = '#8AA5D4'
  gradientColor2.value = '#2F4D81'
  updateGradientColor()
  editingId.value = null
  formModalTitle.value = 'Добавить пакет'
  formModalOpen.value = true
}

const openViewModal = async (item) => {
  viewItemId.value = item.id
  viewModalOpen.value = true
  viewLoading.value = true
  viewData.value = {}
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/pakets/${item.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных пакета')
    }

    viewData.value = await response.json()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных пакета'
    console.error('Error fetching package:', err)
  } finally {
    viewLoading.value = false
  }
}

const closeViewModal = () => {
  viewModalOpen.value = false
  viewData.value = {}
  viewItemId.value = null
}

const openEditModalFromView = () => {
  closeViewModal()
  if (viewItemId.value) {
    const item = allItems.value.find(i => i.id === viewItemId.value)
    if (item) {
      openEditModal(item)
    }
  }
}

const openEditModal = async (item) => {
  editingId.value = item.id
  formModalTitle.value = 'Изменить пакет'
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/pakets/${item.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных пакета')
    }

    const data = await response.json()
    formData.value = {
      name: data.name || '',
      price: parseFloat(data.price) || 0,
      referral_bonus: parseFloat(data.referral_bonus) || 0,
      binary_bonus_percentage: parseFloat(data.binary_bonus_percentage) || 0,
      color: data.color || ''
    }
    parseGradientColors(data.color)
    formModalOpen.value = true
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных пакета'
    console.error('Error fetching package:', err)
  }
}

const closeFormModal = () => {
  formModalOpen.value = false
  formData.value = {
    name: '',
    price: 0,
    referral_bonus: 0,
    binary_bonus_percentage: 0,
    color: ''
  }
  editingId.value = null
}

const handleSave = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const payload = {
      name: formData.value.name,
      price: formData.value.price,
      referral_bonus: formData.value.referral_bonus,
      binary_bonus_percentage: formData.value.binary_bonus_percentage,
      color: formData.value.color
    }

    const url = editingId.value 
      ? `${BACKEND_API_URL}/api/admin/pakets/${editingId.value}`
      : `${BACKEND_API_URL}/api/admin/pakets/`
    
    const method = editingId.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите снова.')
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Ошибка сохранения: ${response.status}`)
    }

    closeFormModal()
    await fetchPackages()
  } catch (err) {
    error.value = err.message || 'Ошибка при сохранении пакета'
    console.error('Error saving package:', err)
  }
}

const openDeleteModal = (item) => {
  deleteItemId.value = item.id
  deleteItemName.value = item.name || `ID: ${item.id}`
  deleteModalOpen.value = true
}

const handleDelete = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/pakets/${deleteItemId.value}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите снова.')
      }
      throw new Error(`Ошибка удаления: ${response.status}`)
    }

    deleteModalOpen.value = false
    await fetchPackages()
  } catch (err) {
    error.value = err.message || 'Ошибка при удалении пакета'
    console.error('Error deleting package:', err)
  }
}

onMounted(() => {
  fetchPackages()
})
</script>

<style scoped>
.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.form-control-plaintext {
  padding: 0.375rem 0;
  margin-bottom: 0;
  line-height: 1.5;
  color: #212529;
  background-color: transparent;
  border: solid transparent;
  border-width: 1px 0;
  min-height: 1.5em;
}

.form-label {
  margin-bottom: 0.5rem;
  color: #495057;
}

.color-preview {
  width: 40px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  display: inline-block;
}

.color-preview-large {
  width: 100px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  display: inline-block;
}

.gradient-preview {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.gradient-preview-text {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  color: #212529;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
