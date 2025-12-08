<template>
  <div class="d-flex flex-column h-100">
    <!-- Переключатель режима -->
    <div class="mb-3 d-flex justify-content-center">
      <div class="mode-segmented-control">
        <button 
          type="button" 
          class="mode-segment"
          :class="{ 'mode-segment-active': mode === 'accounts' }"
          @click="switchMode('accounts')"
        >
          Аккаунты участников
        </button>
        <button 
          type="button" 
          class="mode-segment"
          :class="{ 'mode-segment-active': mode === 'cabinets' }"
          @click="switchMode('cabinets')"
        >
          Кабинеты участников
        </button>
      </div>
    </div>

    <!-- Режим: Аккаунты участников -->
    <div v-if="mode === 'accounts'" class="d-flex flex-column flex-grow-1 overflow-hidden">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
        <div class="position-relative" style="flex: 1; max-width: 400px;">
          <i class="bi bi-search position-absolute" style="left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; z-index: 10;"></i>
          <input 
            type="text" 
            v-model="accountsSearchQuery"
            class="form-control ps-5"
            placeholder="Поиск..."
            style="font-size: 14px;"
          />
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Показать:</span>
          <select 
            v-model="accountsPageSize" 
            @change="changeAccountsPageSize"
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

      <div v-if="accountsLoading" class="text-center py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
      </div>

      <div v-else class="d-flex flex-column flex-grow-1 overflow-hidden">
        <div class="flex-grow-1 overflow-auto">
          <DataTable
            :columns="accountsColumns"
            :items="accounts"
            :actions="accountsActions"
            class="h-100"
          >
            <template #cell-fullname="{ item }">
              <span 
                class="text-primary" 
                style="cursor: pointer; text-decoration: underline;"
                @click="openViewParticipantModal(item.id)"
              >
                {{ formatFullName(item) }}
              </span>
            </template>
            <template #cell-is_active="{ value }">
              <span 
                class="badge"
                :class="value ? 'bg-success' : 'bg-secondary'"
              >
                {{ value ? 'Активен' : 'Неактивен' }}
              </span>
            </template>
            <template #cell-created_at="{ value }">
              {{ formatDateTime(value) }}
            </template>
          </DataTable>
        </div>

        <!-- Pagination -->
        <div class="flex-shrink-0 mt-3 d-flex justify-content-center">
          <nav v-if="accountsTotalPages > 1" aria-label="Page navigation">
            <ul class="pagination mb-0">
              <li 
                v-for="page in accountsDisplayedPages" 
                :key="page" 
                class="page-item"
                :class="{ active: accountsCurrentPage === page, disabled: page === '...' }"
              >
                <button class="page-link" @click="page !== '...' && changeAccountsPage(page)">
                  {{ page }}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Режим: Кабинеты участников -->
    <div v-else class="d-flex flex-column flex-grow-1 overflow-hidden">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
        <div class="position-relative" style="flex: 1; max-width: 400px;">
          <i class="bi bi-search position-absolute" style="left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; z-index: 10;"></i>
          <input 
            type="text" 
            v-model="cabinetsSearchQuery"
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
              <span v-if="registeredFilter !== null" class="badge bg-primary rounded-pill" style="font-size: 0.7rem;">
                1
              </span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end p-3" style="min-width: 250px;">
              <li class="mb-3">
                <label class="form-label small mb-2 fw-semibold">Статус регистрации</label>
                <select 
                  v-model="registeredFilter" 
                  @change="fetchCabinets(1)"
                  class="form-select form-select-sm"
                >
                  <option :value="null">Все кабинеты</option>
                  <option :value="true">Зарегистрированные</option>
                  <option :value="false">Незарегистрированные</option>
                </select>
              </li>
              <li>
                <button 
                  v-if="registeredFilter !== null" 
                  class="btn btn-sm btn-outline-danger w-100" 
                  @click="clearCabinetFilters"
                >
                  Сбросить фильтры
                </button>
              </li>
            </ul>
          </div>

          <span class="text-muted small">Показать:</span>
          <select 
            v-model="cabinetsPageSize" 
            @change="changeCabinetsPageSize"
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

      <div v-if="cabinetsLoading" class="text-center py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
      </div>

      <div v-else class="d-flex flex-column flex-grow-1 overflow-hidden">
        <div class="flex-grow-1 overflow-auto">
          <DataTable
            :columns="cabinetsColumns"
            :items="cabinets"
            :actions="cabinetsActions"
            class="h-100"
          >
            <template #cell-personal_number="{ item }">
              <span 
                class="text-primary" 
                style="cursor: pointer; text-decoration: underline;"
                @click="openCabinetDetailsModal(item.id)"
              >
                {{ item.personal_number }}
              </span>
            </template>
            <template #cell-fullname="{ item }">
              <span 
                class="text-primary" 
                style="cursor: pointer; text-decoration: underline;"
                @click="openViewParticipantModal(item.participant_id)"
              >
                {{ formatCabinetFullName(item) }}
              </span>
            </template>
            <template #cell-registered="{ value }">
              <span 
                class="badge"
                :class="value ? 'bg-success' : 'bg-warning'"
              >
                {{ value ? 'Да' : 'Нет' }}
              </span>
            </template>
            <template #cell-created_at="{ value }">
              {{ formatDateTime(value) }}
            </template>
          </DataTable>
        </div>

        <!-- Pagination -->
        <div class="flex-shrink-0 mt-3 d-flex justify-content-center">
          <nav v-if="cabinetsTotalPages > 1" aria-label="Page navigation">
            <ul class="pagination mb-0">
              <li 
                v-for="page in cabinetsDisplayedPages" 
                :key="page" 
                class="page-item"
                :class="{ active: cabinetsCurrentPage === page, disabled: page === '...' }"
              >
                <button class="page-link" @click="page !== '...' && changeCabinetsPage(page)">
                  {{ page }}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра участника -->
    <ViewParticipantModal
      :is-open="viewParticipantModalOpen"
      :participant-id="selectedParticipantId"
      @close="closeViewParticipantModal"
      @openAddCabinet="handleOpenAddCabinet"
    />

    <!-- Модальное окно добавления кабинета -->
    <AddParticipantModal
      :is-open="addCabinetModalOpen"
      :branches="branches"
      :pakets="pakets"
      :statuses="statuses"
      :preselected-participant="preselectedParticipant"
      @close="closeAddCabinetModal"
      @success="handleAddCabinetSuccess"
      @error="handleAddCabinetError"
    />

    <!-- Модальное окно информации о кабинете -->
    <CabinetDetailsModal
      :is-open="cabinetDetailsModalOpen"
      :cabinet-id="selectedCabinetId"
      @close="closeCabinetDetailsModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import ViewParticipantModal from '../components/ViewParticipantModal.vue'
