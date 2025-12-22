<template>
  <div class="notfound-wrapper">
    <div class="notfound-container">
      <div class="notfound-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Страница не найдена</h1>
        <p class="error-message">
          Запрашиваемая страница не существует или была удалена
        </p>
        <div class="error-actions">
          <router-link to="/" class="btn btn-primary">
            <i class="bi bi-house-door me-2"></i>На главную
          </router-link>
          <button @click="goBack" class="btn btn-secondary">
            <i class="bi bi-arrow-left me-2"></i>Назад
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.notfound-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.notfound-container {
  max-width: 600px;
  width: 100%;
}

.notfound-content {
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.error-code {
  font-size: 120px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.error-message {
  font-size: 16px;
  color: #6c757d;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.875rem 1.75rem;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
  border: 2px solid #dee2e6;
}

.btn-secondary:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  transform: translateY(-2px);
}

/* Mobile */
@media (max-width: 768px) {
  .notfound-wrapper {
    padding: 1rem;
  }

  .notfound-content {
    padding: 2rem 1.5rem;
  }

  .error-code {
    font-size: 80px;
  }

  .error-title {
    font-size: 22px;
  }

  .error-message {
    font-size: 14px;
  }

  .error-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .error-code {
    font-size: 60px;
  }

  .error-title {
    font-size: 20px;
  }

  .notfound-content {
    padding: 1.5rem 1rem;
  }
}
</style>
