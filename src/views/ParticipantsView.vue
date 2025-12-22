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
            <li class="mb-3">
              <label class="form-label small mb-2 fw-semibold">Сортировка по дате регистрации</label>
              <select class="form-select form-select-sm" v-model="sortByRegisterAt" @change="applyFilters">
                <option :value="null">Без сортировки</option>
                <option value="asc">По возрастанию</option>
                <option value="desc">По убыванию</option>
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
        
        <button 
          class="btn btn-primary d-flex align-items-center gap-2"
          style="font-size: 14px; background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
          @click="openAddModal"
        >
          <i class="bi bi-plus-circle"></i>
          Добавить участника
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
          :items="participants"
          :actions="actions"
          class="h-100"
        >
          <template #cell-fullname="{ item }">
            <span>{{ formatFullName(item) }}</span>
          </template>
          <template #cell-personal_number="{ item }">
            <span 
              class="text-primary" 
              style="cursor: pointer; text-decoration: underline;"
              @click="openCabinetDetailsModal(item.id)"
            >
              {{ item.personal_number }}
            </span>
          </template>
          <template #cell-fulfillment_status="{ item }">
            <span 
              v-if="item.fulfillment_status"
              class="status-indicator" 
              :class="getFulfillmentStatusClass(item.fulfillment_status)"
              :title="item.fulfillment_status"
            ></span>
            <span v-else>-</span>
          </template>
          <template #cell-register_at="{ value }">
            {{ formatDate(value) }}
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

    <!-- Модальное окно добавления участника -->
    <AddParticipantModal
      :is-open="addModalOpen"
      :branches="branches"
      :pakets="pakets"
      :statuses="statuses"
      :preselected-participant="preselectedParticipant"
      @close="closeAddModal"
      @success="handleAddSuccess"
      @error="handleAddError"
    />



    <!-- Модальное окно информации -->
    <CabinetDetailsModal
      :is-open="cabinetDetailsModalOpen"
      :cabinet-id="selectedCabinetId"
      :initial-tab="initialTab"
      @close="closeCabinetDetailsModal"
      @navigate="handleCabinetNavigate"
      @reopen="reopenCabinetDetailsModal"
    />

    <!-- Модальное окно личников -->
    <PersonalCabinetsModal
      :is-open="personalCabinetsModalOpen"
      :sponsor-id="selectedSponsorId"
      @close="closePersonalCabinetsModal"
    />

    <!-- Модальное окно редактирования -->
    <EditParticipantModal
      :is-open="editModalOpen"
      :cabinet-id="selectedCabinetIdForEdit"
      :branches="branches"
      :pakets="pakets"
      @close="closeEditModal"
      @success="handleEditSuccess"
    />



    <!-- Модальное окно бонусов -->
    <BonusesModal
      :is-open="bonusesModalOpen"
      :cabinet-id="selectedCabinetIdForBonuses"
      @close="closeBonusesModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import AddParticipantModal from '../components/AddParticipantModal.vue'
import CabinetDetailsModal from '../components/CabinetDetailsModal.vue'
import PersonalCabinetsModal from '../components/PersonalCabinetsModal.vue'
import EditParticipantModal from '../components/EditParticipantModal.vue'

import BonusesModal from '../components/BonusesModal.vue'
import { BACKEND_API_URL } from '../config'

const router = useRouter()

const participants = ref([])
const allParticipants = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(Number(localStorage.getItem('participants_page')) || 1)
const totalPages = ref(1)
const pageSize = ref(Number(localStorage.getItem('participants_pageSize')) || 20)
const searchQuery = ref('')

const branches = ref([])
const pakets = ref([])
const statuses = ref([])

const selectedBranchIds = ref([])
const selectedPaketIds = ref([])
const selectedStatusIds = ref([])
const sortByRegisterAt = ref(null)

const addModalOpen = ref(false)
const preselectedParticipant = ref(null)

// Cabinet details modal
const cabinetDetailsModalOpen = ref(false)
const selectedCabinetId = ref(null)
const initialTab = ref('participant')


// Personal cabinets modal
const personalCabinetsModalOpen = ref(false)
const selectedSponsorId = ref(null)

// Edit modal
const editModalOpen = ref(false)
const selectedCabinetIdForEdit = ref(null)
const selectedParticipantIdForEdit = ref(null)

// Bonuses modal
const bonusesModalOpen = ref(false)
const selectedCabinetIdForBonuses = ref(null)
const selectedParticipantIdForBonuses = ref(null)

