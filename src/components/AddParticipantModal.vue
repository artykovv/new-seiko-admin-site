<template>
  <FormModal
    :is-open="isOpen"
    :title="modalTitle"
    :save-button-text="saveButtonText"
    @save="handleSave"
    @close="handleClose"
  >
    <template #body>
      <form @submit.prevent="handleSave" class="participant-form">
        <!-- Переключатель режима -->
        <div class="mb-4 d-flex justify-content-center">
          <div class="mode-segmented-control">
            <button 
              type="button" 
              class="mode-segment"
              :class="{ 'mode-segment-active': mode === 'participant' }"
              @click="switchMode('participant')"
            >
              Добавить участника
            </button>
            <button 
              type="button" 
              class="mode-segment"
              :class="{ 'mode-segment-active': mode === 'cabinet' }"
              @click="switchMode('cabinet')"
            >
              Добавить кабинет
            </button>
          </div>
        </div>

        <!-- Режим: Добавить участника -->
        <div v-if="mode === 'participant'">
          <h6 class="mb-3">Учетные данные</h6>
          <div class="mb-3">
            <label for="add_email" class="form-label">Email <span class="text-danger">*</span></label>
            <input 
              type="email" 
              class="form-control" 
              id="add_email" 
              v-model="participantForm.email"
              placeholder="user@example.com"
              required
            />
          </div>
          <div class="mb-3">
            <label for="add_password" class="form-label">Пароль <span class="text-danger">*</span></label>
            <div class="input-group">
              <input 
                :type="showPassword ? 'text' : 'password'"
                class="form-control" 
                id="add_password" 
                v-model="participantForm.password"
                placeholder="Введите пароль"
                required
              />
              <button 
                class="btn btn-outline-secondary" 
                type="button"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <hr class="my-4">
          
          <h6 class="mb-3">Личные данные</h6>
          
          <div class="mb-3">
            <label for="add_lastname" class="form-label">Фамилия</label>
            <input 
              type="text" 
              class="form-control" 
              id="add_lastname" 
              v-model="participantForm.lastname"
              placeholder="Фамилия"
            />
          </div>

          <div class="mb-3">
            <label for="add_name" class="form-label">Имя</label>
            <input 
              type="text" 
              class="form-control" 
              id="add_name" 
              v-model="participantForm.name"
              placeholder="Имя"
            />
          </div>

          <div class="mb-3">
            <label for="add_patronymic" class="form-label">Отчество</label>
            <input 
              type="text" 
              class="form-control" 
              id="add_patronymic" 
              v-model="participantForm.patronymic"
              placeholder="Отчество"
            />
          </div>

          <div class="mb-3">
            <label for="add_birth_date" class="form-label">Дата рождения</label>
            <input 
              type="date" 
              class="form-control" 
              id="add_birth_date" 
              v-model="participantForm.passport_info.date_birth"
            />
          </div>

          <div class="mb-3">
            <label for="add_passport_id" class="form-label">N документа</label>
            <input 
              type="text" 
              class="form-control" 
              id="add_passport_id" 
              v-model="participantForm.passport_info.passport_id"
              placeholder="Номер паспорта"
            />
          </div>

          <div class="mb-3">
            <label for="add_passport_issuer" class="form-label">Орган выдачи</label>
            <input 
              type="text" 
              class="form-control" 
              id="add_passport_issuer" 
              v-model="participantForm.passport_info.passport_issuer"
              placeholder="Кем выдан"
            />
          </div>

          <div class="mb-3">
            <label for="add_passport_issue_date" class="form-label">Дата выдачи</label>
            <input 
              type="date" 
              class="form-control" 
              id="add_passport_issue_date" 
              v-model="participantForm.passport_info.passport_issue_date"
            />
          </div>

          <div class="mb-3">
            <label for="add_phone" class="form-label">Номер телефона</label>
            <input 
              type="text" 
              class="form-control" 
              id="add_phone" 
              v-model="participantForm.passport_info.phone_number"
              placeholder="+996..."
            />
          </div>

          <div class="mb-3">
            <label for="add_bank" class="form-label">Банк</label>
            <input 
              type="text" 
              class="form-control" 
              id="add_bank" 
              v-model="participantForm.passport_info.bank"
              placeholder="Название банка / Реквизиты"
            />
          </div>
        </div>

        <!-- Режим: Добавить кабинет -->
        <div v-else>
          <h6 class="mb-3">Выбор участника</h6>
          <div class="mb-3">
            <label for="search_participant" class="form-label">Поиск участника <span class="text-danger">*</span></label>
            <div class="position-relative">
              <input 
                type="text" 
                class="form-control" 
                id="search_participant" 
                v-model="participantSearchQuery"
                @input="handleParticipantSearch"
                placeholder="Поиск по ФИО или email..."
                autocomplete="off"
              />
              
              <div 
                v-if="showParticipantDropdown && (participantSearchResults.length > 0 || participantSearchLoading)"
                class="search-dropdown"
              >
                <div v-if="participantSearchLoading" class="dropdown-item text-center py-2">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                </div>
                <div 
                  v-else
                  v-for="participant in participantSearchResults" 
                  :key="participant.id"
                  class="dropdown-item participant-item"
                  @click="selectParticipant(participant)"
                >
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-semibold">{{ formatParticipantName(participant) }}</div>
                      <small class="text-muted">{{ participant.email }}</small>
                    </div>
                    <i class="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
                <div v-if="participantSearchResults.length === 0 && participantSearchQuery.trim()" class="dropdown-item text-muted text-center py-2">
                  Участники не найдены
                </div>
              </div>
            </div>
          </div>

          <hr class="my-4">

          <h6 class="mb-3">Данные кабинета</h6>
          
          <div class="mb-3">
            <label for="cabinet_code" class="form-label">Код <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="cabinet_code" 
              v-model="cabinetForm.code"
              placeholder="Введите код"
              required
            />
          </div>

          <div class="mb-3">
            <label for="cabinet_paket" class="form-label">Пакет <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              id="cabinet_paket" 
              v-model.number="cabinetForm.paket_id"
              required
            >
              <option :value="null">Выберите пакет</option>
              <option v-for="paket in pakets" :key="paket.id" :value="paket.id">
                {{ paket.name }} - {{ formatPrice(paket.price) }}
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label for="cabinet_branch" class="form-label">Филиал <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              id="cabinet_branch" 
              v-model.number="cabinetForm.branch_id"
              required
            >
              <option :value="null">Выберите филиал</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }} ({{ branch.code }})
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label for="search_sponsor" class="form-label">Спонсор</label>
            <div class="position-relative">
              <input 
                type="text" 
                class="form-control" 
                id="search_sponsor" 
                v-model="sponsorSearchQuery"
                @input="handleSponsorSearch"
                placeholder="Поиск спонсора..."
                autocomplete="off"
              />
              
              <div 
                v-if="showSponsorDropdown && (sponsorSearchResults.length > 0 || sponsorSearchLoading)"
                class="search-dropdown"
              >
                <div v-if="sponsorSearchLoading" class="dropdown-item text-center py-2">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                </div>
                <div 
                  v-else
                  v-for="cabinet in sponsorSearchResults" 
                  :key="cabinet.id"
                  class="dropdown-item participant-item"
                  @click="selectSponsor(cabinet)"
                >
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-semibold">{{ formatCabinetName(cabinet) }}</div>
                      <small class="text-muted">{{ cabinet.personal_number }}</small>
                    </div>
                    <i class="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
                <div v-if="sponsorSearchResults.length === 0 && sponsorSearchQuery.trim()" class="dropdown-item text-muted text-center py-2">
                  Спонсоры не найдены
                </div>
              </div>
            </div>
            <small class="form-text text-muted">Оставьте пустым, если нет спонсора</small>
          </div>
        </div>
      </form>
    </template>
  </FormModal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import FormModal from './FormModal.vue'
