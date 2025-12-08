<template>
  <FormModal
    :is-open="isOpen"
    :title="modalTitle"
    save-button-text="Сохранить"
    @save="handleSave"
    @close="handleClose"
  >
    <template #body>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
      </div>

      <form v-else @submit.prevent="handleSave">
        <!-- Переключатель режима -->
        <div class="mb-4 d-flex justify-content-center">
          <div class="mode-segmented-control">
            <button 
              type="button" 
              class="mode-segment"
              :class="{ 'mode-segment-active': mode === 'participant' }"
              @click="switchMode('participant')"
              :disabled="!participantId"
            >
              Редактировать участника
            </button>
            <button 
              type="button" 
              class="mode-segment"
              :class="{ 'mode-segment-active': mode === 'cabinet' }"
              @click="switchMode('cabinet')"
              :disabled="!cabinetId"
            >
              Редактировать кабинет
            </button>
          </div>
        </div>

        <!-- Режим: Участник -->
        <div v-if="mode === 'participant'">
          <h6 class="mb-3">Личные данные</h6>
          
          <div class="mb-3">
            <label for="edit_lastname" class="form-label">Фамилия</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_lastname" 
              v-model="participantForm.lastname"
              placeholder="Фамилия"
            />
          </div>

          <div class="mb-3">
            <label for="edit_name" class="form-label">Имя</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_name" 
              v-model="participantForm.name"
              placeholder="Имя"
            />
          </div>

          <div class="mb-3">
            <label for="edit_patronymic" class="form-label">Отчество</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_patronymic" 
              v-model="participantForm.patronymic"
              placeholder="Отчество"
            />
          </div>

          <div class="mb-3">
            <label for="edit_email" class="form-label">Email</label>
            <input 
              type="email" 
              class="form-control" 
              id="edit_email" 
              v-model="participantForm.email"
              placeholder="Email"
            />
          </div>

          <h6 class="mb-3 mt-4">Паспортные данные</h6>
          
          <div class="mb-3">
            <label for="edit_phone" class="form-label">Телефон</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_phone" 
              v-model="participantForm.passport_info.phone_number"
              placeholder="Номер телефона"
            />
          </div>

          <div class="mb-3">
            <label for="edit_dob" class="form-label">Дата рождения</label>
            <input 
              type="date" 
              class="form-control" 
              id="edit_dob" 
              v-model="participantForm.passport_info.date_birth"
            />
          </div>

          <div class="mb-3">
            <label for="edit_passport_id" class="form-label">Номер паспорта</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_passport_id" 
              v-model="participantForm.passport_info.passport_id"
              placeholder="Номер паспорта"
            />
          </div>

          <div class="mb-3">
            <label for="edit_pin" class="form-label">ПИН</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_pin" 
              v-model="participantForm.passport_info.pin"
              placeholder="ПИН"
            />
          </div>

          <div class="mb-3">
            <label for="edit_issuer" class="form-label">Кем выдан</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_issuer" 
              v-model="participantForm.passport_info.passport_issuer"
              placeholder="Кем выдан"
            />
          </div>

          <div class="mb-3">
            <label for="edit_issue_date" class="form-label">Дата выдачи</label>
            <input 
              type="date" 
              class="form-control" 
              id="edit_issue_date" 
              v-model="participantForm.passport_info.passport_issue_date"
            />
          </div>

          <div class="mb-3">
            <label for="edit_bank" class="form-label">Банк</label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_bank" 
              v-model="participantForm.passport_info.bank"
              placeholder="Банк"
            />
          </div>
        </div>

        <!-- Режим: Кабинет -->
        <div v-if="mode === 'cabinet'">
          <h6 class="mb-3">Данные кабинета</h6>
          
          <div class="mb-3">
            <label for="cabinet_branch" class="form-label">Филиал</label>
            <select 
              class="form-select" 
              id="cabinet_branch" 
              v-model.number="cabinetForm.branch_id"
            >
              <option :value="null">Выберите филиал</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }} ({{ branch.code }})
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label for="cabinet_paket" class="form-label">Пакет</label>
            <select 
              class="form-select" 
              id="cabinet_paket" 
              v-model.number="cabinetForm.paket_id"
            >
              <option :value="null">Выберите пакет</option>
              <option v-for="paket in pakets" :key="paket.id" :value="paket.id">
                {{ paket.name }} - {{ formatPrice(paket.price) }}
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
                :disabled="!!selectedSponsor"
                autocomplete="off"
              />
              <button 
                v-if="selectedSponsor"
                class="btn btn-link position-absolute end-0 top-0 text-decoration-none text-danger"
                type="button"
                @click="clearSponsor"
              >
                <i class="bi bi-x-lg"></i>
              </button>
              
              <!-- Выпадающий список спонсоров -->
              <div v-if="showSponsorDropdown && sponsorSearchResults.length > 0" class="dropdown-menu show w-100" style="max-height: 200px; overflow-y: auto;">
                <a 
                  v-for="sponsor in sponsorSearchResults" 
                  :key="sponsor.id"
                  class="dropdown-item" 
                  href="#"
                  @click.prevent="selectSponsor(sponsor)"
                >
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-semibold">{{ formatCabinetName(sponsor) }}</div>
                      <small class="text-muted">{{ sponsor.personal_number }}</small>
                    </div>
                  </div>
                </a>
              </div>
            </div>
            <div v-if="selectedSponsor" class="form-text text-success">
              Выбран спонсор: {{ formatCabinetName(selectedSponsor) }}
            </div>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger mt-3">
          {{ error }}
        </div>
      </form>
    </template>
  </FormModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import FormModal from './FormModal.vue'
