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
          <h5 class="modal-title">Добавить в структуру</h5>
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

          <div v-else-if="participantInfo && participantInfo.registered" class="alert alert-warning">
            Нельзя повторно добавить участника: он уже находится в структуре.
          </div>

          <div v-else class="row">
            <!-- Информация об участнике -->
            <div class="col-12 mb-3">
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">Добавляемый участник</h6>
                  <p class="mb-1"><strong>Номер:</strong> {{ participantInfo.personal_number || '-' }}</p>
                  <p class="mb-1"><strong>ФИО:</strong> {{ formatFullName(participantInfo.participant) }}</p>
                  <p class="mb-0"><strong>Номер кабинета:</strong> {{ participantInfo.sequence_number || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Информация о спонсоре
            <div v-if="sponsorInfo" class="col-12 mb-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h6 class="card-title">Спонсор</h6>
                  <p class="mb-1"><strong>Номер:</strong> {{ sponsorInfo.personal_number || '-' }}</p>
                  <p class="mb-1"><strong>ФИО:</strong> {{ formatFullName(sponsorInfo.participant) }}</p>
                  <p class="mb-0"><strong>Номер кабинета:</strong> {{ sponsorInfo.sequence_number || '-' }}</p>
                </div>
              </div>
            </div> -->

            <!-- Список доступных позиций -->
            <div class="col-md-6">
              <h6 class="mb-3">Доступные позиции</h6>
              
              <!-- Поиск -->
              <div class="mb-3">
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="positionSearchQuery"
                  @input="filterPositions"
                  placeholder="Поиск по ФИО или номеру..."
                />
              </div>

              <!-- Список позиций -->
              <div class="position-list" style="max-height: 400px; overflow-y: auto;">
                <div 
                  v-for="position in filteredPositions" 
                  :key="position.id"
                  class="card mb-2 position-card"
                  :class="{ 'border-primary': selectedPosition?.id === position.id }"
                  @click="selectPosition(position)"
                  style="cursor: pointer;"
                >
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-1">
                          <span class="badge bg-secondary">Кабинет №{{ position.sequence_number }}</span>
                          <span 
                            class="badge"
                            :class="getPositionBadgeClass(position.position)"
                          >
                            {{ getPositionLabel(position.position) }}
                          </span>
                        </div>
                        <div class="fw-semibold">{{ formatFullName(position) }}</div>
                        <small class="text-muted">{{ position.personal_number }}</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="filteredPositions.length === 0" class="text-center text-muted py-4">
                  {{ positionSearchQuery ? 'Позиции не найдены' : 'Нет доступных позиций' }}
                </div>
              </div>
            </div>

            <!-- Визуальная схема структуры -->
            <div class="col-md-6">
              <h6 class="mb-3">Доступные позиции</h6>
              
              <div v-if="!sponsorInfo" class="text-center text-muted py-5">
                Загрузка информации о спонсоре...
              </div>

              <div v-else class="structure-preview">
                <!-- Спонсор -->
                <div class="mb-3">
                  <div class="card">
                    <div class="card-body p-3 bg-light">
                      <div class="text-muted small mb-1">СПОНСОР</div>
                      <div class="mb-1">
                        <span class="badge bg-secondary">Кабинет №{{ sponsorInfo.sequence_number }}</span>
                      </div>
                      <div class="fw-semibold">{{ formatFullName(sponsorInfo.participant) }}</div>
                      <small class="text-muted">{{ sponsorInfo.personal_number }}</small>
                    </div>
                  </div>
                </div>

                <!-- Наставник -->
                <div class="mb-3">
                  <div 
                    class="card mentor-card"
                    :class="{ 'animate-bump': animateMentor }"
                  >
                    <div class="card-body p-3 bg-light position-relative">
                      <div class="text-muted small mb-1">НАСТАВНИК</div>
                      
                      <div v-if="selectedPosition">
                        <div class="mb-1">
                          <span class="badge bg-secondary">
                            Кабинет №{{ selectedPosition.sequence_number }}
                          </span>
                        </div>
                        <div class="fw-semibold">{{ formatFullName(selectedPosition) }}</div>
                        <small class="text-muted">{{ selectedPosition.personal_number }}</small>
                        
                        <!-- Кнопка сброса выбора -->
                        <button 
                          type="button"
                          class="btn-close position-absolute"
                          style="top: 12px; right: 12px;"
                          @click="clearSelectedPosition"
                          aria-label="Сбросить выбор"
                        ></button>
                      </div>
                      
                      <div v-else class="text-center text-muted py-3">
                        Выберите наставника из списка
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Разделитель -->
                <hr class="my-3">

                <!-- Текст подсказки -->
                <div class="text-center text-muted small mb-3">
                  Нажмите на левый или правый блок для выбора стороны
                </div>

                <!-- Левая и правая позиции -->
                <div class="row g-3">
                  <!-- Левая позиция -->
                  <div class="col-6">
                    <div 
                      class="card position-slot h-100"
                      :class="{ 
                        'border-success border-2': side === 'left',
                        'animate-bump': animateLeft,
                        'clickable': leftIsFree
                      }"
                      @click="onLeftClick"
                    >
                      <div class="card-body p-3 text-center d-flex flex-column justify-content-center">
                        <div class="text-muted small mb-2">Левый</div>
                        <div v-if="isLeftPreviewParticipant" class="d-flex flex-column align-items-center">
                          <i class="bi bi-check-circle-fill text-success fs-3 mb-2"></i>
                          <div class="fw-semibold">{{ formatFullName(participantInfo.participant) }}</div>
                          <small class="text-muted">{{ participantInfo.personal_number }}</small>
                        </div>
                        <div v-else-if="!leftIsFree" class="d-flex flex-column align-items-center">
                          <i class="bi bi-lock-fill text-muted fs-3 mb-2"></i>
                          <div class="text-muted">Занято</div>
                        </div>
                        <div v-else class="d-flex flex-column align-items-center">
                          <i class="bi bi-plus-circle text-primary fs-3 mb-2"></i>
                          <div class="text-muted">Свободно</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Правая позиция -->
                  <div class="col-6">
                    <div 
                      class="card position-slot h-100"
                      :class="{ 
                        'border-success border-2': side === 'right',
                        'animate-bump': animateRight,
                        'clickable': rightIsFree
                      }"
                      @click="onRightClick"
                    >
                      <div class="card-body p-3 text-center d-flex flex-column justify-content-center">
                        <div class="text-muted small mb-2">Правый</div>
                        <div v-if="isRightPreviewParticipant" class="d-flex flex-column align-items-center">
                          <i class="bi bi-check-circle-fill text-success fs-3 mb-2"></i>
                          <div class="fw-semibold">{{ formatFullName(participantInfo.participant) }}</div>
                          <small class="text-muted">{{ participantInfo.personal_number }}</small>
                        </div>
                        <div v-else-if="!rightIsFree" class="d-flex flex-column align-items-center">
                          <i class="bi bi-lock-fill text-muted fs-3 mb-2"></i>
                          <div class="text-muted">Занято</div>
                        </div>
                        <div v-else class="d-flex flex-column align-items-center">
                          <i class="bi bi-plus-circle text-primary fs-3 mb-2"></i>
                          <div class="text-muted">Свободно</div>
                        </div>
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
            Отмена
          </button>
          <button 
            type="button" 
            class="btn btn-primary"
            style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
            @click="handleAddToStructure"
            :disabled="!selectedPosition || (selectedPosition?.position === 'both' && !side) || adding"
          >
            <span v-if="adding" class="spinner-border spinner-border-sm me-2"></span>
            Добавить в структуру
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
import { ref, computed, watch } from 'vue'
import { BACKEND_API_URL } from '../config'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  cabinetId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'success', 'error'])

