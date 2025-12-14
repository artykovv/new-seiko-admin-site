<template>
  <FormModal
    :is-open="isOpen"
    title="Редактировать участника"
    :save-button-text="'Сохранить'"
    @save="handleSave"
    @close="handleClose"
  >
    <template #body>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
      </div>

      <form v-else @submit.prevent="handleSave" class="participant-form">
        <!-- Индикатор этапов -->
        <div class="steps-container mb-4">
          <div class="steps-segmented-control">
            <div 
              class="step-segment"
              :class="{ 'step-segment-active': currentStep === 1 }"
              @click="currentStep = 1"
            >
              <span class="step-label">Учетные данные</span>
            </div>
            <div 
              class="step-segment"
              :class="{ 'step-segment-active': currentStep === 2 }"
              @click="currentStep = 2"
            >
              <span class="step-label">Личные данные</span>
            </div>
            <div 
              class="step-segment"
              :class="{ 'step-segment-active': currentStep === 3 }"
              @click="currentStep = 3"
            >
              <span class="step-label">Данные</span>
            </div>
          </div>
        </div>

        <!-- Ошибки -->
        <div v-if="error" class="alert alert-danger">
          {{ error }}
        </div>

        <!-- Этап 1: Учетные данные -->
        <div v-show="currentStep === 1">
          <h6 class="mb-3">Учетные данные</h6>
          
          <div class="mb-3">
            <label for="edit_email" class="form-label">Email</label>
            <input 
              type="email" 
              class="form-control" 
              id="edit_email" 
              v-model="formData.email"
              placeholder="user@example.com"
            />
          </div>

          <div class="mb-3">
            <label for="edit_password" class="form-label">Новый пароль</label>
            <div class="input-group">
              <input 
                :type="showPassword ? 'text' : 'password'"
                class="form-control" 
                id="edit_password" 
                v-model="formData.password"
                placeholder="Оставьте пустым, чтобы не менять"
              />
              <button 
                class="btn btn-outline-secondary" 
                type="button"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
            <small class="form-text text-muted">Оставьте пустым, если не хотите менять пароль</small>
          </div>

          <div class="mb-3">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="edit_is_active"
                v-model="formData.is_active"
              />
              <label class="form-check-label" for="edit_is_active">
                Активен (доступ в систему)
              </label>
            </div>
          </div>

          <div class="mb-3">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="edit_is_verified"
                v-model="formData.is_verified"
              />
              <label class="form-check-label" for="edit_is_verified">
                Верифицирован
              </label>
            </div>
          </div>
        </div>

        <!-- Этап 2: Личные данные -->
        <div v-show="currentStep === 2">
          <h6 class="mb-3">Личные данные</h6>
          
          <div class="mb-3">
            <label for="edit_lastname" class="form-label">Фамилия</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_lastname" 
              v-model="formData.lastname"
              placeholder="Фамилия"
            />
          </div>

          <div class="mb-3">
            <label for="edit_name" class="form-label">Имя</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_name" 
              v-model="formData.name"
              placeholder="Имя"
            />
          </div>

          <div class="mb-3">
            <label for="edit_patronymic" class="form-label">Отчество</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_patronymic" 
              v-model="formData.patronymic"
              placeholder="Отчество"
            />
          </div>

          <h6 class="mb-3 mt-4">Паспортные данные</h6>

          <div class="mb-3">
            <label for="edit_phone_number" class="form-label">Телефон</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_phone_number" 
              v-model="formData.passport_info.phone_number"
              placeholder="+996..."
            />
          </div>

          <div class="mb-3">
            <label for="edit_date_birth" class="form-label">Дата рождения</label>
            <input 
              type="date" 
              class="form-control" 
              id="edit_date_birth" 
              v-model="formData.passport_info.date_birth"
            />
          </div>

          <div class="mb-3">
            <label for="edit_passport_id" class="form-label">Номер документа</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_passport_id" 
              v-model="formData.passport_info.passport_id"
              placeholder="Номер паспорта"
            />
          </div>

          <div class="mb-3">
            <label for="edit_pin" class="form-label">ПИН</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_pin" 
              v-model="formData.passport_info.pin"
              placeholder="ПИН"
            />
          </div>

          <div class="mb-3">
            <label for="edit_passport_issuer" class="form-label">Орган выдачи</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_passport_issuer" 
              v-model="formData.passport_info.passport_issuer"
              placeholder="Кем выдан"
            />
          </div>

          <div class="mb-3">
            <label for="edit_passport_issue_date" class="form-label">Дата выдачи</label>
            <input 
              type="date" 
              class="form-control" 
              id="edit_passport_issue_date" 
              v-model="formData.passport_info.passport_issue_date"
            />
          </div>

          <div class="mb-3">
            <label for="edit_bank" class="form-label">Банк</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_bank" 
              v-model="formData.passport_info.bank"
              placeholder="Название банка / Реквизиты"
            />
          </div>

          <div class="mb-3">
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="edit_ip_inn"
                v-model="formData.passport_info.ip_inn"
              />
              <label class="form-check-label" for="edit_ip_inn">
                ИП/ИНН
              </label>
            </div>
          </div>

          <div class="mb-3">
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="edit_pensioner"
                v-model="formData.passport_info.pensioner"
              />
              <label class="form-check-label" for="edit_pensioner">
                Пенсионер
              </label>
            </div>
          </div>
        </div>

        <!-- Этап 3: Данные -->
        <div v-show="currentStep === 3">
          <h6 class="mb-3">Данные</h6>
          
          <div class="mb-3">
            <label for="edit_code" class="form-label">Код</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_code" 
              v-model="formData.cabinet.code"
              placeholder="Код"
              maxlength="5"
              disabled
            />
            <small class="form-text text-muted">Код нельзя изменить</small>
          </div>

          <div class="mb-3">
            <label class="form-label">Персональный номер</label>
            <input 
              type="text" 
              class="form-control" 
              :value="personalNumber"
              disabled
            />
          </div>

          <div class="mb-3">
            <label for="edit_paket" class="form-label">Пакет</label>
            <div class="d-flex gap-2">
              <select 
                class="form-select" 
                id="edit_paket" 
                v-model.number="formData.cabinet.paket_id"
                :disabled="isRegistered"
              >
                <option :value="null">Выберите пакет</option>
                <option v-for="paket in pakets" :key="paket.id" :value="paket.id">
                  {{ paket.name }} - {{ formatPrice(paket.price) }}
                </option>
              </select>
              <button 
                v-if="isRegistered"
                type="button"
                class="btn btn-primary"
                style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128); white-space: nowrap;"
                @click="handleUpgrade"
              >
                <i class="bi bi-arrow-up-circle me-1"></i>
                Upgrade
              </button>
            </div>
            <small v-if="isRegistered" class="form-text text-warning">
              <i class="bi bi-info-circle me-1"></i>
              Пакет нельзя изменить для зарегистрированных пользователей. Используйте кнопку Upgrade.
            </small>
          </div>

          <div class="mb-3">
            <label for="edit_branch" class="form-label">Филиал</label>
            <select 
              class="form-select" 
              id="edit_branch" 
              v-model.number="formData.cabinet.branch_id"
            >
              <option :value="null">Выберите филиал</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }} ({{ branch.code }})
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label for="edit_sponsor" class="form-label">Спонсор</label>
            <div class="position-relative">
              <input 
                type="text" 
                class="form-control" 
                id="edit_sponsor"
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
            <small class="form-text text-muted">Текущий спонсор: {{ currentSponsorName }}</small>
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
  cabinetId: {
    type: String,
    default: null
  },
  branches: {
    type: Array,
    default: () => []
  },
  pakets: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'success', 'upgrade'])

