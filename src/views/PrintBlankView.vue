<template>
  <div class="print-container">
    <div v-if="loading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="alert alert-danger">{{ error }}</div>
    </div>

    <div v-else class="registration-form">
      <!-- Header -->
      <div class="form-header">
        <div class="logo-section">
          <img src="/full_logo.svg" alt="SEIKO Global" class="logo-img" />
        </div>
        <div class="form-title">
          <div class="title-main">Регистрационная форма /</div>
          <div class="title-sub">Каттоо формасы</div>
        </div>
        <div class="attachment-note">*прилагается к договору</div>
      </div>

      <!-- Section A: Package and Products -->
      <div class="form-section section-a">
        <div class="section-header">А. Информация / Маалымат</div>
        
        <!-- Package Field -->
        <div class="field-row">
          <label class="field-label">Пакет:</label>
          <div class="field-value">{{ cabinetData.paket?.name || '-' }}</div>
        </div>

        <!-- Product Table -->
        <table class="product-table">
          <thead>
            <tr>
              <th>Продукт</th>
              <th>Количество</th>
              <th>Цена за шт.</th>
              <th>Итого</th>
              <th style="width: 60px;">Выдано</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orderItems" :key="item.id">
              <td>{{ item.product?.name || '-' }}</td>
              <td class="text-center">{{ item.quantity }}</td>
              <td class="text-center">${{ formatPrice(item.unit_price) }}</td>
              <td class="text-center">${{ formatPrice(item.total_price) }}</td>
              <td class="text-center">
                <div class="checkbox-large" :class="{ 'checked': item.issued_quantity >= item.quantity }">
                  <span v-if="item.issued_quantity >= item.quantity">✓</span>
                </div>
              </td>
            </tr>
            <tr v-if="orderItems.length === 0">
              <td colspan="5" class="text-center text-muted">
                {{ orderData ? 'Товары не найдены в заказе' : 'Заказы не найдены для данного кабинета' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section B: Distributor Information -->
      <div class="form-section section-b">
        <div class="section-header">В. Информация о дистрибьюторе / Дистрибьютор тууралуу маалымат</div>
        
        <div class="info-grid">
          <div class="info-column">
            <div class="info-field">
              <label>Персональный номер:</label>
              <div class="info-value">{{ cabinetData.personal_number || '-' }}</div>
            </div>
            
            <div class="info-field">
              <label>ФИО / Аты-жөнү:</label>
              <div class="info-value">{{ formatFullName(cabinetData.participant) }}</div>
            </div>
            
            <div class="info-field">
              <label>Дата рождения:</label>
              <div class="info-value">{{ formatDate(cabinetData.participant?.passport_info?.date_birth) }}</div>
            </div>
            
            <div class="info-field">
              <label>Страна / Мамлекет:</label>
              <div class="info-value">Кыргызстан</div>
            </div>
            
            <div class="info-field">
              <label>Город / Шаар:</label>
              <div class="info-value">{{ cabinetData.branch?.name || 'Бишкек' }}</div>
            </div>
            
            <div class="info-field">
              <label>Телефон:</label>
              <div class="info-value">{{ cabinetData.participant?.passport_info?.phone_number || '-' }}</div>
            </div>
          </div>

          <div class="info-column">
            <div class="info-field">
              <label>ФИО спонсора / Спонсордун аты-жөнү:</label>
              <div class="info-value">{{ formatFullName(cabinetData.sponsor?.participant) }}</div>
            </div>
            
            <div class="info-field">
              <label>Персональный номер спонсора:</label>
              <div class="info-value">{{ cabinetData.sponsor?.personal_number || '-' }}</div>
            </div>
            
            <div class="info-field">
              <label>ФИО наставника / Насаатчынын аты-жөнү:</label>
              <div class="info-value">{{ formatFullName(cabinetData.mentor?.participant) }}</div>
            </div>
            
            <div class="info-field">
              <label>Персональный номер наставника:</label>
              <div class="info-value">{{ cabinetData.mentor?.personal_number || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section C: Payment Methods -->
      <div class="form-section section-c">
        <div class="section-header">С. Методы платежа / Төлөө ыкмасы</div>
        
        <div class="payment-options">
          <div class="payment-option">
            <div class="checkbox-large" :class="{ 'checked': paymentMethod === 'Наличные' }">
              <span v-if="paymentMethod === 'Наличные'">✓</span>
            </div>
            <label>Наличными / Наличная төлөө</label>
          </div>
          <div class="payment-option">
            <div class="checkbox-large" :class="{ 'checked': paymentMethod === 'MBank' }">
              <span v-if="paymentMethod === 'MBank'">✓</span>
            </div>
            <label>MBank</label>
          </div>
          <div class="payment-option">
            <label>Другое (поле для записи):</label>
            <div class="payment-input-line"></div>
          </div>
          <div class="payment-option full-width">
            <label>Полная оплата / Жалпы төлөм:</label>
            <div class="payment-input">{{ formatPriceInt(orderData?.total_amount) }}</div>
          </div>
        </div>
      </div>

      <!-- Agreement Section -->
      <div class="agreement-section">
        <!-- Top Row: Partnership Boxes and Agreement Text -->
        <div class="agreement-grid">
          <!-- Left Column: Partnership Boxes -->
          <div class="partnership-column">
            <div class="partnership-box">
              <div class="partnership-text">
                <strong>СТАНЬ ПАРТНЕРОМ</strong><br>
                Зарабатывай<br>
                вместе с нами
              </div>
            </div>
            
            <div class="partnership-box">
              <div class="partnership-text">
                <strong>ПОЛУЧИ 50%</strong><br>
                Скидку на<br>
                мероприятия
              </div>
            </div>
          </div>

          <!-- Right Column: Agreement Text Only -->
          <div class="agreement-text">
            Подписав настоящую регистрационную форму, я понимаю и соглашаюсь с тем, что:<br>
            1. Информация, изложенная и предоставленная Мной, является полной, точной и достоверной во всех отношениях.<br>
            2. Настоящим я подтверждаю присоединение к Условиям и положениям настоящего Договора.<br>
            3. Я подтверждаю, что полностью ознакомлен(а) и полностью согласен(на) со всеми условиями Договора, обязуюсь их неукоснительно исполнить.
          </div>
        </div>

        <!-- Bottom Row: Signature Row -->
        <div class="signature-row">
          <div class="signature-item">
            <label>Подпись</label>
            <div class="signature-box"></div>
          </div>
          <div class="signature-item">
            <label>Дата</label>
            <div class="signature-box">{{ currentDate }}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="form-footer">
        <div class="footer-info">
          <div>Кыргызстан г. Бишкек</div>
          <div>ул. М. Фрунзе 430</div>
          <div>телефон 0500 20 50 25</div>
        </div>
        <div class="footer-qr">
          <img src="/qr.png" alt="QR Code" class="qr-img" />
        </div>
      </div>

      <!-- Print Buttons -->
      <div class="no-print">
        <button class="btn btn-primary btn-lg me-2" @click="printPage">
          <i class="bi bi-printer me-2"></i>
          Печать
        </button>
        <button class="btn btn-success btn-lg" @click="downloadPDF">
          <i class="bi bi-file-pdf me-2"></i>
          Скачать PDF
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { BACKEND_API_URL } from '../config'

const route = useRoute()
const cabinetId = route.params.cabinetId

const loading = ref(true)
const error = ref('')
const cabinetData = ref({})
const orderData = ref(null)
const orderItems = ref([])

const currentDate = computed(() => {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  return `${day}.${month}.${year}`
})

const paymentMethod = computed(() => {
  return orderData.value?.payment_method?.name || ''
})

const formatFullName = (participant) => {
  if (!participant) return '-'
  const parts = []
  if (participant.lastname) parts.push(participant.lastname)
  if (participant.name) parts.push(participant.name)
  if (participant.patronymic) parts.push(participant.patronymic)
  return parts.length > 0 ? parts.join(' ') : '-'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  } catch (err) {
    return '-'
  }
}

const formatPrice = (price) => {
  if (!price) return '0.00'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2)
}

const formatPriceInt = (price) => {
  if (!price) return '0'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return Math.round(numPrice).toString()
}

const fetchCabinetData = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }

    const response = await fetch(`${BACKEND_API_URL}/api/admin/cabinets/with-participant/${cabinetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка при загрузке данных кабинета')
    }

    cabinetData.value = await response.json()
  } catch (err) {
    throw err
  }
}

const fetchOrderData = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }
    
    // Получаем первый заказ кабинета со всеми данными
    const orderUrl = `${BACKEND_API_URL}/api/admin/orders/first/${cabinetId}`
    
    const orderResponse = await fetch(orderUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })

    if (!orderResponse.ok) {
      if (orderResponse.status === 404) {
        return // Нет заказов - это нормально, просто выходим
      }
      throw new Error(`Ошибка при загрузке заказа: ${orderResponse.status}`)
    }

    const order = await orderResponse.json()
    
    // Сохраняем данные заказа
    orderData.value = {
      id: order.id,
      total_amount: order.total_amount,
      order_date: order.order_date,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      status: order.status
    }

    // Преобразуем products в формат orderItems
    // API теперь возвращает массив с вложенными объектами product и данными order_items
    if (order.products && order.products.length > 0) {
      orderItems.value = order.products.map(item => {
        const product = item.product
        const quantity = item.quantity || 1
        const unitPrice = product.cost_price
        
        return {
          id: product.id,
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description
          },
          quantity: quantity,
          unit_price: unitPrice,
          total_price: (parseFloat(unitPrice) * quantity).toFixed(2),
          issued_quantity: item.issued_quantity || 0
        }
      })
    } else {
      orderItems.value = []
    }
  } catch (err) {
    // Не бросаем ошибку, просто оставляем пустой массив товаров
  }
}

const printPage = () => {
  const originalTitle = document.title
  document.title = 'SEIKO - Регистрационная форма'
  
  window.print()
  
  setTimeout(() => {
    document.title = originalTitle
  }, 100)
}

const downloadPDF = () => {
  const originalTitle = document.title
  const personalNumber = cabinetData.value?.personal_number || 'blank'
  document.title = `SEIKO_${personalNumber}_Регистрационная_форма`
  
  // Trigger print dialog which can be used to save as PDF
  window.print()
  
  setTimeout(() => {
    document.title = originalTitle
  }, 100)
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  
  try {
    await fetchCabinetData()
    await fetchOrderData()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
  
  document.title = 'SEIKO - Регистрационная форма'
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.print-container {
  min-height: 100vh;
  background-color: #2c3e50;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.registration-form {
  width: 210mm;
  min-height: auto;
  max-height: 297mm;
  background: white;
  padding: 15px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
  font-size: 10px;
  position: relative;
}

/* Header */
.form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid #2c3e50;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-img {
  height: 50px;
  width: auto;
  display: block;
  /* Filter to convert white (#FFFFFF) to #2c3e50 */
  filter: brightness(0) saturate(100%) invert(20%) sepia(15%) saturate(1089%) hue-rotate(162deg) brightness(95%) contrast(91%);
}

.brand {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
}

.brand-subtitle {
  font-size: 16px;
  color: #2c3e50;
  line-height: 1;
}

.form-title {
  background: #2c3e50;
  color: white;
  padding: 8px 20px;
  text-align: center;
  flex: 1;
  margin: 0 15px;
  border-radius: 4px;
}

.title-main {
  font-size: 12px;
  font-weight: bold;
}

.title-sub {
  font-size: 10px;
}

.attachment-note {
  font-size: 8px;
  color: #666;
  align-self: flex-start;
}

/* Form Sections */
.form-section {
  margin-bottom: 10px;
}

.section-header {
  background: #2c3e50;
  color: white;
  padding: 5px 12px;
  font-weight: bold;
  font-size: 10px;
  margin-bottom: 8px;
  border-radius: 4px;
}

/* Section A */
.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.field-label {
  font-weight: bold;
  margin-right: 8px;
  min-width: 60px;
  font-size: 9px;
}

.field-value {
  border-bottom: 1px solid #000;
  flex: 1;
  padding: 2px 6px;
  min-height: 20px;
  font-size: 9px;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8px;
  margin-top: 6px;
}

.product-table th,
.product-table td {
  border: 1px solid #000;
  padding: 3px 5px;
  text-align: left;
}

.product-table th {
  background: #f5f5f5;
  font-weight: bold;
  font-size: 8px;
}

.product-table .text-center {
  text-align: center;
}

.product-table .text-muted {
  color: #999;
}

/* Section B */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-field label {
  font-size: 8px;
  font-weight: bold;
  color: #666;
}

.info-value {
  border-bottom: 1px solid #000;
  padding: 2px 6px;
  min-height: 18px;
  font-size: 9px;
}

/* Section C */
.payment-options {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
}

.payment-option.full-width {
  width: 100%;
  margin-top: 4px;
}

.checkbox-large {
  width: 16px;
  height: 16px;
  border: 2px solid #000;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
}

.checkbox-large.checked {
  background: #2c3e50;
  color: white;
}

.payment-input {
  border-bottom: 1px solid #000;
  min-width: 100px;
  padding: 2px 6px;
  min-height: 18px;
  font-weight: bold;
  font-size: 9px;
}

.payment-input-line {
  border-bottom: 1px solid #000;
  min-width: 150px;
  padding: 2px 6px;
  min-height: 18px;
}

/* Agreement Section */
.agreement-section {
  margin: 12px 0;
}

.agreement-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 10px;
  margin-bottom: 10px;
  align-items: stretch;
}

.partnership-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  grid-auto-rows: 1fr;
}

.partnership-box {
  background: #b8b8b8;
  padding: 12px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
}

.partnership-text {
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
  width: 100%;
}

.partnership-text strong {
  font-size: 10px;
}

.agreement-text {
  font-size: 8px;
  line-height: 1.3;
  padding: 10px;
  border: 2px solid #000;
  background: white;
  border-radius: 0;
}

/* Signature Row */
.signature-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.signature-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.signature-item label {
  font-weight: bold;
  font-size: 9px;
}

.signature-box {
  border: 2px solid #000;
  min-height: 30px;
  padding: 6px;
  background: white;
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 9px;
}

/* Old Signature Section - Remove */
.signature-section {
  display: none;
}

/* Footer */
.form-footer {
  background: #2c3e50;
  color: white;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  border-radius: 4px;
}

.footer-info {
  font-size: 8px;
  line-height: 1.4;
}

.footer-qr {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-img {
  display: block;
  width: 60px;
  height: 60px;
  object-fit: contain;
}

/* Print Button */
.no-print {
  text-align: center;
  margin-top: 20px;
}

/* Print Styles */
@page {
  size: A4;
  margin: 0;
}

@media print {
  html {
    margin: 0;
    padding: 0;
  }

  body {
    margin: 0 !important;
    padding: 0 !important;
  }

  .print-container {
    background: white;
    padding: 0;
    margin: 0;
    display: block;
  }

  .registration-form {
    width: 210mm;
    min-height: 297mm;
    box-shadow: none;
    margin: 0;
    padding: 15mm;
  }

  .no-print {
    display: none !important;
  }
}
</style>
