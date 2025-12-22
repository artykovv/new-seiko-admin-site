<template>
  <div class="d-flex flex-column h-100">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
      <div class="position-relative" style="flex: 1; max-width: 400px;">
        <i class="bi bi-search position-absolute" style="left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; z-index: 10;"></i>
        <input 
          type="text" 
          v-model="searchQuery"
          class="form-control ps-5"
          placeholder="Поиск..."
          style="font-size: 14px;"
        />
      </div>
      <div class="d-flex align-items-center gap-2">
        <!-- Filters Dropdown -->
        <div class="dropdown">
          <button 
            class="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
            style="font-size: 14px;"
          >
            <i class="bi bi-funnel"></i>
            Фильтры
            <span v-if="hasActiveFilters" class="badge bg-primary rounded-pill" style="font-size: 0.7rem;">
              {{ activeFiltersCount }}
            </span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end p-3" style="min-width: 350px; max-width: 500px;">
            <li class="mb-3">
              <label class="form-label small mb-2">Статус заказа</label>
              <div class="d-flex flex-wrap gap-2">
                <span 
                  v-for="status in orderStatuses" 
                  :key="status.id"
                  class="badge"
                  :class="selectedStatusIds.includes(status.id) ? 'bg-primary' : 'bg-secondary'"
                  style="cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.6rem;"
                  @click="toggleStatus(status.id)"
                >
                  {{ status.description || status.name }}
                </span>
              </div>
            </li>
            <li class="mb-3">
              <label class="form-label small mb-2">Способ оплаты</label>
              <div class="d-flex flex-wrap gap-2">
                <span 
                  v-for="method in paymentMethods" 
                  :key="method.id"
                  class="badge"
                  :class="selectedPaymentMethodIds.includes(method.id) ? 'bg-primary' : 'bg-secondary'"
                  style="cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.6rem;"
                  @click="togglePaymentMethod(method.id)"
                >
                  {{ method.name }}
                </span>
              </div>
            </li>
            <li class="mb-3">
              <label class="form-label small mb-2">Статус оплаты</label>
              <div class="d-flex flex-wrap gap-2">
                <span 
                  v-for="status in paymentStatuses" 
                  :key="status.id"
                  class="badge"
                  :class="selectedPaymentStatusIds.includes(status.id) ? 'bg-primary' : 'bg-secondary'"
                  style="cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.6rem;"
                  @click="togglePaymentStatus(status.id)"
                >
                  {{ status.name }}
                </span>
              </div>
            </li>
            <li class="mb-3">
              <label class="form-label small mb-2">Статус выдачи</label>
              <div class="d-flex flex-wrap gap-2">
                <span 
                  v-for="status in fulfillmentStatuses" 
                  :key="status.id"
                  class="badge"
                  :class="selectedFulfillmentStatusIds.includes(status.id) ? 'bg-primary' : 'bg-secondary'"
                  style="cursor: pointer; font-size: 0.85rem; padding: 0.6rem 0.6rem;"
                  @click="toggleFulfillmentStatus(status.id)"
                >
                  {{ status.name }}
                </span>
              </div>
            </li>
            <li>
              <button 
                v-if="hasActiveFilters" 
                class="btn btn-sm btn-outline-danger w-100" 
                @click="clearFilters"
              >
                Сбросить фильтры
              </button>
            </li>
          </ul>
        </div>
        
        <button 
          class="btn btn-primary d-flex align-items-center gap-2"
          style="font-size: 14px; background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
          @click="openAddModal"
          disabled
        >
          <i class="bi bi-plus-circle"></i>
          Добавить заказ
        </button>
        
        <span class="text-muted small">Показать:</span>
        <select 
          v-model="pageSize" 
          @change="changePageSize"
          class="form-select form-select-sm page-size-select"
        >
          <option :value="20">20</option>
          <option :value="30">30</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger flex-shrink-0" role="alert">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-5 flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else class="d-flex flex-column flex-grow-1 overflow-hidden">
      <div class="flex-grow-1 overflow-auto">
        <DataTable
          :columns="columns"
          :items="items"
          :actions="actions"
          class="h-100"
        >
          <template #cell-fulfillment_status="{ item }">
            <span 
              v-if="item.fulfillment_status"
              class="status-indicator" 
              :class="getFulfillmentStatusClass(item.fulfillment_status)"
              :title="item.fulfillment_status"
            ></span>
            <span v-else>-</span>
          </template>
        </DataTable>
      </div>

      <!-- Pagination -->
      <div class="flex-shrink-0 mt-3 d-flex justify-content-center">
        <nav v-if="totalPages > 1" aria-label="Page navigation">
          <ul class="pagination mb-0">
            <li 
              v-for="page in displayedPages" 
              :key="page" 
              class="page-item"
              :class="{ active: currentPage === page, disabled: page === '...' }"
            >
              <button class="page-link" @click="page !== '...' && changePage(page)">
                {{ page }}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Модальное окно добавления заказа -->
    <div 
      class="modal fade" 
      :class="{ show: addModalOpen, 'd-block': addModalOpen }" 
      :style="{ display: addModalOpen ? 'block' : 'none' }"
      tabindex="-1"
      role="dialog"
      @click.self="closeAddModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Добавить заказ</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="closeAddModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <!-- Progress Steps -->
            <div class="steps-container mb-4">
              <div class="steps-wrapper">
                <div 
                  v-for="(step, index) in orderSteps" 
                  :key="index"
                  class="step-item"
                  :class="{ 
                    'active': currentOrderStep === index + 1,
                    'completed': currentOrderStep > index + 1
                  }"
                >
                  <div class="step-circle">
                    <i v-if="currentOrderStep > index + 1" class="bi bi-check-lg"></i>
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <div class="step-label">{{ step.label }}</div>
                </div>
              </div>
            </div>

            <form @submit.prevent="handleNextStep" class="order-form">
              <!-- Шаг 1: Выбор участника -->
              <div v-if="currentOrderStep === 1" class="step-panel">
                <h6 class="mb-3">Выбор кабинета</h6>
            <div class="position-relative">
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="orderFormData.cabinetSearch"
                  @input="handleCabinetSearch"
                  @focus="showCabinetDropdown = true"
                  placeholder="Поиск кабинета..."
                  autocomplete="off"
                />
                <button 
                  v-if="orderFormData.selectedCabinet"
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="clearCabinet"
                  title="Очистить"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
              <div 
                v-if="showCabinetDropdown && (cabinetSearchResults.length > 0 || cabinetSearchLoading)"
                class="participant-dropdown"
              >
                <div v-if="cabinetSearchLoading" class="dropdown-item text-center py-2">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                </div>
                <div 
                  v-else
                  v-for="cabinet in cabinetSearchResults" 
                  :key="cabinet.id"
                  class="dropdown-item participant-item"
                  @click="selectCabinet(cabinet)"
                >
                  <div class="fw-semibold">{{ formatCabinetName(cabinet) }}</div>
                  <small class="text-muted">{{ cabinet.personal_number }}</small>
                </div>
                <div v-if="cabinetSearchResults.length === 0 && orderFormData.cabinetSearch.trim()" class="dropdown-item text-muted text-center py-2">
                  Кабинеты не найдены
                </div>
              </div>
            </div>
            <div v-if="orderFormData.selectedCabinet" class="mt-2 p-2 bg-light rounded">
              <small class="text-muted d-block mb-1">Выбранный кабинет:</small>
              <div class="fw-semibold">{{ formatCabinetName(orderFormData.selectedCabinet) }}</div>
              <small class="text-muted">{{ orderFormData.selectedCabinet.personal_number }}</small>
            </div>
              </div>

              <!-- Шаг 2: Выбор товаров -->
              <div v-if="currentOrderStep === 2" class="step-panel">
                <h6 class="mb-3">Выбор товаров</h6>
                
                <div v-if="loadingProducts" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                </div>
                
                <!-- Список всех товаров -->
                <div v-else class="products-list mb-4">
                  <div 
                    v-for="product in allProducts" 
                    :key="product.id"
                    class="product-item-card"
                    :class="{ 'selected': isProductInOrder(product.id) }"
                  >
                    <div class="d-flex align-items-center gap-3">
                      <div class="product-item-image">
                        <img 
                          v-if="product.images && product.images.length > 0" 
                          :src="product.images[0].src" 
                          :alt="product.name"
                          class="product-item-img"
                        />
                        <div v-else class="product-item-placeholder">
                          <i class="bi bi-image"></i>
                        </div>
                      </div>
                      <div class="flex-grow-1">
                        <div class="fw-semibold">{{ product.name }}</div>
                        <small class="text-muted">{{ product.description || product.sku || '-' }}</small>
                        <div class="product-item-price mt-1">{{ formatCurrency(product.price) }}</div>
                      </div>
                      <div class="product-item-actions">
                        <div v-if="isProductInOrder(product.id)" class="quantity-controls">
                          <button 
                            type="button"
                            class="quantity-btn minus"
                            @click="decreaseProductQuantityByProductId(product.id)"
                          >
                            <i class="bi bi-dash"></i>
                          </button>
                          <span class="quantity-value">{{ getProductQuantityByProductId(product.id) }}</span>
                          <button 
                            type="button"
                            class="quantity-btn plus"
                            @click="increaseProductQuantityByProductId(product.id)"
                          >
                            <i class="bi bi-plus"></i>
                          </button>
                        </div>
                        <button 
                          v-else
                          type="button"
                          class="add-product-btn"
                          @click="addProductToOrder(product)"
                        >
                          <i class="bi bi-plus-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="allProducts.length === 0 && !loadingProducts" class="text-muted text-center py-4">
                  Товары не найдены
                </div>
                
                <!-- Список выбранных товаров -->
            <div v-if="orderFormData.items.length > 0" class="selected-products-list">
              <div 
                v-for="(item, index) in orderFormData.items" 
                :key="index"
                class="selected-product-item"
              >
                <div class="d-flex align-items-center gap-2">
                  <img 
                    v-if="item.product.images && item.product.images.length > 0" 
                    :src="item.product.images[0].src" 
                    :alt="item.product.name"
                    style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                  />
                  <div v-else class="bg-light d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; border-radius: 4px;">
                    <i class="bi bi-image text-muted"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="fw-semibold">{{ item.product.name }}</div>
                    <small class="text-muted">{{ formatCurrency(item.product.price) }} за шт.</small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      @click="decreaseProductQuantity(index)"
                    >
                      <i class="bi bi-dash"></i>
                    </button>
                    <span class="fw-semibold" style="min-width: 30px; text-align: center;">{{ item.quantity }}</span>
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      @click="increaseProductQuantity(index)"
                    >
                      <i class="bi bi-plus"></i>
                    </button>
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="removeProduct(index)"
                    >
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
                <div v-else class="text-muted text-center py-3">
                  Товары не выбраны
                </div>
              </div>

              <!-- Шаг 3: Статус и способ доставки -->
              <div v-if="currentOrderStep === 3" class="step-panel">
                <h6 class="mb-3">Статус и способ доставки</h6>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Статус <span class="text-danger">*</span></label>
                    <select 
                      class="form-select" 
                      v-model.number="orderFormData.status_id"
                      required
                    >
                      <option :value="0">Выберите статус</option>
                      <option v-for="status in orderStatuses" :key="status.id" :value="status.id">
                        {{ status.description }} ({{ status.name }})
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Способ доставки <span class="text-danger">*</span></label>
                    <select 
                      class="form-select" 
                      v-model.number="orderFormData.delivery_method_id"
                      required
                    >
                      <option :value="0">Выберите способ доставки</option>
                      <option v-for="method in deliveryMethods" :key="method.id" :value="method.id">
                        {{ method.description }} ({{ method.name }})
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Шаг 4: Дополнительная информация -->
              <div v-if="currentOrderStep === 4" class="step-panel">
                <h6 class="mb-3">Дополнительная информация</h6>
                <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Дата заказа</label>
                <input 
                  type="datetime-local" 
                  class="form-control" 
                  v-model="orderFormData.order_date"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Дата доставки</label>
                <input 
                  type="datetime-local" 
                  class="form-control" 
                  v-model="orderFormData.delivery_date"
                />
              </div>
              <div class="col-12">
                <label class="form-label">Адрес доставки</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="orderFormData.shipping_address"
                  placeholder="Город, улица, дом, квартира"
                />
              </div>
              <div class="col-12">
                <label class="form-label">Примечания</label>
                <textarea 
                  class="form-control" 
                  v-model="orderFormData.notes"
                  rows="3"
                  placeholder="Дополнительная информация о заказе"
                ></textarea>
                </div>
                </div>
              </div>

              <!-- Навигация между шагами -->
              <div class="d-flex gap-2 mt-4">
                <button 
                  v-if="currentOrderStep > 1"
                  type="button" 
                  @click="prevOrderStep" 
                  class="btn btn-outline-secondary flex-grow-1"
                >
                  Назад
                </button>
                <button 
                  v-if="currentOrderStep < 4"
                  type="submit" 
                  class="btn btn-primary flex-grow-1"
                  style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
                >
                  Продолжить
                </button>
                <button 
                  v-if="currentOrderStep === 4"
                  type="button" 
                  @click="handleCreateOrder" 
                  class="btn btn-primary flex-grow-1"
                  style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
                >
                  Создать заказ
                </button>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeAddModal"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="addModalOpen" 
      class="modal-backdrop fade show"
      @click="closeAddModal"
    ></div>

    <!-- Модальное окно просмотра заказа -->
    <OrderDetailsModal
      :is-open="viewModalOpen"
      :order-id="selectedOrderId"
      modal-id="orderDetailsModal"
      @close="closeViewModal"
      @updated="fetchOrders"
    />

    <!-- Модальное окно выдачи товара - теперь внутри OrderDetailsModal -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DataTable from '../components/DataTable.vue'
