<template>
  <FormModal
    :is-open="isOpen"
    title="Добавить участника"
    :save-button-text="currentStep === 3 ? 'Создать' : 'Далее'"
    @save="handleNext"
    @close="handleClose"
  >
    <template #body>
      <form @submit.prevent="handleNext" class="participant-form">
        <!-- Индикатор этапов -->
        <div class="steps-container mb-4">
          <div class="steps-segmented-control">
            <div 
              class="step-segment"
              :class="{ 'step-segment-active': currentStep === 1, 'step-segment-completed': currentStep > 1 }"
              @click="currentStep > 1 && (currentStep = 1)"
              :style="{ cursor: currentStep > 1 ? 'pointer' : 'default' }"
            >
              <span class="step-number">1</span>
              <span class="step-label">Учетные данные</span>
            </div>
            <div 
              class="step-segment"
              :class="{ 'step-segment-active': currentStep === 2, 'step-segment-completed': currentStep > 2 }"
              @click="currentStep > 2 && (currentStep = 2)"
              :style="{ cursor: currentStep > 2 ? 'pointer' : 'default' }"
            >
              <span class="step-number">2</span>
              <span class="step-label">Личные данные</span>
            </div>
            <div 
              class="step-segment"
              :class="{ 'step-segment-active': currentStep === 3 }"
            >
              <span class="step-number">3</span>
              <span class="step-label">Данные</span>
            </div>
          </div>
        </div>

        <!-- Ошибки валидации -->
        <div v-if="validationErrors.length > 0" class="alert alert-danger">
          <ul class="mb-0">
            <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
          </ul>
        </div>

        <!-- Этап 1: Учетные данные -->
        <div v-show="currentStep === 1">
          <h6 class="mb-3">Учетные данные</h6>
          
          <div class="mb-3">
            <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
            <input 
              type="email" 
              class="form-control" 
              id="email" 
              v-model="formData.email"
              placeholder="user@example.com"
            />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Пароль <span class="text-danger">*</span></label>
            <div class="input-group">
              <input 
                :type="showPassword ? 'text' : 'password'"
                class="form-control" 
                id="password" 
                v-model="formData.password"
                placeholder="Введите пароль"
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
        </div>

        <!-- Этап 2: Личные данные -->
        <div v-show="currentStep === 2">
          <h6 class="mb-3">Личные данные</h6>
          
          <div class="mb-3">
            <label for="lastname" class="form-label">Фамилия</label>
            <input 
              type="text" 
              class="form-control" 
              id="lastname" 
              v-model="formData.lastname"
              placeholder="Фамилия"
            />
          </div>

          <div class="mb-3">
            <label for="name" class="form-label">Имя</label>
            <input 
              type="text" 
              class="form-control" 
              id="name" 
              v-model="formData.name"
              placeholder="Имя"
            />
          </div>

          <div class="mb-3">
            <label for="patronymic" class="form-label">Отчество</label>
            <input 
              type="text" 
              class="form-control" 
              id="patronymic" 
              v-model="formData.patronymic"
              placeholder="Отчество"
            />
          </div>

          <h6 class="mb-3 mt-4">Паспортные данные</h6>

          <div class="mb-3">
            <label for="phone_number" class="form-label">Телефон</label>
            <input 
              type="text" 
              class="form-control" 
              id="phone_number" 
              v-model="formData.passport_info.phone_number"
              placeholder="+996..."
            />
          </div>

          <div class="mb-3">
            <label for="date_birth" class="form-label">Дата рождения</label>
            <input 
              type="date" 
              class="form-control" 
              id="date_birth" 
              v-model="formData.passport_info.date_birth"
            />
          </div>

          <div class="mb-3">
            <label for="passport_id" class="form-label">Номер документа</label>
            <input 
              type="text" 
              class="form-control" 
              id="passport_id" 
              v-model="formData.passport_info.passport_id"
              placeholder="Номер паспорта"
            />
          </div>

          <div class="mb-3">
            <label for="pin" class="form-label">ПИН</label>
            <input 
              type="text" 
              class="form-control" 
              id="pin" 
              v-model="formData.passport_info.pin"
              placeholder="ПИН"
            />
          </div>

          <div class="mb-3">
            <label for="passport_issuer" class="form-label">Орган выдачи</label>
            <input 
              type="text" 
              class="form-control" 
              id="passport_issuer" 
              v-model="formData.passport_info.passport_issuer"
              placeholder="Кем выдан"
            />
          </div>

          <div class="mb-3">
            <label for="passport_issue_date" class="form-label">Дата выдачи</label>
            <input 
              type="date" 
              class="form-control" 
              id="passport_issue_date" 
              v-model="formData.passport_info.passport_issue_date"
            />
          </div>

          <div class="mb-3">
            <label for="bank" class="form-label">Банк</label>
            <input 
              type="text" 
              class="form-control" 
              id="bank" 
              v-model="formData.passport_info.bank"
              placeholder="Название банка / Реквизиты"
            />
          </div>

          <div class="mb-3">
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="ip_inn"
                v-model="formData.passport_info.ip_inn"
              />
              <label class="form-check-label" for="ip_inn">
                ИП/ИНН
              </label>
            </div>
          </div>

          <div class="mb-3">
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="pensioner"
                v-model="formData.passport_info.pensioner"
              />
              <label class="form-check-label" for="pensioner">
                Пенсионер
              </label>
            </div>
          </div>
        </div>

        <!-- Этап 3: Данные -->
        <div v-show="currentStep === 3">
          <h6 class="mb-3">Данные</h6>
          
          <div class="mb-3">
            <label for="code" class="form-label">Код <span class="text-danger">*</span></label>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                id="code" 
                v-model="formData.cabinet.code"
                placeholder="Введите код"
                maxlength="5"
              />
              <button 
                class="btn btn-outline-secondary" 
                type="button"
                @click="generateCode"
                title="Сгенерировать новый код"
              >
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
            <small class="form-text text-muted">Формат: 2 буквы + 3 цифры (например: AB123)</small>
          </div>

          <div class="mb-3">
            <label for="paket" class="form-label">Пакет <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              id="paket" 
              v-model.number="formData.cabinet.paket_id"
            >
              <option :value="null">Выберите пакет</option>
              <option v-for="paket in pakets" :key="paket.id" :value="paket.id">
                {{ paket.name }} - {{ formatPrice(paket.price) }}
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label for="branch" class="form-label">Филиал <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              id="branch" 
              v-model.number="formData.cabinet.branch_id"
            >
              <option :value="null">Выберите филиал</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }} ({{ branch.code }})
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label for="sponsor" class="form-label">Спонсор</label>
            <div class="position-relative">
              <input 
                type="text" 
                class="form-control" 
                id="sponsor"
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

        <!-- Кнопки навигации -->
        <div class="d-flex justify-content-between mt-4">
          <button 
            v-if="currentStep > 1"
            type="button" 
            class="btn btn-secondary"
            @click="previousStep"
          >
            <i class="bi bi-arrow-left me-1"></i>
            Назад
          </button>
          <div v-else></div>
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