import AddParticipantModal from '../components/AddParticipantModal.vue'
import CabinetDetailsModal from '../components/CabinetDetailsModal.vue'
import { BACKEND_API_URL } from '../config'

const router = useRouter()
const route = useRoute()

const mode = ref('accounts')
const error = ref('')

// Аккаунты участников
const accounts = ref([])
const accountsLoading = ref(false)
const accountsCurrentPage = ref(1)
const accountsTotalPages = ref(1)
const accountsPageSize = ref(20)
const accountsSearchQuery = ref('')
let accountsSearchTimeout = null

// Кабинеты участников
const cabinets = ref([])
const cabinetsLoading = ref(false)
const cabinetsCurrentPage = ref(1)
const cabinetsTotalPages = ref(1)
const cabinetsPageSize = ref(20)
const cabinetsSearchQuery = ref('')
const registeredFilter = ref(null)
let cabinetsSearchTimeout = null

// Модальное окно просмотра участника
const viewParticipantModalOpen = ref(false)
const selectedParticipantId = ref(null)

// Модальное окно деталей кабинета
const cabinetDetailsModalOpen = ref(false)
const selectedCabinetId = ref(null)

// Модальное окно добавления кабинета
const addCabinetModalOpen = ref(false)
const preselectedParticipant = ref(null)

// Данные для модального окна
const branches = ref([])
const pakets = ref([])
const statuses = ref([])

const accountsColumns = [
  { key: 'fullname', label: 'ФИО' },
  { key: 'email', label: 'Email' },
  { key: 'is_active', label: 'Статус' },
  { key: 'created_at', label: 'Дата создания' }
]

const accountsActions = [
  {
    label: 'Просмотр',
    icon: 'bi-eye',
    handler: (item) => openViewParticipantModal(item.id)
  }
]