import FormModal from '../components/FormModal.vue'
import OrderDetailsModal from '../components/OrderDetailsModal.vue'
import { BACKEND_API_URL } from '../config'

const items = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')

// Filter data
const orderStatuses = ref([])
const paymentMethods = ref([])
const paymentStatuses = ref([])
const fulfillmentStatuses = ref([])
const deliveryMethods = ref([])

// Selected filters
const selectedStatusIds = ref([])
const selectedPaymentMethodIds = ref([])
const selectedPaymentStatusIds = ref([])
const selectedFulfillmentStatusIds = ref([])

const addModalOpen = ref(false)
const currentOrderStep = ref(1)

const orderSteps = [
  { label: 'Кабинет' },
  { label: 'Товары' },
  { label: 'Доставка' },
  { label: 'Детали' }
]

const orderFormData = ref({
  cabinet_id: '',
  cabinetSearch: '',
  selectedCabinet: null,
  items: [],
  status_id: 0,
  delivery_method_id: 0,
  order_date: '',
  delivery_date: '',
  notes: '',
  shipping_address: ''
})

const cabinetSearchResults = ref([])
const cabinetSearchLoading = ref(false)
const showCabinetDropdown = ref(false)

const allProducts = ref([])
const loadingProducts = ref(false)


let cabinetSearchTimeout = null

