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
              <label class="form-label small mb-1">Год</label>
              <select class="form-select form-select-sm" v-model="filters.year" @change="applyFilters">
                <option :value="null">Все годы</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </li>
            <li class="mb-3">
              <label class="form-label small mb-1">Месяц</label>
              <select class="form-select form-select-sm" v-model="filters.month" @change="applyFilters">
                <option :value="null">Все месяцы</option>
                <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
              </select>
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
          @change="applyFilters"
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
          <template #cell-cabinet="{ item }">
            <div>
              <div class="fw-bold">
                {{ item.cabinet.personal_number }}
                <span class="text-muted fw-normal" v-if="item.cabinet.sequence_number">
                  (№{{ item.cabinet.sequence_number }})
                </span>
              </div>
              <div class="small text-muted">{{ formatFullName(item.cabinet.participant) }}</div>
            </div>
          </template>
          <template #cell-binary_amount="{ value }">
            {{ formatCurrency(value) }}
          </template>
          <template #cell-cheque_amount="{ value }">
            {{ formatCurrency(value) }}
          </template>
          <template #cell-total_amount="{ value }">
            <span class="fw-bold">{{ formatCurrency(value) }}</span>
          </template>
          <template #cell-issued_amount="{ value }">
            <span class="text-success">{{ formatCurrency(value) }}</span>
          </template>
          <template #cell-pending_amount="{ value }">
            <span class="text-warning">{{ formatCurrency(value) }}</span>
          </template>
          <template #cell-actions="{ item }">
            <button 
              v-if="parseFloat(item.pending_amount) > 0"
              class="btn btn-sm btn-success" 
              @click="issueBonus(item)"
            >
              Выдать
            </button>
          </template>
        </DataTable>
      </div>

      <!-- Pagination -->
      <div class="flex-shrink-0 mt-3">
        <nav v-if="totalPages > 1" aria-label="Page navigation" class="d-flex justify-content-center">
          <ul class="pagination mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="changePage(currentPage - 1)" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
              </button>
            </li>
            
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

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="changePage(currentPage + 1)" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DataTable from '../../components/DataTable.vue'
import { BACKEND_API_URL } from '../../config'

const items = ref([])
const allItems = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')

const filters = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
})

const columns = [
  { key: 'cabinet', label: 'Кабинет' },
  { key: 'binary_amount', label: 'Бинар' },
  { key: 'cheque_amount', label: 'Чековый' },
  { key: 'total_amount', label: 'Всего' },
  { key: 'issued_amount', label: 'Выдано' },
  { key: 'pending_amount', label: 'Ожидает' },
  { key: 'actions', label: '' }
]

const actions = []

const formatFullName = (participant) => {
  if (!participant) return '-'
  return `${participant.lastname || ''} ${participant.name || ''} ${participant.patronymic || ''}`.trim()
}

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0'
  return parseFloat(value).toFixed(2).replace('.', ',')
}

const formatDateISO = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const fetchBonuses = async (page = 1) => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    let url = `${BACKEND_API_URL}/api/admin/bonuses/summary/binary-cheque?page=${page}&page_size=${pageSize.value}`
    
    if (filters.value.year) {
      let dateFrom, dateTo
      
      if (filters.value.month) {
        // Specific month
        dateFrom = new Date(filters.value.year, filters.value.month - 1, 1)
        dateTo = new Date(filters.value.year, filters.value.month, 1)
      } else {
        // Whole year
        dateFrom = new Date(filters.value.year, 0, 1)
        dateTo = new Date(filters.value.year + 1, 0, 1)
      }
      
      url += `&date_from=${formatDateISO(dateFrom)}&date_to=${formatDateISO(dateTo)}`
    }

    if (searchQuery.value.trim().length >= 4) {
      url += `&search=${searchQuery.value.trim()}`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch bonuses')
    }

    const data = await response.json()
    items.value = data.items || []
    totalPages.value = data.total_pages || 1
    currentPage.value = data.page || 1
  } catch (e) {
    console.error('Error fetching bonuses:', e)
    error.value = 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const issueBonus = async (item) => {
  if (!confirm(`Выдать бонус для кабинета ${item.cabinet.personal_number}?`)) return

  try {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/bonuses/issue/binary-cheque`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cabinet_id: item.cabinet.id,
        amount: item.pending_amount
      })
    })

    if (!response.ok) {
      throw new Error('Failed to issue bonus')
    }

    // Refresh data
    fetchBonuses(currentPage.value)
    alert('Бонус успешно выдан')
  } catch (e) {
    console.error('Error issuing bonus:', e)
    alert('Ошибка при выдаче бонуса (API endpoint might be missing)')
  }
}

const hasActiveFilters = computed(() => {
  return filters.value.year !== null || filters.value.month !== null
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.year !== null) count++
  if (filters.value.month !== null) count++
  return count
})

const clearFilters = () => {
  const now = new Date()
  filters.value.year = now.getFullYear()
  filters.value.month = now.getMonth() + 1
  applyFilters()
}

const applyFilters = () => {
  fetchBonuses(1)
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchBonuses(page)
  }
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

let searchTimeout = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim().length >= 4 || searchQuery.value.trim().length === 0) {
      currentPage.value = 1
      fetchBonuses(1)
    }
  }, 500)
})

onMounted(() => {
  fetchBonuses()
})
</script>
