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
          @input="handleSearchInput"
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
          Добавить продукт
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
          :items="products"
          :actions="actions"
          class="h-100"
        >
          <template #cell-image="{ item }">
            <img 
              v-if="item.images && item.images.length > 0" 
              :src="item.images[0].src" 
              :alt="item.name"
              style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
            />
            <div 
              v-else 
              class="d-flex align-items-center justify-content-center bg-light border rounded"
              style="width: 50px; height: 50px;"
            >
              <i class="bi bi-image text-muted"></i>
            </div>
          </template>
          <template #cell-price="{ value }">
            {{ formatPrice(value) }}
          </template>
          <template #cell-cost_price="{ value }">
            {{ formatPrice(value) }}
          </template>
          <template #cell-stock="{ value }">
            <span :class="getStockClass(value)">{{ value }}</span>
          </template>
          <template #cell-created_at="{ value }">
            {{ formatDate(value) }}
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

    <!-- Модальное окно добавления продукта -->
    <FormModal
      :is-open="addModalOpen"
      title="Добавить продукт"
      save-button-text="Добавить"
      @save="handleAddProduct"
      @close="closeAddModal"
    >
      <template #body>
        <form @submit.prevent="handleAddProduct" class="product-form">
          <div class="mb-3">
            <label for="add_sku" class="form-label">SKU <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="add_sku" 
              v-model="addFormData.sku"
              placeholder="BAD-001"
              required
            />
          </div>
          <div class="mb-3">
            <label for="add_name" class="form-label">Название <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="add_name" 
              v-model="addFormData.name"
              placeholder="Японский бад для иммунитета"
              required
            />
          </div>
          <div class="mb-3">
            <label for="add_description" class="form-label">Описание</label>
            <textarea 
              class="form-control" 
              id="add_description" 
              v-model="addFormData.description"
              placeholder="Высококачественный японский бад для укрепления иммунной системы"
              rows="3"
            ></textarea>
          </div>
          <div class="mb-3">
            <label for="add_price" class="form-label">Цена <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="add_price" 
              v-model.number="addFormData.price"
              placeholder="45.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div class="mb-3">
            <label for="add_cost_price" class="form-label">Себестоимость <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="add_cost_price" 
              v-model.number="addFormData.cost_price"
              placeholder="25.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div class="mb-3">
            <label for="add_stock" class="form-label">Остаток <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="add_stock" 
              v-model.number="addFormData.stock"
              placeholder="100"
              min="0"
              required
            />
          </div>
        </form>
      </template>
    </FormModal>

    <!-- Модальное окно редактирования продукта -->
    <FormModal
      :is-open="editModalOpen"
      title="Изменить продукт"
      save-button-text="Сохранить"
      @save="handleEditProduct"
      @close="closeEditModal"
    >
      <template #body>
        <form @submit.prevent="handleEditProduct" class="product-form">
          <div class="mb-3">
            <label for="edit_sku" class="form-label">SKU <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_sku" 
              v-model="editFormData.sku"
              placeholder="BAD-001"
              required
            />
          </div>
          <div class="mb-3">
            <label for="edit_name" class="form-label">Название <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="edit_name" 
              v-model="editFormData.name"
              placeholder="Японский бад для иммунитета"
              required
            />
          </div>
          <div class="mb-3">
            <label for="edit_description" class="form-label">Описание</label>
            <textarea 
              class="form-control" 
              id="edit_description" 
              v-model="editFormData.description"
              placeholder="Высококачественный японский бад для укрепления иммунной системы"
              rows="3"
            ></textarea>
          </div>
          <div class="mb-3">
            <label for="edit_price" class="form-label">Цена <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="edit_price" 
              v-model.number="editFormData.price"
              placeholder="45.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div class="mb-3">
            <label for="edit_cost_price" class="form-label">Себестоимость <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="edit_cost_price" 
              v-model.number="editFormData.cost_price"
              placeholder="25.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div class="mb-3">
            <label for="edit_stock" class="form-label">Остаток <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              id="edit_stock" 
              v-model.number="editFormData.stock"
              placeholder="100"
              min="0"
              required
            />
          </div>
        </form>
      </template>
    </FormModal>

    <!-- Модальное окно подтверждения удаления -->
    <ConfirmModal
      :is-open="deleteModalOpen"
      title="Удаление продукта"
      :message="deleteConfirmMessage"
      @confirm="handleDeleteProduct"
      @close="closeDeleteModal"
    />

    <!-- Модальное окно просмотра продукта -->
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
            <h5 class="modal-title">Просмотр продукта</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="closeViewModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="viewLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            <div v-else>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label fw-semibold">Изображения</label>
                  <div v-if="viewData.images && viewData.images.length > 0" class="d-flex flex-column gap-2">
                    <img 
                      v-for="(image, index) in viewData.images" 
                      :key="image.id || index"
                      :src="image.src" 
                      :alt="viewData.name"
                      class="img-fluid rounded border"
                      style="max-height: 200px; object-fit: cover;"
                    />
                  </div>
                  <div v-else class="d-flex align-items-center justify-content-center bg-light border rounded p-4">
                    <i class="bi bi-image text-muted" style="font-size: 3rem;"></i>
                  </div>
                </div>
                <div class="col-md-8">
                  <div class="mb-3">
                    <label class="form-label fw-semibold">SKU</label>
                    <p class="mb-0">{{ viewData.sku || '-' }}</p>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Название</label>
                    <p class="mb-0">{{ viewData.name || '-' }}</p>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Описание</label>
                    <p class="mb-0">{{ viewData.description || '-' }}</p>
                  </div>
                  <div class="row">
                    <div class="col-md-4 mb-3">
                      <label class="form-label fw-semibold">Цена</label>
                      <p class="mb-0">{{ viewData.price ? formatPrice(viewData.price) : '-' }}</p>
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label fw-semibold">Себестоимость</label>
                      <p class="mb-0">{{ viewData.cost_price ? formatPrice(viewData.cost_price) : '-' }}</p>
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label fw-semibold">Остаток</label>
                      <p class="mb-0">
                        <span :class="getStockClass(viewData.stock)">{{ viewData.stock || 0 }}</span>
                      </p>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">Дата создания</label>
                      <p class="mb-0">{{ viewData.created_at ? formatDate(viewData.created_at) : '-' }}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">Дата обновления</label>
                      <p class="mb-0">{{ viewData.updated_at ? formatDate(viewData.updated_at) : '-' }}</p>
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
              @click="closeViewModal"
            >
              Закрыть
            </button>
            <button 
              type="button" 
              class="btn btn-primary"
              style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
              @click="openEditModalFromView"
            >
              Редактировать
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
import ConfirmModal from '../components/ConfirmModal.vue'
import { BACKEND_API_URL } from '../config'