const loading = ref(false)
const participantInfo = ref({})
const sponsorInfo = ref(null)
const availablePositions = ref([])
const filteredPositions = ref([])
const positionSearchQuery = ref('')
const selectedPosition = ref(null)
const side = ref('')
const adding = ref(false)

const animateMentor = ref(false)
const animateLeft = ref(false)
const animateRight = ref(false)

const leftIsFree = computed(() => {
  if (!selectedPosition.value) return false
  return selectedPosition.value.position === 'left' || selectedPosition.value.position === 'both'
})

const rightIsFree = computed(() => {
  if (!selectedPosition.value) return false
  return selectedPosition.value.position === 'right' || selectedPosition.value.position === 'both'
})

const isLeftPreviewParticipant = computed(() => {
  if (!selectedPosition.value) return false
  return (selectedPosition.value.position === 'left' && side.value === 'left') ||
         (selectedPosition.value.position === 'both' && side.value === 'left')
})

const isRightPreviewParticipant = computed(() => {
  if (!selectedPosition.value) return false
  return (selectedPosition.value.position === 'right' && side.value === 'right') ||
         (selectedPosition.value.position === 'both' && side.value === 'right')
})

const formatFullName = (person) => {
  if (!person) return '-'
  return `${person.lastname || ''} ${person.name || ''} ${person.patronymic || ''}`.trim() || '-'
}