const columns = [
  { key: 'id', label: '#' },
  { key: 'cabinet_info', label: 'Кабинет' },
  { key: 'total_amount', label: 'Сумма' },
  { key: 'status', label: 'Статус заказа' },
  { key: 'payment_method', label: 'Способ оплаты' },
  { key: 'payment_status', label: 'Статус оплаты' },
  { key: 'fulfillment_status', label: 'Статус выдачи' },
  { key: 'order_date', label: 'Дата заказа' }
]

const actions = [
  { label: 'Просмотр', handler: (item) => handleViewOrder(item), icon: 'bi-eye' },
  { label: 'Изменить', handler: (item) => handleEditOrder(item), icon: 'bi-pencil' },
  { label: 'Удалить', handler: (item) => handleDeleteOrder(item), icon: 'bi-trash', class: 'text-danger' }
]

const formatCabinetName = (cabinet) => {
  if (!cabinet || !cabinet.participant) return '-'
  const parts = []
  if (cabinet.participant.lastname) parts.push(cabinet.participant.lastname)
  if (cabinet.participant.name) parts.push(cabinet.participant.name)
  if (cabinet.participant.patronymic) parts.push(cabinet.participant.patronymic)
  const fullName = parts.length > 0 ? parts.join(' ') : '-'
  const personalNumber = cabinet.personal_number || '-'
  const sequenceNumber = cabinet.sequence_number || '-'
  return `${fullName} (${personalNumber}) - Кабинет №${sequenceNumber}`
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
    return 'status-issued' // Зеленый круг
  } else if (status === 'частично выдано' || status === 'partially issued' || status.includes('частично')) {
    return 'status-partial' // Желтый круг
  } else if (status === 'не выдано' || status === 'not issued') {
    return 'status-not-issued' // Красный круг
  }
  
  return 'status-unknown' // Серый круг по умолчанию
}

