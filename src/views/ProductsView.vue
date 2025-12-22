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
            <li class="mb-2">
              <label class="form-label small fw-semibold">Пакет</label>
              <select 
                v-model="selectedPaketFilter" 
                @change="handlePaketFilterChange"
                class="form-select form-select-sm"
              >
                <option :value="null">Все пакеты</option>
                <option 
                  v-for="paket in availablePakets" 
                  :key="paket.id" 
                  :value="paket.id"
                >
                  {{ paket.name }}
                </option>
              </select>
            </li>
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
          <template #cell-price="{ item }">
            <div class="position-relative">
              <button 
                class="btn btn-sm btn-link text-decoration-none p-0"
                @click.stop="togglePriceDropdown(item.id)"
                style="color: inherit;"
              >
                {{ getPriceForDisplay(item) }}
                <i class="bi bi-chevron-down ms-1" style="font-size: 10px;"></i>
              </button>
              
              <!-- Price Dropdown -->
              <div 
                v-if="priceDropdownOpen[item.id]" 
                class="position-absolute bg-white border rounded shadow-sm p-2"
                style="top: 100%; left: 0; z-index: 1000; min-width: 200px;"
                @click.stop
              >
                <div class="small fw-semibold mb-2">Цены по пакетам:</div>
                <div v-if="item.paket_prices && item.paket_prices.length > 0">
                  <div 
                    v-for="paketPrice in item.paket_prices" 
                    :key="paketPrice.id"
                    class="d-flex justify-content-between align-items-center mb-1"
                  >
                    <span class="small">{{ getPaketName(paketPrice.paket_id) }}:</span>
                    <span class="small fw-semibold">{{ formatPrice(paketPrice.price) }}</span>
                  </div>
                </div>
                <div v-else class="text-muted small">
                  Нет цен по пакетам
                </div>
              </div>
            </div>
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
    <div 
      class="modal fade" 
      :class="{ show: editModalOpen, 'd-block': editModalOpen }" 
      :style="{ display: editModalOpen ? 'block' : 'none' }"
      tabindex="-1"
      role="dialog"
      @click.self="closeEditModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" role="document" style="height: 80vh;">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Изменить продукт</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="closeEditModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <!-- Navbar Tabs -->
            <div class="mb-3 d-flex justify-content-center">
              <div class="edit-product-tabs">
                <button 
                  type="button"
                  class="edit-tab"
                  :class="{ 'edit-tab-active': editActiveTab === 'info' }"
                  @click="editActiveTab = 'info'"
                >
                  Информация
                </button>
                <button 
                  type="button"
                  class="edit-tab"
                  :class="{ 'edit-tab-active': editActiveTab === 'images' }"
                  @click="editActiveTab = 'images'"
                >
                  Изображение
                </button>
              </div>
            </div>

            <!-- Tab: Information -->
            <div v-show="editActiveTab === 'info'">
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
            </div>

            <!-- Tab: Images -->
            <div v-show="editActiveTab === 'images'">
              <div v-if="imagesLoading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
              </div>

              <div v-else>
                <!-- Upload Section -->
                <div class="mb-4">
                  <label class="form-label fw-semibold">Загрузить изображение</label>
                  <div class="d-flex gap-2">
                    <input 
                      type="file" 
                      ref="imageFileInput"
                      class="form-control" 
                      accept="image/*"
                      @change="handleImageFileSelect"
                    />
                    <button 
                      class="btn btn-primary"
                      style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
                      @click="handleUploadImage"
                      :disabled="!selectedImageFile || uploadingImage"
                    >
                      <i class="bi bi-upload me-1"></i>
                      {{ uploadingImage ? 'Загрузка...' : 'Загрузить' }}
                    </button>
                  </div>
                  <div v-if="imageUploadError" class="alert alert-danger mt-2 mb-0">
                    {{ imageUploadError }}
                  </div>
                </div>

                <!-- Images Grid -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Изображения продукта</label>
                  <div v-if="productImages.length === 0" class="text-center text-muted py-4">
                    Нет изображений
                  </div>
                  <div v-else class="row g-3">
                    <div 
                      v-for="image in productImages" 
                      :key="image.id"
                      class="col-md-4"
                    >
                      <div class="card">
                        <img 
                          :src="image.src" 
                          class="card-img-top" 
                          style="height: 200px; object-fit: cover;"
                          :alt="`Product image ${image.id}`"
                        />
                        <div class="card-body p-2">
                          <button 
                            class="btn btn-sm btn-danger w-100"
                            @click="handleDeleteImage(image.id)"
                            :disabled="deletingImageId === image.id"
                          >
                            <i class="bi bi-trash me-1"></i>
                            {{ deletingImageId === image.id ? 'Удаление...' : 'Удалить' }}
                          </button>
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
              @click="closeEditModal"
            >
              Закрыть
            </button>
            <button 
              v-if="editActiveTab === 'info'"
              type="button" 
              class="btn btn-primary"
              style="background-color: rgb(0, 0, 128); border-color: rgb(0, 0, 128);"
              @click="handleEditProduct"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="editModalOpen" 
      class="modal-backdrop fade show"
      @click="closeEditModal"
    ></div>

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
                  <label class="form-label fw-semibold">Изображение</label>
                  <div v-if="viewData.images && viewData.images.length > 0">
                    <img 
                      :src="viewData.images[0].src" 
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

    <!-- Модальное окно управления ценами по пакетам -->
    <div 
      class="modal fade" 
      :class="{ show: paketPricesModalOpen, 'd-block': paketPricesModalOpen }" 
      :style="{ display: paketPricesModalOpen ? 'block' : 'none' }"
      tabindex="-1"
      role="dialog"
      @click.self="closePaketPricesModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Управление ценами по пакетам
              <span v-if="selectedProductForPricing" class="text-muted small"> - {{ selectedProductForPricing.name }}</span>
            </h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="closePaketPricesModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="paketPricesError" class="alert alert-danger" role="alert">
              {{ paketPricesError }}
            </div>

            <div v-if="paketPricesLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>

            <div v-else>
              <div v-if="selectedProductForPricing" class="alert alert-info mb-3">
                <strong>Базовая цена товара:</strong> {{ formatPrice(selectedProductForPricing.price) }}
              </div>

              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 40%;">Пакет</th>
                      <th style="width: 30%;">Цена</th>
                      <th style="width: 30%;">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="paket in availablePakets" :key="paket.id">
                      <td>
                        <strong>{{ paket.name }}</strong>
                      </td>
                      <td>
                        <div v-if="editingPrices[paket.id] !== undefined">
                          <input 
                            type="number" 
                            v-model="editingPrices[paket.id]"
                            class="form-control form-control-sm"
                            placeholder="Введите цену"
                            step="0.01"
                            min="0"
                            style="max-width: 150px;"
                          />
                        </div>
                        <div v-else>
                          <span 
                            v-if="getPriceForPaket(paket.id) !== null" 
                            class="badge bg-success"
                          >
                            {{ formatPrice(getPriceForPaket(paket.id)) }}
                          </span>
                          <span v-else class="badge bg-secondary">
                            Не установлена
                          </span>
                        </div>
                      </td>
                      <td>
                        <div v-if="editingPrices[paket.id] !== undefined" class="d-flex gap-1">
                          <button 
                            class="btn btn-sm btn-success"
                            @click="handleSavePrice(paket.id)"
                            :disabled="savingPriceForPaket[paket.id]"
                          >
                            <i class="bi bi-check-lg"></i>
                            {{ savingPriceForPaket[paket.id] ? 'Сохранение...' : 'Сохранить' }}
                          </button>
                          <button 
                            class="btn btn-sm btn-secondary"
                            @click="cancelEditingPrice(paket.id)"
                            :disabled="savingPriceForPaket[paket.id]"
                          >
                            <i class="bi bi-x-lg"></i>
                          </button>
                        </div>
                        <div v-else class="d-flex gap-1">
                          <button 
                            class="btn btn-sm btn-primary"
                            @click="startEditingPrice(paket.id)"
                          >
                            <i class="bi bi-pencil"></i>
                            {{ getPriceForPaket(paket.id) !== null ? 'Изменить' : 'Установить' }}
                          </button>
                          <button 
                            v-if="getPriceForPaket(paket.id) !== null"
                            class="btn btn-sm btn-danger"
                            @click="handleDeletePrice(paket.id)"
                            :disabled="savingPriceForPaket[paket.id]"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="availablePakets.length === 0" class="text-center text-muted py-4">
                Нет доступных пакетов
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closePaketPricesModal"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="paketPricesModalOpen" 
      class="modal-backdrop fade show"
      @click="closePaketPricesModal"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
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
const selectedPaketFilter = ref(null)
const priceDropdownOpen = ref({})