const columns = [
  { key: 'branch_name', label: 'Филиал' },
  { key: 'personal_number', label: 'Номер' },
  { key: 'fullname', label: 'ФИО' },
  { key: 'paket_name', label: 'Пакет' },
  { key: 'status_name', label: 'Статус' },
  { key: 'fulfillment_status', label: 'Статус выдачи' },
  { key: 'register_at', label: 'Дата регистрации' }
]

const actions = [
  {
    label: 'Просмотр',
    icon: 'bi-eye',
    handler: (item) => openCabinetDetailsModal(item.id, 'participant')
  },
  {
    label: 'Личники',
    icon: 'bi-people',
    handler: (item) => openCabinetDetailsModal(item.id, 'personal')
  },
  {
    label: 'Бонусы',
    icon: 'bi-cash-coin',
    handler: (item) => openCabinetDetailsModal(item.id, 'bonuses')
  },
  {
    label: 'Бланк',
    icon: 'bi-file-earmark-text',
    handler: (item) => openBlankForm(item)
  },
  {
    label: 'Структура',
    icon: 'bi-diagram-3',
    handler: (item) => {
      if (item.id) {
        router.push({ name: 'structure', params: { cabinetId: item.id } })
      }
    }
  },
  {
    label: 'Изменить',
    icon: 'bi-pencil',
    handler: (item) => openEditModal(item)
  }
]

