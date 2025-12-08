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
          v-if="!isReordering"
          class="btn btn-outline-primary d-flex align-items-center gap-2"
          style="font-size: 14px;"
          @click="toggleReorderMode"
        >
          <i class="bi bi-arrow-down-up"></i>
          Изменить порядок
        </button>

        <button 
          v-if="!isReordering"
          class="btn btn-primary d-flex align-items-center gap-2"
          style="font-size: 14px; background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
          @click="openAddModal"
        >
          <i class="bi bi-plus-circle"></i>
          Добавить статус
        </button>

        <div v-else class="d-flex gap-2">
          <button 
            class="btn btn-secondary d-flex align-items-center gap-2"
            style="font-size: 14px;"
            @click="toggleReorderMode"
          >
            Отмена
          </button>
          <button 
            class="btn btn-success d-flex align-items-center gap-2"
            style="font-size: 14px;"
            @click="saveOrder"
          >
            <i class="bi bi-check-lg"></i>
            Сохранить порядок
          </button>
        </div>
        
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
      <!-- Reordering List -->
      <div v-if="isReordering" class="flex-grow-1 overflow-auto p-4">
        <div class="alert alert-info mb-3">
          <i class="bi bi-info-circle me-2"></i>
          Перетаскивайте элементы, чтобы изменить их порядок (ранг). Нажмите "Сохранить порядок", чтобы применить изменения.
        </div>
        <div class="list-group" style="max-width: 800px; margin: 0 auto;">
          <div 
            v-for="(item, index) in reorderItems" 
            :key="item.id"
            class="list-group-item d-flex justify-content-between align-items-center p-3 mb-2 border rounded shadow-sm"
            draggable="true"
            @dragstart="dragStart(index, $event)"
            @dragover.prevent
            @drop="onDrop(index)"
            style="cursor: move; transition: all 0.2s;"
            :class="{ 'bg-light': draggingIndex === index }"
          >
            <div class="d-flex align-items-center">
              <i class="bi bi-grip-vertical me-3 text-muted fs-4"></i>
              <div>
                <div class="fw-bold">{{ item.name }}</div>
                <div class="small text-muted">
                  Оборот: {{ formatNumber(item.required_turnover) }} | 
                  Бонус: {{ item.bonus_percentage }}%
                </div>
              </div>
            </div>
            <div class="d-flex align-items-center gap-3">
              <span class="badge bg-primary rounded-pill">Ранг: {{ index + 1 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Normal Table View -->
      <div v-else class="d-flex flex-column h-100">
        <div class="flex-grow-1 overflow-auto">
          <DataTable
            :columns="columns"
            :items="filteredItems"
            :actions="actions"
            class="h-100"
          />
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
        <form @submit.prevent="handleSave" class="status-form">
          <!-- Mode Switcher -->
          <div class="segmented-control mb-4">
            <input 
              type="radio" 
              id="mode-basic" 
              value="basic" 
              v-model="formMode"
              class="segmented-control-input"
            />
            <label for="mode-basic" class="segmented-control-label">
              Основное
            </label>
            
            <input 
              type="radio" 
              id="mode-depth" 
              value="depth" 
              v-model="formMode"
              class="segmented-control-input"
            />
            <label for="mode-depth" class="segmented-control-label">
              Глубина
            </label>
            
            <input 
              type="radio" 
              id="mode-requirements" 
              value="requirements" 
              v-model="formMode"
              class="segmented-control-input"
            />
            <label for="mode-requirements" class="segmented-control-label">
              Требования
            </label>
          </div>

          <!-- Mode 1: Basic Info -->
          <div v-show="formMode === 'basic'">
            <div class="mb-3">
              <label for="name" class="form-label">Название <span class="text-danger">*</span></label>
              <input 
                type="text" 
                class="form-control" 
                id="name" 
                v-model="formData.name"
                placeholder="Например: Новичок"
                required
              />
            </div>
            
            <div class="mb-3">
              <label for="required_turnover" class="form-label">Требуемый оборот</label>
              <input 
                type="number" 
                class="form-control" 
                id="required_turnover" 
                v-model.number="formData.required_turnover"
                placeholder="0"
                step="1"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <label for="bonus_percentage" class="form-label">Процент бонуса</label>
              <input 
                type="number" 
                class="form-control" 
                id="bonus_percentage" 
                v-model.number="formData.bonus_percentage"
                placeholder="0"
                step="1"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <label for="sponsor_bonus" class="form-label">Спонсорский бонус</label>
              <input 
                type="number" 
                class="form-control" 
                id="sponsor_bonus" 
                v-model.number="formData.sponsor_bonus"
                placeholder="0"
                step="1"
                min="0"
              />
            </div>
          </div>

          <!-- Mode 2: Depth -->
          <div v-show="formMode === 'depth'">
            <h6 class="mb-3">Глубина (Depth)</h6>
            
            <div class="mb-3">
              <label for="depth_1" class="form-label">Глубина 1</label>
              <input 
                type="number" 
                class="form-control" 
                id="depth_1" 
                v-model.number="formData.depth_1"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <label for="depth_2" class="form-label">Глубина 2</label>
              <input 
                type="number" 
                class="form-control" 
                id="depth_2" 
                v-model.number="formData.depth_2"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <label for="depth_3" class="form-label">Глубина 3</label>
              <input 
                type="number" 
                class="form-control" 
                id="depth_3" 
                v-model.number="formData.depth_3"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <label for="depth_4" class="form-label">Глубина 4</label>
              <input 
                type="number" 
                class="form-control" 
                id="depth_4" 
                v-model.number="formData.depth_4"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <label for="depth_5" class="form-label">Глубина 5</label>
              <input 
                type="number" 
                class="form-control" 
                id="depth_5" 
                v-model.number="formData.depth_5"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <label for="depth_6" class="form-label">Глубина 6</label>
              <input 
                type="number" 
                class="form-control" 
                id="depth_6" 
                v-model.number="formData.depth_6"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <!-- Mode 3: Requirements -->
          <div v-show="formMode === 'requirements'">
            <h6 class="mb-3">Требования по личным приглашениям</h6>
            
            <div class="mb-3">
              <label for="required_personal_status_id" class="form-label">Требуемый личный статус</label>
              <select 
                class="form-select" 
                id="required_personal_status_id" 
                v-model.number="formData.required_personal_status_id"
              >
                <option :value="null">Не требуется</option>
                <option 
                  v-for="status in availableStatuses" 
                  :key="status.id" 
                  :value="status.id"
                >
                  {{ status.name }}
                </option>
              </select>
            </div>
            
            <div class="mb-3">
              <label for="required_personal_count_left" class="form-label">Количество слева</label>
              <input 
                type="number" 
                class="form-control" 
                id="required_personal_count_left" 
                v-model.number="formData.required_personal_count_left"
                placeholder="0"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <label for="required_personal_count_right" class="form-label">Количество справа</label>
              <input 
                type="number" 
                class="form-control" 
                id="required_personal_count_right" 
                v-model.number="formData.required_personal_count_right"
                placeholder="0"
                min="0"
              />
            </div>
            
            <div class="mb-3">
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="require_in_either_branch"
                  v-model="formData.require_in_either_branch"
                />
                <label class="form-check-label" for="require_in_either_branch">
                  Требовать в любой ветке
                </label>
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
            <h5 class="modal-title">Просмотр статуса</h5>
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
                  <label class="form-label fw-semibold">Требуемый оборот</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.required_turnover) }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Процент бонуса</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.bonus_percentage) }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Спонсорский бонус</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.sponsor_bonus) }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">ID требуемого личного статуса</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.required_personal_status_id) }}</div>
                </div>
              </div>

              <hr class="my-3" />

              <h6 class="mb-3">Глубина (Depth)</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Depth 1</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.depth_1) }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Depth 2</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.depth_2) }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Depth 3</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.depth_3) }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Depth 4</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.depth_4) }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Depth 5</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.depth_5) }}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Depth 6</label>
                  <div class="form-control-plaintext">{{ formatNumber(viewData.depth_6) }}</div>
                </div>
              </div>

              <hr class="my-3" />

              <h6 class="mb-3">Требования по личным приглашениям</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Количество слева</label>
                  <div class="form-control-plaintext">{{ viewData.required_personal_count_left ?? 0 }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Количество справа</label>
                  <div class="form-control-plaintext">{{ viewData.required_personal_count_right ?? 0 }}</div>
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold">Требовать в любой ветке</label>
                  <div class="form-control-plaintext">
                    <span :class="viewData.require_in_either_branch ? 'text-success' : 'text-muted'">
                      {{ viewData.require_in_either_branch ? 'Да' : 'Нет' }}
                    </span>
                  </div>
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
      title="Удаление статуса"
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
const formModalTitle = ref('Добавить статус')
const formData = ref({
  name: '',
  required_turnover: null,
  bonus_percentage: null,
  sponsor_bonus: null,
  depth_1: null,
  depth_2: null,
  depth_3: null,
  depth_4: null,
  depth_5: null,
  depth_6: null,
  required_personal_status_id: null,
  required_personal_count_left: 0,
  required_personal_count_right: 0,
  require_in_either_branch: false
})
const editingId = ref(null)

// Form mode for switcher
const formMode = ref('basic')

// Available statuses for selector (excluding current status when editing)
const availableStatuses = computed(() => {
  if (!editingId.value) {
    return allItems.value
  }
  return allItems.value.filter(status => status.id !== editingId.value)
})

const deleteModalOpen = ref(false)
const deleteItemId = ref(null)
const deleteItemName = ref('')

const viewModalOpen = ref(false)
const viewLoading = ref(false)
const viewData = ref({})
const viewItemId = ref(null)

const deleteConfirmMessage = computed(() => {
  return `Вы уверены, что хотите удалить статус "${deleteItemName.value}"? Это действие нельзя отменить.`
})

// Reordering logic
const isReordering = ref(false)
const reorderItems = ref([])
const draggingIndex = ref(null)

const toggleReorderMode = () => {
  if (isReordering.value) {
    // Cancel reordering
    isReordering.value = false
    reorderItems.value = []
  } else {
    // Start reordering
    // Sort allItems by rank if available, otherwise keep current order
    reorderItems.value = [...allItems.value].sort((a, b) => (a.rank || 0) - (b.rank || 0))
    isReordering.value = true
  }
}

const dragStart = (index, event) => {
  draggingIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.dropEffect = 'move'
  event.dataTransfer.setData('text/plain', index)
}

const onDrop = (toIndex) => {
  if (draggingIndex.value === null) return
  const fromIndex = draggingIndex.value
  const item = reorderItems.value[fromIndex]
  reorderItems.value.splice(fromIndex, 1)
  reorderItems.value.splice(toIndex, 0, item)
  draggingIndex.value = null
}

const saveOrder = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    
    // Create update promises
    // Assuming we need to update each status with its new rank
    // Rank will be index + 1
    const updates = reorderItems.value.map((item, index) => {
      const newRank = index + 1
      if (item.rank === newRank) return Promise.resolve() // No change
      
      return fetch(`${BACKEND_API_URL}/api/admin/statuses/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rank: newRank })
      })
    })

    await Promise.all(updates)
    
    await fetchStatuses()
    isReordering.value = false
  } catch (err) {
    console.error('Error saving order:', err)
    error.value = 'Ошибка при сохранении порядка'
  } finally {
    loading.value = false
  }
}

const columns = [
  { key: 'rank', label: 'Ранг' },
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Название' },
  { key: 'required_turnover', label: 'Требуемый оборот' },
  { key: 'bonus_percentage', label: 'Процент бонуса' },
  { key: 'sponsor_bonus', label: 'Спонсорский бонус' }
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

const formatNumber = (value) => {
  if (value === null || value === undefined) return '-'
  return value
}

const fetchStatuses = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/statuses/`, {
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
    error.value = err.message || 'Ошибка при загрузке статусов'
    console.error('Error fetching statuses:', err)
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
      (item.required_turnover && item.required_turnover.toString().includes(query)) ||
      (item.bonus_percentage && item.bonus_percentage.toString().includes(query))
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
    name: '',
    required_turnover: null,
    bonus_percentage: null,
    sponsor_bonus: null,
    depth_1: null,
    depth_2: null,
    depth_3: null,
    depth_4: null,
    depth_5: null,
    depth_6: null,
    required_personal_status_id: null,
    required_personal_count_left: 0,
    required_personal_count_right: 0,
    require_in_either_branch: false
  }
  editingId.value = null
  formMode.value = 'basic'
  formModalTitle.value = 'Добавить статус'
  formModalOpen.value = true
}

const openViewModal = async (item) => {
  viewItemId.value = item.id
  viewModalOpen.value = true
  viewLoading.value = true
  viewData.value = {}
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/statuses/${item.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных статуса')
    }

    viewData.value = await response.json()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных статуса'
    console.error('Error fetching status:', err)
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
  formModalTitle.value = 'Изменить статус'
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/statuses/${item.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных статуса')
    }

    const data = await response.json()
    formData.value = {
      name: data.name || '',
      required_turnover: data.required_turnover ?? null,
      bonus_percentage: data.bonus_percentage ?? null,
      sponsor_bonus: data.sponsor_bonus ?? null,
      depth_1: data.depth_1 ?? null,
      depth_2: data.depth_2 ?? null,
      depth_3: data.depth_3 ?? null,
      depth_4: data.depth_4 ?? null,
      depth_5: data.depth_5 ?? null,
      depth_6: data.depth_6 ?? null,
      required_personal_status_id: data.required_personal_status_id ?? null,
      required_personal_count_left: data.required_personal_count_left ?? 0,
      required_personal_count_right: data.required_personal_count_right ?? 0,
      require_in_either_branch: data.require_in_either_branch ?? false
    }
    formMode.value = 'basic'
    formModalOpen.value = true
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных статуса'
    console.error('Error fetching status:', err)
  }
}

const closeFormModal = () => {
  formModalOpen.value = false
  formData.value = {
    name: '',
    required_turnover: null,
    bonus_percentage: null,
    sponsor_bonus: null,
    depth_1: null,
    depth_2: null,
    depth_3: null,
    depth_4: null,
    depth_5: null,
    depth_6: null,
    required_personal_status_id: null,
    required_personal_count_left: 0,
    required_personal_count_right: 0,
    require_in_either_branch: false
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
      required_turnover: formData.value.required_turnover !== null ? Math.round(formData.value.required_turnover) : null,
      bonus_percentage: formData.value.bonus_percentage !== null ? Math.round(formData.value.bonus_percentage) : null,
      sponsor_bonus: formData.value.sponsor_bonus !== null ? Math.round(formData.value.sponsor_bonus) : null,
      depth_1: formData.value.depth_1 ?? null,
      depth_2: formData.value.depth_2 ?? null,
      depth_3: formData.value.depth_3 ?? null,
      depth_4: formData.value.depth_4 ?? null,
      depth_5: formData.value.depth_5 ?? null,
      depth_6: formData.value.depth_6 ?? null,
      required_personal_status_id: formData.value.required_personal_status_id ?? null,
      required_personal_count_left: formData.value.required_personal_count_left ?? 0,
      required_personal_count_right: formData.value.required_personal_count_right ?? 0,
      require_in_either_branch: formData.value.require_in_either_branch ?? false
    }

    const url = editingId.value 
      ? `${BACKEND_API_URL}/api/admin/statuses/${editingId.value}`
      : `${BACKEND_API_URL}/api/admin/statuses/`
    
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
    await fetchStatuses()
  } catch (err) {
    error.value = err.message || 'Ошибка при сохранении статуса'
    console.error('Error saving status:', err)
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

    const response = await fetch(`${BACKEND_API_URL}/api/admin/statuses/${deleteItemId.value}`, {
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
    await fetchStatuses()
  } catch (err) {
    error.value = err.message || 'Ошибка при удалении статуса'
    console.error('Error deleting status:', err)
  }
}

onMounted(() => {
  fetchStatuses()
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

.status-form {
  max-height: 70vh;
  overflow-y: auto;
}

/* Segmented Control */
.segmented-control {
  display: inline-flex;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
  width: 100%;
}

.segmented-control-input {
  display: none;
}

.segmented-control-label {
  flex: 1;
  padding: 8px 16px;
  text-align: center;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  user-select: none;
}

.segmented-control-input:checked + .segmented-control-label {
  background-color: white;
  color: #000080;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.segmented-control-label:hover {
  color: #495057;
}
</style>
