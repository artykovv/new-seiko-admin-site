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
          <h5 class="modal-title">Информация о кабинете</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="handleClose"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
          </div>

          <div v-else-if="cabinetInfo">
            <!-- Основная информация -->
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title mb-3">Участник</h6>
                    <p class="mb-1"><strong>ФИО:</strong> {{ formatFullName(cabinetInfo.participant) }}</p>
                    <p class="mb-1"><strong>Номер кабинета:</strong> {{ cabinetInfo.sequence_number }}</p>
                    <p class="mb-1"><strong>Персональный номер:</strong> {{ cabinetInfo.personal_number }}</p>
                    <p class="mb-0"><strong>Код:</strong> {{ cabinetInfo.code }}</p>
                    <hr class="my-2">
                    <p class="mb-1"><strong>Спонсор:</strong> {{ cabinetInfo.sponsor ? formatFullName(cabinetInfo.sponsor.participant) : '-' }}</p>
                    <p class="mb-1"><strong>Номер спонсора:</strong> {{ cabinetInfo.sponsor?.personal_number || '-' }}</p>
                    <p class="mb-0"><strong>Кабинет спонсора:</strong> {{ cabinetInfo.sponsor?.sequence_number || '-' }}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title mb-3">Пакет и статус</h6>
                    <p class="mb-1"><strong>Пакет:</strong> {{ cabinetInfo.paket?.name || '-' }}</p>
                    <p class="mb-1"><strong>Цена пакета:</strong> {{ cabinetInfo.paket?.price || '-' }}</p>
                    <p class="mb-1"><strong>Статус:</strong> {{ cabinetInfo.status?.name || '-' }}</p>
                    <p class="mb-0"><strong>Филиал:</strong> {{ cabinetInfo.branch?.name || '-' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Обороты -->
            <div class="mb-3">
              <h6 class="mb-3">Обороты</h6>
              
              <!-- Переключатель периода -->
              <div class="segmented-control mb-3" style="max-width: 400px;">
                <input 
                  type="radio" 
                  id="period-all" 
                  value="all" 
                  v-model="selectedPeriod"
                  @change="loadTurnover"
                  class="segmented-control-input"
                />
                <label for="period-all" class="segmented-control-label">
                  За все время
                </label>
                
                <input 
                  type="radio" 
                  id="period-month" 
                  value="month" 
                  v-model="selectedPeriod"
                  @change="loadTurnover"
                  class="segmented-control-input"
                />
                <label for="period-month" class="segmented-control-label">
                  Текущий месяц
                </label>
              </div>

              <div v-if="turnoverLoading" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
              </div>

              <div v-else-if="turnoverData">
                <!-- Сводка -->
                <div class="row g-3 mb-4">
                  <div class="col-md-3">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <div class="text-muted small mb-1">Левая ветка</div>
                        <div class="fs-5 fw-bold">{{ turnoverData.summary.left_volume }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <div class="text-muted small mb-1">Правая ветка</div>
                        <div class="fs-5 fw-bold">{{ turnoverData.summary.right_volume }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="card bg-warning bg-opacity-10">
                      <div class="card-body text-center">
                        <div class="text-muted small mb-1">Слабая нога</div>
                        <div class="fs-5 fw-bold text-warning">{{ turnoverData.summary.weak_leg }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="card bg-success bg-opacity-10">
                      <div class="card-body text-center">
                        <div class="text-muted small mb-1">Всего</div>
                        <div class="fs-5 fw-bold text-success">{{ turnoverData.summary.total_volume }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
import { ref, watch } from 'vue'
import { BACKEND_API_URL } from '../config'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  cabinetId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const turnoverLoading = ref(false)
const cabinetInfo = ref(null)
const turnoverData = ref(null)
const selectedPeriod = ref('all')

const formatFullName = (participant) => {
  if (!participant) return '-'
  return `${participant.lastname || ''} ${participant.name || ''} ${participant.patronymic || ''}`.trim()
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

const getCurrentMonthDates = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  const dateFrom = new Date(year, month, 1)
  const dateTo = new Date(year, month + 1, 0)
  
  const formatDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  
  return {
    from: formatDate(dateFrom),
    to: formatDate(dateTo)
  }
}

const loadCabinetInfo = async () => {
  if (!props.cabinetId) return
  
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/${props.cabinetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to load cabinet info')
    
    cabinetInfo.value = await response.json()
    await loadTurnover()
  } catch (error) {
    console.error('Error loading cabinet info:', error)
  } finally {
    loading.value = false
  }
}

const loadTurnover = async () => {
  if (!props.cabinetId) return
  
  turnoverLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    let url = `${BACKEND_API_URL}/api/admin/cabinets/turnover/${props.cabinetId}?side=ALL`
    
    if (selectedPeriod.value === 'month') {
      const { from, to } = getCurrentMonthDates()
      url += `&date_from=${from}&date_to=${to}`
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to load turnover')
    
    turnoverData.value = await response.json()
  } catch (error) {
    console.error('Error loading turnover:', error)
  } finally {
    turnoverLoading.value = false
  }
}

const handleClose = () => {
  emit('close')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.cabinetId) {
    loadCabinetInfo()
  } else {
    cabinetInfo.value = null
    turnoverData.value = null
    selectedPeriod.value = 'all'
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

/* Segmented Control */
.segmented-control {
  display: inline-flex;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
  width: 100%;
}

.segmented-control-input {
  display: none;
}

.segmented-control-label {
  flex: 1;
  padding: 8px 16px;
  text-align: center;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  user-select: none;
}

.segmented-control-input:checked + .segmented-control-label {
  background-color: white;
  color: #000080;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.segmented-control-label:hover {
  color: #495057;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