import { BACKEND_API_URL } from '../config'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  branches: {
    type: Array,
    default: () => []
  },
  pakets: {
    type: Array,
    default: () => []
  },
  statuses: {
    type: Array,
    default: () => []
  },
  preselectedParticipant: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'success', 'error'])

const mode = ref('participant') // 'participant' или 'cabinet'
const showPassword = ref(false)

// Форма участника
const participantForm = ref({
  email: '',
  password: '',
  name: '',
  lastname: '',
  patronymic: '',
  passport_info: {
    pin: '',
    passport_id: '',
    passport_issuer: '',
    passport_issue_date: '',
    bank: '',
    ip_inn: false,
    pensioner: false,
    phone_number: '',
    date_birth: ''
  }
})

// Форма кабинета
const cabinetForm = ref({
  participant_id: null,
  code: '',
  paket_id: null,
  branch_id: null,
  sponsor_id: null
})

// Поиск участника
const participantSearchQuery = ref('')
const participantSearchResults = ref([])
const participantSearchLoading = ref(false)
const showParticipantDropdown = ref(false)
const selectedParticipant = ref(null)
let participantSearchTimeout = null

// Поиск спонсора
const sponsorSearchQuery = ref('')
const sponsorSearchResults = ref([])
const sponsorSearchLoading = ref(false)
const showSponsorDropdown = ref(false)
const selectedSponsor = ref(null)
let sponsorSearchTimeout = null