const getPositionBadgeClass = (position) => {
  switch (position) {
    case 'left':
      return 'bg-primary text-white'
    case 'right':
      return 'bg-success text-white'
    case 'both':
      return 'bg-warning text-dark'
    default:
      return 'bg-secondary text-white'
  }
}

const getPositionLabel = (position) => {
  switch (position) {
    case 'left':
      return 'Левая'
    case 'right':
      return 'Правая'
    case 'both':
      return 'Обе стороны'
    default:
      return 'Неизвестно'
  }
}

const filterPositions = () => {
  if (!positionSearchQuery.value.trim()) {
    filteredPositions.value = [...availablePositions.value]
  } else {
    const query = positionSearchQuery.value.toLowerCase().trim()
    filteredPositions.value = availablePositions.value.filter(position => {
      const fullName = formatFullName(position).toLowerCase()
      const personalNumber = (position.personal_number || '').toLowerCase()
      
      return fullName.includes(query) || personalNumber.includes(query)
    })
  }
}

const selectPosition = (position) => {
  selectedPosition.value = position
  side.value = ''
  
  // Автоматический выбор, если доступна только одна сторона
  if (position.position === 'left') {
    side.value = 'left'
  } else if (position.position === 'right') {
    side.value = 'right'
  }
  
  // Анимация
  animateMentor.value = false
  requestAnimationFrame(() => {
    animateMentor.value = true
  })
}

const clearSelectedPosition = () => {
  selectedPosition.value = null
  side.value = ''
  animateMentor.value = false
  requestAnimationFrame(() => {
    animateMentor.value = true
  })
}

const onLeftClick = () => {
  if (!selectedPosition.value) return
  if (!leftIsFree.value && !isLeftPreviewParticipant.value) return
  
  side.value = 'left'
  animateLeft.value = false
  requestAnimationFrame(() => {
    animateLeft.value = true
  })
}

const onRightClick = () => {
  if (!selectedPosition.value) return
  if (!rightIsFree.value && !isRightPreviewParticipant.value) return
  
  side.value = 'right'
  animateRight.value = false
  requestAnimationFrame(() => {
    animateRight.value = true
  })
}

const loadParticipantInfo = async () => {
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
    
    if (!response.ok) throw new Error('Failed to load participant info')
    
    const data = await response.json()
    participantInfo.value = data
    
    if (data.sponsor_id) {
      await loadSponsorInfo(data.sponsor_id)
      await loadAvailablePositions(data.sponsor_id)
    }
  } catch (error) {
    console.error('Error loading participant info:', error)
    emit('error', 'Ошибка загрузки информации об участнике')
  } finally {
    loading.value = false
  }
}

const loadSponsorInfo = async (sponsorId) => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/${sponsorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (response.ok) {
      sponsorInfo.value = await response.json()
    }
  } catch (error) {
    console.error('Error loading sponsor info:', error)
  }
}

const loadAvailablePositions = async (sponsorId) => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/structure/find_free_positions/${sponsorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to load available positions')
    
    const data = await response.json()
    availablePositions.value = data.available_positions || []
    filteredPositions.value = [...availablePositions.value]
  } catch (error) {
    console.error('Error loading available positions:', error)
    emit('error', 'Ошибка загрузки доступных позиций')
  }
}

const handleAddToStructure = async () => {
  if (!selectedPosition.value || !side.value) return
  
  adding.value = true
  try {
    const token = localStorage.getItem('access_token')
    const payload = {
      mentor_cabinet_id: selectedPosition.value.id,
      cabinet_id: props.cabinetId,
      position: side.value
    }
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/structure/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || 'Ошибка при добавлении в структуру')
    }
    
    emit('success')
    handleClose()
  } catch (error) {
    console.error('Error adding to structure:', error)
    emit('error', error.message || 'Ошибка при добавлении в структуру')
  } finally {
    adding.value = false
  }
}

const handleClose = () => {
  selectedPosition.value = null
  side.value = ''
  positionSearchQuery.value = ''
  participantInfo.value = {}
  sponsorInfo.value = null
  availablePositions.value = []
  filteredPositions.value = []
  emit('close')
}

watch(() => props.isOpen, (newValue) => {
  if (newValue && props.cabinetId) {
    loadParticipantInfo()
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

.position-card {
  transition: all 0.2s ease;
}

.position-card:hover {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.position-slot.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.position-slot.clickable:hover {
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
}

@keyframes bump {
  0% { transform: scale(1); }
  40% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.animate-bump {
  animation: bump 220ms ease-in-out;
}
</style>