const currentStep = ref(1)
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const personalNumber = ref('')
const currentSponsorName = ref('-')
const isRegistered = ref(false)

const formData = ref({
  email: '',
  password: '',
  name: '',
  lastname: '',
  patronymic: '',
  is_active: true,
  is_verified: false,
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
  },
  cabinet: {
    code: '',
    paket_id: null,
    branch_id: null,
    sponsor_id: null
  }
})

// Поиск спонсора
const sponsorSearchQuery = ref('')
const sponsorSearchResults = ref([])
const sponsorSearchLoading = ref(false)
const showSponsorDropdown = ref(false)
const selectedSponsor = ref(null)
let sponsorSearchTimeout = null

const formatCabinetName = (cabinet) => {
  if (!cabinet || !cabinet.participant) return '-'
  const name = formatParticipantName(cabinet.participant)
  const personalNumber = cabinet.personal_number || '-'
  return `${name} (${personalNumber})`
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

const formatPrice = (price) => {
  if (!price) return '0.00'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2) + ' $'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return dateString.split('T')[0]
}

const loadData = async () => {
  if (!props.cabinetId) return
  
  loading.value = true
  error.value = ''
  
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/with-participant/${props.cabinetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Ошибка загрузки данных')
    }
    
    const data = await response.json()
    
    // Заполняем форму
    formData.value = {
      email: data.participant.email || '',
      password: '',
      name: data.participant.name || '',
      lastname: data.participant.lastname || '',
      patronymic: data.participant.patronymic || '',
      is_active: data.participant.is_active,
      is_verified: data.participant.is_verified,
      passport_info: {
        pin: data.participant.passport_info?.pin || '',
        passport_id: data.participant.passport_info?.passport_id || '',
        passport_issuer: data.participant.passport_info?.passport_issuer || '',
        passport_issue_date: formatDate(data.participant.passport_info?.passport_issue_date) || '',
        bank: data.participant.passport_info?.bank || '',
        ip_inn: data.participant.passport_info?.ip_inn || false,
        pensioner: data.participant.passport_info?.pensioner || false,
        phone_number: data.participant.passport_info?.phone_number || '',
        date_birth: formatDate(data.participant.passport_info?.date_birth) || ''
      },
      cabinet: {
        code: data.code || '',
        paket_id: data.paket_id,
        branch_id: data.branch_id,
        sponsor_id: data.sponsor_id
      }
    }
    
    personalNumber.value = data.personal_number || ''
    isRegistered.value = data.registered || false
    
    // Устанавливаем текущего спонсора
    if (data.sponsor) {
      currentSponsorName.value = formatCabinetName(data.sponsor)
      sponsorSearchQuery.value = currentSponsorName.value
      selectedSponsor.value = data.sponsor
    } else {
      currentSponsorName.value = 'Нет спонсора'
      sponsorSearchQuery.value = ''
    }
  } catch (err) {
    console.error('Error loading data:', err)
    error.value = err.message || 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
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
  formData.value.cabinet.sponsor_id = cabinet.id
  sponsorSearchQuery.value = formatCabinetName(cabinet)
  showSponsorDropdown.value = false
}

