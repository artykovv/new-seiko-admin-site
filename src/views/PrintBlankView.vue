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

    <div v-else class="a4-page">
      <!-- Header -->
      <div class="header">
        <h1>SEIKO GLOBAL</h1>
        <h2>Анкета участника</h2>
      </div>

      <!-- Participant Info -->
      <div class="section">
        <h3>Личная информация</h3>
        <table class="info-table">
          <tr>
            <td class="label">Персональный номер:</td>
            <td class="value">{{ cabinetData.personal_number || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Фамилия:</td>
            <td class="value">{{ cabinetData.participant?.lastname || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Имя:</td>
            <td class="value">{{ cabinetData.participant?.name || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Отчество:</td>
            <td class="value">{{ cabinetData.participant?.patronymic || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Email:</td>
            <td class="value">{{ cabinetData.participant?.email || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Телефон:</td>
            <td class="value">{{ cabinetData.participant?.passport_info?.phone_number || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Дата рождения:</td>
            <td class="value">{{ formatDate(cabinetData.participant?.passport_info?.date_birth) }}</td>
          </tr>
        </table>
      </div>

      <!-- Passport Info -->
      <div class="section">
        <h3>Паспортные данные</h3>
        <table class="info-table">
          <tr>
            <td class="label">Паспорт ID:</td>
            <td class="value">{{ cabinetData.participant?.passport_info?.passport_id || '-' }}</td>
          </tr>
          <tr>
            <td class="label">ПИН:</td>
            <td class="value">{{ cabinetData.participant?.passport_info?.pin || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Орган выдачи:</td>
            <td class="value">{{ cabinetData.participant?.passport_info?.passport_issuer || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Дата выдачи:</td>
            <td class="value">{{ formatDate(cabinetData.participant?.passport_info?.passport_issue_date) }}</td>
          </tr>
          <tr>
            <td class="label">Банк:</td>
            <td class="value">{{ cabinetData.participant?.passport_info?.bank || '-' }}</td>
          </tr>
          <tr>
            <td class="label">ИП/ИНН:</td>
            <td class="value">{{ cabinetData.participant?.passport_info?.ip_inn ? 'Да' : 'Нет' }}</td>
          </tr>
          <tr>
            <td class="label">Пенсионер:</td>
            <td class="value">{{ cabinetData.participant?.passport_info?.pensioner ? 'Да' : 'Нет' }}</td>
          </tr>
        </table>
      </div>

      <!-- Business Info -->
      <div class="section">
        <h3>Информация о кабинете</h3>
        <table class="info-table">
          <tr>
            <td class="label">Спонсор:</td>
            <td class="value">{{ formatSponsor(cabinetData.sponsor) }}</td>
          </tr>
          <tr>
            <td class="label">Наставник:</td>
            <td class="value">{{ formatMentor(cabinetData.mentor) }}</td>
          </tr>
          <tr>
            <td class="label">Пакет:</td>
            <td class="value">{{ cabinetData.paket?.name || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Статус:</td>
            <td class="value">{{ cabinetData.status?.name || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Филиал:</td>
            <td class="value">{{ cabinetData.branch?.name || '-' }}</td>
          </tr>
          <tr>
            <td class="label">Дата регистрации:</td>
            <td class="value">{{ formatDateTime(cabinetData.register_at || cabinetData.created_at) }}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Дата печати: {{ new Date().toLocaleDateString('ru-RU') }}</p>
      </div>

      <!-- Print Button -->
      <div class="no-print">
        <button class="btn btn-primary btn-lg" @click="printPage">
          <i class="bi bi-printer me-2"></i>
          Печать
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BACKEND_API_URL } from '../config'

const route = useRoute()
const cabinetId = route.params.cabinetId

const loading = ref(true)
const error = ref('')
const cabinetData = ref({})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  } catch {
    return '-'
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}

const formatSponsor = (sponsor) => {
  if (!sponsor || !sponsor.participant) return '-'
  const fullName = `${sponsor.participant.lastname || ''} ${sponsor.participant.name || ''} ${sponsor.participant.patronymic || ''}`.trim()
  return `${fullName} (${sponsor.personal_number})`
}

const formatMentor = (mentor) => {
  if (!mentor || !mentor.participant) return '-'
  const fullName = `${mentor.participant.lastname || ''} ${mentor.participant.name || ''} ${mentor.participant.patronymic || ''}`.trim()
  return `${fullName} (${mentor.personal_number})`
}

const fetchCabinetData = async () => {
  loading.value = true
  error.value = ''
  
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
      throw new Error('Ошибка при загрузке данных')
    }

    cabinetData.value = await response.json()
  } catch (err) {
    console.error('Error fetching cabinet data:', err)
    error.value = err.message || 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const printPage = () => {
  window.print()
}

onMounted(() => {
  fetchCabinetData()
})
</script>

<style scoped>
/* Базовые стили для экрана */
.print-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.a4-page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: white;
  padding: 15mm;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 8mm;
  border-bottom: 2px solid #000080;
  padding-bottom: 4mm;
}

.header h1 {
  color: #000080;
  font-size: 20pt;
  font-weight: bold;
  margin: 0 0 2mm 0;
}

.header h2 {
  font-size: 14pt;
  color: #333;
  margin: 0;
}

.section {
  margin-bottom: 6mm;
}

.section h3 {
  font-size: 12pt;
  font-weight: bold;
  color: #000080;
  margin-bottom: 3mm;
  border-bottom: 1px solid #ddd;
  padding-bottom: 1mm;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
}

.info-table tr {
  border-bottom: 1px solid #eee;
}

.info-table td {
  padding: 2mm 2mm;
  font-size: 10pt;
}

.info-table .label {
  width: 40%;
  font-weight: 600;
  color: #555;
}

.info-table .value {
  width: 60%;
  color: #000;
}

.footer {
  margin-top: 8mm;
  text-align: center;
  font-size: 9pt;
  color: #666;
  border-top: 1px solid #ddd;
  padding-top: 4mm;
}

.no-print {
  text-align: center;
  margin-top: 20px;
}

/* Правила для печати */
@page {
  size: A4 portrait;
  margin: 10mm 15mm;
}

@media print {
  html, body {
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 297mm;
  }

  .print-container {
    background: white;
    padding: 0;
    margin: 0;
  }

  .a4-page {
    width: 210mm;
    min-height: 297mm;
    max-height: 297mm;
    margin: 0;
    padding: 10mm 12mm;
    box-shadow: none;
    page-break-after: always;
  }

  .header {
    margin-bottom: 6mm;
    padding-bottom: 3mm;
    page-break-after: avoid;
  }

  .header h1 {
    font-size: 18pt;
    margin: 0 0 1.5mm 0;
  }

  .header h2 {
    font-size: 13pt;
  }

  .section {
    margin-bottom: 5mm;
    page-break-inside: avoid;
  }

  .section h3 {
    font-size: 11pt;
    margin-bottom: 2mm;
    padding-bottom: 1mm;
    page-break-after: avoid;
  }

  .info-table {
    page-break-inside: avoid;
  }

  .info-table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  .info-table td {
    padding: 1.5mm 2mm;
    font-size: 9pt;
  }

  .footer {
    margin-top: 6mm;
    padding-top: 3mm;
    font-size: 8pt;
    page-break-before: avoid;
  }

  .no-print {
    display: none !important;
  }

  /* Предотвращение разрывов внутри важных элементов */
  h1, h2, h3 {
    page-break-after: avoid;
  }

  p {
    page-break-inside: avoid;
  }
}
</style>
