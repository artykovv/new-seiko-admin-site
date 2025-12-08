<template>
  <div 
    class="modal fade" 
    :class="{ show: isOpen, 'd-block': isOpen }" 
    :style="{ display: isOpen ? 'block' : 'none' }"
    tabindex="-1"
    role="dialog"
    @click.self="handleClose"
  >
    <div class="modal-dialog modal-dialog-centered modal-xl" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Личники</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="handleClose"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Filters -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="position-relative" style="flex: 1; max-width: 300px;">
              <i class="bi bi-search position-absolute" style="left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; z-index: 10;"></i>
              <input 
                type="text" 
                v-model="searchQuery"
                class="form-control ps-5"
                placeholder="Поиск..."
                style="font-size: 14px;"
                @input="handleSearch"
              />
            </div>
            
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
              <ul class="dropdown-menu dropdown-menu-end p-3" style="min-width: 350px; max-width: 500px;">
                <li class="mb-3">
                  <label class="form-label small mb-2 fw-semibold">Филиалы</label>
                  <div class="d-flex flex-wrap gap-2">
                    <span 
                      v-for="branch in branches" 
                      :key="branch.id"
                      class="badge"
                      :class="selectedBranchIds.includes(branch.id) ? 'bg-primary' : 'bg-secondary'"
                      style="cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.6rem;"
                      @click="toggleBranch(branch.id)"
                    >
                      {{ branch.name }}
                    </span>
                  </div>
                </li>
                <li class="mb-3">
                  <label class="form-label small mb-2 fw-semibold">Пакеты</label>
                  <div class="d-flex flex-wrap gap-2">
                    <span 
                      v-for="paket in pakets" 
                      :key="paket.id"
                      class="badge"
                      :class="selectedPaketIds.includes(paket.id) ? 'bg-primary' : 'bg-secondary'"
                      style="cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.6rem;"
                      @click="togglePaket(paket.id)"
                    >
                      {{ paket.name }}
                    </span>
                  </div>
                </li>
                <li class="mb-3">
                  <label class="form-label small mb-2 fw-semibold">Статусы</label>
                  <div class="d-flex flex-wrap gap-2">
                    <span 
                      v-for="status in statuses" 
                      :key="status.id"
                      class="badge"
                      :class="selectedStatusIds.includes(status.id) ? 'bg-primary' : 'bg-secondary'"
                      style="cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.6rem;"
                      @click="toggleStatus(status.id)"
                    >
                      {{ status.name }}
                    </span>
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
          </div>

          <!-- Data Table -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
          </div>

          <div v-else-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>

          <div v-else class="d-flex flex-column" style="min-height: 400px;">
            <div class="flex-grow-1 overflow-auto">
              <DataTable
                :columns="columns"
                :items="cabinets"
                :actions="[]"
              >
                <template #cell-fullname="{ item }">
                  {{ formatFullName(item) }}
                </template>
                <template #cell-register_at="{ value }">
                  {{ formatDate(value) }}
                </template>
                <template #cell-registered="{ value }">
                  <span class="badge" :class="value ? 'bg-success' : 'bg-warning'">
                    {{ value ? 'Да' : 'Нет' }}
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
        </div>
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="handleClose"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
  <div 
    v-if="isOpen" 
    class="modal-backdrop fade show"
    @click="handleClose"
  ></div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import DataTable from './DataTable.vue'
import { BACKEND_API_URL } from '../config'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  sponsorId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref('')
const cabinets = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
let searchTimeout = null

// Filter options
const branches = ref([])
const pakets = ref([])
const statuses = ref([])

// Selected filters
const selectedBranchIds = ref([])
const selectedPaketIds = ref([])
const selectedStatusIds = ref([])

const columns = [
  { key: 'code', label: 'Код' },
  { key: 'personal_number', label: 'Персональный номер' },
  { key: 'sequence_number', label: '№ кабинета' },
  { key: 'fullname', label: 'ФИО' },
  { key: 'paket_name', label: 'Пакет' },
  { key: 'status_name', label: 'Статус' },
  { key: 'branch_name', label: 'Филиал' },
  { key: 'registered', label: 'Зарегистрирован' },
  { key: 'register_at', label: 'Дата регистрации' }
]

