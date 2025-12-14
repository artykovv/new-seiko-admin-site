<template>
  <div 
    class="modal fade" 
    :class="{ show: isOpen, 'd-block': isOpen }" 
    :style="{ display: isOpen ? 'block' : 'none' }"
    tabindex="-1"
    role="dialog"
    @click.self="handleClose"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Upgrade пакета</h5>
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

          <div v-else>
            <!-- Текущий пакет -->
            <div class="alert alert-info mb-4">
              <h6 class="alert-heading mb-2">
                <i class="bi bi-info-circle me-2"></i>
                Текущий пакет
              </h6>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{{ currentPaket?.name || '-' }}</strong>
                  <div class="text-muted small">{{ formatPrice(currentPaket?.price) }}</div>
                </div>
              </div>
            </div>

            <!-- Выбор нового пакета -->
            <div class="mb-3">
              <label for="new_paket" class="form-label">
                Выберите новый пакет <span class="text-danger">*</span>
              </label>
              <select 
                class="form-select" 
                id="new_paket" 
                v-model.number="selectedPaketId"
              >
                <option :value="null">Выберите пакет</option>
                <option 
                  v-for="paket in availablePakets" 
                  :key="paket.id" 
                  :value="paket.id"
                >
                  {{ paket.name }} - {{ formatPrice(paket.price) }}
                </option>
              </select>
            </div>

            <!-- Информация о выбранном пакете -->
            <div v-if="selectedPaket" class="card mb-3">
              <div class="card-body">
                <h6 class="card-title">{{ selectedPaket.name }}</h6>
                <div class="row g-2">
                  <div class="col-6">
                    <small class="text-muted">Цена:</small>
                    <div class="fw-semibold">{{ formatPrice(selectedPaket.price) }}</div>
                  </div>
                  <div class="col-6">
                    <small class="text-muted">Реферальный бонус:</small>
                    <div class="fw-semibold">{{ formatPrice(selectedPaket.referral_bonus) }}</div>
                  </div>
                  <div class="col-6">
                    <small class="text-muted">Бинарный бонус:</small>
                    <div class="fw-semibold">{{ (selectedPaket.binary_bonus_percentage * 100).toFixed(1) }}%</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ошибка -->
            <div v-if="error" class="alert alert-danger">
              {{ error }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="handleBack"
          >
            <i class="bi bi-arrow-left me-1"></i>
            Назад к редактированию
          </button>
          <button 
            type="button" 
            class="btn btn-primary"
            style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
            @click="handleUpgrade"
            :disabled="!selectedPaketId || loading"
          >
            <i class="bi bi-arrow-up-circle me-1"></i>
            Выполнить Upgrade
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
  },
  currentPaketId: {
    type: Number,
    default: null
  },
  pakets: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'back', 'success'])

const loading = ref(false)
const error = ref('')
const selectedPaketId = ref(null)

const currentPaket = computed(() => {
  return props.pakets.find(p => p.id === props.currentPaketId)
})

const availablePakets = computed(() => {
  // Показываем только пакеты с ценой выше текущего
  if (!currentPaket.value) return props.pakets
  
  return props.pakets.filter(p => {
    const currentPrice = parseFloat(currentPaket.value.price)
    const paketPrice = parseFloat(p.price)
    return paketPrice > currentPrice
  })
})

const selectedPaket = computed(() => {
  return props.pakets.find(p => p.id === selectedPaketId.value)
})

const formatPrice = (price) => {
  if (!price) return '0.00'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2) + ' $'
}

const handleBack = () => {
  emit('back')
}

const handleClose = () => {
  selectedPaketId.value = null
  error.value = ''
  emit('close')
}

const handleUpgrade = async () => {
  if (!selectedPaketId.value) {
    error.value = 'Выберите новый пакет'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/upgrade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        cabinet_id: props.cabinetId,
        new_paket_id: selectedPaketId.value
      })
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите снова.')
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Ошибка upgrade: ${response.status}`)
    }

    emit('success')
    handleClose()
  } catch (err) {
    error.value = err.message || 'Ошибка при выполнении upgrade'
    console.error('Error upgrading:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    selectedPaketId.value = null
    error.value = ''
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

.card {
  border-color: #dee2e6;
}

.card-body {
  background-color: #f8f9fa;
}
</style>
