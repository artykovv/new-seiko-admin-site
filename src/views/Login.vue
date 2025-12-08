<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow-sm" style="width: 100%; max-width: 400px;">
      <div class="card-body p-4">
        <div class="text-center mb-4">
          <img src="/logo.svg" alt="Seiko Logo" style="height: 60px; width: auto;">
        </div>
        <h3 class="card-title text-center mb-4">Вход</h3>
        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              type="email"
              class="form-control"
              id="email"
              v-model="email"
              required
              placeholder="name@example.com"
            />
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Пароль</label>
            <div class="input-group">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                id="password"
                v-model="password"
                required
                placeholder="Пароль"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="togglePasswordVisibility"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>
          <div class="mb-3 form-check">
            <input
              type="checkbox"
              class="form-check-input"
              id="rememberMe"
              v-model="rememberMe"
            />
            <label class="form-check-label" for="rememberMe">Запомнить меня</label>
          </div>
          <div class="d-grid">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BACKEND_API_URL } from '../config'

const router = useRouter()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    const formData = new URLSearchParams()
    formData.append('username', email.value)
    formData.append('password', password.value)
    // client_id and client_secret are empty as per curl example
    formData.append('client_id', '')
    formData.append('client_secret', '')

    const response = await fetch(`${BACKEND_API_URL}/api/admin/auth/jwt/login`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    const data = await response.json()
    
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
      router.push('/')
    } else {
      throw new Error('No access token received')
    }
  } catch (e) {
    console.error('Login error:', e)
    error.value = 'Ошибка входа. Пожалуйста, проверьте ваши данные.'
  } finally {
    loading.value = false
  }
}
</script>
