<template>
  <div 
    class="modal fade" 
    :class="{ show: isOpen, 'd-block': isOpen }" 
    :style="{ display: isOpen ? 'block' : 'none' }"
    tabindex="-1"
    role="dialog"
    @click.self="handleBackdropClick"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="close"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <slot name="body">
            <p>Форма для добавления/изменения данных</p>
          </slot>
        </div>
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="close"
          >
            Отмена
          </button>
          <button 
            type="button" 
            class="btn btn-primary"
            :style="{ backgroundColor: '#000080', borderColor: '#000080' }"
            @click="save"
          >
            {{ saveButtonText }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div 
    v-if="isOpen" 
    class="modal-backdrop fade show"
    @click="handleBackdropClick"
  ></div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Форма'
  },
  saveButtonText: {
    type: String,
    default: 'Сохранить'
  }
})

const emit = defineEmits(['save', 'close'])

const save = () => {
  emit('save')
}

const close = () => {
  emit('close')
}

const handleBackdropClick = () => {
  close()
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.btn-primary {
  color: white;
}

.btn-primary:hover {
  background-color: rgba(0, 0, 128, 0.9) !important;
  border-color: rgba(0, 0, 128, 0.9) !important;
}
</style>



