<template>
  <div class="node">
    <div 
      v-if="node"
      class="node-link"
    >
      <div 
        class="node-content"
        :style="nodeStyle"
        @click="handleClick"
      >
        <div class="cabinet-number mb-1">
          <small>Кабинет №{{ node.cabinet_sequence_number || '-' }}</small>
        </div>
        <h6 class="mb-2">
          {{ node.participant_name || '-' }} <br>
          {{ node.participant_lastname || '-' }}
        </h6>
        <button 
          class="btn btn-light btn-sm mt-1"
          @click.stop="handleCabinetDetailsClick"
        >
          {{ node.cabinet_personal_number || '-' }}
        </button>
        <button 
          class="btn btn-light btn-sm mt-1"
          @click.stop="handleDetailsClick"
        >
          Подробнее
        </button>
      </div>
    </div>

    <!-- Children branch -->
    <div v-if="node && (node.left_child || node.right_child)" class="branch">
      <!-- Left child -->
      <TreeNode 
        v-if="node.left_child"
        :node="node.left_child"
        @nodeClick="$emit('nodeClick', $event)"
        @cabinetDetailsClick="$emit('cabinetDetailsClick', $event)"
      />
      <div v-else class="node invisible"></div>

      <!-- Right child -->
      <TreeNode 
        v-if="node.right_child"
        :node="node.right_child"
        @nodeClick="$emit('nodeClick', $event)"
        @cabinetDetailsClick="$emit('cabinetDetailsClick', $event)"
      />
      <div v-else class="node invisible"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  node: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['nodeClick', 'cabinetDetailsClick'])
const router = useRouter()

const nodeStyle = computed(() => {
  if (!props.node) return {}
  
  const style = {
    padding: '40px',
    width: '200px',
    borderRadius: '30px'
  }
  
  // Используем цвет пакета для градиента
  if (props.node.paket_color) {
    // Формат: "#8AA5D4, #2F4D81" - первый цвет сверху, второй снизу
    const colors = props.node.paket_color.split(',').map(c => c.trim())
    if (colors.length === 2) {
      style.background = `linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%)`
    } else {
      // Если формат неожиданный, используем как есть
      style.background = `linear-gradient(180deg, ${props.node.paket_color})`
    }
  } else {
    // Дефолтный градиент, если цвет не указан
    style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
  
  return style
})

const handleClick = () => {
  if (props.node?.cabinet_id) {
    router.push(`/structure/${props.node.cabinet_id}`)
  }
}

const handleCabinetDetailsClick = () => {
  if (props.node?.cabinet_id) {
    emit('cabinetDetailsClick', props.node.cabinet_id)
  }
}

const handleDetailsClick = async () => {
  if (!props.node?.cabinet_id) return
  
  try {
    // Получаем participant_id из кабинета
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8000'}/api/admin/cabinets/${props.node.cabinet_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const cabinetData = await response.json()
      emit('nodeClick', cabinetData.participant_id)
    }
  } catch (error) {
    console.error('Error fetching cabinet data:', error)
  }
}
</script>

<style scoped>
.tree .branch {
  padding-top: 20px;
  position: relative;
  transition: all 0.5s;
}

.tree .node {
  display: inline-block;
  text-align: center;
  position: relative;
  padding: 20px 5px 0 5px;
  transition: all 0.5s;
}

/* Connecting lines */
.tree .node::before,
.tree .node::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  border-top: 1px solid #ccc;
  width: 50%;
  height: 20px;
}

.tree .node::after {
  right: auto;
  left: 50%;
  border-left: 1px solid #ccc;
}

/* Remove lines for leaf nodes */
.tree .node:only-child::after,
.tree .node:only-child::before {
  display: none;
}

/* Connect parent to children */
.tree .node:only-child {
  padding-top: 0;
}

.tree .node:first-child::before,
.tree .node:last-child::after {
  border: 0 none;
}

.tree .node:last-child::before {
  border-right: 1px solid #ccc;
  border-radius: 0 5px 0 0;
}

.tree .node:first-child::after {
  border-radius: 5px 0 0 0;
}

/* Line connecting sibling branches */
.tree .branch::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  border-left: 1px solid #ccc;
  width: 0;
  height: 20px;
}

.node-link {
  text-decoration: none;
  color: inherit;
}

.node-content {
  color: #ffffff;
  font-family: arial, verdana, tahoma;
  font-size: 11px;
  display: inline-block;
  border-radius: 5px;
  transition: all 0.5s;
  cursor: pointer;
}

.node-content:hover {
  background: #ffffff !important;
  color: #000;
}

.node.invisible {
  visibility: hidden;
}

.branch {
  display: flex;
  justify-content: center;
}

.cabinet-number {
  font-weight: 600;
  opacity: 0.9;
}
</style>
