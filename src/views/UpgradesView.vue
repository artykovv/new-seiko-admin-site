<template>
  <div class="d-flex flex-column h-100">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
      <div class="position-relative" style="flex: 1; max-width: 400px;">
        <i class="bi bi-search position-absolute" style="left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; z-index: 10;"></i>
        <input 
          type="text" 
          v-model="searchQuery"
          @input="handleSearch"
          class="form-control ps-5"
          placeholder="Поиск по ФИО или номеру..."
          style="font-size: 14px;"
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
            <span v-if="hasActiveFilters" class="badge bg-primary rounded-pill" style="font-size: 0.7rem;">
              {{ activeFiltersCount }}
            </span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end p-3" style="min-width: 250px;">
            <li class="mb-3">
              <label class="form-label small mb-2">Статус</label>
              <div class="d-flex flex-column gap-2">
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    name="issuedFilter" 
                    id="issuedAll"
                    :value="null"
                    v-model="issuedFilter"
                    @change="applyFilters"
                  >
                  <label class="form-check-label" for="issuedAll">
                    Все
                  </label>
                </div>
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    name="issuedFilter" 
                    id="issuedTrue"
                    :value="true"
                    v-model="issuedFilter"
                    @change="applyFilters"
                  >
                  <label class="form-check-label" for="issuedTrue">
                    Выдано
                  </label>
                </div>
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    name="issuedFilter" 
                    id="issuedFalse"
                    :value="false"
                    v-model="issuedFilter"
                    @change="applyFilters"
                  >
                  <label class="form-check-label" for="issuedFalse">
                    Не выдано
                  </label>
                </div>
              </div>
            </li>
            <li>
              <button 
                v-if="hasActiveFilters" 
                class="btn btn-sm btn-outline-danger w-100" 
                @click="clearFilters"
              >
                Сбросить фильтры
              </button>
            </li>
          </ul>
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
      <div class="flex-grow-1 overflow-auto">
        <DataTable
          :columns="columns"
          :items="items"
          :actions="actions"
          class="h-100"
        >
          <template #cell-issued="{ item }">
            <span 
              class="badge"
              :class="item.issued ? 'bg-success' : 'bg-danger'"
            >
              {{ item.issued ? 'Выдано' : 'Не выдано' }}
            </span>
          </template>
          <template #cell-paket_upgrade="{ item }">
            <div class="d-flex align-items-center gap-2">
              <span 
                class="badge" 
                :style="{ 
                  background: getPaketGradient(item.old_paket.color),
                  color: 'white',
                  fontSize: '0.75rem'
                }"
              >
                {{ item.old_paket.name }}
              </span>
              <i class="bi bi-arrow-right text-muted"></i>
              <span 
                class="badge" 
                :style="{ 
                  background: getPaketGradient(item.new_paket.color),
                  color: 'white',
                  fontSize: '0.75rem'
                }"
              >
                {{ item.new_paket.name }}
              </span>
            </div>
          </template>
        </DataTable>
      </div>

      <!-- Pagination -->
      <div class="flex-shrink-0 mt-3 d-flex justify-content-between align-items-center">
        <div class="text-muted small">
          Всего записей: {{ totalUpgrades }}
        </div>
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

    <!-- Confirmation Modal -->
    <div 
      class="modal fade" 
      :class="{ show: confirmModalOpen, 'd-block': confirmModalOpen }" 
      :style="{ display: confirmModalOpen ? 'block' : 'none' }"
      tabindex="-1"
      role="dialog"
      @click.self="closeConfirmModal"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Подтверждение выдачи</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="closeConfirmModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedUpgrade">
              <p class="mb-3">Вы уверены, что хотите подтвердить выдачу апгрейда?</p>
              <div class="upgrade-details">
                <div class="detail-row">
                  <span class="detail-label">ID:</span>
                  <span class="detail-value">{{ selectedUpgrade.id }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Заказ ID:</span>
                  <span class="detail-value">{{ selectedUpgrade.order_id }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ФИО:</span>
                  <span class="detail-value">{{ selectedUpgrade.full_name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Личный номер:</span>
                  <span class="detail-value">{{ selectedUpgrade.personal_number }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Апгрейд:</span>
                  <span class="detail-value">
                    {{ selectedUpgrade.old_paket.name }} → {{ selectedUpgrade.new_paket.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeConfirmModal"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-success" 
              @click="confirmIssue"
              :disabled="confirming"
            >
              <span v-if="confirming" class="spinner-border spinner-border-sm me-2" role="status"></span>
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="confirmModalOpen" 
      class="modal-backdrop fade show"
      @click="closeConfirmModal"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DataTable from '../components/DataTable.vue'
import { BACKEND_API_URL } from '../config'

const items = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalUpgrades = ref(0)
const pageSize = ref(20)
const searchQuery = ref('')
const issuedFilter = ref(null)

// Confirmation modal
const confirmModalOpen = ref(false)
const selectedUpgrade = ref(null)
const confirming = ref(false)

let searchTimeout = null

const columns = [
  { key: 'id', label: '#' },
  { key: 'order_id', label: 'Заказ ID' },
  { key: 'personal_number', label: 'Личный номер' },
  { key: 'full_name', label: 'ФИО' },
  { key: 'paket_upgrade', label: 'Апгрейд пакета' },
  { key: 'issued', label: 'Статус' },
  { key: 'created_at', label: 'Дата создания' },
  { key: 'issued_at', label: 'Дата выдачи' }
]

const actions = [
  { 
    label: 'Подтвердить', 
    handler: (item) => handleConfirmIssue(item), 
    icon: 'bi-check-circle',
    class: 'text-success',
    condition: (item) => !item.issued
  },
  { label: 'Просмотр', handler: (item) => handleViewUpgrade(item), icon: 'bi-eye' }
]

const hasActiveFilters = computed(() => {
  return issuedFilter.value !== null
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (issuedFilter.value !== null) count++
  return count
})

const getPaketGradient = (colorString) => {
  if (!colorString) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  
  const colors = colorString.split(',').map(c => c.trim())
  if (colors.length === 2) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
  }
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 100%)`
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchUpgrades()
  }, 500)
}

const applyFilters = () => {
  currentPage.value = 1
  fetchUpgrades()
}

const clearFilters = () => {
  issuedFilter.value = null
  currentPage.value = 1
  fetchUpgrades()
}

const fetchUpgrades = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      error.value = 'Токен авторизации не найден'
      return
    }

    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      page_size: pageSize.value.toString()
    })

    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }

    if (issuedFilter.value !== null) {
      params.append('issued', issuedFilter.value.toString())
    }

    const response = await fetch(
      `${BACKEND_API_URL}/api/admin/upgrades/?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      items.value = data.upgrades.map(upgrade => ({
        ...upgrade,
        created_at: formatDateTime(upgrade.created_at),
        issued_at: upgrade.issued_at ? formatDateTime(upgrade.issued_at) : '-'
      }))
      totalUpgrades.value = data.total_upgrades
      totalPages.value = data.total_pages
      currentPage.value = data.page
    } else {
      const errorData = await response.json()
      error.value = errorData.detail || 'Ошибка при загрузке данных'
    }
  } catch (err) {
    console.error('Error fetching upgrades:', err)
    error.value = 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchUpgrades()
  }
}

const changePageSize = () => {
  currentPage.value = 1
  fetchUpgrades()
}

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

const handleConfirmIssue = (upgrade) => {
  selectedUpgrade.value = upgrade
  confirmModalOpen.value = true
}

const closeConfirmModal = () => {
  if (!confirming.value) {
    confirmModalOpen.value = false
    selectedUpgrade.value = null
  }
}

const confirmIssue = async () => {
  if (!selectedUpgrade.value) return
  
  confirming.value = true
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(
      `${BACKEND_API_URL}/api/admin/upgrades/confirm`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          upgrade_id: selectedUpgrade.value.id
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      // Refresh the list
      await fetchUpgrades()
      closeConfirmModal()
      
      // Optional: Show success message
      if (data.message) {
        console.log(data.message)
      }
    } else {
      const errorData = await response.json()
      error.value = errorData.detail || 'Ошибка при подтверждении выдачи'
    }
  } catch (err) {
    console.error('Error confirming issue:', err)
    error.value = 'Ошибка при подтверждении выдачи'
  } finally {
    confirming.value = false
  }
}

const handleViewUpgrade = (upgrade) => {
  console.log('View upgrade:', upgrade)
  // TODO: Implement view upgrade modal
}

onMounted(() => {
  fetchUpgrades()
})

// Watch for changes in filters
watch([issuedFilter], () => {
  if (currentPage.value === 1) {
    fetchUpgrades()
  }
})
</script>

<style scoped>
.page-size-select {
  width: auto;
  min-width: 80px;
}

.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-issued {
  background-color: #28a745;
}

.status-not-issued {
  background-color: #dc3545;
}

.form-check-input:checked {
  background-color: rgb(0, 0, 128);
  border-color: rgb(0, 0, 128);
}

.upgrade-details {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #6c757d;
}

.detail-value {
  color: #212529;
  font-weight: 500;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