const handleUpgrade = () => {
  emit('upgrade', {
    cabinetId: props.cabinetId,
    currentPaketId: formData.value.cabinet.paket_id
  })
}

const handleClose = () => {
  currentStep.value = 1
  error.value = ''
  showPassword.value = false
  emit('close')
}

const handleSave = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const payload = {
      email: formData.value.email,
      name: formData.value.name || null,
      lastname: formData.value.lastname || null,
      patronymic: formData.value.patronymic || null,
      is_active: formData.value.is_active,
      is_verified: formData.value.is_verified,
      passport_info: {
        pin: formData.value.passport_info.pin || null,
        passport_id: formData.value.passport_info.passport_id || null,
        passport_issuer: formData.value.passport_info.passport_issuer || null,
        passport_issue_date: formData.value.passport_info.passport_issue_date || null,
        bank: formData.value.passport_info.bank || null,
        ip_inn: formData.value.passport_info.ip_inn,
        pensioner: formData.value.passport_info.pensioner,
        phone_number: formData.value.passport_info.phone_number || null,
        date_birth: formData.value.passport_info.date_birth || null
      },
      cabinet: {
        code: formData.value.cabinet.code,
        paket_id: formData.value.cabinet.paket_id,
        branch_id: formData.value.cabinet.branch_id,
        sponsor_id: formData.value.cabinet.sponsor_id || null
      }
    }

    // Добавляем пароль только если он заполнен
    if (formData.value.password && formData.value.password.trim()) {
      payload.password = formData.value.password
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/with-participant/${props.cabinetId}`, {
      method: 'PATCH',
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
      throw new Error(errorData.detail || `Ошибка обновления: ${response.status}`)
    }

    emit('success')
    emit('close')
  } catch (err) {
    error.value = err.message || 'Ошибка при сохранении'
    console.error('Error saving:', err)
  }
}

watch(() => props.isOpen, (newValue) => {
  if (newValue && props.cabinetId) {
    loadData()
  } else {
    showSponsorDropdown.value = false
  }
})

const handleClickOutside = (event) => {
  const target = event.target
  const sponsorInput = document.getElementById('sponsor')
  const sponsorDropdown = document.querySelector('.search-dropdown')
  
  if (sponsorInput && sponsorDropdown && 
      !sponsorInput.contains(target) && 
      !sponsorDropdown.contains(target)) {
    showSponsorDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.participant-form {
  max-height: 70vh;
  overflow-y: auto;
}

/* Steps Indicator - Navbar Style */
.steps-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.steps-segmented-control {
  display: inline-flex;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  gap: 0;
}

.step-segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 10px 20px;
  color: #6c757d;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  position: relative;
  user-select: none;
  cursor: pointer;
}

.step-segment .step-label {
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.step-segment-active {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.step-segment-active .step-label {
  color: rgb(0, 0, 128);
  font-weight: 600;
}

.step-segment:hover:not(.step-segment-active) {
  background-color: rgba(0, 0, 128, 0.05);
}

/* Search Dropdown */
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
</style>
