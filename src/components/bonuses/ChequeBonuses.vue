<template>
  <div>
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th scope="col">От кого</th>
              <th scope="col">Глубина</th>
              <th scope="col">Филиал</th>
              <th scope="col">Сумма бонуса</th>
              <th scope="col">Дата создания</th>
              <th scope="col">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="bonuses.length === 0">
              <td colspan="6" class="text-center py-4 text-muted">
                Нет данных
              </td>
            </tr>
            <tr v-for="bonus in bonuses" :key="bonus.id">
              <td>{{ formatCabinetName(bonus.from_cabinet) }}</td>
              <td>{{ bonus.depth }}</td>
              <td>{{ bonus.branch_name }}</td>
              <td>{{ formatPrice(bonus.bonus_amount) }}</td>
              <td>{{ formatDateTime(bonus.created_at) }}</td>
              <td>
                <span class="badge" :class="bonus.issued ? 'bg-success' : 'bg-warning'">
                  {{ bonus.issued ? 'Выдан' : 'Не выдан' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="d-flex justify-content-center mt-3">
        <nav aria-label="Page navigation">
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { BACKEND_API_URL } from '../../config'

const props = defineProps({
  cabinetId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

const loading = ref(false)
const error = ref('')
const bonuses = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)

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

const formatCabinetName = (cabinet) => {
  if (!cabinet || !cabinet.participant) return '-'
  const fullName = `${cabinet.participant.lastname || ''} ${cabinet.participant.name || ''} ${cabinet.participant.patronymic || ''}`.trim()
  return `${fullName} (${cabinet.personal_number})`
}

const formatPrice = (price) => {
  if (!price) return '0.00'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2) + ' $'
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

const fetchBonuses = async (page = 1) => {
  if (!props.cabinetId) return

  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      cabinet_id: props.cabinetId,
      page: page.toString(),
      page_size: pageSize.value.toString()
    })

    const response = await fetch(`${BACKEND_API_URL}/api/admin/bonuses/cheque?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) throw new Error('Failed to fetch cheque bonuses')

    const data = await response.json()
    
    // Fetch branches for mapping
    const branchesResponse = await fetch(`${BACKEND_API_URL}/api/admin/branches/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    const branches = branchesResponse.ok ? await branchesResponse.json() : []
    const branchMap = {}
    branches.forEach(b => {
      branchMap[b.id] = b.name
    })

    bonuses.value = data.bonuses.map(b => ({
      ...b,
      branch_name: branchMap[b.branch_id] || '-'
    }))
    
    totalPages.value = data.total_pages
    currentPage.value = data.page
  } catch (err) {
    console.error('Error fetching cheque bonuses:', err)
    error.value = 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  fetchBonuses(page)
}

watch(
  () => [props.isActive, props.cabinetId],
  ([isActive, cabinetId]) => {
    if (isActive && cabinetId) {
      fetchBonuses(1)
    }
  },
  { immediate: true }
)
</script>
