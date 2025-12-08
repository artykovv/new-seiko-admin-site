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
          </button>
          <ul class="dropdown-menu dropdown-menu-end p-3" style="min-width: 250px;">
            <li class="text-muted small">Фильтры будут добавлены позже</li>
          </ul>
        </div>
        
        <button 
          class="btn btn-primary d-flex align-items-center gap-2"
          style="font-size: 14px; background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
          @click="openAddModal"
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
        />
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
    <div 
      class="modal fade" 
      :class="{ show: viewModalOpen, 'd-block': viewModalOpen }" 
      :style="{ display: viewModalOpen ? 'block' : 'none' }"
      tabindex="-1"
      role="dialog"
      @click.self="closeViewModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Просмотр заказа #{{ viewOrderData?.id }}</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="closeViewModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="loadingOrder" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            <div v-else-if="viewOrderData" class="order-view">
              <!-- Информация о заказе -->
              <div class="mb-4">
                <h6 class="mb-3 border-bottom pb-2">Информация о заказе</h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="text-muted small">ID заказа</label>
                    <div class="fw-semibold">#{{ viewOrderData.id }}</div>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small">Общая сумма</label>
                    <div class="fw-semibold text-primary">{{ formatCurrency(viewOrderData.total_amount) }}</div>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small">Дата заказа</label>
                    <div>{{ formatDate(viewOrderData.order_date) }}</div>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small">Дата доставки</label>
                    <div>{{ formatDate(viewOrderData.delivery_date) || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small">Статус</label>
                    <div>
                      <span class="badge bg-secondary">{{ viewOrderData.status?.description || viewOrderData.status?.name || '-' }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small">Способ доставки</label>
                    <div>{{ viewOrderData.delivery_method?.description || viewOrderData.delivery_method?.name || '-' }}</div>
                  </div>
                  <div class="col-12" v-if="viewOrderData.shipping_address">
                    <label class="text-muted small">Адрес доставки</label>
                    <div>{{ viewOrderData.shipping_address }}</div>
                  </div>
                  <div class="col-12" v-if="viewOrderData.notes">
                    <label class="text-muted small">Примечания</label>
                    <div>{{ viewOrderData.notes }}</div>
                  </div>
                </div>
              </div>

              <!-- Информация об участнике -->
              <div class="mb-4">
                <h6 class="mb-3 border-bottom pb-2">Участник</h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="text-muted small">ФИО</label>
                    <div class="fw-semibold">{{ formatParticipantFullName(viewOrderData.participant) }}</div>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small">Email</label>
                    <div>{{ viewOrderData.participant?.email || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small">Код</label>
                    <div>{{ viewOrderData.participant?.code || '-' }}</div>
                  </div>
                  <div class="col-md-6">
                    <label class="text-muted small">Персональный номер</label>
                    <div>{{ viewOrderData.participant?.personal_number || '-' }}</div>
                  </div>
                </div>
              </div>

              <!-- Товары в заказе -->
              <div class="mb-4">
                <h6 class="mb-3 border-bottom pb-2">Товары ({{ viewOrderData.items?.length || 0 }})</h6>
                <div v-if="viewOrderData.items && viewOrderData.items.length > 0" class="order-items-list">
                  <div 
                    v-for="(item, index) in viewOrderData.items" 
                    :key="index"
                    class="order-item-card"
                  >
                    <div class="d-flex align-items-start gap-3">
                      <div class="order-item-image">
                        <img 
                          v-if="item.product?.images && item.product.images.length > 0" 
                          :src="item.product.images[0].src" 
                          :alt="item.product?.name"
                          class="order-item-img"
                        />
                        <div v-else class="order-item-placeholder">
                          <i class="bi bi-image"></i>
                        </div>
                      </div>
                      <div class="flex-grow-1">
                        <div class="fw-semibold mb-1">{{ item.product?.name || '-' }}</div>
                        <div class="text-muted small mb-2">{{ item.product?.description || item.product?.sku || '-' }}</div>
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <span class="text-muted small">Количество: </span>
                            <span class="fw-semibold">{{ item.quantity }}</span>
                          </div>
                          <div>
                            <span class="text-muted small">Цена за шт.: </span>
                            <span class="fw-semibold">{{ formatCurrency(item.unit_price) }}</span>
                          </div>
                          <div>
                            <span class="text-muted small">Итого: </span>
                            <span class="fw-semibold text-primary">{{ formatCurrency(item.total_price) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-muted text-center py-3">
                  Товары не найдены
                </div>
              </div>

              <!-- Дополнительная информация -->
              <div class="mb-4">
                <h6 class="mb-3 border-bottom pb-2">Дополнительная информация</h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="text-muted small">Создан</label>
                    <div>{{ formatDate(viewOrderData.created_at) }}</div>
                  </div>
                  <div class="col-md-6" v-if="viewOrderData.updated_at">
                    <label class="text-muted small">Обновлен</label>
                    <div>{{ formatDate(viewOrderData.updated_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeViewModal"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="viewModalOpen" 
      class="modal-backdrop fade show"
      @click="closeViewModal"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DataTable from '../components/DataTable.vue'
import FormModal from '../components/FormModal.vue'
import { BACKEND_API_URL } from '../config'

const items = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')

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

const orderStatuses = ref([])
const deliveryMethods = ref([])

let cabinetSearchTimeout = null

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'cabinet_info', label: 'Кабинет' },
  { key: 'total_amount', label: 'Сумма' },
  { key: 'status', label: 'Статус' },
  { key: 'delivery_method', label: 'Способ доставки' },
  { key: 'order_date', label: 'Дата заказа' },
  { key: 'created_at', label: 'Создан' }
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

const fetchDeliveryMethods = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/orders/delivery-methods`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (response.ok) {
      deliveryMethods.value = await response.json()
    }
  } catch (err) {
    console.error('Error fetching delivery methods:', err)
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
    fetchDeliveryMethods()
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
    
    // Форматируем данные для таблицы
    items.value = data.map(order => ({
      id: order.id,
      cabinet_info: formatCabinetInfo(order.cabinet),
      total_amount: formatCurrency(order.total_amount),
      status: order.status?.description || order.status?.name || '-',
      status_name: order.status?.name || '-',
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
const viewOrderData = ref(null)
const loadingOrder = ref(false)

const handleViewOrder = async (item) => {
  loadingOrder.value = true
  viewModalOpen.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/orders/${item.id}`, {
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
    
    viewOrderData.value = await response.json()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке заказа'
    console.error('Error fetching order:', err)
    viewModalOpen.value = false
  } finally {
    loadingOrder.value = false
  }
}

const closeViewModal = () => {
  viewModalOpen.value = false
  viewOrderData.value = null
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

onMounted(() => {
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
</style>

