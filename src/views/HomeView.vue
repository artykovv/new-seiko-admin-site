<template>
  <div class="home-container">
    <!-- Row 1: 1 column (Turnover) -->
    <div class="dashboard-row row-1">
      <!-- Card: Turnover -->
      <div class="dashboard-card">
        <div class="card-header-row">
          <div class="card-title">Товарооборот</div>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: periods.turnover === 'all' }"
              @click="setPeriod('turnover', 'all')"
            >За все время</button>
            <button 
              class="period-btn" 
              :class="{ active: periods.turnover === 'month' }"
              @click="setPeriod('turnover', 'month')"
            >За текущий месяц</button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingTurnover" class="loading-state">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          <div v-else-if="turnoverData" class="simple-stats centered">
            <div class="big-value">{{ formatNumber(turnoverData.total_turnover) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 2: 2 columns -->
    <div class="dashboard-row row-2">
      <!-- Card 1: Cashbox -->
      <div class="dashboard-card">
        <div class="card-header-row">
          <div class="card-title">Касса</div>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: periods.cashbox === 'all' }"
              @click="setPeriod('cashbox', 'all')"
            >За все время</button>
            <button 
              class="period-btn" 
              :class="{ active: periods.cashbox === 'month' }"
              @click="setPeriod('cashbox', 'month')"
            >За текущий месяц</button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingCashbox" class="loading-state">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          <div v-else-if="cashboxData" class="simple-stats">
            <div class="stat-row">
              <span class="label">Баланс</span>
              <span class="value">${{ formatNumber(cashboxData.balance) }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Доходы</span>
              <span class="value">${{ formatNumber(cashboxData.income.total) }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Расходы</span>
              <span class="value">${{ formatNumber(cashboxData.expense.total) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Card 2: Bonuses -->
      <div class="dashboard-card">
        <div class="card-header-row">
          <div class="card-title">Бонусы</div>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: periods.bonuses === 'all' }"
              @click="setPeriod('bonuses', 'all')"
            >За все время</button>
            <button 
              class="period-btn" 
              :class="{ active: periods.bonuses === 'month' }"
              @click="setPeriod('bonuses', 'month')"
            >За текущий месяц</button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingBonuses" class="loading-state">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          <div v-else-if="bonusesData" class="simple-stats scrollable">
            <div class="stat-row">
              <span class="label">Всего</span>
              <span class="value">${{ formatNumber(bonusesData.total_bonuses_amount) }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Бинарные</span>
              <span class="value">${{ formatNumber(bonusesData.binary_bonuses.total_amount) }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Реферальные</span>
              <span class="value">${{ formatNumber(bonusesData.referral_bonuses.total_amount) }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Спонсорские</span>
              <span class="value">${{ formatNumber(bonusesData.sponsor_bonuses.total_amount) }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Статусные</span>
              <span class="value">${{ formatNumber(bonusesData.status_bonuses.total_amount) }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Чековые</span>
              <span class="value">${{ formatNumber(bonusesData.cheque_bonuses.total_amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 3: 2 columns (Orders + Participants) -->
    <div class="dashboard-row row-2">
      <!-- Card 3: Orders -->
      <div class="dashboard-card">
        <div class="card-header-row">
          <div class="card-title">Заказы</div>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: periods.orders === 'all' }"
              @click="setPeriod('orders', 'all')"
            >За все время</button>
            <button 
              class="period-btn" 
              :class="{ active: periods.orders === 'month' }"
              @click="setPeriod('orders', 'month')"
            >За текущий месяц</button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingOrders" class="loading-state">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          <div v-else-if="ordersData" class="table-container">
            <table class="stats-table">
              <tbody>
                <tr>
                  <td class="label">Всего заказов</td>
                  <td class="value">{{ ordersData.total_orders }}</td>
                </tr>
                <template v-if="ordersData.fulfillment_statuses">
                  <tr v-for="status in ordersData.fulfillment_statuses" :key="'f-' + status.id">
                    <td class="label">{{ status.name }}</td>
                    <td class="value">{{ status.orders_count }}</td>
                  </tr>
                </template>
                <template v-if="ordersData.payment_statuses">
                  <tr v-for="status in ordersData.payment_statuses" :key="'p-' + status.id">
                    <td class="label">{{ status.name }}</td>
                    <td class="value">{{ status.orders_count }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Card 4: Participants -->
      <div class="dashboard-card">
        <div class="card-header-row">
          <div class="card-title">Участники</div>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: periods.participants === 'all' }"
              @click="setPeriod('participants', 'all')"
            >Все</button>
            <button 
              class="period-btn" 
              :class="{ active: periods.participants === 'month' }"
              @click="setPeriod('participants', 'month')"
            >Месяц</button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingParticipants" class="loading-state">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          <div v-else-if="participantsData" class="simple-stats">
            <div class="stat-row">
              <span class="label">Всего</span>
              <span class="value">{{ participantsData.total_participants }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Зарегистрированные</span>
              <span class="value">{{ participantsData.registered_participants }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Незарегистрированные</span>
              <span class="value">{{ participantsData.unregistered_participants }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 4: 3 columns -->
    <div class="dashboard-row row-3">
      <!-- Card 6: Statuses -->
      <div class="dashboard-card">
        <div class="card-header-row">
          <div class="card-title">Статусы</div>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: periods.statuses === 'all' }"
              @click="setPeriod('statuses', 'all')"
            >За все время</button>
            <button 
              class="period-btn" 
              :class="{ active: periods.statuses === 'month' }"
              @click="setPeriod('statuses', 'month')"
            >За текущий месяц</button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingStatuses" class="loading-state">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          <div v-else-if="statusesData" class="simple-stats scrollable">
            <div v-for="status in statusesData.statuses.filter(s => s.participants_count > 0)" :key="status.id" class="stat-row">
              <span class="label">{{ status.name }}</span>
              <span class="value">{{ status.participants_count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 7: Packages -->
      <div class="dashboard-card">
        <div class="card-header-row">
          <div class="card-title">Пакеты</div>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: periods.pakets === 'all' }"
              @click="setPeriod('pakets', 'all')"
            >Все</button>
            <button 
              class="period-btn" 
              :class="{ active: periods.pakets === 'month' }"
              @click="setPeriod('pakets', 'month')"
            >Месяц</button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingPakets" class="loading-state">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          <div v-else-if="paketsData" class="simple-stats">
            <div v-for="paket in paketsData.pakets.filter(p => p.participants_count > 0)" :key="paket.id" class="stat-row">
              <span class="label">{{ paket.name }}</span>
              <span class="value">{{ paket.participants_count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 8: Branches -->
      <div class="dashboard-card">
        <div class="card-header-row">
          <div class="card-title">Филиалы</div>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: periods.branches === 'all' }"
              @click="setPeriod('branches', 'all')"
            >Все</button>
            <button 
              class="period-btn" 
              :class="{ active: periods.branches === 'month' }"
              @click="setPeriod('branches', 'month')"
            >Месяц</button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loadingBranches" class="loading-state">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          <div v-else-if="branchesData" class="simple-stats">
            <div v-for="branch in branchesData.branches.filter(b => b.participants_count > 0)" :key="branch.id" class="stat-row">
              <span class="label">{{ branch.name }}</span>
              <span class="value">{{ branch.participants_count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { BACKEND_API_URL } from '../config'

const loadingCashbox = ref(false)
const loadingBonuses = ref(false)
const loadingOrders = ref(false)
const loadingParticipants = ref(false)
const loadingStatuses = ref(false)
const loadingPakets = ref(false)
const loadingBranches = ref(false)
const loadingTurnover = ref(false)

const cashboxData = ref(null)
const bonusesData = ref(null)
const ordersData = ref(null)
const participantsData = ref(null)
const statusesData = ref(null)
const paketsData = ref(null)
const branchesData = ref(null)
const turnoverData = ref(null)

// Periods for each card (default: month)
const periods = reactive({
  cashbox: 'month',
  bonuses: 'month',
  orders: 'month',
  participants: 'month',
  statuses: 'month',
  pakets: 'month',
  branches: 'month',
  turnover: 'month'
})

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const setPeriod = (card, period) => {
  periods[card] = period
  // Reload data for this card
  switch(card) {
    case 'cashbox': loadCashboxData(); break
    case 'bonuses': loadBonusesData(); break
    case 'orders': loadOrdersData(); break
    case 'participants': loadParticipantsData(); break
    case 'statuses': loadStatusesData(); break
    case 'pakets': loadPaketsData(); break
    case 'branches': loadBranchesData(); break
    case 'turnover': loadTurnoverData(); break
  }
}

const buildUrl = (baseUrl, period) => {
  const url = new URL(`${BACKEND_API_URL}${baseUrl}`)
  if (period === 'month') {
    // Get current month's first and last day
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // 0-indexed, so add 1
    
    // First day of month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    
    // Last day of month
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    
    url.searchParams.append('start_date', startDate)
    url.searchParams.append('end_date', endDate)
  }
  return url.toString()
}

const loadCashboxData = async () => {
  loadingCashbox.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(buildUrl('/api/admin/cashbox/balance', periods.cashbox), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      cashboxData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading cashbox data:', err)
  } finally {
    loadingCashbox.value = false
  }
}

const loadBonusesData = async () => {
  loadingBonuses.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(buildUrl('/api/admin/report/bonuses/', periods.bonuses), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      bonusesData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading bonuses data:', err)
  } finally {
    loadingBonuses.value = false
  }
}

const loadOrdersData = async () => {
  loadingOrders.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(buildUrl('/api/admin/report/orders/', periods.orders), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      ordersData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading orders data:', err)
  } finally {
    loadingOrders.value = false
  }
}

const loadParticipantsData = async () => {
  loadingParticipants.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(buildUrl('/api/admin/report/participants/', periods.participants), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      participantsData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading participants data:', err)
  } finally {
    loadingParticipants.value = false
  }
}

const buildTurnoverUrl = (period) => {
  const url = new URL(`${BACKEND_API_URL}/api/admin/report/turnover/`)
  if (period === 'month') {
    // Get current month's first and last day
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // 0-indexed, so add 1
    
    // First day of month
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
    
    // Last day of month
    const lastDay = new Date(year, month, 0).getDate()
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    
    url.searchParams.append('date_from', dateFrom)
    url.searchParams.append('date_to', dateTo)
  }
  return url.toString()
}

const loadTurnoverData = async () => {
  loadingTurnover.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(buildTurnoverUrl(periods.turnover), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      // Extract total_volume from summary
      turnoverData.value = {
        total_turnover: data.summary?.total_volume || 0
      }
    }
  } catch (err) {
    console.error('Error loading turnover data:', err)
  } finally {
    loadingTurnover.value = false
  }
}

const loadStatusesData = async () => {
  loadingStatuses.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(buildUrl('/api/admin/report/statuses/', periods.statuses), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      statusesData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading statuses data:', err)
  } finally {
    loadingStatuses.value = false
  }
}

const loadPaketsData = async () => {
  loadingPakets.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(buildUrl('/api/admin/report/pakets/', periods.pakets), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      paketsData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading pakets data:', err)
  } finally {
    loadingPakets.value = false
  }
}

const loadBranchesData = async () => {
  loadingBranches.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await fetch(buildUrl('/api/admin/report/branches/', periods.branches), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      branchesData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading branches data:', err)
  } finally {
    loadingBranches.value = false
  }
}



onMounted(() => {
  loadCashboxData()
  loadBonusesData()
  loadOrdersData()
  loadParticipantsData()
  loadTurnoverData()
  loadStatusesData()
  loadPaketsData()
  loadBranchesData()
})
</script>

<style scoped>
.home-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

/* Dashboard Rows */
.dashboard-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

/* Row with 1 column */
.dashboard-row.row-1 {
  flex-direction: row;
}

.dashboard-row.row-1 .dashboard-card {
  flex: 1;
}

/* Row with 2 columns */
.dashboard-row.row-2 {
  flex-direction: row;
}

.dashboard-row.row-2 .dashboard-card {
  flex: 1;
}

/* Row with 3 columns */
.dashboard-row.row-3 {
  flex-direction: row;
}

.dashboard-row.row-3 .dashboard-card {
  flex: 1;
}

/* Dashboard Card */
.dashboard-card {
  border: 1px solid #dee2e6;
  border-radius: 12px;
  background: white;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  min-height: 250px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  gap: 12px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #344767;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

/* Period Selector */
.period-selector {
  display: inline-flex;
  background-color: #e9ecef;
  border-radius: 8px;
  padding: 3px;
  gap: 0;
  flex-shrink: 0;
}

.period-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  color: #6c757d;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 11px;
}

.period-btn:hover {
  color: #495057;
}

.period-btn.active {
  background-color: #ffffff !important;
  color: #344767 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

/* Table Stats */
.simple-stats {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.simple-stats.centered {
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.simple-stats.scrollable {
  overflow-y: auto;
  max-height: 100%;
}

/* Custom Scrollbar */
.simple-stats.scrollable::-webkit-scrollbar {
  width: 6px;
}

.simple-stats.scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.simple-stats.scrollable::-webkit-scrollbar-thumb {
  background-color: #dee2e6;
  border-radius: 3px;
}

.simple-stats.scrollable::-webkit-scrollbar-thumb:hover {
  background-color: #adb5bd;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.stat-row:hover {
  background-color: #f8f9fa;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row.small {
  padding: 8px 20px 8px 32px;
  font-size: 12px;
}

/* Stat Sections */
.stat-section {
  margin-top: 0;
  padding-top: 0;
}

.stat-section:not(:first-child) {
  margin-top: 8px;
  padding-top: 8px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #6c757d;
  padding: 8px 20px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f8f9fa;
}

.label {
  font-size: 13px;
  color: #6c757d;
  font-weight: 400;
}

.value {
  font-size: 14px;
  font-weight: 500;
  color: #344767;
  text-align: right;
}

/* Table Container */
.table-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

/* Stats Table */
.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.stats-table tbody tr:hover {
  background-color: #f8f9fa;
}

.stats-table tbody tr:last-child {
  border-bottom: none;
}

.stats-table td {
  padding: 10px 20px;
}

.stats-table td.label {
  font-size: 13px;
  color: #6c757d;
  font-weight: 400;
  text-align: left;
}

.stats-table td.value {
  font-size: 14px;
  font-weight: 500;
  color: #344767;
  text-align: right;
}

/* Big Value */
.big-value {
  font-size: 42px;
  font-weight: 700;
  color: #344767;
  line-height: 1;
}

/* Medium Value */
.medium-value {
  font-size: 32px;
  font-weight: 600;
  color: #344767;
  line-height: 1;
}

/* Sub Text */
.sub-text {
  font-size: 13px;
  color: #6c757d;
  margin-top: 8px;
  font-weight: 400;
}

/* Responsive design */
@media (max-width: 1024px) {
  .dashboard-row.row-3 {
    flex-wrap: wrap;
  }
  
  .dashboard-row.row-3 .dashboard-card {
    flex: 1 1 calc(50% - 10px);
    min-width: 250px;
  }
}

@media (max-width: 768px) {
  .home-container {
    padding: 15px;
  }

  .dashboard-row {
    flex-direction: column;
    margin-bottom: 15px;
  }
  
  .dashboard-row .dashboard-card {
    flex: 1 1 100%;
    min-width: 100%;
    min-height: auto;
  }
  
  .card-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 15px;
  }
  
  .card-title {
    font-size: 12px;
  }
  
  .period-selector {
    width: 100%;
  }
  
  .period-btn {
    flex: 1;
    font-size: 10px;
    padding: 4px 8px;
  }

  .card-content {
    padding: 0;
  }
  
  .stat-row {
    padding: 8px 15px;
  }

  .stat-row.small {
    padding: 6px 15px 6px 24px;
  }

  /* Table responsive */
  .stats-table td {
    padding: 8px 15px;
  }

  .stats-table td.label {
    font-size: 12px;
  }

  .stats-table td.value {
    font-size: 13px;
  }
  
  .big-value {
    font-size: 32px;
  }
  
  .medium-value {
    font-size: 24px;
  }
  
  .value {
    font-size: 13px;
  }
  
  .label {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .home-container {
    padding: 10px;
  }

  .dashboard-row {
    margin-bottom: 10px;
  }

  .dashboard-card {
    border-radius: 8px;
  }

  .card-header-row {
    padding: 10px 12px;
  }

  .card-title {
    font-size: 11px;
  }

  .period-btn {
    font-size: 9px;
    padding: 3px 6px;
  }

  .stat-row {
    padding: 6px 12px;
  }

  .stat-row.small {
    padding: 5px 12px 5px 20px;
  }

  .stats-table td {
    padding: 6px 12px;
  }

  .stats-table td.label {
    font-size: 11px;
  }

  .stats-table td.value {
    font-size: 12px;
  }

  .big-value {
    font-size: 28px;
  }

  .medium-value {
    font-size: 20px;
  }

  .value {
    font-size: 12px;
  }

  .label {
    font-size: 11px;
  }
}
</style>