const handleCabinetSearch = () => {
  clearTimeout(cabinetSearchTimeout)
  
  if (!orderFormData.value.cabinetSearch.trim()) {
    cabinetSearchResults.value = []
    showCabinetDropdown.value = false
    return
  }
  
  cabinetSearchTimeout = setTimeout(async () => {
    await searchCabinets()
  }, 500)
}

const searchCabinets = async () => {
  if (!orderFormData.value.cabinetSearch.trim()) {
    cabinetSearchResults.value = []
    return
  }
  
  cabinetSearchLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      page: '1',
      page_size: '20',
      search: orderFormData.value.cabinetSearch.trim()
    })
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      cabinetSearchResults.value = data.cabinets || []
      showCabinetDropdown.value = true
    }
  } catch (err) {
    console.error('Error searching cabinets:', err)
    cabinetSearchResults.value = []
  } finally {
    cabinetSearchLoading.value = false
  }
}

const selectCabinet = (cabinet) => {
  orderFormData.value.selectedCabinet = cabinet
  orderFormData.value.cabinet_id = cabinet.id
  orderFormData.value.cabinetSearch = formatCabinetName(cabinet)
  showCabinetDropdown.value = false
}

const clearCabinet = () => {
  orderFormData.value.selectedCabinet = null
  orderFormData.value.cabinet_id = ''
  orderFormData.value.cabinetSearch = ''
  cabinetSearchResults.value = []
  showCabinetDropdown.value = false
}