const modalTitle = computed(() => {
  return mode.value === 'participant' ? 'Добавить участника' : 'Добавить кабинет'
})

const saveButtonText = computed(() => {
  return mode.value === 'participant' ? 'Добавить' : 'Создать кабинет'
})

const switchMode = (newMode) => {
  mode.value = newMode
  resetForms()
}

const formatParticipantName = (participant) => {
  if (!participant) return '-'
  const parts = []
  if (participant.lastname) parts.push(participant.lastname)
  if (participant.name) parts.push(participant.name)
  if (participant.patronymic) parts.push(participant.patronymic)
  const name = parts.length > 0 ? parts.join(' ') : participant.email || '-'
  return name
}

const formatParticipantWithEmail = (participant) => {
  if (!participant) return '-'
  const name = formatParticipantName(participant)
  return `${name} (${participant.email || '-'})`
}

const formatCabinetName = (cabinet) => {
  if (!cabinet || !cabinet.participant) return '-'
  const name = formatParticipantName(cabinet.participant)
  const personalNumber = cabinet.personal_number || '-'
  const sequenceNumber = cabinet.sequence_number || '-'
  return `${name} (${personalNumber}) - Кабинет №${sequenceNumber}`
}

const formatPrice = (price) => {
  if (!price) return '0.00'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2) + ' $'
}

const handleParticipantSearch = () => {
  clearTimeout(participantSearchTimeout)
  
  if (!participantSearchQuery.value.trim()) {
    participantSearchResults.value = []
    showParticipantDropdown.value = false
    return
  }
  
  participantSearchTimeout = setTimeout(async () => {
    await searchParticipants()
  }, 500)
}

const searchParticipants = async () => {
  if (!participantSearchQuery.value.trim()) {
    participantSearchResults.value = []
    return
  }
  
  participantSearchLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      search: participantSearchQuery.value.trim(),
      page: '1',
      page_size: '20'
    })
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/participants/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      participantSearchResults.value = data.participants || []
      showParticipantDropdown.value = true
    }
  } catch (err) {
    console.error('Error searching participants:', err)
    participantSearchResults.value = []
  } finally {
    participantSearchLoading.value = false
  }
}

const selectParticipant = (participant) => {
  selectedParticipant.value = participant
  cabinetForm.value.participant_id = participant.id
  participantSearchQuery.value = formatParticipantWithEmail(participant)
  showParticipantDropdown.value = false
}

const clearParticipant = () => {
  selectedParticipant.value = null
  cabinetForm.value.participant_id = null
  participantSearchQuery.value = ''
  participantSearchResults.value = []
  showParticipantDropdown.value = false
}

const handleSponsorSearch = () => {
  clearTimeout(sponsorSearchTimeout)
  
  if (!sponsorSearchQuery.value.trim()) {
    sponsorSearchResults.value = []
    showSponsorDropdown.value = false
    return
  }
  
  sponsorSearchTimeout = setTimeout(async () => {
    await searchSponsors()
  }, 500)
}

const searchSponsors = async () => {
  if (!sponsorSearchQuery.value.trim()) {
    sponsorSearchResults.value = []
    return
  }
  
  sponsorSearchLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      search: sponsorSearchQuery.value.trim(),
      page: '1',
      page_size: '20'
    })
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      sponsorSearchResults.value = data.cabinets || []
      showSponsorDropdown.value = true
    }
  } catch (err) {
    console.error('Error searching sponsors:', err)
    sponsorSearchResults.value = []
  } finally {
    sponsorSearchLoading.value = false
  }
}

