<template>
  <div 
    class="modal fade" 
    id="cabinetDetailsModal"
    :class="{ show: isOpen, 'd-block': isOpen }" 
    :style="{ display: isOpen ? 'block' : 'none' }"
    tabindex="-1"
    role="dialog"
    aria-hidden="true"
    aria-labelledby="cabinetDetailsModalLabel"
    @click.self="handleClose"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="cabinetDetailsModalLabel">Информация</h5>
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

          <div v-else-if="cabinetInfo">
            <!-- Меню навигации -->
            <div class="tabs-container mb-4">
              <div class="tabs-segmented-control">
                <div 
                  class="tab-segment"
                  :class="{ 'tab-segment-active': currentTab === 'participant' }"
                  @click="currentTab = 'participant'"
                >
                  Участник
                </div>
                <div 
                  class="tab-segment"
                  :class="{ 'tab-segment-active': currentTab === 'to' }"
                  @click="currentTab = 'to'"
                >
                  Товарооборот
                </div>
                <div 
                  class="tab-segment"
                  :class="{ 'tab-segment-active': currentTab === 'bonuses' }"
                  @click="currentTab = 'bonuses'"
                >
                  Бонусы
                </div>
                <div 
                  class="tab-segment"
                  :class="{ 'tab-segment-active': currentTab === 'personal' }"
                  @click="currentTab = 'personal'"
                >
                  Личники
                </div>
                <div 
                  class="tab-segment"
                  :class="{ 'tab-segment-active': currentTab === 'orders' }"
                  @click="currentTab = 'orders'"
                >
                  Заказы
                </div>
              </div>
            </div>

            <!-- Вкладка: Участник -->
            <div v-show="currentTab === 'participant'">
              <table class="simple-table">
                <tbody>
                  <tr>
                    <td class="label-cell">Участник</td>
                    <td>
                      <div class="d-flex justify-content-between align-items-center">
                        <span>{{ formatFullName(cabinetInfo.participant) }} ({{ cabinetInfo.personal_number }})</span>
                        <button 
                          class="btn btn-sm btn-outline-primary"
                          @click="goToStructure(cabinetInfo.id)"
                          title="Перейти к структуре"
                        >
                          <i class="bi bi-diagram-3 me-1"></i>
                          Структура
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="label-cell">Спонсор</td>
                    <td>
                      <div class="d-flex justify-content-between align-items-center">
                        <span>
                          <span 
                            v-if="cabinetInfo.sponsor"
                            class="clickable-link"
                            @click="handleNavigate(cabinetInfo.sponsor_id)"
                          >
                            {{ formatFullName(cabinetInfo.sponsor.participant) }} ({{ cabinetInfo.sponsor.personal_number }})
                            <i class="bi bi-box-arrow-up-right ms-1"></i>
                          </span>
                          <span v-else>-</span>
                        </span>
                        <button 
                          v-if="cabinetInfo.sponsor"
                          class="btn btn-sm btn-outline-primary"
                          @click="goToStructure(cabinetInfo.sponsor_id)"
                          title="Перейти к структуре спонсора"
                        >
                          <i class="bi bi-diagram-3 me-1"></i>
                          Структура
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="label-cell">Наставник</td>
                    <td>
                      <div class="d-flex justify-content-between align-items-center">
                        <span>
                          <span 
                            v-if="cabinetInfo.mentor"
                            class="clickable-link"
                            @click="handleNavigate(cabinetInfo.mentor_id)"
                          >
                            {{ formatFullName(cabinetInfo.mentor.participant) }} ({{ cabinetInfo.mentor.personal_number }})
                            <i class="bi bi-box-arrow-up-right ms-1"></i>
                          </span>
                          <span v-else>-</span>
                        </span>
                        <button 
                          v-if="cabinetInfo.mentor"
                          class="btn btn-sm btn-outline-primary"
                          @click="goToStructure(cabinetInfo.mentor_id)"
                          title="Перейти к структуре наставника"
                        >
                          <i class="bi bi-diagram-3 me-1"></i>
                          Структура
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="label-cell">Пакет</td>
                    <td>{{ cabinetInfo.paket?.name || '-' }} - {{ formatPrice(cabinetInfo.paket?.price) }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Статус</td>
                    <td>{{ cabinetInfo.status?.name || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Филиал</td>
                    <td>{{ cabinetInfo.branch?.name || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Дата</td>
                    <td>
                      {{ cabinetInfo.registered ? formatDateTime(cabinetInfo.register_at) : formatDateTime(cabinetInfo.created_at) }}
                      ({{ cabinetInfo.registered ? 'Зарегистрирован' : 'Не зарегистрирован' }})
                    </td>
                  </tr>
                  
                  <!-- Разделитель -->
                  <tr class="separator-row">
                    <td colspan="2"></td>
                  </tr>
                  
                  <tr>
                    <td class="label-cell">Email</td>
                    <td>{{ cabinetInfo.participant?.email || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Телефон</td>
                    <td>{{ cabinetInfo.participant?.passport_info?.phone_number || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Дата рождения</td>
                    <td>{{ formatDate(cabinetInfo.participant?.passport_info?.date_birth) }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Паспорт ID</td>
                    <td>{{ cabinetInfo.participant?.passport_info?.passport_id || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">ПИН</td>
                    <td>{{ cabinetInfo.participant?.passport_info?.pin || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Орган выдачи</td>
                    <td>{{ cabinetInfo.participant?.passport_info?.passport_issuer || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Дата выдачи паспорта</td>
                    <td>{{ formatDate(cabinetInfo.participant?.passport_info?.passport_issue_date) }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Банк</td>
                    <td>{{ cabinetInfo.participant?.passport_info?.bank || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">ИП/ИНН</td>
                    <td>{{ cabinetInfo.participant?.passport_info?.ip_inn ? 'Да' : 'Нет' }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Пенсионер</td>
                    <td>{{ cabinetInfo.participant?.passport_info?.pensioner ? 'Да' : 'Нет' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Вкладка: ТО (Товарооборот) -->
            <div v-show="currentTab === 'to'">
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
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <div class="text-muted small mb-1">Левая ветка</div>
                        <div class="fs-5 fw-bold">{{ turnoverData.summary.left_volume }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <div class="text-muted small mb-1">Правая ветка</div>
                        <div class="fs-5 fw-bold">{{ turnoverData.summary.right_volume }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Вкладка: Бонусы -->
            <div v-show="currentTab === 'bonuses'">
              <!-- Bonus Tabs -->
              <div class="mb-3 d-flex justify-content-center">
                <div class="bonus-segmented-control">
                  <button 
                    type="button" 
                    class="bonus-segment"
                    :class="{ 'bonus-segment-active': activeBonusTab === 'binary' }"
                    @click="activeBonusTab = 'binary'"
                  >
                    Бинарный
                  </button>
                  <button 
                    type="button" 
                    class="bonus-segment"
                    :class="{ 'bonus-segment-active': activeBonusTab === 'matching' }"
                    @click="activeBonusTab = 'matching'"
                  >
                    Чек от Чека
                  </button>
                  <button 
                    type="button" 
                    class="bonus-segment"
                    :class="{ 'bonus-segment-active': activeBonusTab === 'referral' }"
                    @click="activeBonusTab = 'referral'"
                  >
                    Реферальный
                  </button>
                  <button 
                    type="button" 
                    class="bonus-segment"
                    :class="{ 'bonus-segment-active': activeBonusTab === 'status' }"
                    @click="activeBonusTab = 'status'"
                  >
                    Статусный
                  </button>
                  <button 
                    type="button" 
                    class="bonus-segment"
                    :class="{ 'bonus-segment-active': activeBonusTab === 'sponsor' }"
                    @click="activeBonusTab = 'sponsor'"
                  >
                    Спонсорский
                  </button>
                </div>
              </div>

              <!-- Content Area -->
              <div class="tab-content p-3 border rounded bg-light" style="min-height: 300px;">
                <div v-if="bonusesLoading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                </div>
                
                <div v-else>
                  <div v-if="activeBonusTab === 'binary'">
                    <BinaryBonuses 
                      :cabinet-id="cabinetId"
                      :is-active="activeBonusTab === 'binary'"
                    />
                  </div>

                  <div v-if="activeBonusTab === 'matching'">
                    <ChequeBonuses 
                      :cabinet-id="cabinetId"
                      :is-active="activeBonusTab === 'matching'"
                    />
                  </div>

                  <div v-if="activeBonusTab === 'referral'">
                    <ReferralBonuses 
                      :cabinet-id="cabinetId"
                      :is-active="activeBonusTab === 'referral'"
                    />
                  </div>

                  <div v-if="activeBonusTab === 'status'">
                    <StatusBonuses 
                      :cabinet-id="cabinetId"
                      :is-active="activeBonusTab === 'status'"
                    />
                  </div>

                  <div v-if="activeBonusTab === 'sponsor'">
                    <SponsorBonuses 
                      :cabinet-id="cabinetId"
                      :is-active="activeBonusTab === 'sponsor'"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Вкладка: Личники -->
            <div v-show="currentTab === 'personal'">
              <PersonalCabinets 
                :sponsor-id="cabinetId"
                :is-active="currentTab === 'personal'"
              />
            </div>

            <!-- Вкладка: Заказы -->
            <div v-show="currentTab === 'orders'">
              <div v-if="ordersLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
              </div>

              <div v-else-if="orders.length > 0">
                <DataTable
                  :columns="ordersColumns"
                  :items="orders"
                  :actions="ordersActions"
                >
                  <template #cell-fulfillment_status="{ item }">
                    <div class="d-flex align-items-center gap-2">
                      <span 
                        class="status-indicator" 
                        :class="getFulfillmentStatusClass(item.fulfillment_status?.name)"
                      ></span>
                      <span>{{ item.fulfillment_status?.name || '-' }}</span>
                    </div>
                  </template>
                </DataTable>
              </div>

              <div v-else class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Заказы не найдены
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            v-if="canDelete"
            type="button" 
            class="btn btn-danger me-auto" 
            @click="openDeleteConfirmation"
          >
            <i class="bi bi-trash me-1"></i>
            Удалить
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

  <!-- Delete Confirmation Modal -->
  <div 
    class="modal fade" 
    :class="{ show: deleteConfirmationOpen, 'd-block': deleteConfirmationOpen }" 
    :style="{ display: deleteConfirmationOpen ? 'block' : 'none' }"
    tabindex="-1"
    role="dialog"
    @click.self="closeDeleteConfirmation"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header bg-danger text-white">
          <h5 class="modal-title">Подтверждение удаления</h5>
          <button type="button" class="btn-close btn-close-white" @click="closeDeleteConfirmation"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Внимание!</strong> Это действие необратимо.
          </div>
          <p class="mb-2"><strong>Вы действительно хотите удалить участника?</strong></p>
          <div v-if="cabinetInfo" class="mt-3">
            <div class="mb-2">
              <strong>ФИО:</strong> {{ formatFullName(cabinetInfo.participant) }}
            </div>
            <div class="mb-2">
              <strong>Персональный номер:</strong> {{ cabinetInfo.personal_number }}
            </div>
            <div class="mb-2">
              <strong>Пакет:</strong> {{ cabinetInfo.paket?.name || '-' }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDeleteConfirmation">Отмена</button>
          <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner-border spinner-border-sm me-1"></span>
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="deleteConfirmationOpen" class="modal-backdrop fade show"></div>

  <!-- Order Details Modal -->
  <OrderDetailsModal
    :is-open="orderDetailsModalOpen"
    :order-id="selectedOrderId"
    modal-id="orderDetailsModalFromCabinet"
    parent-modal-id="cabinetDetailsModal"
    @close="closeOrderDetailsModal"
    @updated="loadOrders"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BACKEND_API_URL } from '../config'
import BinaryBonuses from './bonuses/BinaryBonuses.vue'
import ChequeBonuses from './bonuses/ChequeBonuses.vue'
import ReferralBonuses from './bonuses/ReferralBonuses.vue'
import StatusBonuses from './bonuses/StatusBonuses.vue'
import SponsorBonuses from './bonuses/SponsorBonuses.vue'
import PersonalCabinets from './PersonalCabinets.vue'
import DataTable from './DataTable.vue'
import OrderDetailsModal from './OrderDetailsModal.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  cabinetId: {
    type: String,
    default: null
  },
  initialTab: {
    type: String,
    default: 'participant'
  }
})

const emit = defineEmits(['close', 'navigate', 'reopen'])

const loading = ref(false)
const turnoverLoading = ref(false)
const bonusesLoading = ref(false)
const cabinetInfo = ref(null)
const turnoverData = ref(null)
const selectedPeriod = ref('all')
const currentTab = ref('participant')
const activeBonusTab = ref('binary')
const ordersLoading = ref(false)
const orders = ref([])
const orderDetailsModalOpen = ref(false)
const selectedOrderId = ref(null)

const router = useRouter()

const handleNavigate = (cabinetId) => {
  if (cabinetId) {
    emit('navigate', cabinetId)
  }
}

const goToStructure = (cabinetId) => {
  if (cabinetId) {
    router.push({ name: 'structure', params: { cabinetId } })
  }
}

const formatFullName = (participant) => {
  if (!participant) return '-'
  return `${participant.lastname || ''} ${participant.name || ''} ${participant.patronymic || ''}`.trim()
}

const formatPrice = (price) => {
  if (!price) return '0.00'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2) + ' $'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  } catch (err) {
    return '-'
  }
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
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/with-participant/${props.cabinetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to load cabinet info')
    
    cabinetInfo.value = await response.json()
    
    // Загружаем обороты только если открыта вкладка ТО
    if (currentTab.value === 'to') {
      await loadTurnover()
    }

    // Check if cabinet can be deleted
    await checkIfCanDelete()
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

// Orders columns and actions
const ordersColumns = [
  { key: 'id', label: '#' },
  { key: 'total_amount', label: 'Сумма' },
  { key: 'status', label: 'Статус заказа' },
  { key: 'payment_method', label: 'Способ оплаты' },
  { key: 'payment_status', label: 'Статус оплаты' },
  { key: 'fulfillment_status', label: 'Статус выдачи' },
  { key: 'order_date', label: 'Дата заказа' }
]

const ordersActions = [
  {
    label: 'Просмотр',
    icon: 'bi-eye',
    handler: (item) => {
      openOrderDetailsModal(item.id)
    }
  }
]

const loadOrders = async () => {
  if (!props.cabinetId) return
  
  ordersLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/orders/?cabinet_id=${props.cabinetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to load orders')
    
    const data = await response.json()
    const ordersArray = Array.isArray(data) ? data : (data.orders || data.items || [])
    
    orders.value = ordersArray.map(order => ({
      id: order.id,
      total_amount: formatCurrency(order.total_amount),
      status: order.status?.description || order.status?.name || '-',
      payment_method: order.payment_method?.name || '-',
      payment_status: order.payment_status?.name || '-',
      fulfillment_status: order.fulfillment_status,
      order_date: formatDateTime(order.order_date || order.created_at)
    }))
  } catch (error) {
    console.error('Error loading orders:', error)
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
}

const getFulfillmentStatusClass = (statusName) => {
  if (!statusName) return 'status-unknown'
  
  const normalizedStatus = statusName.toLowerCase().trim()
  
  if (normalizedStatus === 'выдано') {
    return 'status-issued'
  } else if (normalizedStatus === 'частично выдано') {
    return 'status-partial'
  } else if (normalizedStatus === 'не выдано') {
    return 'status-not-issued'
  }
  
  return 'status-unknown'
}

const formatCurrency = (amount) => {
  if (!amount) return '0.00 $'
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return numAmount.toFixed(2) + ' $'
}

const openOrderDetailsModal = (orderId) => {
  selectedOrderId.value = orderId
  // Temporarily hide the cabinet modal to prevent backdrop stacking
  emit('close')
  // Open order details modal after a short delay
  setTimeout(() => {
    orderDetailsModalOpen.value = true
  }, 150)
}

const closeOrderDetailsModal = () => {
  orderDetailsModalOpen.value = false
  selectedOrderId.value = null
  // Reopen cabinet modal after closing order details
  setTimeout(() => {
    emit('reopen')
  }, 150)
}

// Delete functionality
const deleteConfirmationOpen = ref(false)
const deleteLoading = ref(false)
const structureData = ref(null)
const canDelete = ref(false)

const checkIfCanDelete = async () => {
  if (!props.cabinetId) {
    canDelete.value = false
    return
  }

  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/structure/${props.cabinetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      canDelete.value = false
      return
    }

    const data = await response.json()
    structureData.value = data

    // Can delete only if both left_child and right_child are null
    canDelete.value = data.left_child === null && data.right_child === null
  } catch (err) {
    console.error('Error checking structure:', err)
    canDelete.value = false
  }
}

const openDeleteConfirmation = () => {
  deleteConfirmationOpen.value = true
}

const closeDeleteConfirmation = () => {
  deleteConfirmationOpen.value = false
}

const confirmDelete = async () => {
  if (!props.cabinetId) return

  deleteLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/with-participant/${props.cabinetId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to delete cabinet')
    }

    // Close modals and emit close event
    closeDeleteConfirmation()
    emit('close')
    
    // Optionally show success message or refresh parent view
    // You might want to emit a 'deleted' event here
  } catch (err) {
    console.error('Error deleting cabinet:', err)
    alert(`Ошибка при удалении участника: ${err.message}`)
  } finally {
    deleteLoading.value = false
  }
}

const handleClose = () => {
  emit('close')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.cabinetId) {
    currentTab.value = props.initialTab || 'participant'
    loadCabinetInfo()
  } else {
    cabinetInfo.value = null
    turnoverData.value = null
    selectedPeriod.value = 'all'
    currentTab.value = 'participant'
  }
})

watch(() => props.cabinetId, (newId, oldId) => {
  if (newId && newId !== oldId && props.isOpen) {
    currentTab.value = props.initialTab || 'participant'
    loadCabinetInfo()
  }
})

watch(() => props.initialTab, (newTab) => {
  if (newTab && props.isOpen) {
    currentTab.value = newTab
  }
})

watch(() => currentTab.value, (newTab) => {
  if (newTab === 'to' && !turnoverData.value && cabinetInfo.value) {
    loadTurnover()
  }
  if (newTab === 'orders' && cabinetInfo.value) {
    loadOrders()
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

.modal-dialog {
  max-height: 80vh;
  height: 80vh;
}

.modal-content {
  height: 100%;
}

/* Tabs - Navbar Style */
.tabs-container {
  display: flex;
  justify-content: center;
}

.tabs-segmented-control {
  display: inline-flex;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  gap: 0;
}

.tab-segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  color: #6c757d;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  cursor: pointer;
  user-select: none;
}

.tab-segment:hover:not(.tab-segment-active) {
  color: rgb(0, 0, 128);
}

.tab-segment-active {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Segmented Control for Period */
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

/* Simple Table Styles */
.simple-table {
  width: 100%;
  border-collapse: collapse;
}

.simple-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e9ecef;
}

.simple-table tr:last-child td {
  border-bottom: none;
}

.label-cell {
  font-weight: 600;
  width: 30%;
  color: #495057;
}

.separator-row td {
  padding: 20px 0 !important;
  border-bottom: 2px solid #dee2e6 !important;
}


/* Clickable Links */
.clickable-link {
  color: rgb(0, 0, 128);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.clickable-link:hover {
  text-decoration: underline;
  color: rgba(0, 0, 128, 0.8);
}

/* Bonus Segmented Control */
.bonus-segmented-control {
  display: flex;
  background-color: #f1f3f5;
  padding: 4px;
  border-radius: 8px;
}

.bonus-segment {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.bonus-segment-active {
  background-color: white;
  color: rgb(0, 0, 128);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.bonus-segment:hover:not(.bonus-segment-active) {
  color: rgb(0, 0, 128);
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
  background-color: #28a745; /* Зеленый - Выдано */
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.status-partial {
  background-color: #ffc107; /* Желтый - Частично выдано */
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
}

.status-not-issued {
  background-color: #dc3545; /* Красный - Не выдано */
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.status-unknown {
  background-color: #6c757d; /* Серый - Неизвестно */
  box-shadow: 0 0 0 2px rgba(108, 117, 125, 0.2);
}

</style>