const fetchAllProducts = async () => {
  loadingProducts.value = true
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      allProducts.value = data.map(product => ({
        ...product,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
      }))
    }
  } catch (err) {
    console.error('Error fetching products:', err)
  } finally {
    loadingProducts.value = false
  }
}

const isProductInOrder = (productId) => {
  return orderFormData.value.items.some(item => item.product_id === productId)
}

const getProductQuantityByProductId = (productId) => {
  const item = orderFormData.value.items.find(item => item.product_id === productId)
  return item ? item.quantity : 0
}

const increaseProductQuantityByProductId = (productId) => {
  const index = orderFormData.value.items.findIndex(item => item.product_id === productId)
  if (index > -1) {
    orderFormData.value.items[index].quantity++
  }
}

const decreaseProductQuantityByProductId = (productId) => {
  const index = orderFormData.value.items.findIndex(item => item.product_id === productId)
  if (index > -1) {
    if (orderFormData.value.items[index].quantity > 1) {
      orderFormData.value.items[index].quantity--
    } else {
      orderFormData.value.items.splice(index, 1)
    }
  }
}

const addProductToOrder = (product) => {
  const existingIndex = orderFormData.value.items.findIndex(item => item.product.id === product.id)
  if (existingIndex > -1) {
    orderFormData.value.items[existingIndex].quantity++
  } else {
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
    orderFormData.value.items.push({
      product: product,
      product_id: product.id,
      quantity: 1,
      unit_price: price
    })
  }
  productSearchQuery.value = ''
  showProductDropdown.value = false
}

const increaseProductQuantity = (index) => {
  orderFormData.value.items[index].quantity++
}

const decreaseProductQuantity = (index) => {
  if (orderFormData.value.items[index].quantity > 1) {
    orderFormData.value.items[index].quantity--
  } else {
    orderFormData.value.items.splice(index, 1)
  }
}

const removeProduct = (index) => {
  orderFormData.value.items.splice(index, 1)
}

const fetchOrderStatuses = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/orders/statuses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (response.ok) {
      orderStatuses.value = await response.json()
    }
  } catch (err) {
    console.error('Error fetching order statuses:', err)
  }
}



const openAddModal = () => {
  currentOrderStep.value = 1
  orderFormData.value = {
    cabinet_id: '',
    cabinetSearch: '',
    selectedCabinet: null,
    items: [],
    status_id: 0,
    delivery_method_id: 0,
    order_date: new Date().toISOString().slice(0, 16),
    delivery_date: '',
    notes: '',
    shipping_address: ''
  }
  cabinetSearchResults.value = []
  showCabinetDropdown.value = false
  addModalOpen.value = true
  if (allProducts.value.length === 0) {
    fetchAllProducts()
  }
}