const selectSponsor = (cabinet) => {
  selectedSponsor.value = cabinet
  cabinetForm.value.sponsor_id = cabinet.id
  sponsorSearchQuery.value = formatCabinetName(cabinet)
  showSponsorDropdown.value = false
}

const clearSponsor = () => {
  selectedSponsor.value = null
  cabinetForm.value.sponsor_id = null
  sponsorSearchQuery.value = ''
  sponsorSearchResults.value = []
  showSponsorDropdown.value = false
}

const resetForms = () => {
  participantForm.value = {
    email: '',
    password: '',
    name: '',
    lastname: '',
    patronymic: '',
    passport_info: {
      pin: '',
      passport_id: '',
      passport_issuer: '',
      passport_issue_date: '',
      bank: '',
      ip_inn: false,
      pensioner: false,
      phone_number: '',
      date_birth: ''
    }
  }
  
  cabinetForm.value = {
    participant_id: null,
    code: '',
    paket_id: null,
    branch_id: null,
    sponsor_id: null
  }
  
  showPassword.value = false
  clearParticipant()
  clearSponsor()
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForms()
    // Если передан предвыбранный участник, переключаемся на режим кабинета
    if (props.preselectedParticipant) {
      mode.value = 'cabinet'
      selectedParticipant.value = props.preselectedParticipant
      cabinetForm.value.participant_id = props.preselectedParticipant.id
      participantSearchQuery.value = formatParticipantWithEmail(props.preselectedParticipant)
    }
  } else {
    showParticipantDropdown.value = false
    showSponsorDropdown.value = false
  }
})

const handleClickOutside = (event) => {
  const target = event.target
  const participantInput = document.getElementById('search_participant')
  const participantDropdown = document.querySelector('.search-dropdown')
  const sponsorInput = document.getElementById('search_sponsor')
  
  if (participantInput && participantDropdown && 
      !participantInput.contains(target) && 
      !participantDropdown.contains(target)) {
    showParticipantDropdown.value = false
  }
  
  if (sponsorInput && participantDropdown && 
      !sponsorInput.contains(target) && 
      !participantDropdown.contains(target)) {
    showSponsorDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClose = () => {
  resetForms()
  emit('close')
}

const handleSave = async () => {
  if (mode.value === 'participant') {
    await saveParticipant()
  } else {
    await saveCabinet()
  }
}

const saveParticipant = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const payload = {
      email: participantForm.value.email,
      password: participantForm.value.password,
      name: participantForm.value.name || null,
      lastname: participantForm.value.lastname || null,
      patronymic: participantForm.value.patronymic || null,
      passport_info: {
        pin: participantForm.value.passport_info.pin || null,
        passport_id: participantForm.value.passport_info.passport_id || null,
        passport_issuer: participantForm.value.passport_info.passport_issuer || null,
        passport_issue_date: participantForm.value.passport_info.passport_issue_date || null,
        bank: participantForm.value.passport_info.bank || null,
        ip_inn: participantForm.value.passport_info.ip_inn,
        pensioner: participantForm.value.passport_info.pensioner,
        phone_number: participantForm.value.passport_info.phone_number || null,
        date_birth: participantForm.value.passport_info.date_birth || null
      }
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/participants/`, {
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

    resetForms()
    emit('success')
    emit('close')
  } catch (err) {
    emit('error', err.message || 'Ошибка при создании участника')
    console.error('Error adding participant:', err)
  }
}

const saveCabinet = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    if (!cabinetForm.value.participant_id) {
      throw new Error('Выберите участника')
    }

    const payload = {
      participant_id: cabinetForm.value.participant_id,
      code: cabinetForm.value.code,
      paket_id: cabinetForm.value.paket_id,
      branch_id: cabinetForm.value.branch_id,
      sponsor_id: cabinetForm.value.sponsor_id || null
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/`, {
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

    resetForms()
    emit('success')
    emit('close')
  } catch (err) {
    emit('error', err.message || 'Ошибка при создании кабинета')
    console.error('Error adding cabinet:', err)
  }
}
</script>

<style scoped>
.participant-form {
  max-height: 70vh;
  overflow-y: auto;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 0.25rem;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.participant-item:hover {
  background-color: #f8f9fa;
}

.participant-item .fw-semibold {
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.participant-item small {
  font-size: 0.85rem;
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