const hasActiveFilters = computed(() => {
  return selectedBranchIds.value.length > 0 || 
         selectedPaketIds.value.length > 0 || 
         selectedStatusIds.value.length > 0
})

const activeFiltersCount = computed(() => {
  return selectedBranchIds.value.length + 
         selectedPaketIds.value.length + 
         selectedStatusIds.value.length
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

const formatFullName = (item) => {
  if (!item.participant) return '-'
  return `${item.participant.lastname || ''} ${item.participant.name || ''} ${item.participant.patronymic || ''}`.trim()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  } catch (err) {
    return dateString
  }
}

const fetchFilterOptions = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const headers = {
      'Authorization': `Bearer ${token}`,
      'accept': 'application/json'
    }

    const [branchesRes, paketsRes, statusesRes] = await Promise.all([
      fetch(`${BACKEND_API_URL}/api/admin/branches/`, { headers }),
      fetch(`${BACKEND_API_URL}/api/admin/pakets/`, { headers }),
      fetch(`${BACKEND_API_URL}/api/admin/statuses/`, { headers })
    ])

    if (branchesRes.ok) branches.value = await branchesRes.json()
    if (paketsRes.ok) pakets.value = await paketsRes.json()
    if (statusesRes.ok) statuses.value = await statusesRes.json()
  } catch (err) {
    console.error('Error fetching filter options:', err)
  }
}

const fetchCabinets = async (page = 1) => {
  if (!props.sponsorId) return

  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      sponsor_id: props.sponsorId,
      page: page.toString(),
      page_size: pageSize.value.toString()
    })

    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }

    selectedBranchIds.value.forEach(id => params.append('branch_id', id))
    selectedPaketIds.value.forEach(id => params.append('paket_id', id))
    selectedStatusIds.value.forEach(id => params.append('status_id', id))

    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) throw new Error('Failed to fetch cabinets')

    const data = await response.json()
    cabinets.value = data.cabinets.map(c => ({
      ...c,
      branch_name: c.branch?.name || '-',
      paket_name: c.paket?.name || '-',
      status_name: c.status?.name || '-'
    }))
    
    totalPages.value = data.total_pages
    currentPage.value = data.page
  } catch (err) {
    console.error('Error fetching cabinets:', err)
    error.value = 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchCabinets(1)
  }, 500)
}

const toggleBranch = (id) => {
  const index = selectedBranchIds.value.indexOf(id)
  if (index > -1) selectedBranchIds.value.splice(index, 1)
  else selectedBranchIds.value.push(id)
  currentPage.value = 1
  fetchCabinets(1)
}

const togglePaket = (id) => {
  const index = selectedPaketIds.value.indexOf(id)
  if (index > -1) selectedPaketIds.value.splice(index, 1)
  else selectedPaketIds.value.push(id)
  currentPage.value = 1
  fetchCabinets(1)
}

const toggleStatus = (id) => {
  const index = selectedStatusIds.value.indexOf(id)
  if (index > -1) selectedStatusIds.value.splice(index, 1)
  else selectedStatusIds.value.push(id)
  currentPage.value = 1
  fetchCabinets(1)
}

const clearFilters = () => {
  selectedBranchIds.value = []
  selectedPaketIds.value = []
  selectedStatusIds.value = []
  searchQuery.value = ''
  currentPage.value = 1
  fetchCabinets(1)
}

const changePage = (page) => {
  fetchCabinets(page)
}

const handleClose = () => {
  emit('close')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.sponsorId) {
    fetchCabinets(1)
    if (branches.value.length === 0) fetchFilterOptions()
  } else {
    cabinets.value = []
    searchQuery.value = ''
    selectedBranchIds.value = []
    selectedPaketIds.value = []
    selectedStatusIds.value = []
  }
})
</script>

<style scoped>
.modal-backdrop {
  z-index: 1040;
}
.modal {
  z-index: 1050;
}
</style>
