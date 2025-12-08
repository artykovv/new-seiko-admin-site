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
          <h5 class="modal-title">Просмотр участника</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="handleClose"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
          </div>

          <div v-else-if="participantData" class="participant-view">
            <!-- Основная информация -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2">Основная информация</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="text-muted small">ФИО</label>
                  <div class="fw-semibold">{{ formatFullName(participantData) }}</div>
                </div>
                <div class="col-md-4">
                  <label class="text-muted small">Email</label>
                  <div>{{ participantData.email || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="text-muted small d-block">Доступ в систему</label>
                  <div class="form-check form-switch">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      role="switch" 
                      id="activeStatusSwitch"
                      v-model="participantData.is_active"
                      @change="updateActiveStatus"
                      :disabled="updatingStatus"
                      style="cursor: pointer;"
                    >
                    <label class="form-check-label" for="activeStatusSwitch" style="cursor: pointer;">
                      {{ participantData.is_active ? 'Активен' : 'Неактивен' }}
                    </label>
                    <span v-if="updatingStatus" class="spinner-border spinner-border-sm ms-2" role="status">
                      <span class="visually-hidden">Загрузка...</span>
                    </span>
                  </div>
                  <small class="text-muted">При отключении не сможет попасть в систему</small>
                </div>
              </div>
            </div>

            <!-- Паспортные данные -->
            <div v-if="participantData.passport_info" class="mb-4">
              <h6 class="mb-3 border-bottom pb-2">Паспортные данные</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="text-muted small">Дата рождения</label>
                  <div>{{ formatDate(participantData.passport_info.date_birth) }}</div>
                </div>
                <div class="col-md-4">
                  <label class="text-muted small">Номер документа</label>
                  <div>{{ participantData.passport_info.passport_id || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="text-muted small">Орган выдачи</label>
                  <div>{{ participantData.passport_info.passport_issuer || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="text-muted small">Дата выдачи</label>
                  <div>{{ formatDate(participantData.passport_info.passport_issue_date) }}</div>
                </div>
                <div class="col-md-4">
                  <label class="text-muted small">Телефон</label>
                  <div>{{ participantData.passport_info.phone_number || '-' }}</div>
                </div>
                <div class="col-md-4">
                  <label class="text-muted small">Банк</label>
                  <div>{{ participantData.passport_info.bank || '-' }}</div>
                </div>
              </div>
            </div>

            <!-- Кабинеты -->
            <div v-if="cabinets && cabinets.length > 0" class="mb-4">
              <h6 class="mb-3 border-bottom pb-2">Кабинеты ({{ cabinets.length }})</h6>
              <div class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Код</th>
                      <th>Персональный номер</th>
                      <th>№ кабинета</th>
                      <th>Филиал</th>
                      <th>Пакет</th>
                      <th>Статус</th>
                      <th>Зарегистрирован</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cabinet in cabinets" :key="cabinet.id">
                      <td>{{ cabinet.code }}</td>
                      <td>
                        <button 
                          class="btn btn-link p-0 text-decoration-none"
                          @click="handleCabinetDetailsClick(cabinet.id)"
                          style="cursor: pointer;"
                        >
                          {{ cabinet.personal_number }}
                        </button>
                      </td>
                      <td>{{ cabinet.sequence_number }}</td>
                      <td>{{ cabinet.branch?.name || '-' }}</td>
                      <td>{{ cabinet.paket?.name || '-' }}</td>
                      <td>{{ cabinet.status?.name || '-' }}</td>
                      <td>
                        <span 
                          class="badge"
                          :class="cabinet.registered ? 'bg-success' : 'bg-warning'"
                        >
                          {{ cabinet.registered ? 'Да' : 'Нет' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Дополнительная информация -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2">Дополнительная информация</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="text-muted small">Дата создания</label>
                  <div>{{ formatDateTime(participantData.created_at) }}</div>
                </div>
                <div class="col-md-6" v-if="participantData.updated_at">
                  <label class="text-muted small">Последнее обновление</label>
                  <div>{{ formatDateTime(participantData.updated_at) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted py-5">
            Данные не найдены
          </div>
        </div>
        <div class="modal-footer">
          <button 
            v-if="participantData"
            type="button" 
            class="btn btn-primary me-auto"
            style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
            @click="handleOpenAddCabinet"
          >
            <i class="bi bi-plus-circle me-1"></i>
            Добавить кабинет
          </button>
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

  <!-- Модальное окно информации о кабинете -->
  <CabinetDetailsModal
    :is-open="cabinetDetailsModalOpen"
    :cabinet-id="selectedCabinetId"
    @close="closeCabinetDetailsModal"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import CabinetDetailsModal from './CabinetDetailsModal.vue'
import { BACKEND_API_URL } from '../config'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  participantId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'openAddCabinet'])

const loading = ref(false)
const participantData = ref(null)
const cabinets = ref([])
const updatingStatus = ref(false)

// Cabinet details modal
const cabinetDetailsModalOpen = ref(false)
const selectedCabinetId = ref(null)

const formatFullName = (participant) => {
  if (!participant) return '-'
  const parts = []
  if (participant.lastname) parts.push(participant.lastname)
  if (participant.name) parts.push(participant.name)
  if (participant.patronymic) parts.push(participant.patronymic)
  return parts.length > 0 ? parts.join(' ') : '-'
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

const loadParticipantData = async () => {
  if (!props.participantId) return
  
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    
    // Загружаем данные участника
    const participantResponse = await fetch(`${BACKEND_API_URL}/api/admin/participants/${props.participantId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (participantResponse.ok) {
      participantData.value = await participantResponse.json()
    }
    
    // Загружаем кабинеты участника
    const cabinetsResponse = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/?participant_id=${props.participantId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (cabinetsResponse.ok) {
      const cabinetsData = await cabinetsResponse.json()
      cabinets.value = cabinetsData.cabinets || cabinetsData || []
    }
  } catch (error) {
    console.error('Error loading participant data:', error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  participantData.value = null
  cabinets.value = []
  emit('close')
}

const handleOpenAddCabinet = () => {
  if (participantData.value) {
    emit('openAddCabinet', participantData.value)
  }
}

const handleCabinetDetailsClick = (cabinetId) => {
  selectedCabinetId.value = cabinetId
  cabinetDetailsModalOpen.value = true
}

const closeCabinetDetailsModal = () => {
  cabinetDetailsModalOpen.value = false
  selectedCabinetId.value = null
}

const updateActiveStatus = async () => {
  if (!participantData.value) return
  
  updatingStatus.value = true
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/participants/${participantData.value.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        is_active: participantData.value.is_active
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update status')
    }
    
    // Обновляем данные участника
    const updatedData = await response.json()
    participantData.value = updatedData
  } catch (error) {
    console.error('Error updating status:', error)
    // Откатываем изменения при ошибке
    participantData.value.is_active = !participantData.value.is_active
  } finally {
    updatingStatus.value = false
  }
}

watch(() => props.isOpen, (newValue) => {
  if (newValue && props.participantId) {
    loadParticipantData()
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

.participant-view {
  max-height: 70vh;
  overflow-y: auto;
}

.table {
  font-size: 0.9rem;
}

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
  white-space: nowrap;
}

.table td {
  vertical-align: middle;
}
</style>