import { BACKEND_API_URL } from '../config'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  cabinetId: {
    type: String,
    default: null
  },
  participantId: {
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

const emit = defineEmits(['close', 'success'])

const mode = ref('participant') // 'participant' or 'cabinet'
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const modalTitle = computed(() => {
  return mode.value === 'participant' ? 'Редактирование участника' : 'Редактирование кабинета'
})

// Participant Form Data
const participantForm = ref({
  email: '',
  name: '',
  lastname: '',
  patronymic: '',
  passport_info: {
    phone_number: '',
    date_birth: '',
    passport_id: '',
    pin: '',
    passport_issuer: '',
    passport_issue_date: '',
    bank: ''
  }
})

// Cabinet Form Data
const cabinetForm = ref({
  branch_id: null,
  paket_id: null,
  sponsor_id: null
})

// Sponsor Search
const sponsorSearchQuery = ref('')
const sponsorSearchResults = ref([])
const showSponsorDropdown = ref(false)
const selectedSponsor = ref(null)
const sponsorSearchLoading = ref(false)
let sponsorSearchTimeout = null

const switchMode = (newMode) => {
  mode.value = newMode
}

const formatCabinetName = (cabinet) => {
  if (!cabinet || !cabinet.participant) return '-'
  const name = `${cabinet.participant.lastname || ''} ${cabinet.participant.name || ''}`.trim()
  const personalNumber = cabinet.personal_number || '-'
  const sequenceNumber = cabinet.sequence_number || '-'
  return `${name} (${personalNumber}) - Кабинет №${sequenceNumber}`
}

const formatPrice = (price) => {
  if (!price) return '0.00'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2) + ' $'
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    
    // Load Participant Data
    if (props.participantId) {
      const pResponse = await fetch(`${BACKEND_API_URL}/api/admin/participants/${props.participantId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (pResponse.ok) {
        const pData = await pResponse.json()
        participantForm.value = {
          email: pData.email || '',
          name: pData.name || '',
          lastname: pData.lastname || '',
          patronymic: pData.patronymic || '',
          passport_info: {
            phone_number: pData.passport_info?.phone_number || '',
            date_birth: pData.passport_info?.date_birth ? pData.passport_info.date_birth.split('T')[0] : '',
            passport_id: pData.passport_info?.passport_id || '',
            pin: pData.passport_info?.pin || '',
            passport_issuer: pData.passport_info?.passport_issuer || '',
            passport_issue_date: pData.passport_info?.passport_issue_date ? pData.passport_info.passport_issue_date.split('T')[0] : '',
            bank: pData.passport_info?.bank || ''
          }
        }
      }
    }

    // Load Cabinet Data
    if (props.cabinetId) {
      const cResponse = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/${props.cabinetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (cResponse.ok) {
        const cData = await cResponse.json()
        cabinetForm.value = {
          branch_id: cData.branch_id,
          paket_id: cData.paket_id,
          sponsor_id: cData.sponsor_id
        }
        
        // Load sponsor details if exists
        if (cData.sponsor_id) {
          const sResponse = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/${cData.sponsor_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (sResponse.ok) {
            selectedSponsor.value = await sResponse.json()
            sponsorSearchQuery.value = formatCabinetName(selectedSponsor.value)
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading data:', err)
    error.value = 'Ошибка при загрузке данных'
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
  sponsorSearchTimeout = setTimeout(searchSponsors, 500)
}

const searchSponsors = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      search: sponsorSearchQuery.value.trim(),
      page: '1',
      page_size: '20'
    })
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      sponsorSearchResults.value = data.cabinets || []
      showSponsorDropdown.value = true
    }
  } catch (err) {
    console.error(err)
  }
}

const selectSponsor = (sponsor) => {
  selectedSponsor.value = sponsor
  cabinetForm.value.sponsor_id = sponsor.id
  sponsorSearchQuery.value = formatCabinetName(sponsor)
  showSponsorDropdown.value = false
}

const clearSponsor = () => {
  selectedSponsor.value = null
  cabinetForm.value.sponsor_id = null
  sponsorSearchQuery.value = ''
  showSponsorDropdown.value = false
}

const handleSave = async () => {
  saving.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    
    if (mode.value === 'participant' && props.participantId) {
      // Update Participant
      const response = await fetch(`${BACKEND_API_URL}/api/admin/participants/${props.participantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(participantForm.value)
      })
      if (!response.ok) throw new Error('Failed to update participant')
    } else if (mode.value === 'cabinet' && props.cabinetId) {
      // Update Cabinet
      const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/${props.cabinetId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cabinetForm.value)
      })
      if (!response.ok) throw new Error('Failed to update cabinet')
    }
    
    emit('success')
    handleClose()
  } catch (err) {
    console.error('Error saving:', err)
    error.value = 'Ошибка при сохранении'
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  emit('close')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    // Determine initial mode based on props
    if (props.cabinetId) {
      mode.value = 'cabinet'
    } else if (props.participantId) {
      mode.value = 'participant'
    }
    
    loadData()
  } else {
    // Reset state
    participantForm.value = {
      email: '',
      name: '',
      lastname: '',
      patronymic: '',
      passport_info: {
        phone_number: '',
        date_birth: '',
        passport_id: '',
        pin: '',
        passport_issuer: '',
        passport_issue_date: '',
        bank: ''
      }
    }
    cabinetForm.value = {
      branch_id: null,
      paket_id: null,
      sponsor_id: null
    }
    clearSponsor()
  }
})
</script>

<style scoped>
.mode-segmented-control {
  display: flex;
  background-color: #f1f3f5;
  padding: 4px;
  border-radius: 8px;
}

.mode-segment {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-segment-active {
  background-color: white;
  color: #000;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