const products = ref([])
const allProducts = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(Number(localStorage.getItem('products_page')) || 1)
const totalPages = ref(1)
const pageSize = ref(Number(localStorage.getItem('products_pageSize')) || 20)
const searchQuery = ref('')

const addModalOpen = ref(false)
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)
const viewModalOpen = ref(false)
const viewLoading = ref(false)
const viewData = ref({})
const deleteItemId = ref(null)
const deleteItemName = ref('')

const deleteConfirmMessage = computed(() => {
  return `Вы уверены, что хотите удалить продукт "${deleteItemName.value}"? Это действие нельзя отменить.`
})

const addFormData = ref({
  sku: '',
  name: '',
  description: '',
  price: 0,
  cost_price: 0,
  stock: 0
})

const editFormData = ref({
  id: null,
  sku: '',
  name: '',
  description: '',
  price: 0,
  cost_price: 0,
  stock: 0
})

const columns = [
  { key: 'image', label: 'Изображение' },
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Название' },
  { key: 'price', label: 'Цена' },
  { key: 'cost_price', label: 'Себестоимость' },
  { key: 'stock', label: 'Остаток' },
  { key: 'created_at', label: 'Дата создания' }
]

const actions = [
  {
    label: 'Просмотр',
    icon: 'bi-eye',
    handler: (item) => openViewModal(item)
  },
  {
    label: 'Изменить',
    icon: 'bi-pencil',
    handler: (item) => openEditModal(item)
  },
  {
    label: 'Удалить',
    icon: 'bi-trash',
    class: 'text-danger',
    handler: (item) => openDeleteModal(item)
  }
]

