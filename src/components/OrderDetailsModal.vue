<template>
  <div 
    class="modal fade" 
    :id="modalId"
    :class="{ show: isOpen, 'd-block': isOpen }
" 
    :style="{ display: isOpen ? 'block' : 'none' }"
    tabindex="-1"
    role="dialog"
    aria-hidden="true"
    :aria-labelledby="`${modalId}Label`"
    @click.self="handleClose"
  >
    <div class="modal-dialog modal-dialog-centered modal-xl" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" :id="`${modalId}Label`">Просмотр заказа #{{ orderData?.id }}</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="handleClose"
            aria-label="Close"
            :data-bs-dismiss="parentModalId ? 'modal' : undefined"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
          </div>
          <div v-else-if="orderData" class="order-view-redesign">
            <!-- Часть 1: Основная информация -->
            <div class="order-header-info mb-4">
              <div class="row g-3">
                <div class="col-12">
                  <div class="text-muted small">Номер заказа:</div>
                  <div class="fs-5">#{{ orderData.id }}</div>
                </div>
                <div class="col-12">
                  <div class="text-muted small">Купил:</div>
                  <div class="fs-6">
                    {{ formatParticipantFullName(orderData.cabinet?.participant) }}
                    <span class="text-muted">({{ orderData.cabinet?.personal_number || '-' }})</span>
                  </div>
                </div>
              </div>

              <!-- Статусы в виде карточек -->
              <div class="row g-2 mt-3">
                <div class="col-md-6">
                  <div class="status-card">
                    <div class="status-card-label">Статус заказа</div>
                    <div class="status-card-value">{{ orderData.status?.description || orderData.status?.name || '-' }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="status-card">
                    <div class="status-card-label">Способ оплаты</div>
                    <div class="status-card-value">{{ orderData.payment_method?.name || '-' }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="status-card">
                    <div class="status-card-label">Статус оплаты</div>
                    <div class="status-card-value">{{ orderData.payment_status?.name || '-' }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="status-card">
                    <div class="status-card-label">Статус выдачи</div>
                    <div class="status-card-value">
                      <div class="d-flex align-items-center gap-2">
                        <span 
                          class="status-indicator" 
                          :class="getFulfillmentStatusClass(orderData.fulfillment_status?.name)"
                        ></span>
                        <span>{{ orderData.fulfillment_status?.name || '-' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Часть 2: Список товаров -->
            <div class="products-section">
              <div class="mb-3">Товары ({{ orderData.items?.length || 0 }})</div>
              
              <div v-if="orderData.items && orderData.items.length > 0" class="table-responsive">
                <table class="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th style="width: 80px;">Фото</th>
                      <th>Название товара</th>
                      <th style="width: 100px;" class="text-center">Количество</th>
                      <th style="width: 120px;" class="text-center">Выдано</th>
                      <th style="width: 100px;" class="text-end">Цена</th>
                      <th style="width: 100px;" class="text-end">Итого</th>
                      <th style="width: 100px;" class="text-center">Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in orderData.items" :key="index">
                      <td>
                        <div class="product-thumb">
                          <img 
                            v-if="item.product?.images && item.product.images.length > 0" 
                            :src="item.product.images[0].src" 
                            :alt="item.product?.name"
                            class="product-thumb-img"
                          />
                          <div v-else class="product-thumb-placeholder">
                            <i class="bi bi-image"></i>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{{ item.product?.name || '-' }}</div>
                        <small class="text-muted">{{ item.product?.sku || '' }}</small>
                      </td>
                      <td class="text-center">{{ item.quantity }}</td>
                      <td class="text-center">
                        <span :class="getIssuedTextClass(item.issued_quantity, item.quantity)">
                          {{ item.issued_quantity || 0 }} / {{ item.quantity }}
                        </span>
                      </td>
                      <td class="text-end">{{ formatCurrency(item.unit_price) }}</td>
                      <td class="text-end">{{ formatCurrency(item.total_price) }}</td>
                      <td class="text-center">
                        <button 
                          v-if="(item.issued_quantity || 0) < item.quantity"
                          class="btn btn-sm btn-outline-primary"
                          @click="openFulfillDialog(item, index)"
                        >
                          Выдать
                        </button>
                        <span v-else class="text-success">
                          <i class="bi bi-check-circle"></i>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-muted text-center py-4">
                Товары не найдены
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            v-if="parentModalId"
            type="button" 
            class="btn btn-secondary" 
            @click="handleClose"
          >
            Назад
          </button>
          <button 
            v-else
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

  <!-- Модальное окно выдачи товара -->
  <div 
    class="modal fade" 
    :class="{ show: fulfillDialogOpen, 'd-block': fulfillDialogOpen }" 
    :style="{ display: fulfillDialogOpen ? 'block' : 'none' }"
    tabindex="-1"
    role="dialog"
    @click.self="closeFulfillDialog"
  >
    <div class="modal-dialog modal-dialog-centered modal-sm" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Выдать товар</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="closeFulfillDialog"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="fulfillItemData" class="mb-3">
            <div class="fw-semibold mb-2">{{ fulfillItemData.product?.name }}</div>
            <div class="text-muted small mb-3">
              Заказано: {{ fulfillItemData.quantity }} | 
              Выдано: {{ fulfillItemData.issued_quantity || 0 }}
            </div>
            
            <label class="form-label">Количество для выдачи</label>
            <input 
              type="number" 
              class="form-control" 
              v-model.number="fulfillQuantity"
              :max="fulfillItemData.quantity - (fulfillItemData.issued_quantity || 0)"
              :min="1"
              placeholder="Введите количество"
            />
            <small class="text-muted">
              Максимум: {{ fulfillItemData.quantity - (fulfillItemData.issued_quantity || 0) }}
            </small>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-outline-secondary" 
            @click="closeFulfillDialog"
          >
            Отмена
          </button>
          <button 
            type="button" 
            class="btn btn-outline-primary" 
            @click="handleFulfillItem"
            :disabled="!fulfillQuantity || fulfillQuantity <= 0"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  </div>
  <div 
    v-if="isOpen || fulfillDialogOpen" 
    class="modal-backdrop fade show"
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
  orderId: {
    type: [String, Number],
    default: null
  },
  modalId: {
    type: String,
    default: 'orderDetailsModal'
  },
  parentModalId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'updated'])

const loading = ref(false)
const orderData = ref(null)

// Fulfill dialog state
const fulfillDialogOpen = ref(false)
const fulfillItemData = ref(null)
const fulfillQuantity = ref(0)
const fulfillItemIndex = ref(-1)

const formatParticipantFullName = (participant) => {
  if (!participant) return '-'
  const parts = []
  if (participant.lastname) parts.push(participant.lastname)
  if (participant.name) parts.push(participant.name)
  if (participant.patronymic) parts.push(participant.patronymic)
  return parts.length > 0 ? parts.join(' ') : participant.email || '-'
}

const formatCurrency = (amount) => {
  if (!amount) return '$0'
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (numAmount % 1 === 0) {
    return `$${numAmount}`
  }
  return `$${numAmount.toFixed(2)}`
}

const getFulfillmentStatusClass = (statusName) => {
  if (!statusName) return 'status-unknown'
  
  const status = statusName.toLowerCase()
  
  if (status === 'выдано' || status === 'issued') {
    return 'status-issued'
  } else if (status === 'частично выдано' || status === 'partially issued' || status.includes('частично')) {
    return 'status-partial'
  } else if (status === 'не выдано' || status === 'not issued') {
    return 'status-not-issued'
  }
  
  return 'status-unknown'
}

const getIssuedTextClass = (issued, total) => {
  const issuedQty = issued || 0
  if (issuedQty === 0) {
    return 'text-danger'
  } else if (issuedQty < total) {
    return 'text-warning'
  } else {
    return 'text-success'
  }
}

const loadOrderData = async () => {
  if (!props.orderId) return
  
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/orders/${props.orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите снова.')
      }
      throw new Error(`Ошибка загрузки: ${response.status}`)
    }
    
    orderData.value = await response.json()
  } catch (err) {
    console.error('Error fetching order:', err)
  } finally {
    loading.value = false
  }
}

const openFulfillDialog = (item, index) => {
  fulfillItemData.value = item
  fulfillItemIndex.value = index
  const maxQuantity = item.quantity - (item.issued_quantity || 0)
  fulfillQuantity.value = maxQuantity > 0 ? maxQuantity : 0
  fulfillDialogOpen.value = true
}

const closeFulfillDialog = () => {
  fulfillDialogOpen.value = false
  fulfillItemData.value = null
  fulfillQuantity.value = 0
  fulfillItemIndex.value = -1
}

const handleFulfillItem = async () => {
  try {
    if (!fulfillItemData.value || fulfillQuantity.value <= 0) {
      return
    }

    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/orders/${orderData.value.id}/fulfill`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify([
        {
          order_item_id: fulfillItemData.value.id,
          quantity: fulfillQuantity.value
        }
      ])
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Ошибка при выдаче товара')
    }

    // Update local data
    const currentIssued = fulfillItemData.value.issued_quantity || 0
    orderData.value.items[fulfillItemIndex.value].issued_quantity = currentIssued + fulfillQuantity.value

    // Close dialog
    closeFulfillDialog()

    // Reload order data to get updated fulfillment status
    await loadOrderData()
    
    // Emit updated event
    emit('updated')
  } catch (err) {
    console.error('Error fulfilling item:', err)
  }
}

const handleClose = () => {
  emit('close')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.orderId) {
    loadOrderData()
  } else {
    orderData.value = null
  }
})

watch(() => props.orderId, (newId, oldId) => {
  if (newId && newId !== oldId && props.isOpen) {
    loadOrderData()
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

/* Status Indicators */
.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-issued {
  background-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.status-partial {
  background-color: #ffc107;
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.status-not-issued {
  background-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.status-unknown {
  background-color: #6c757d;
  box-shadow: 0 0 0 2px rgba(108, 117, 125, 0.2);
}

/* Order View */
.order-view-redesign {
  max-height: 70vh;
  overflow-y: auto;
}

.order-header-info {
  padding: 1rem;
  border-radius: 0.5rem;
}

.status-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 0.375rem;
  padding: 0.75rem;
  height: 100%;
}

.status-card-label {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.5rem;
}

.status-card-value {
  font-size: 0.95rem;
  color: #212529;
}

.products-section {
  margin-top: 1.5rem;
}

.product-thumb {
  width: 60px;
  height: 60px;
  border-radius: 0.375rem;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 1.5rem;
}
</style>