const cabinetsColumns = [
  { key: 'personal_number', label: 'Персональный номер' },
  { key: 'fullname', label: 'ФИО' },
  { key: 'code', label: 'Код' },
  { key: 'sequence_number', label: '№ кабинета' },
  { key: 'branch_name', label: 'Филиал' },
  { key: 'paket_name', label: 'Пакет' },
  { key: 'registered', label: 'Зарегистрирован' },
  { key: 'created_at', label: 'Дата создания' }
]

const cabinetsActions = [
  {
    label: 'Просмотр участника',
    icon: 'bi-eye',
    handler: (item) => openViewParticipantModal(item.participant_id)
  },
  {
    label: 'Структура',
    icon: 'bi-diagram-3',
    handler: (item) => viewStructure(item),
    condition: (item) => item.registered === true
  }
]

const updateUrl = () => {
  const query = { mode: mode.value }
  
  if (mode.value === 'accounts') {
    query.page = accountsCurrentPage.value.toString()
    query.page_size = accountsPageSize.value.toString()
    if (accountsSearchQuery.value) query.search = accountsSearchQuery.value
  } else {
    query.page = cabinetsCurrentPage.value.toString()
    query.page_size = cabinetsPageSize.value.toString()
    if (cabinetsSearchQuery.value) query.search = cabinetsSearchQuery.value
    if (registeredFilter.value !== null) query.registered = registeredFilter.value.toString()
  }
  
  router.replace({ query }).catch(() => {})
}

const switchMode = (newMode) => {
  mode.value = newMode
  error.value = ''
  
  // Reset pagination when switching modes if not loaded from URL
  if (newMode === 'accounts') {
    if (accounts.value.length === 0) fetchAccounts(1)
    else updateUrl()
  } else {
    if (cabinets.value.length === 0) fetchCabinets(1)
    else updateUrl()
  }
}

const formatFullName = (participant) => {
  if (!participant) return '-'
  const parts = []
  if (participant.lastname) parts.push(participant.lastname)
  if (participant.name) parts.push(participant.name)
  if (participant.patronymic) parts.push(participant.patronymic)
  return parts.length > 0 ? parts.join(' ') : participant.email || '-'
}