const addModalOpen = ref(false)
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)
const viewModalOpen = ref(false)
const viewLoading = ref(false)
const viewData = ref({})
const deleteItemId = ref(null)
const deleteItemName = ref('')

// Paket Prices Modal State
const paketPricesModalOpen = ref(false)
const selectedProductForPricing = ref(null)
const availablePakets = ref([])
const productPaketPrices = ref([])
const paketPricesLoading = ref(false)
const paketPricesError = ref('')
const editingPrices = ref({})
const savingPriceForPaket = ref({})

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

// Edit Modal Tab State
const editActiveTab = ref('info')

// Image Management State
const productImages = ref([])
const imagesLoading = ref(false)
const selectedImageFile = ref(null)
const imageFileInput = ref(null)
const uploadingImage = ref(false)
const imageUploadError = ref('')
const deletingImageId = ref(null)

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
    label: 'Управление ценами',
    icon: 'bi-cash-stack',
    handler: (item) => openPaketPricesModal(item)
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

    // Build URL with paket filter if selected
    let url = `${BACKEND_API_URL}/api/admin/products/`
    if (selectedPaketFilter.value !== null) {
      url += `?paket_id=${selectedPaketFilter.value}`
    }

    const response = await fetch(url, {
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
  const productId = viewData.value.id
  closeViewModal()
  if (productId) {
    openEditModal({ id: productId })
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
    
    // Load images when opening edit modal
    await loadProductImages(product.id)
    
    editActiveTab.value = 'info'
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
  editActiveTab.value = 'info'
  productImages.value = []
  selectedImageFile.value = null
  imageUploadError.value = ''
  if (imageFileInput.value) {
    imageFileInput.value.value = ''
  }
}

// Image Management Functions
const loadProductImages = async (productId) => {
  imagesLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/${productId}/images`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to load images')
    }

    productImages.value = await response.json()
  } catch (err) {
    console.error('Error loading images:', err)
    productImages.value = []
  } finally {
    imagesLoading.value = false
  }
}

const handleImageFileSelect = (event) => {
  const file = event.target.files?.[0]
  selectedImageFile.value = file || null
  imageUploadError.value = ''
}

const handleUploadImage = async () => {
  if (!selectedImageFile.value || !editFormData.value.id) return

  uploadingImage.value = true
  imageUploadError.value = ''

  try {
    const token = localStorage.getItem('access_token')
    const formData = new FormData()
    formData.append('file', selectedImageFile.value)

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/${editFormData.value.id}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    // Reload images after successful upload
    await loadProductImages(editFormData.value.id)
    
    // Reset file input
    selectedImageFile.value = null
    if (imageFileInput.value) {
      imageFileInput.value.value = ''
    }
    
    // Refresh products list to update image in table
    await fetchProducts()
  } catch (err) {
    console.error('Error uploading image:', err)
    imageUploadError.value = 'Ошибка при загрузке изображения'
  } finally {
    uploadingImage.value = false
  }
}

const handleDeleteImage = async (imageId) => {
  if (!editFormData.value.id) return

  deletingImageId.value = imageId

  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete image')
    }

    // Reload images after successful deletion
    await loadProductImages(editFormData.value.id)
    
    // Refresh products list to update image in table
    await fetchProducts()
  } catch (err) {
    console.error('Error deleting image:', err)
    error.value = 'Ошибка при удалении изображения'
  } finally {
    deletingImageId.value = null
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

// Paket Prices Management Functions
const fetchPakets = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/pakets/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка при загрузке пакетов')
    }

    const data = await response.json()
    availablePakets.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error fetching pakets:', err)
    paketPricesError.value = err.message || 'Ошибка при загрузке пакетов'
  }
}

const fetchProductPaketPrices = async (productId) => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка при загрузке цен')
    }

    const data = await response.json()
    // Extract paket_prices from product response
    productPaketPrices.value = Array.isArray(data.paket_prices) ? data.paket_prices : []
  } catch (err) {
    console.error('Error fetching product paket prices:', err)
    paketPricesError.value = err.message || 'Ошибка при загрузке цен'
  }
}

const getPriceForPaket = (paketId) => {
  const priceEntry = productPaketPrices.value.find(p => p.paket_id === paketId)
  return priceEntry ? priceEntry.price : null
}

const saveProductPaketPrice = async (productId, paketId, price) => {
  try {
    savingPriceForPaket.value[paketId] = true
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const priceValue = parseFloat(price)
    if (isNaN(priceValue) || priceValue <= 0) {
      throw new Error('Цена должна быть больше 0')
    }

    // Check if price already exists
    const existingPrice = productPaketPrices.value.find(p => p.paket_id === paketId)
    
    let response
    if (existingPrice) {
      // Update existing price
      response = await fetch(`${BACKEND_API_URL}/api/admin/products/${productId}/paket-prices/${paketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ price: priceValue })
      })
    } else {
      // Create new price - paket_id as query parameter
      response = await fetch(`${BACKEND_API_URL}/api/admin/products/${productId}/paket-prices?paket_id=${paketId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          paket_id: paketId,
          price: priceValue
        })
      })
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Ошибка при сохранении цены')
    }

    // Refresh prices
    await fetchProductPaketPrices(productId)
    delete editingPrices.value[paketId]
  } catch (err) {
    console.error('Error saving paket price:', err)
    paketPricesError.value = err.message || 'Ошибка при сохранении цены'
  } finally {
    delete savingPriceForPaket.value[paketId]
  }
}

const deleteProductPaketPrice = async (productId, paketId) => {
  if (!confirm('Вы уверены, что хотите удалить эту цену?')) {
    return
  }

  try {
    savingPriceForPaket.value[paketId] = true
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/products/${productId}/paket-prices/${paketId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Ошибка при удалении цены')
    }

    // Refresh prices
    await fetchProductPaketPrices(productId)
  } catch (err) {
    console.error('Error deleting paket price:', err)
    paketPricesError.value = err.message || 'Ошибка при удалении цены'
  } finally {
    delete savingPriceForPaket.value[paketId]
  }
}

const openPaketPricesModal = async (item) => {
  selectedProductForPricing.value = item
  paketPricesModalOpen.value = true
  paketPricesLoading.value = true
  paketPricesError.value = ''
  editingPrices.value = {}
  savingPriceForPaket.value = {}
  
  // Fetch pakets and prices in parallel
  await Promise.all([
    fetchPakets(),
    fetchProductPaketPrices(item.id)
  ])
  
  paketPricesLoading.value = false
}

const closePaketPricesModal = () => {
  paketPricesModalOpen.value = false
  selectedProductForPricing.value = null
  productPaketPrices.value = []
  paketPricesError.value = ''
  editingPrices.value = {}
  savingPriceForPaket.value = {}
}

const startEditingPrice = (paketId) => {
  const currentPrice = getPriceForPaket(paketId)
  editingPrices.value[paketId] = currentPrice !== null ? currentPrice : ''
}

const cancelEditingPrice = (paketId) => {
  delete editingPrices.value[paketId]
}

const handleSavePrice = async (paketId) => {
  const price = editingPrices.value[paketId]
  if (selectedProductForPricing.value && price !== undefined && price !== '') {
    await saveProductPaketPrice(selectedProductForPricing.value.id, paketId, price)
  }
}

const handleDeletePrice = async (paketId) => {
  if (selectedProductForPricing.value) {
    await deleteProductPaketPrice(selectedProductForPricing.value.id, paketId)
  }
}

const getPriceForDisplay = (product) => {
  // If paket filter is selected, show paket-specific price
  if (selectedPaketFilter.value !== null && product.paket_prices) {
    const paketPrice = product.paket_prices.find(p => p.paket_id === selectedPaketFilter.value)
    if (paketPrice) {
      return formatPrice(paketPrice.price)
    }
  }
  // Otherwise show cost_price (base price)
  return formatPrice(product.cost_price)
}

const getPaketName = (paketId) => {
  const paket = availablePakets.value.find(p => p.id === paketId)
  return paket ? paket.name : `Пакет ${paketId}`
}

const togglePriceDropdown = (productId) => {
  // Close all other dropdowns
  Object.keys(priceDropdownOpen.value).forEach(key => {
    if (parseInt(key) !== productId) {
      priceDropdownOpen.value[key] = false
    }
  })
  // Toggle current dropdown
  priceDropdownOpen.value[productId] = !priceDropdownOpen.value[productId]
}

const handlePaketFilterChange = () => {
  currentPage.value = 1
  fetchProducts()
}

// Close dropdowns when clicking outside
const handleClickOutside = (event) => {
  const target = event.target
  if (!target.closest('.position-relative')) {
    Object.keys(priceDropdownOpen.value).forEach(key => {
      priceDropdownOpen.value[key] = false
    })
  }
}

onMounted(() => {
  fetchProducts()
  fetchPakets()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.page-size-select {
  width: 80px;
}

/* Price dropdown styles */
.position-relative .btn-link:hover {
  text-decoration: underline !important;
}

.position-relative .position-absolute {
  animation: fadeIn 0.15s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Edit Product Tabs */
.edit-product-tabs {
  display: inline-flex;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  gap: 0;
}

.edit-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  color: #212529;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
}

.edit-tab:hover {
  color: rgb(0, 0, 128);
  transition: color 0.2s ease;
}

.edit-tab-active {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
}

.edit-tab-active:hover {
  color: rgb(0, 0, 128) !important;
}
</style>