const formatPrice = (price) => {
  if (!price) return '0 $'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  // Если число целое, отображаем без десятичной части
  if (numPrice % 1 === 0) {
    return numPrice.toString() + ' $'
  }
  return numPrice.toFixed(2) + ' $'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStockClass = (stock) => {
  if (stock === 0) return 'text-danger fw-bold'
  if (stock < 20) return 'text-warning fw-semibold'
  return 'text-success'
}

const fetchProducts = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите снова.')
      }
      throw new Error('Ошибка при загрузке продуктов')
    }

    const data = await response.json()
    allProducts.value = Array.isArray(data) ? data : []
    
    // Применяем поиск и пагинацию
    applyFilters()
  } catch (e) {
    console.error('Error fetching products:', e)
    error.value = e.message || 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  let filtered = [...allProducts.value]
  
  // Применяем поиск
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter(product => 
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    )
  }
  
  // Применяем пагинацию
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  products.value = filtered.slice(start, end)
  totalPages.value = Math.ceil(filtered.length / pageSize.value) || 1
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    localStorage.setItem('products_page', page.toString())
    applyFilters()
  }
}

const changePageSize = () => {
  currentPage.value = 1
  localStorage.setItem('products_pageSize', pageSize.value.toString())
  localStorage.setItem('products_page', '1')
  applyFilters()
}

const handleSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    applyFilters()
  }, 500)
}

let searchTimeout = null

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

// Watch for page size changes
watch(pageSize, (newSize) => {
  localStorage.setItem('products_pageSize', newSize.toString())
})

const openAddModal = () => {
  addFormData.value = {
    sku: '',
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    stock: 0
  }
  addModalOpen.value = true
}

const closeAddModal = () => {
  addModalOpen.value = false
  addFormData.value = {
    sku: '',
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    stock: 0
  }
}

const openViewModal = async (item) => {
  viewModalOpen.value = true
  viewLoading.value = true
  viewData.value = {}
  
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/${item.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка при загрузке данных продукта')
    }

    viewData.value = await response.json()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке продукта'
    console.error('Error loading product:', err)
  } finally {
    viewLoading.value = false
  }
}

const closeViewModal = () => {
  viewModalOpen.value = false
  viewData.value = {}
}

const openEditModalFromView = () => {
  closeViewModal()
  if (viewData.value.id) {
    openEditModal({ id: viewData.value.id })
  }
}

const openEditModal = async (item) => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/${item.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка при загрузке данных продукта')
    }

    const product = await response.json()
    editFormData.value = {
      id: product.id,
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      cost_price: typeof product.cost_price === 'string' ? parseFloat(product.cost_price) : product.cost_price,
      stock: product.stock || 0
    }
    editModalOpen.value = true
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке продукта'
    console.error('Error loading product:', err)
  }
}

const closeEditModal = () => {
  editModalOpen.value = false
  editFormData.value = {
    id: null,
    sku: '',
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    stock: 0
  }
}

const openDeleteModal = (item) => {
  deleteItemId.value = item.id
  deleteItemName.value = item.name
  deleteModalOpen.value = true
}

const closeDeleteModal = () => {
  deleteModalOpen.value = false
  deleteItemId.value = null
  deleteItemName.value = ''
}

const handleAddProduct = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const payload = {
      sku: addFormData.value.sku,
      name: addFormData.value.name,
      description: addFormData.value.description || null,
      price: addFormData.value.price,
      cost_price: addFormData.value.cost_price,
      stock: addFormData.value.stock,
      images: []
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/`, {
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
    await fetchProducts()
  } catch (err) {
    error.value = err.message || 'Ошибка при создании продукта'
    console.error('Error adding product:', err)
  }
}

const handleEditProduct = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const payload = {
      sku: editFormData.value.sku,
      name: editFormData.value.name,
      description: editFormData.value.description || null,
      price: editFormData.value.price,
      cost_price: editFormData.value.cost_price,
      stock: editFormData.value.stock
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/${editFormData.value.id}`, {
      method: 'PUT',
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
      throw new Error(errorData.detail || `Ошибка обновления: ${response.status}`)
    }

    closeEditModal()
    await fetchProducts()
  } catch (err) {
    error.value = err.message || 'Ошибка при обновлении продукта'
    console.error('Error editing product:', err)
  }
}

const handleDeleteProduct = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/${deleteItemId.value}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, войдите снова.')
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Ошибка удаления: ${response.status}`)
    }

    closeDeleteModal()
    await fetchProducts()
  } catch (err) {
    error.value = err.message || 'Ошибка при удалении продукта'
    console.error('Error deleting product:', err)
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

