<template>
  <div class="card border-0 shadow-sm h-100 rounded-3 overflow-hidden">
    <div class="card-body p-0 d-flex flex-column h-100">
      <div class="table-responsive flex-grow-1">
        <table class="table table-hover mb-0 align-middle h-100 custom-table">
          <thead class="bg-light sticky-top z-1">
            <tr>
              <th 
                v-for="col in columns" 
                :key="col.key"
                class="border-bottom px-3 py-2 text-secondary text-uppercase fw-semibold bg-light text-nowrap"
                :style="{ width: col.width || 'auto', fontSize: '0.7rem', letterSpacing: '0.5px' }"
              >
                {{ col.label }}
              </th>
              <th v-if="hasActions" class="border-bottom px-3 py-2 text-end bg-light" style="width: 40px;">
                <i class="bi bi-three-dots text-muted" style="font-size: 0.8rem;"></i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index" class="table-row-hover">
              <td 
                v-for="col in columns" 
                :key="col.key"
                class="px-3 py-2 border-bottom-0 text-nowrap"
                style="font-size: 0.85rem; color: #344767;"
              >
                <!-- Slot for custom cell content -->
                <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]">
                  {{ item[col.key] }}
                </slot>
              </td>
              <td v-if="hasActions" class="px-3 py-2 text-end border-bottom-0 position-relative">
                <div class="dropdown">
                  <button 
                    class="btn btn-link text-muted px-2 py-1 action-btn" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    data-bs-boundary="viewport"
                    data-bs-popper-config='{"strategy":"fixed"}'
                    aria-expanded="false"
                    style="min-width: 32px;"
                  >
                    <i class="bi bi-three-dots-vertical" style="font-size: 1.1rem;"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3 mt-1">
                    <li v-for="(action, aIndex) in actions" :key="aIndex">
                      <a 
                        class="dropdown-item py-2 px-3 d-flex align-items-center" 
                        href="#" 
                        @click.prevent="action.handler(item)"
                        :class="action.class || 'text-body'"
                        style="font-size: 0.85rem;"
                      >
                        <i v-if="action.icon" :class="`bi ${action.icon} me-2 opacity-75`"></i>
                        {{ action.label }}
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td :colspan="columns.length + (hasActions ? 1 : 0)" class="text-center py-5 text-muted">
                <div class="d-flex flex-column align-items-center">
                  <i class="bi bi-inbox display-4 mb-3 opacity-25"></i>
                  <span class="small">Нет данных</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    // Expected format: { key: 'id', label: 'ID', width: '50px' }
  },
  items: {
    type: Array,
    required: true
  },
  actions: {
    type: Array,
    default: () => []
    // Expected format: { label: 'Edit', icon: 'bi-pencil', handler: (item) => {}, class: 'text-danger' }
  }
})

const hasActions = computed(() => props.actions && props.actions.length > 0)
</script>

<style scoped>
.custom-table tr:last-child td {
  border-bottom: 0;
}

.table-row-hover {
  transition: background-color 0.2s ease;
}

.table-row-hover:hover {
  background-color: #f8f9fa !important;
}

.action-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.table-row-hover:hover .action-btn {
  opacity: 1;
}

.dropdown-item {
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  transform: translateX(2px);
}

.dropdown-item:active {
  background-color: #e9ecef;
  color: #1e2125;
}

/* Custom Scrollbar for Webkit */
.table-responsive::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-responsive::-webkit-scrollbar-track {
  background: transparent;
}

.table-responsive::-webkit-scrollbar-thumb {
  background-color: #dee2e6;
  border-radius: 3px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
  background-color: #adb5bd;
}

/* Fix dropdown overflow issue - allow dropdown to escape table boundaries */
.dropdown-menu {
  z-index: 1050;
}
</style>