const closeAddModal = () => {
  addModalOpen.value = false
  currentOrderStep.value = 1
  orderFormData.value = {
    cabinet_id: '',
    cabinetSearch: '',
    selectedCabinet: null,
    items: [],
    status_id: 0,
    delivery_method_id: 0,
    order_date: '',
    delivery_date: '',
    notes: '',
    shipping_address: ''
  }
  cabinetSearchResults.value = []
  showCabinetDropdown.value = false
}

const handleNextStep = () => {
  // Валидация перед переходом на следующий шаг
  if (currentOrderStep.value === 1) {
    if (!orderFormData.value.selectedCabinet) {
      error.value = 'Выберите кабинет'
      return
    }
  } else if (currentOrderStep.value === 2) {
    if (orderFormData.value.items.length === 0) {
      error.value = 'Добавьте хотя бы один товар'
      return
    }
  } else if (currentOrderStep.value === 3) {
    if (!orderFormData.value.status_id || orderFormData.value.status_id === 0) {
      error.value = 'Выберите статус заказа'
      return
    }
    if (!orderFormData.value.delivery_method_id || orderFormData.value.delivery_method_id === 0) {
      error.value = 'Выберите способ доставки'
      return
    }
  }
  
  error.value = ''
  if (currentOrderStep.value < 4) {
    currentOrderStep.value++
  }
}

const prevOrderStep = () => {
  if (currentOrderStep.value > 1) {
    currentOrderStep.value--
    error.value = ''
  }
}