const formatFullName = (item) => {
  if (!item.participant) return '-'
  return `${item.participant.lastname || ''} ${item.participant.name || ''} ${item.participant.patronymic || ''}`.trim()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}`
}

const getFulfillmentStatusClass = (statusName) => {
  if (!statusName) return 'status-unknown'
  
  const status = statusName.toLowerCase()
  
  if (status === 'выдано' || status === 'issued') {
    return 'status-issued' // Зеленый круг
  } else if (status === 'частично выдано' || status === 'partially issued' || status.includes('частично')) {
    return 'status-partial' // Желтый круг
  } else if (status === 'не выдано' || status === 'not issued') {
    return 'status-not-issued' // Красный круг
  }
  
  return 'status-unknown' // Серый круг по умолчанию
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
  } catch (e) {
    console.error('Error fetching branches:', e)
  }
}

const fetchPakets = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/pakets/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (response.ok) {
      pakets.value = await response.json()
    }
  } catch (e) {
    console.error('Error fetching pakets:', e)
  }
}

const fetchStatuses = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/statuses/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (response.ok) {
      statuses.value = await response.json()
    }
  } catch (e) {
    console.error('Error fetching statuses:', e)
  }
}

const fetchParticipants = async (page = 1) => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    
    // Строим URL с параметрами
    const params = new URLSearchParams({
      registered: 'true',
      page: page.toString(),
      page_size: pageSize.value.toString()
    })
    
    // Добавляем поиск если есть
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }
    
    // Добавляем множественные фильтры по филиалам
    selectedBranchIds.value.forEach(id => {
      params.append('branch_id', id.toString())
    })
    
    // Добавляем множественные фильтры по пакетам
    selectedPaketIds.value.forEach(id => {
      params.append('paket_id', id.toString())
    })
    
    // Добавляем множественные фильтры по статусам
    selectedStatusIds.value.forEach(id => {
      params.append('status_id', id.toString())
    })
    
    // Добавляем сортировку
    if (sortByRegisterAt.value) {
      params.append('sort_by_register_at', sortByRegisterAt.value)
    }
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch participants')
    }

    const data = await response.json()
    allParticipants.value = data.cabinets.map(c => ({
      ...c,
      branch_name: c.branch?.name || '-',
      branch_id: c.branch_id || null,
      paket_name: c.paket?.name || '-',
      status_name: c.status?.name || '-',
      fullname: c.participant ? `${c.participant.lastname || ''} ${c.participant.name || ''} ${c.participant.patronymic || ''}`.trim() : '-',
      fulfillment_status: c.fulfillment_status?.name || null
    }))
    
    totalPages.value = data.total_pages
    currentPage.value = data.page
    participants.value = allParticipants.value
    localStorage.setItem('participants_page', data.page.toString())
  } catch (e) {
    console.error('Error fetching participants:', e)
    error.value = 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    localStorage.setItem('participants_page', page.toString())
    fetchParticipants(page)
  }
}

const changePageSize = () => {
  currentPage.value = 1
  localStorage.setItem('participants_pageSize', pageSize.value.toString())
  localStorage.setItem('participants_page', '1')
  fetchParticipants(1)
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

const toggleBranch = (branchId) => {
  const index = selectedBranchIds.value.indexOf(branchId)
  if (index > -1) {
    selectedBranchIds.value.splice(index, 1)
  } else {
    selectedBranchIds.value.push(branchId)
  }
  applyFilters()
}

const togglePaket = (paketId) => {
  const index = selectedPaketIds.value.indexOf(paketId)
  if (index > -1) {
    selectedPaketIds.value.splice(index, 1)
  } else {
    selectedPaketIds.value.push(paketId)
  }
  applyFilters()
}

const toggleStatus = (statusId) => {
  const index = selectedStatusIds.value.indexOf(statusId)
  if (index > -1) {
    selectedStatusIds.value.splice(index, 1)
  } else {
    selectedStatusIds.value.push(statusId)
  }
  applyFilters()
}

const hasActiveFilters = computed(() => {
  return selectedBranchIds.value.length > 0 || 
         selectedPaketIds.value.length > 0 || 
         selectedStatusIds.value.length > 0 ||
         sortByRegisterAt.value !== null
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (selectedBranchIds.value.length > 0) count++
  if (selectedPaketIds.value.length > 0) count++
  if (selectedStatusIds.value.length > 0) count++
  if (sortByRegisterAt.value !== null) count++
  return count
})

const clearFilters = () => {
  selectedBranchIds.value = []
  selectedPaketIds.value = []
  selectedStatusIds.value = []
  sortByRegisterAt.value = null
  fetchParticipants(1)
}

const applyFilters = () => {
  currentPage.value = 1
  fetchParticipants(1)
}

watch(searchQuery, () => {
  // Добавляем небольшую задержку для debounce
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchParticipants(1)
  }, 500)
})

let searchTimeout = null

// Watch for page size changes
watch(pageSize, (newSize) => {
  localStorage.setItem('participants_pageSize', newSize.toString())
})

const openAddModal = () => {
  addModalOpen.value = true
}

const closeAddModal = () => {
  addModalOpen.value = false
  preselectedParticipant.value = null
}

const handleAddSuccess = async () => {
  await fetchParticipants(currentPage.value)
}

const handleAddError = (errorMessage) => {
  error.value = errorMessage
}



const openCabinetDetailsModal = (cabinetId, tab = 'participant') => {
  selectedCabinetId.value = cabinetId
  initialTab.value = tab
  cabinetDetailsModalOpen.value = true
}

const closeCabinetDetailsModal = () => {
  cabinetDetailsModalOpen.value = false
  selectedCabinetId.value = null
  initialTab.value = 'participant'
}

const handleCabinetNavigate = (cabinetId) => {
  selectedCabinetId.value = cabinetId
}

const reopenCabinetDetailsModal = () => {
  cabinetDetailsModalOpen.value = true
}

const openPersonalCabinetsModal = (sponsorId) => {
  selectedSponsorId.value = sponsorId
  personalCabinetsModalOpen.value = true
}

const closePersonalCabinetsModal = () => {
  personalCabinetsModalOpen.value = false
  selectedSponsorId.value = null
}

const openEditModal = (item) => {
  selectedCabinetIdForEdit.value = item.id
  selectedParticipantIdForEdit.value = item.participant_id
  editModalOpen.value = true
}

const closeEditModal = () => {
  editModalOpen.value = false
  selectedCabinetIdForEdit.value = null
  selectedParticipantIdForEdit.value = null
}

const handleEditSuccess = () => {
  fetchParticipants(currentPage.value)
}

const openBonusesModal = (item) => {
  selectedCabinetIdForBonuses.value = item.id
  selectedParticipantIdForBonuses.value = item.participant_id
  bonusesModalOpen.value = true
}

const closeBonusesModal = () => {
  bonusesModalOpen.value = false
  selectedCabinetIdForBonuses.value = null
  selectedParticipantIdForBonuses.value = null
}

const openBlankForm = (item) => {
  if (!item.id) return
  const url = `/print/blank/${item.id}`
  window.open(url, '_blank', 'width=800,height=1000')
}

const openUpgradeModal = (item) => {
  if (!item.id || !item.paket_id) return
  selectedCabinetIdForUpgrade.value = item.id
  currentPaketIdForUpgrade.value = item.paket_id
  upgradeModalOpen.value = true
}




onMounted(async () => {
  await Promise.all([
    fetchBranches(),
    fetchPakets(),
    fetchStatuses()
  ])
  fetchParticipants(currentPage.value)
})
</script>

<style scoped>
/* Status Indicators */
.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-issued {
  background-color: #28a745; /* Зеленый - Выдано */
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.status-partial {
  background-color: #ffc107; /* Желтый - Частично выдано */
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.status-not-issued {
  background-color: #dc3545; /* Красный - Не выдано */
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.status-unknown {
  background-color: #6c757d; /* Серый - Неизвестно */
  box-shadow: 0 0 0 2px rgba(108, 117, 125, 0.2);
}
</style>
