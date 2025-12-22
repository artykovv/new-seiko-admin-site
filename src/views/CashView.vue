<template>
  <div class="cash-view">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Касса</h2>
      
      <!-- Period Selector -->
      <div class="d-flex gap-3 align-items-center">
        <div class="period-segmented-control">
          <button 
            type="button" 
            class="period-segment"
            :class="{ 'period-segment-active': selectedPeriod === 'today' }"
            @click="selectPeriod('today')"
          >
            Сегодня
          </button>
          <button 
            type="button" 
            class="period-segment"
            :class="{ 'period-segment-active': selectedPeriod === 'all' }"
            @click="selectPeriod('all')"
          >
            Все время
          </button>
          <button 
            type="button" 
            class="period-segment"
            :class="{ 'period-segment-active': selectedPeriod === 'custom' }"
            @click="selectedPeriod = 'custom'"
          >
            Период
          </button>
        </div>

        <!-- Custom Date Range -->
        <div v-if="selectedPeriod === 'custom'" class="d-flex gap-2 align-items-center">
          <input 
            type="date" 
            class="form-control form-control-sm" 
            v-model="dateFrom"
            style="width: 150px;"
          />
          <span>—</span>
          <input 
            type="date" 
            class="form-control form-control-sm" 
            v-model="dateTo"
            style="width: 150px;"
          />
          <button 
            class="btn btn-sm btn-success"
            @click="loadCustomPeriod"
          >
            Применить
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- Data Display -->
    <div v-else-if="balanceData">
      <!-- Main Balance Card -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card balance-card">
            <div class="card-body text-center">
              <h6 class="text-muted mb-2">Баланс</h6>
              <h1 class="display-4 mb-0" :class="balanceData.balance >= 0 ? 'text-success' : 'text-danger'">
                ${{ formatNumber(balanceData.balance) }}
              </h1>
              <small class="text-muted">
                {{ formatPeriod(balanceData.period) }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Income and Expense Cards -->
      <div class="row mb-4">
        <!-- Income Card -->
        <div class="col-md-6 mb-3">
          <div class="card income-card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">
                  <i class="bi bi-arrow-down-circle text-success me-2"></i>
                  Доходы
                </h5>
                <h4 class="mb-0 text-success">${{ formatNumber(balanceData.income.total) }}</h4>
              </div>
              <div class="income-details">
                <div class="detail-row">
                  <span class="detail-label">Оплаченные заказы:</span>
                  <span class="detail-value">${{ formatNumber(balanceData.income.paid_orders) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Expense Card -->
        <div class="col-md-6 mb-3">
          <div class="card expense-card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">
                  <i class="bi bi-arrow-up-circle text-danger me-2"></i>
                  Расходы
                </h5>
                <h4 class="mb-0 text-danger">${{ formatNumber(balanceData.expense.total) }}</h4>
              </div>
              <div class="expense-details">
                <div class="detail-row">
                  <span class="detail-label">Реферальные бонусы:</span>
                  <span class="detail-value">${{ formatNumber(balanceData.expense.referral_bonuses) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Статусные бонусы:</span>
                  <span class="detail-value">${{ formatNumber(balanceData.expense.status_bonuses) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Спонсорские бонусы:</span>
                  <span class="detail-value">${{ formatNumber(balanceData.expense.sponsor_bonuses) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Бинарные бонусы:</span>
                  <span class="detail-value">${{ formatNumber(balanceData.expense.binary_bonuses) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Чековые бонусы:</span>
                  <span class="detail-value">${{ formatNumber(balanceData.expense.cheque_bonuses) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics Card (if available) -->
      <div v-if="statisticsData" class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Детальная статистика</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6 class="text-muted mb-3">Количество операций</h6>
                  <div class="stats-details">
                    <div class="detail-row">
                      <span class="detail-label">Оплаченные заказы:</span>
                      <span class="detail-value">{{ statisticsData.counts.paid_orders }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Всего выданных бонусов:</span>
                      <span class="detail-value">{{ statisticsData.counts.issued_bonuses.total }}</span>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted mb-3">Выданные бонусы по типам</h6>
                  <div class="stats-details">
                    <div class="detail-row">
                      <span class="detail-label">Реферальные:</span>
                      <span class="detail-value">{{ statisticsData.counts.issued_bonuses.referral }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Статусные:</span>
                      <span class="detail-value">{{ statisticsData.counts.issued_bonuses.status }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Спонсорские:</span>
                      <span class="detail-value">{{ statisticsData.counts.issued_bonuses.sponsor }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Бинарные:</span>
                      <span class="detail-value">{{ statisticsData.counts.issued_bonuses.binary }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Чековые:</span>
                      <span class="detail-value">{{ statisticsData.counts.issued_bonuses.cheque }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { BACKEND_API_URL } from '../config'

const loading = ref(false)
const error = ref('')
const selectedPeriod = ref('today')
const dateFrom = ref('')
const dateTo = ref('')
const balanceData = ref(null)
const statisticsData = ref(null)

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const formatPeriod = (period) => {
  if (!period) return ''
  if (period.date_from === period.date_to) {
    return formatDate(period.date_from)
  }
  return `${formatDate(period.date_from)} — ${formatDate(period.date_to)}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const loadBalance = async (endpoint, params = {}) => {
  loading.value = true
  error.value = ''
  statisticsData.value = null

  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const queryParams = new URLSearchParams(params)
    const url = `${BACKEND_API_URL}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка при загрузке данных')
    }

    balanceData.value = await response.json()
  } catch (err) {
    console.error('Error loading balance:', err)
    error.value = err.message || 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const loadStatistics = async (params = {}) => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const queryParams = new URLSearchParams(params)
    const url = `${BACKEND_API_URL}/api/admin/cashbox/statistics?${queryParams.toString()}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (response.ok) {
      statisticsData.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading statistics:', err)
  }
}

const selectPeriod = async (period) => {
  selectedPeriod.value = period

  if (period === 'today') {
    await loadBalance('/api/admin/cashbox/today')
    // Use period from balanceData for statistics
    if (balanceData.value?.period) {
      await loadStatistics({
        date_from: balanceData.value.period.date_from,
        date_to: balanceData.value.period.date_to
      })
    }
  } else if (period === 'all') {
    await loadBalance('/api/admin/cashbox/balance')
    // Don't load statistics for "all time" as it may be too much data
    statisticsData.value = null
  }
}

const loadCustomPeriod = async () => {
  if (!dateFrom.value || !dateTo.value) {
    error.value = 'Пожалуйста, выберите даты'
    return
  }

  const params = {
    date_from: dateFrom.value,
    date_to: dateTo.value
  }

  await loadBalance('/api/admin/cashbox/balance', params)
  await loadStatistics(params)
}

onMounted(() => {
  selectPeriod('today')
})
</script>

<style scoped>
.cash-view {
  padding: 20px;
}

/* Balance Card */
.balance-card {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.balance-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.balance-card .text-muted {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.balance-card .text-success {
  color: #4ade80 !important;
  font-weight: 600;
}

.balance-card .text-danger {
  color: #f87171 !important;
  font-weight: 600;
}

/* Income and Expense Cards */
.income-card,
.expense-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  background: white;
}

.income-card {
  border-left: 4px solid #22c55e;
}

.expense-card {
  border-left: 4px solid #ef4444;
}

.income-card:hover,
.expense-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.card-title i {
  font-size: 20px;
}

/* Detail Rows */
.income-details,
.expense-details,
.stats-details {
  margin-top: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row:hover {
  background-color: #f9fafb;
  padding-left: 8px;
  padding-right: 8px;
  margin-left: -8px;
  margin-right: -8px;
  border-radius: 6px;
}

.detail-label {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

/* Statistics Card */
.card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-header {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 12px 12px 0 0 !important;
  padding: 16px 20px;
}

.card-header h5 {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.card-body {
  padding: 20px;
}

.stats-details .detail-row {
  padding: 8px 0;
}

/* Custom Date Inputs */
.form-control-sm {
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  font-size: 14px;
}

.form-control-sm:focus {
  border-color: rgb(0, 0, 128);
  box-shadow: 0 0 0 3px rgba(0, 0, 128, 0.1);
  outline: none;
}

/* Apply Button */
.btn-success {
  background-color: #22c55e;
  border-color: #22c55e;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-success:hover {
  background-color: #16a34a;
  border-color: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
}

/* Period Segmented Control */
.period-segmented-control {
  display: inline-flex;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  gap: 0;
}

.period-segment {
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
  font-size: 14px;
}

.period-segment:hover {
  color: rgb(0, 0, 128);
  transition: color 0.2s ease;
}

.period-segment-active {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
}

.period-segment-active:hover {
  background-color: #ffffff !important;
  color: rgb(0, 0, 128) !important;
}

/* Loading and Error States */
.spinner-border {
  color: rgb(0, 0, 128);
}

.alert-danger {
  border-radius: 8px;
  border: none;
  background-color: #fee2e2;
  color: #991b1b;
  border-left: 4px solid #ef4444;
}

/* Typography */
h2 {
  font-weight: 600;
  color: #1f2937;
}

h4 {
  font-weight: 600;
}

h6 {
  font-weight: 600;
  color: #6b7280;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .cash-view {
    padding: 15px;
  }
  
  .period-segmented-control {
    width: 100%;
  }
  
  .period-segment {
    flex: 1;
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
