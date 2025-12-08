<template>
  <div class="welcome-container">
    <div class="welcome-card">
      <div class="welcome-icon">
        <i class="bi bi-house-heart-fill"></i>
      </div>
      <h1 class="welcome-title">Добро пожаловать!</h1>
      <p class="welcome-message">
        Некоторые страницы и функции сейчас на доработке
      </p>
      <div class="construction-icon">
        <i class="bi bi-tools"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
// Welcome page - simplified version
</script>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.welcome-card {
  text-align: center;
  max-width: 600px;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  color: white;
}

.welcome-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.welcome-message {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.95;
  line-height: 1.6;
}

.construction-icon {
  font-size: 2rem;
  opacity: 0.8;
  animation: swing 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes swing {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}
</style>