const handleCreateOrder = async () => {
  try {
    error.value = ''
    
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }
    
    const payload = {
      cabinet_id: orderFormData.value.cabinet_id,
      items: orderFormData.value.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      status_id: orderFormData.value.status_id,
      delivery_method_id: orderFormData.value.delivery_method_id,
      order_date: orderFormData.value.order_date || new Date().toISOString(),
      delivery_date: orderFormData.value.delivery_date || null,
      notes: orderFormData.value.notes || null,
      shipping_address: orderFormData.value.shipping_address || null
    }
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/orders/`, {
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
    
    closeAddModal()
    await fetchOrders() // Обновляем список заказов
  } catch (err) {
    error.value = err.message || 'Ошибка при создании заказа'
    console.error('Error creating order:', err)
  }
}

const handleClickOutside = (event) => {
  const target = event.target
  const cabinetInput = document.querySelector('input[placeholder="Поиск кабинета..."]')
  const cabinetDropdown = document.querySelector('.participant-dropdown')
  
  if (cabinetInput && cabinetDropdown && 
      !cabinetInput.contains(target) && 
      !cabinetDropdown.contains(target)) {
    showCabinetDropdown.value = false
  }
}

watch(() => addModalOpen.value, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)
    fetchOrderStatuses()
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const changePageSize = () => {
  currentPage.value = 1
}

const displayedPages = computed(() => {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || (i >= currentPage.value - delta && i <= currentPage.value + delta)) {
      range.push(i)
    }
  }

  range.forEach(i => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
})

// Fetch filter data
const fetchFilterData = async () => {
  const token = localStorage.getItem('access_token')
  if (!token) return

  try {
    // Fetch order statuses
    const statusesResponse = await fetch(`${BACKEND_API_URL}/api/admin/orders/statuses/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (statusesResponse.ok) {
      orderStatuses.value = await statusesResponse.json()
    }

    // Fetch payment methods
    const methodsResponse = await fetch(`${BACKEND_API_URL}/api/admin/orders/payment-methods/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (methodsResponse.ok) {
      paymentMethods.value = await methodsResponse.json()
    }

    // Fetch payment statuses
    const paymentStatusesResponse = await fetch(`${BACKEND_API_URL}/api/admin/orders/payment-statuses/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (paymentStatusesResponse.ok) {
      paymentStatuses.value = await paymentStatusesResponse.json()
    }

    // Fetch fulfillment statuses
    const fulfillmentStatusesResponse = await fetch(`${BACKEND_API_URL}/api/admin/orders/fulfillment-statuses/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (fulfillmentStatusesResponse.ok) {
      fulfillmentStatuses.value = await fulfillmentStatusesResponse.json()
    }

    // Fetch delivery methods
    const deliveryMethodsResponse = await fetch(`${BACKEND_API_URL}/api/admin/orders/delivery-methods/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (deliveryMethodsResponse.ok) {
      deliveryMethods.value = await deliveryMethodsResponse.json()
    }
  } catch (err) {
    console.error('Error fetching filter data:', err)
  }
}

// Toggle functions
const toggleStatus = (statusId) => {
  const index = selectedStatusIds.value.indexOf(statusId)
  if (index > -1) {
    selectedStatusIds.value.splice(index, 1)
  } else {
    selectedStatusIds.value.push(statusId)
  }
  applyFilters()
}

const togglePaymentMethod = (methodId) => {
  const index = selectedPaymentMethodIds.value.indexOf(methodId)
  if (index > -1) {
    selectedPaymentMethodIds.value.splice(index, 1)
  } else {
    selectedPaymentMethodIds.value.push(methodId)
  }
  applyFilters()
}

const togglePaymentStatus = (statusId) => {
  const index = selectedPaymentStatusIds.value.indexOf(statusId)
  if (index > -1) {
    selectedPaymentStatusIds.value.splice(index, 1)
  } else {
    selectedPaymentStatusIds.value.push(statusId)
  }
  applyFilters()
}

const toggleFulfillmentStatus = (statusId) => {
  const index = selectedFulfillmentStatusIds.value.indexOf(statusId)
  if (index > -1) {
    selectedFulfillmentStatusIds.value.splice(index, 1)
  } else {
    selectedFulfillmentStatusIds.value.push(statusId)
  }
  applyFilters()
}

// Active filters
const hasActiveFilters = computed(() => {
  return selectedStatusIds.value.length > 0 || 
         selectedPaymentMethodIds.value.length > 0 || 
         selectedPaymentStatusIds.value.length > 0 ||
         selectedFulfillmentStatusIds.value.length > 0
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (selectedStatusIds.value.length > 0) count++
  if (selectedPaymentMethodIds.value.length > 0) count++
  if (selectedPaymentStatusIds.value.length > 0) count++
  if (selectedFulfillmentStatusIds.value.length > 0) count++
  return count
})

const clearFilters = () => {
  selectedStatusIds.value = []
  selectedPaymentMethodIds.value = []
  selectedPaymentStatusIds.value = []
  selectedFulfillmentStatusIds.value = []
  fetchOrders()
}

const applyFilters = () => {
  currentPage.value = 1
  fetchOrders()
}

const fetchOrders = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }
    
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      page_size: pageSize.value.toString()
    })
    
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }
    
    // Add filter parameters
    selectedStatusIds.value.forEach(id => {
      params.append('status_id', id.toString())
    })
    
    selectedPaymentMethodIds.value.forEach(id => {
      params.append('payment_method_id', id.toString())
    })
    
    selectedPaymentStatusIds.value.forEach(id => {
      params.append('payment_status_id', id.toString())
    })
    
    selectedFulfillmentStatusIds.value.forEach(id => {
      params.append('fulfillment_status_id', id.toString())
    })
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/orders/?${params.toString()}`, {
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
    
    const data = await response.json()
    
    // API возвращает массив заказов напрямую
    const ordersArray = Array.isArray(data) ? data : (data.orders || data.items || [])
    
    // Форматируем данные для таблицы
    items.value = ordersArray.map(order => ({
      id: order.id,
      cabinet_info: formatCabinetInfo(order.cabinet),
      total_amount: formatCurrency(order.total_amount),
      status: order.status?.description || order.status?.name || '-',
      status_name: order.status?.name || '-',
      payment_method: order.payment_method?.name || order.payment_method?.description || '-',
      payment_status: order.payment_status?.name || order.payment_status?.description || '-',
      fulfillment_status: order.fulfillment_status?.name || order.fulfillment_status?.description || null,
      delivery_method: order.delivery_method?.description || order.delivery_method?.name || '-',
      order_date: formatDate(order.order_date),
      delivery_date: formatDate(order.delivery_date),
      created_at: formatDate(order.created_at),
      notes: order.notes || '-',
      shipping_address: order.shipping_address || '-',
      _raw: order // Сохраняем исходные данные для действий
    }))
    
    // Если API возвращает пагинацию
    if (data.total_pages !== undefined) {
      totalPages.value = data.total_pages
    } else {
      // Если пагинации нет, показываем все на одной странице
      totalPages.value = 1
    }
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке заказов'
    console.error('Error fetching orders:', err)
  } finally {
    loading.value = false
  }
}

const formatCabinetInfo = (cabinet) => {
  if (!cabinet || !cabinet.participant) return '-'
  const parts = []
  if (cabinet.participant.lastname) parts.push(cabinet.participant.lastname)
  if (cabinet.participant.name) parts.push(cabinet.participant.name)
  if (cabinet.participant.patronymic) parts.push(cabinet.participant.patronymic)
  const fullName = parts.length > 0 ? parts.join(' ') : cabinet.participant.email || '-'
  return `${fullName} (${cabinet.personal_number})`
}

const formatParticipantFullName = (participant) => {
  if (!participant) return '-'
  const parts = []
  if (participant.lastname) parts.push(participant.lastname)
  if (participant.name) parts.push(participant.name)
  if (participant.patronymic) parts.push(participant.patronymic)
  return parts.length > 0 ? parts.join(' ') : participant.email || '-'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (err) {
    return dateString
  }
}

const viewModalOpen = ref(false)
const selectedOrderId = ref(null)

const handleViewOrder = async (item) => {
  selectedOrderId.value = item.id
  viewModalOpen.value = true
}

const closeViewModal = () => {
  viewModalOpen.value = false
  selectedOrderId.value = null
}


const handleEditOrder = (item) => {
  console.log('Edit order:', item)
  // TODO: Реализовать редактирование заказа
}

const handleDeleteOrder = (item) => {
  console.log('Delete order:', item)
  // TODO: Реализовать удаление заказа
}

watch([currentPage, pageSize], () => {
  fetchOrders()
})

watch(searchQuery, () => {
  currentPage.value = 1
  fetchOrders()
})

onMounted(async () => {
  await fetchFilterData()
  fetchOrders()
})
</script>

<style scoped>
.order-form {
  max-height: 70vh;
  overflow-y: auto;
}

.participant-dropdown {
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

.products-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.product-item-card {
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: white;
  transition: all 0.2s ease;
}

.product-item-card:hover {
  border-color: rgba(0, 0, 128, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 128, 0.1);
}

.product-item-card.selected {
  border-color: rgb(0, 0, 128);
  background: rgba(0, 0, 128, 0.02);
}

.product-item-image {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 0.375rem;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 1.5rem;
}

.product-item-price {
  font-weight: 700;
  color: rgb(0, 0, 128);
  font-size: 1rem;
}

.product-item-actions {
  flex-shrink: 0;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 0.25rem;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
  color: #333;
}

.quantity-btn:hover:not(:disabled) {
  background: rgb(0, 0, 128);
  color: white;
  transform: scale(1.1);
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-btn.plus {
  background: rgb(0, 0, 128);
  color: white;
}

.quantity-btn.plus:hover:not(:disabled) {
  background: rgba(0, 0, 128, 0.9);
}

.quantity-value {
  font-weight: 600;
  min-width: 24px;
  text-align: center;
  font-size: 1rem;
}

.add-product-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgb(0, 0, 128);
  background: white;
  color: rgb(0, 0, 128);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
}

.add-product-btn:hover {
  background: rgb(0, 0, 128);
  color: white;
  transform: scale(1.1);
}

.selected-products-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.selected-product-item {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.75rem;
  background: #f8f9fa;
}

.order-view {
  max-height: 70vh;
  overflow-y: auto;
}

.order-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item-card {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
}

.order-item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 0.375rem;
  overflow: hidden;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 2rem;
}

.steps-container {
  margin-bottom: 2rem;
}

.steps-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.steps-wrapper::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e0e0e0;
  z-index: 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.step-item.active .step-circle {
  background: rgb(0, 0, 128);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 128, 0.4);
}

.step-item.completed .step-circle {
  background: #28a745;
  color: white;
}

.step-label {
  font-size: 0.85rem;
  color: #666;
  text-align: center;
}

.step-item.active .step-label {
  color: rgb(0, 0, 128);
  font-weight: 600;
}

.step-panel {
  min-height: 300px;
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

/* Redesigned Order View */
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

