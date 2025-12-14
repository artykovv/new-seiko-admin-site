<template>
  <div>
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
          <span v-if="selectedBranchIds.length > 0" class="badge bg-primary rounded-pill" style="font-size: 0.7rem;">
            {{ selectedBranchIds.length }}
          </span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end p-3" style="min-width: 300px;">
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
          <li>
            <button 
              v-if="selectedBranchIds.length > 0" 
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

    <div v-else class="d-flex flex-column">
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th scope="col">Дата</th>
              <th scope="col">От кого</th>
              <th scope="col" v-if="!cabinetId">Кому</th>
              <th scope="col">Сумма</th>
              <th scope="col">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="bonuses.length === 0">
              <td :colspan="cabinetId ? 4 : 5" class="text-center py-4 text-muted">
                Нет данных
              </td>
            </tr>
            <tr v-for="bonus in bonuses" :key="bonus.id">
              <td>{{ formatDate(bonus.created_at) }}</td>
              <td>
                <div v-if="bonus.from_cabinet">
                  {{ formatName(bonus.from_cabinet.participant) }} ({{ bonus.from_cabinet.personal_number }})
                </div>
                <span v-else>-</span>
              </td>
              <td v-if="!cabinetId">
                <div v-if="bonus.cabinet">
                  {{ formatName(bonus.cabinet.participant) }} ({{ bonus.cabinet.personal_number }})
                </div>
                <span v-else>-</span>
              </td>
              <td>
                {{ formatPrice(bonus.bonus_amount) }}
              </td>
              <td>
                <span class="badge" :class="bonus.issued ? 'bg-success' : 'bg-warning'">
                  {{ bonus.issued ? 'Выплачен' : 'Ожидает' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
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
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { BACKEND_API_URL } from '../../config'

const props = defineProps({
  cabinetId: {
    type: String,
    default: null
  },
  participantId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

const loading = ref(false)
const error = ref('')
const bonuses = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
let searchTimeout = null

const branches = ref([])
const selectedBranchIds = ref([])

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

const formatName = (participant) => {
  if (!participant) return 'Неизвестно'
  return `${participant.lastname || ''} ${participant.name || ''}`.trim()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (err) {
    return dateString
  }
}

const formatPrice = (price) => {
  if (!price) return '0.00 $'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2) + ' $'
}

const fetchBranches = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/branches/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (response.ok) {
      branches.value = await response.json()
    }
  } catch (err) {
    console.error('Error fetching branches:', err)
  }
}

const fetchBonuses = async (page = 1) => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.value.toString(),
      sort_by_created_at: 'desc'
    })

    if (props.cabinetId) {
      params.append('cabinet_id', props.cabinetId)
    } else if (props.participantId) {
      params.append('participant_id', props.participantId)
    }

    if (searchQuery.value.trim().length >= 4) {
      params.append('search', searchQuery.value.trim())
    }

    selectedBranchIds.value.forEach(id => params.append('branch_id', id))

    const response = await fetch(`${BACKEND_API_URL}/api/admin/bonuses/sponsor?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) throw new Error('Failed to fetch bonuses')

    const data = await response.json()
    bonuses.value = data.bonuses || []
    totalPages.value = data.total_pages
    currentPage.value = data.page
  } catch (err) {
    console.error('Error fetching bonuses:', err)
    error.value = 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim().length >= 4 || searchQuery.value.trim().length === 0) {
      currentPage.value = 1
      fetchBonuses(1)
    }
  }, 500)
}

const toggleBranch = (id) => {
  const index = selectedBranchIds.value.indexOf(id)
  if (index > -1) selectedBranchIds.value.splice(index, 1)
  else selectedBranchIds.value.push(id)
  currentPage.value = 1
  fetchBonuses(1)
}

const clearFilters = () => {
  selectedBranchIds.value = []
  searchQuery.value = ''
  currentPage.value = 1
  fetchBonuses(1)
}

const changePage = (page) => {
  fetchBonuses(page)
}

watch(() => props.isActive, (newVal) => {
  if (newVal) {
    if (branches.value.length === 0) fetchBranches()
    fetchBonuses(1)
  }
})

watch(() => props.cabinetId, () => {
  if (props.isActive) {
    fetchBonuses(1)
  }
})

watch(() => props.participantId, () => {
  if (props.isActive) {
    fetchBonuses(1)
  }
})

onMounted(() => {
  if (props.isActive) {
    fetchBranches()
    fetchBonuses(1)
  }
})
</script>


