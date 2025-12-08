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
          Добавить сотрудника
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
          <template #cell-is_active="{ value }">
            <span 
              class="badge"
              :class="value ? 'bg-success' : 'bg-secondary'"
            >
              {{ value ? 'Активен' : 'Неактивен' }}
            </span>
          </template>
          <template #cell-is_superuser="{ value }">
            <span 
              class="badge"
              :class="value ? 'bg-danger' : 'bg-secondary'"
            >
              {{ value ? 'Да' : 'Нет' }}
            </span>
          </template>
          <template #cell-is_verified="{ value }">
            <span 
              class="badge"
              :class="value ? 'bg-info' : 'bg-warning'"
            >
              {{ value ? 'Подтвержден' : 'Не подтвержден' }}
            </span>
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
        <form @submit.prevent="handleSave" class="employee-form">
          <div class="mb-3">
            <label for="name" class="form-label">Имя</label>
            <input 
              type="text" 
              class="form-control" 
              id="name" 
              v-model="formData.name"
              placeholder="Введите имя"
            />
          </div>
          <div class="mb-3">
            <label for="lastname" class="form-label">Фамилия</label>
            <input 
              type="text" 
              class="form-control" 
              id="lastname" 
              v-model="formData.lastname"
              placeholder="Введите фамилию"
            />
          </div>
          <div class="mb-3">
            <label for="patronymic" class="form-label">Отчество</label>
            <input 
              type="text" 
              class="form-control" 
              id="patronymic" 
              v-model="formData.patronymic"
              placeholder="Введите отчество"
            />
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
            <input 
              type="email" 
              class="form-control" 
              id="email" 
              v-model="formData.email"
              placeholder="user@example.com"
              required
            />
          </div>
          <div class="mb-3">
            <label for="phone_number" class="form-label">Номер телефона</label>
            <input 
              type="text" 
              class="form-control" 
              id="phone_number" 
              v-model="formData.phone_number"
              placeholder="Введите номер телефона"
            />
          </div>
          <div class="mb-3" v-if="editingId">
            <label for="branch" class="form-label">Филиал</label>
            <input 
              type="text" 
              class="form-control" 
              id="branch" 
              v-model="formData.branch"
              placeholder="ID филиала или оставьте пустым"
            />
            <small class="form-text text-muted">Оставьте пустым для null</small>
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">
              {{ editingId ? 'Новый пароль' : 'Пароль' }}
              <span v-if="!editingId" class="text-danger">*</span>
            </label>
            <input 
              type="password" 
              class="form-control" 
              id="password" 
              v-model="formData.password"
              :placeholder="editingId ? 'Оставьте пустым, чтобы не менять' : 'Введите пароль'"
              :required="!editingId"
            />
            <small class="form-text text-muted">
              {{ editingId ? 'Оставьте пустым, чтобы не изменять пароль' : 'Обязательное поле для нового сотрудника' }}
            </small>
          </div>

          <hr class="my-3" />

          <h6 class="mb-3">Настройки доступа</h6>
          <div class="mb-3">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="is_active"
                v-model="formData.is_active"
              />
              <label class="form-check-label" for="is_active">
                Активен
              </label>
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="is_superuser"
                v-model="formData.is_superuser"
              />
              <label class="form-check-label" for="is_superuser">
                Суперпользователь
              </label>
            </div>
          </div>
          <div class="mb-3">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="is_verified"
                v-model="formData.is_verified"
              />
              <label class="form-check-label" for="is_verified">
                Подтвержден
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
            <h5 class="modal-title">Просмотр сотрудника</h5>
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
              <div class="mb-3">
                <label class="form-label fw-semibold">ID</label>
                <div class="form-control-plaintext small">{{ viewData.id || '-' }}</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Email</label>
                <div class="form-control-plaintext">{{ viewData.email || '-' }}</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Имя</label>
                <div class="form-control-plaintext">{{ viewData.name || '-' }}</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Фамилия</label>
                <div class="form-control-plaintext">{{ viewData.lastname || '-' }}</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Отчество</label>
                <div class="form-control-plaintext">{{ viewData.patronymic || '-' }}</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Номер телефона</label>
                <div class="form-control-plaintext">{{ viewData.phone_number || '-' }}</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Филиал</label>
                <div class="form-control-plaintext">{{ viewData.branch || '-' }}</div>
              </div>

              <hr class="my-3" />

              <h6 class="mb-3">Настройки доступа</h6>
              <div class="mb-3">
                <label class="form-label fw-semibold">Активен</label>
                <div class="form-control-plaintext">
                  <span 
                    class="badge"
                    :class="viewData.is_active ? 'bg-success' : 'bg-secondary'"
                  >
                    {{ viewData.is_active ? 'Да' : 'Нет' }}
                  </span>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Суперпользователь</label>
                <div class="form-control-plaintext">
                  <span 
                    class="badge"
                    :class="viewData.is_superuser ? 'bg-danger' : 'bg-secondary'"
                  >
                    {{ viewData.is_superuser ? 'Да' : 'Нет' }}
                  </span>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Подтвержден</label>
                <div class="form-control-plaintext">
                  <span 
                    class="badge"
                    :class="viewData.is_verified ? 'bg-info' : 'bg-warning'"
                  >
                    {{ viewData.is_verified ? 'Да' : 'Нет' }}
                  </span>
                </div>
              </div>
              <!-- Дополнительные поля будут добавлены здесь -->
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
      title="Удаление сотрудника"
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
const formModalTitle = ref('Добавить сотрудника')
const formData = ref({
  email: '',
  password: '',
  is_active: false,
  is_superuser: false,
  is_verified: false,
  name: '',
  lastname: '',
  patronymic: '',
  branch: '',
  phone_number: ''
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
  return `Вы уверены, что хотите удалить сотрудника "${deleteItemName.value}"? Это действие нельзя отменить.`
})

