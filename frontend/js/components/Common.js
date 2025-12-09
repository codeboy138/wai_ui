/**
 * ==========================================
 * Common.js - 공통 UI 컴포넌트
 * 
 * 역할: Dropdown, Modal, ContextMenu 등 재사용 가능한 UI 컴포넌트
 * 경로: frontend/js/components/Common.js
 * ==========================================
 */

// Dropdown 컴포넌트
export const Dropdown = {
  name: 'Dropdown',
  
  props: {
    label: String,
    value: String,
    items: Array
  },
  
  data() {
    return {
      isOpen: false
    };
  },
  
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },
    
    select(item) {
      this.$emit('change', item);
      this.isOpen = false;
    }
  },
  
  template: `
    <div 
      class="c-dropdown"
      :class="{ 'open': isOpen }"
      @click="toggle"
    >
      <span class="c-dropdown__label">{{ label }}:</span>
      <span class="c-dropdown__value">{{ value }}</span>
      <i class="fas fa-chevron-down c-dropdown__icon"></i>
      
      <div class="c-dropdown-menu">
        <div 
          v-for="item in items"
          :key="item"
          class="c-dropdown-item"
          @click.stop="select(item)"
        >
          {{ item }}
        </div>
      </div>
    </div>
  `
};

// Modal 컴포넌트
export const Modal = {
  name: 'Modal',
  
  props: {
    visible: Boolean,
    title: String
  },
  
  methods: {
    close() {
      this.$emit('close');
    }
  },
  
  template: `
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-window animate-fade-in">
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button class="modal-close" @click="close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
      </div>
    </div>
  `
};

export default {
  Dropdown,
  Modal
};