const formatCabinetFullName = (cabinet) => {
  if (!cabinet || !cabinet.participant) return '-'
  const parts = []
  if (cabinet.participant.lastname) parts.push(cabinet.participant.lastname)
  if (cabinet.participant.name) parts.push(cabinet.participant.name)
  if (cabinet.participant.patronymic) parts.push(cabinet.participant.patronymic)
  return parts.length > 0 ? parts.join(' ') : '-'
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}.${month}.${day} ${hours}:${minutes}`
  } catch (err) {
    return dateString
  }
}

// Аккаунты участников
const fetchAccounts = async (page = 1) => {
  accountsLoading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: accountsPageSize.value.toString()
    })
    
    if (accountsSearchQuery.value.trim()) {
      params.append('search', accountsSearchQuery.value.trim())
    }
    
    // Update URL
    accountsCurrentPage.value = page
    updateUrl()
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/participants/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to fetch accounts')
    
    const data = await response.json()
    accounts.value = data.participants || []
    accountsTotalPages.value = data.total_pages || 1
    accountsCurrentPage.value = data.page || 1
  } catch (err) {
    console.error('Error fetching accounts:', err)
    error.value = 'Ошибка при загрузке аккаунтов'
  } finally {
    accountsLoading.value = false
  }
}

const changeAccountsPage = (page) => {
  if (page >= 1 && page <= accountsTotalPages.value) {
    fetchAccounts(page)
  }
}

const changeAccountsPageSize = () => {
  fetchAccounts(1)
}

const accountsDisplayedPages = computed(() => {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= accountsTotalPages.value; i++) {
    if (i === 1 || i === accountsTotalPages.value || (i >= accountsCurrentPage.value - delta && i <= accountsCurrentPage.value + delta)) {
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

watch(accountsSearchQuery, () => {
  clearTimeout(accountsSearchTimeout)
  accountsSearchTimeout = setTimeout(() => {
    fetchAccounts(1)
  }, 500)
})

// Кабинеты участников
const fetchCabinets = async (page = 1) => {
  cabinetsLoading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: cabinetsPageSize.value.toString()
    })
    
    if (cabinetsSearchQuery.value.trim()) {
      params.append('search', cabinetsSearchQuery.value.trim())
    }
    
    if (registeredFilter.value !== null) {
      params.append('registered', registeredFilter.value.toString())
    }
    
    // Update URL
    cabinetsCurrentPage.value = page
    updateUrl()
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to fetch cabinets')
    
    const data = await response.json()
    cabinets.value = (data.cabinets || []).map(c => ({
      ...c,
      branch_name: c.branch?.name || '-',
      paket_name: c.paket?.name || '-'
    }))
    cabinetsTotalPages.value = data.total_pages || 1
    cabinetsCurrentPage.value = data.page || 1
  } catch (err) {
    console.error('Error fetching cabinets:', err)
    error.value = 'Ошибка при загрузке кабинетов'
  } finally {
    cabinetsLoading.value = false
  }
}

const changeCabinetsPage = (page) => {
  if (page >= 1 && page <= cabinetsTotalPages.value) {
    fetchCabinets(page)
  }
}

const changeCabinetsPageSize = () => {
  fetchCabinets(1)
}

const clearCabinetFilters = () => {
  registeredFilter.value = null
  fetchCabinets(1)
}

const cabinetsDisplayedPages = computed(() => {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= cabinetsTotalPages.value; i++) {
    if (i === 1 || i === cabinetsTotalPages.value || (i >= cabinetsCurrentPage.value - delta && i <= cabinetsCurrentPage.value + delta)) {
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

watch(cabinetsSearchQuery, () => {
  clearTimeout(cabinetsSearchTimeout)
  cabinetsSearchTimeout = setTimeout(() => {
    fetchCabinets(1)
  }, 500)
})

// Модальное окно просмотра участника
const openViewParticipantModal = (participantId) => {
  selectedParticipantId.value = participantId
  viewParticipantModalOpen.value = true
}

const closeViewParticipantModal = () => {
  viewParticipantModalOpen.value = false
  selectedParticipantId.value = null
}

const viewStructure = (item) => {
  router.push(`/structure/${item.id}`)
}

// Модальное окно деталей кабинета
const openCabinetDetailsModal = (cabinetId) => {
  selectedCabinetId.value = cabinetId
  cabinetDetailsModalOpen.value = true
}

const closeCabinetDetailsModal = () => {
  cabinetDetailsModalOpen.value = false
  selectedCabinetId.value = null
}

// Модальное окно добавления кабинета
const handleOpenAddCabinet = (participant) => {
  preselectedParticipant.value = participant
  viewParticipantModalOpen.value = false
  addCabinetModalOpen.value = true
}

const closeAddCabinetModal = () => {
  addCabinetModalOpen.value = false
  preselectedParticipant.value = null
}

const handleAddCabinetSuccess = () => {
  // Обновляем список кабинетов, если мы в режиме кабинетов
  if (mode.value === 'cabinets') {
    fetchCabinets(cabinetsCurrentPage.value)
  }
}

const handleAddCabinetError = (errorMessage) => {
  error.value = errorMessage
}

// Загрузка справочников
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
  } catch (err) {
    console.error('Error fetching pakets:', err)
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
  } catch (err) {
    console.error('Error fetching statuses:', err)
  }
}

onMounted(async () => {
  // Init from URL
  if (route.query.mode) mode.value = route.query.mode
  
  if (mode.value === 'accounts') {
    if (route.query.page) accountsCurrentPage.value = parseInt(route.query.page)
    if (route.query.page_size) accountsPageSize.value = parseInt(route.query.page_size)
    if (route.query.search) accountsSearchQuery.value = route.query.search
  } else {
    if (route.query.page) cabinetsCurrentPage.value = parseInt(route.query.page)
    if (route.query.page_size) cabinetsPageSize.value = parseInt(route.query.page_size)
    if (route.query.search) cabinetsSearchQuery.value = route.query.search
    if (route.query.registered !== undefined) {
      registeredFilter.value = route.query.registered === 'true' ? true : route.query.registered === 'false' ? false : null
    }
  }

  await Promise.all([
    fetchBranches(),
    fetchPakets(),
    fetchStatuses()
  ])
  
  if (mode.value === 'accounts') {
    fetchAccounts(accountsCurrentPage.value)
  } else {
    fetchCabinets(cabinetsCurrentPage.value)
  }
})
</script>

<style scoped>
.page-size-select {
  width: 80px;
}

/* Mode Segmented Control - matching Navbar style */
.mode-segmented-control {
  display: inline-flex;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  gap: 0;
}

.mode-segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  color: #212529;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.mode-segment:hover {
  color: rgb(0, 0, 128);
  transition: color 0.2s ease;
}

.mode-segment-active {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mode-segment-active:hover {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
}
</style>