const columns = [
  { key: 'email', label: 'Email' },
  { key: 'name', label: 'Имя' },
  { key: 'lastname', label: 'Фамилия' },
  { key: 'phone_number', label: 'Телефон' },
  { key: 'is_active', label: 'Активен' },
  { key: 'is_superuser', label: 'Суперпользователь' },
  { key: 'is_verified', label: 'Подтвержден' }
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

const fetchEmployees = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/employees`, {
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
    error.value = err.message || 'Ошибка при загрузке сотрудников'
    console.error('Error fetching employees:', err)
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
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.lastname && item.lastname.toLowerCase().includes(query)) ||
      (item.patronymic && item.patronymic.toLowerCase().includes(query)) ||
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
    email: '',
    password: '',
    is_active: false,
    is_superuser: false,
    is_verified: false,
    name: '',
    lastname: '',
    patronymic: '',
    branch: '',
    phone_number: ''
  }
  editingId.value = null
  formModalTitle.value = 'Добавить сотрудника'
  formModalOpen.value = true
}

const openViewModal = async (item) => {
  viewItemId.value = item.id
  viewModalOpen.value = true
  viewLoading.value = true
  viewData.value = {}
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/employees/${item.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных сотрудника')
    }

    viewData.value = await response.json()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных сотрудника'
    console.error('Error fetching employee:', err)
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
  formModalTitle.value = 'Изменить сотрудника'
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/employees/${item.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных сотрудника')
    }

    const data = await response.json()
    formData.value = {
      email: data.email || '',
      password: '', // Пароль не загружается, оставляем пустым
      is_active: data.is_active ?? true,
      is_superuser: data.is_superuser ?? false,
      is_verified: data.is_verified ?? true,
      name: data.name || '',
      lastname: data.lastname || '',
      patronymic: data.patronymic || '',
      branch: data.branch || '',
      phone_number: data.phone_number || ''
    }
    formModalOpen.value = true
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных сотрудника'
    console.error('Error fetching employee:', err)
  }
}

const closeFormModal = () => {
  formModalOpen.value = false
  formData.value = {
    email: '',
    password: '',
    is_active: false,
    is_superuser: false,
    is_verified: false,
    name: '',
    lastname: '',
    patronymic: '',
    branch: '',
    phone_number: ''
  }
  editingId.value = null
}

const handleSave = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    if (editingId.value) {
      // Редактирование существующего сотрудника
      const payload = {
        email: formData.value.email,
        is_active: formData.value.is_active,
        is_superuser: formData.value.is_superuser,
        is_verified: formData.value.is_verified,
        name: formData.value.name || null,
        lastname: formData.value.lastname || null,
        patronymic: formData.value.patronymic || null,
        branch: formData.value.branch || null,
        phone_number: formData.value.phone_number || null
      }

      // Добавляем пароль только если он указан
      if (formData.value.password && formData.value.password.trim()) {
        payload.password = formData.value.password
      }

      const response = await fetch(`${BACKEND_API_URL}/api/admin/employees/${editingId.value}`, {
        method: 'PUT',
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
    } else {
      // Создание нового сотрудника
      const payload = {
        email: formData.value.email,
        password: formData.value.password,
        is_active: formData.value.is_active,
        is_superuser: formData.value.is_superuser,
        is_verified: formData.value.is_verified,
        name: formData.value.name || null,
        lastname: formData.value.lastname || null,
        patronymic: formData.value.patronymic || null,
        phone_number: formData.value.phone_number || null
      }

      const response = await fetch(`${BACKEND_API_URL}/api/admin/register`, {
        method: 'POST',
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
        throw new Error(errorData.detail || `Ошибка создания: ${response.status}`)
      }
    }

    closeFormModal()
    await fetchEmployees()
  } catch (err) {
    error.value = err.message || 'Ошибка при сохранении сотрудника'
    console.error('Error saving employee:', err)
  }
}

const openDeleteModal = (item) => {
  deleteItemId.value = item.id
  deleteItemName.value = item.email || item.name || `ID: ${item.id}`
  deleteModalOpen.value = true
}

const handleDelete = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/employees/${deleteItemId.value}`, {
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
    await fetchEmployees()
  } catch (err) {
    error.value = err.message || 'Ошибка при удалении сотрудника'
    console.error('Error deleting employee:', err)
  }
}

onMounted(() => {
  fetchEmployees()
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

.employee-form {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
