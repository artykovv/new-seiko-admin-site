<template>
  <div class="d-flex flex-column h-100">
    <div class="card">
      <div class="card-body text-center">
        <!-- Поиск участников -->
        <div class="search-container mb-4">
          <div class="position-relative" style="max-width: 500px; margin: 0 auto;">
            <i class="bi bi-search position-absolute" style="left: 12px; top: 50%; transform: translateY(-50%); color: #6c757d; z-index: 10;"></i>
            <input 
              type="text" 
              v-model="searchQuery"
              @input="handleSearch"
              class="form-control ps-5"
              placeholder="Поиск участника..."
              style="font-size: 14px;"
            />
          </div>
          
          <!-- Результаты поиска -->
          <div v-if="searchResults.length > 0" class="search-results mt-3">
            <ul class="list-group" style="max-width: 500px; margin: 0 auto;">
              <li 
                v-for="participant in searchResults" 
                :key="participant.id"
                class="list-group-item"
              >
                <router-link 
                  :to="`/structure/${participant.id}`"
                  class="text-decoration-none"
                  @click="handleSearchResultClick"
                >
                  {{ participant.name }} {{ participant.lastname }} ({{ participant.personal_number }})
                </router-link>
              </li>
            </ul>
          </div>
          <div v-else-if="searchQuery && !searchLoading" class="mt-3">
            <p class="text-muted">Ничего не найдено</p>
          </div>
        </div>

        <!-- Загрузка -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
        </div>

        <!-- Ошибка -->
        <div v-else-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <!-- Дерево структуры -->
        <div v-else-if="treeData" class="tree mt-5 mb-5" ref="treeContainer">
          <TreeNode 
            :node="treeData" 
            @nodeClick="handleNodeClick" 
            @cabinetDetailsClick="handleCabinetDetailsClick"
          />
        </div>
      </div>
    </div>



    <!-- Модальное окно добавления -->
    <AddParticipantModal
      :is-open="addCabinetModalOpen"
      :branches="branches"
      :pakets="pakets"
      :statuses="statuses"
      :preselected-participant="preselectedParticipant"
      @close="closeAddCabinetModal"
      @success="handleAddCabinetSuccess"
      @error="handleAddCabinetError"
    />

    <!-- Модальное окно информации -->
    <CabinetDetailsModal
      :is-open="cabinetDetailsModalOpen"
      :cabinet-id="selectedCabinetId"
      @close="closeCabinetDetailsModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TreeNode from '../components/TreeNode.vue'
import AddParticipantModal from '../components/AddParticipantModal.vue'
import CabinetDetailsModal from '../components/CabinetDetailsModal.vue'
import { BACKEND_API_URL } from '../config'

const route = useRoute()
const router = useRouter()

const treeData = ref(null)
const loading = ref(false)
const error = ref('')

// Поиск
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
let searchTimeout = null

// Модальные окна
const addCabinetModalOpen = ref(false)
const preselectedParticipant = ref(null)
const cabinetDetailsModalOpen = ref(false)
const selectedCabinetId = ref(null)

// Справочники
const branches = ref([])
const pakets = ref([])
const statuses = ref([])

const fetchStructure = async (cabinetId) => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/structure/${cabinetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch structure')
    }
    
    treeData.value = await response.json()
  } catch (err) {
    console.error('Error fetching structure:', err)
    error.value = 'Ошибка при загрузке структуры'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  searchTimeout = setTimeout(async () => {
    await searchParticipants()
  }, 500)
}

const searchParticipants = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  searchLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams({
      search: searchQuery.value.trim(),
      page: '1',
      page_size: '10'
    })
    
    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      searchResults.value = (data.cabinets || []).map(cabinet => ({
        id: cabinet.id,
        name: cabinet.participant?.name || '',
        lastname: cabinet.participant?.lastname || '',
        personal_number: cabinet.personal_number,
        sequence_number: cabinet.sequence_number
      }))
    }
  } catch (err) {
    console.error('Error searching participants:', err)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const handleSearchResultClick = () => {
  searchQuery.value = ''
  searchResults.value = []
}





const closeAddCabinetModal = () => {
  addCabinetModalOpen.value = false
  preselectedParticipant.value = null
}

const handleAddCabinetSuccess = () => {
  // Обновляем структуру
  if (route.params.cabinetId) {
    fetchStructure(route.params.cabinetId)
  }
}

const handleAddCabinetError = (errorMessage) => {
  error.value = errorMessage
}

const handleCabinetDetailsClick = (cabinetId) => {
  selectedCabinetId.value = cabinetId
  cabinetDetailsModalOpen.value = true
}

const closeCabinetDetailsModal = () => {
  cabinetDetailsModalOpen.value = false
  selectedCabinetId.value = null
}

// Загрузка справочников
const fetchBranches = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/branches/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (response.ok) {
      branches.value = await response.json()
    }
  } catch (err) {
    console.error('Error fetching branches:', err)
  }
}

const fetchPakets = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/pakets/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (response.ok) {
      pakets.value = await response.json()
    }
  } catch (err) {
    console.error('Error fetching pakets:', err)
  }
}

const fetchStatuses = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BACKEND_API_URL}/api/admin/statuses/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    if (response.ok) {
      statuses.value = await response.json()
    }
  } catch (err) {
    console.error('Error fetching statuses:', err)
  }
}

watch(() => route.params.cabinetId, (newId) => {
  if (newId) {
    fetchStructure(newId)
  }
}, { immediate: true })

onMounted(async () => {
  await Promise.all([
    fetchBranches(),
    fetchPakets(),
    fetchStatuses()
  ])
})
</script>

<style scoped>
.search-container {
  position: relative;
}

.search-results {
  position: relative;
  z-index: 1000;
}

.tree {
  overflow-x: auto;
  padding: 20px;
}
</style>
