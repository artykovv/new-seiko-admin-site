<template>
  <div 
    class="modal fade" 
    :class="{ show: isOpen, 'd-block': isOpen }" 
    :style="{ display: isOpen ? 'block' : 'none' }"
    tabindex="-1"
    role="dialog"
    @click.self="handleClose"
  >
    <div class="modal-dialog modal-dialog-centered modal-xl" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Бонусы</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="handleClose"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Mode Switcher -->
          <div class="mb-4 d-flex justify-content-center">
            <div class="mode-segmented-control">
              <button 
                type="button" 
                class="mode-segment"
                :class="{ 'mode-segment-active': mode === 'selected' }"
                @click="mode = 'selected'"
                :disabled="!cabinetId"
              >
                Выбранный кабинет
              </button>
              <button 
                type="button" 
                class="mode-segment"
                :class="{ 'mode-segment-active': mode === 'all' }"
                @click="mode = 'all'"
              >
                Все кабинеты
              </button>
            </div>
          </div>

          <!-- Bonus Tabs -->
          <div class="mb-3 d-flex justify-content-center">
            <div class="mode-segmented-control">
              <button 
                type="button" 
                class="mode-segment"
                :class="{ 'mode-segment-active': activeTab === 'binary' }"
                @click="activeTab = 'binary'"
              >
                Бинарный
              </button>
              <button 
                type="button" 
                class="mode-segment"
                :class="{ 'mode-segment-active': activeTab === 'matching' }"
                @click="activeTab = 'matching'"
              >
                Чек от Чека
              </button>
              <button 
                type="button" 
                class="mode-segment"
                :class="{ 'mode-segment-active': activeTab === 'referral' }"
                @click="activeTab = 'referral'"
              >
                Реферальный
              </button>
              <button 
                type="button" 
                class="mode-segment"
                :class="{ 'mode-segment-active': activeTab === 'status' }"
                @click="activeTab = 'status'"
              >
                Статусный
              </button>
              <button 
                type="button" 
                class="mode-segment"
                :class="{ 'mode-segment-active': activeTab === 'sponsor' }"
                @click="activeTab = 'sponsor'"
              >
                Спонсорский
              </button>
            </div>
          </div>

          <!-- Content Area -->
          <div class="tab-content p-3 border rounded bg-light" style="min-height: 300px;">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            
            <div v-else>
              <div v-if="activeTab === 'binary'">
                <h5>Бинарный бонус</h5>
                <p class="text-muted">Информация о бинарных бонусах будет здесь.</p>
                <div v-if="mode === 'selected'">
                  Отображение для кабинета ID: {{ cabinetId }}
                </div>
                <div v-else>
                  Отображение для всех кабинетов
                </div>
              </div>

              <div v-if="activeTab === 'matching'">
                <h5>Чек от Чека</h5>
                <p class="text-muted">Информация о бонусах "Чек от Чека" будет здесь.</p>
              </div>

              <div v-if="activeTab === 'referral'">
                <ReferralBonuses 
                  :cabinet-id="mode === 'selected' ? cabinetId : null"
                  :participant-id="mode === 'all' ? participantId : null"
                  :is-active="activeTab === 'referral'"
                />
              </div>

              <div v-if="activeTab === 'status'">
                <StatusBonuses 
                  :cabinet-id="mode === 'selected' ? cabinetId : null"
                  :participant-id="mode === 'all' ? participantId : null"
                  :is-active="activeTab === 'status'"
                />
              </div>

              <div v-if="activeTab === 'sponsor'">
                <SponsorBonuses 
                  :cabinet-id="mode === 'selected' ? cabinetId : null"
                  :participant-id="mode === 'all' ? participantId : null"
                  :is-active="activeTab === 'sponsor'"
                />
              </div>
            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="handleClose"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
  <div 
    v-if="isOpen" 
    class="modal-backdrop fade show"
    @click="handleClose"
  ></div>
</template>

<script setup>
import { ref, watch } from 'vue'
import ReferralBonuses from './bonuses/ReferralBonuses.vue'
import StatusBonuses from './bonuses/StatusBonuses.vue'
import SponsorBonuses from './bonuses/SponsorBonuses.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  cabinetId: {
    type: String,
    default: null
  },
  participantId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close'])

const mode = ref('selected') // 'selected' or 'all'
const activeTab = ref('binary')
const loading = ref(false)

const handleClose = () => {
  emit('close')
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.cabinetId) {
      mode.value = 'selected'
    } else {
      mode.value = 'all'
    }
    // Reset tab
    activeTab.value = 'binary'
  }
})
</script>

<style scoped>
.modal-backdrop {
  z-index: 1040;
}
.modal {
  z-index: 1050;
}

.mode-segmented-control {
  display: flex;
  background-color: #f1f3f5;
  padding: 4px;
  border-radius: 8px;
}

.mode-segment {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-segment-active {
  background-color: white;
  color: #000;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