const currentStep = ref(1)
const showPassword = ref(false)
const validationErrors = ref([])

const formData = ref({
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

const generateCode = () => {
  // Генерируем 2 случайные заглавные буквы
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letter1 = letters.charAt(Math.floor(Math.random() * letters.length))
  const letter2 = letters.charAt(Math.floor(Math.random() * letters.length))
  
  // Генерируем 3 случайные цифры
  const num1 = Math.floor(Math.random() * 10)
  const num2 = Math.floor(Math.random() * 10)
  const num3 = Math.floor(Math.random() * 10)
  
  // Формируем код
  formData.value.cabinet.code = `${letter1}${letter2}${num1}${num2}${num3}`
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

const validateStep1 = () => {
  const errors = []
  if (!formData.value.email || !formData.value.email.trim()) {
    errors.push('Email обязателен для заполнения')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.push('Введите корректный email')
  }
  if (!formData.value.password || !formData.value.password.trim()) {
    errors.push('Пароль обязателен для заполнения')
  } else if (formData.value.password.length < 6) {
    errors.push('Пароль должен содержать минимум 6 символов')
  }
  return errors
}

const validateStep2 = () => {
  const errors = []
  // Этап 2 не имеет обязательных полей, но можно добавить валидацию при необходимости
  return errors
}

const validateStep3 = () => {
  const errors = []
  if (!formData.value.cabinet.code || !formData.value.cabinet.code.trim()) {
    errors.push('Код обязателен для заполнения')
  }
  if (!formData.value.cabinet.paket_id) {
    errors.push('Выберите пакет')
  }
  if (!formData.value.cabinet.branch_id) {
    errors.push('Выберите филиал')
  }
  return errors
}

const handleNext = () => {
  validationErrors.value = []
  
  if (currentStep.value === 1) {
    const errors = validateStep1()
    if (errors.length > 0) {
      validationErrors.value = errors
      return
    }
    currentStep.value = 2
  } else if (currentStep.value === 2) {
    const errors = validateStep2()
    if (errors.length > 0) {
      validationErrors.value = errors
      return
    }
    currentStep.value = 3
    // Автоматически генерируем код, если он пустой
    if (!formData.value.cabinet.code) {
      generateCode()
    }
  } else if (currentStep.value === 3) {
    const errors = validateStep3()
    if (errors.length > 0) {
      validationErrors.value = errors
      return
    }
    handleSave()
  }
}

const previousStep = () => {
  validationErrors.value = []
  if (currentStep.value > 1) {
    currentStep.value--
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

const clearSponsor = () => {
  selectedSponsor.value = null
  formData.value.cabinet.sponsor_id = null
  sponsorSearchQuery.value = ''
  sponsorSearchResults.value = []
  showSponsorDropdown.value = false
}

const resetForm = () => {
  currentStep.value = 1
  validationErrors.value = []
  formData.value = {
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
    },
    cabinet: {
      code: '',
      paket_id: null,
      branch_id: null,
      sponsor_id: null
    }
  }
  showPassword.value = false
  clearSponsor()
}

const handleClose = () => {
  resetForm()
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
      password: formData.value.password,
      name: formData.value.name || null,
      lastname: formData.value.lastname || null,
      patronymic: formData.value.patronymic || null,
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

    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/with-participant`, {
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

    resetForm()
    emit('success')
    emit('close')
  } catch (err) {
    emit('error', err.message || 'Ошибка при создании участника')
    console.error('Error adding participant:', err)
  }
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm()
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
}

.step-segment .step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #dee2e6;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
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

.step-segment-active .step-number {
  background-color: rgb(0, 0, 128);
  color: white;
}

.step-segment-active .step-label {
  color: rgb(0, 0, 128);
  font-weight: 600;
}

.step-segment-completed {
  color: #28a745;
}

.step-segment-completed .step-number {
  background-color: #28a745;
  color: white;
}

.step-segment-completed .step-label {
  color: #495057;
}

.step-segment-completed:hover {
  background-color: rgba(40, 167, 69, 0.1);
  transition: background-color 0.2s ease;
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
