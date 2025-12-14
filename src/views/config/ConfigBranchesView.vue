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
          Добавить филиал
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
          <template #cell-is_active="{ item }">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                role="switch" 
                :id="`switch-${item.id}`"
                :checked="item.is_active"
                @change="toggleActive(item)"
                style="cursor: pointer;"
              >
            </div>
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
            <label for="code" class="form-label">Код <span class="text-muted">(необязательно)</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="code" 
              v-model="formData.code"
              placeholder="Например: S01"
            />
          </div>
          <div class="mb-3">
            <label for="name" class="form-label">Название <span class="text-muted">(необязательно)</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="name" 
              v-model="formData.name"
              placeholder="Например: Бишкек"
            />
          </div>
          <div class="mb-3">
            <label for="address" class="form-label">Адрес <span class="text-muted">(необязательно)</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="address" 
              v-model="formData.address"
              placeholder="Введите адрес"
            />
          </div>
          <div class="mb-3">
            <label for="phone_number" class="form-label">Номер телефона <span class="text-muted">(необязательно)</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="phone_number" 
              v-model="formData.phone_number"
              placeholder="Введите номер телефона"
            />
          </div>
          <div class="mb-3">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="is_active"
                v-model="formData.is_active"
              >
              <label class="form-check-label" for="is_active">
                Активен
              </label>
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
            <h5 class="modal-title">Просмотр филиала</h5>
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
                  <label class="form-label fw-semibold">Код</label>
                  <div class="form-control-plaintext">{{ viewData.code || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Название</label>
                  <div class="form-control-plaintext">{{ viewData.name || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Телефон</label>
                  <div class="form-control-plaintext">{{ viewData.phone_number || '-' }}</div>
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold">Адрес</label>
                  <div class="form-control-plaintext">{{ viewData.address || '-' }}</div>
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
      title="Удаление филиала"
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
const formModalTitle = ref('Добавить филиал')
const formData = ref({
  code: '',
  name: '',
  address: '',
  phone_number: '',
  is_active: true
})
const editingId = ref(null)

const deleteModalOpen = ref(false)
const deleteItemId = ref(null)
const deleteItemName = ref('')

const viewModalOpen = ref(false)
const viewLoading = ref(false)
const viewData = ref({})
const viewItemId = ref(null)

const deleteConfirmMessage = computed(() => {
  return `Вы уверены, что хотите удалить филиал "${deleteItemName.value}"? Это действие нельзя отменить.`
})

const columns = [
  { key: 'code', label: 'Код' },
  { key: 'name', label: 'Название' },
  { key: 'address', label: 'Адрес' },
  { key: 'phone_number', label: 'Телефон' },
  { key: 'is_active', label: 'Активен' }
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

const fetchBranches = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/branches/`, {
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
    error.value = err.message || 'Ошибка при загрузке филиалов'
    console.error('Error fetching branches:', err)
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
      (item.code && item.code.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.address && item.address.toLowerCase().includes(query)) ||
      (item.phone_number && item.phone_number.toLowerCase().includes(query))
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

const openAddModal = () => {
  formData.value = {
    code: '',
    name: '',
    address: '',
    phone_number: '',
    is_active: true
  }
  editingId.value = null
  formModalTitle.value = 'Добавить филиал'
  formModalOpen.value = true
}

const openViewModal = async (item) => {
  viewItemId.value = item.id
  viewModalOpen.value = true
  viewLoading.value = true
  viewData.value = {}
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/branches/${item.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных филиала')
    }

    viewData.value = await response.json()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных филиала'
    console.error('Error fetching branch:', err)
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
  formModalTitle.value = 'Изменить филиал'
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/branches/${item.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных филиала')
    }

    const data = await response.json()
    formData.value = {
      code: data.code || '',
      name: data.name || '',
      address: data.address || '',
      phone_number: data.phone_number || '',
      is_active: data.is_active !== undefined ? data.is_active : true
    }
    formModalOpen.value = true
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных филиала'
    console.error('Error fetching branch:', err)
  }
}

const closeFormModal = () => {
  formModalOpen.value = false
  formData.value = {
    code: '',
    name: '',
    address: '',
    phone_number: '',
    is_active: true
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
      code: formData.value.code || null,
      name: formData.value.name || null,
      address: formData.value.address || null,
      phone_number: formData.value.phone_number || null,
      is_active: formData.value.is_active
    }

    const url = editingId.value 
      ? `${BACKEND_API_URL}/api/admin/branches/${editingId.value}`
      : `${BACKEND_API_URL}/api/admin/branches/`
    
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
    await fetchBranches()
  } catch (err) {
    error.value = err.message || 'Ошибка при сохранении филиала'
    console.error('Error saving branch:', err)
  }
}

const openDeleteModal = (item) => {
  deleteItemId.value = item.id
  deleteItemName.value = item.name || item.code || `ID: ${item.id}`
  deleteModalOpen.value = true
}

const handleDelete = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/branches/${deleteItemId.value}`, {
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
    await fetchBranches()
  } catch (err) {
    error.value = err.message || 'Ошибка при удалении филиала'
    console.error('Error deleting branch:', err)
  }
}

const toggleActive = async (item) => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/branches/${item.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        is_active: !item.is_active
      })
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите снова.')
      }
      throw new Error(`Ошибка обновления статуса: ${response.status}`)
    }

    await fetchBranches()
  } catch (err) {
    error.value = err.message || 'Ошибка при изменении статуса филиала'
    console.error('Error toggling branch status:', err)
  }
}

onMounted(() => {
  fetchBranches()
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
</style>
