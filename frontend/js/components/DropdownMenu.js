/**
 * [DATA-DEV: DropdownMenu]
 * - 역할: 재사용 가능한 드롭다운 메뉴 UI
 * - 고유ID: dropdown-menu
 * - 기능: 메뉴 토글, 항목 선택
 * - 로직: isOpen 상태 토글, 외부 클릭 시 닫기
 * - 데이터: items (배열), isOpen (boolean)
 * - 경로: frontend/js/components/DropdownMenu.js
 * - 명령: 없음 (UI 컴포넌트)
 */

export default {
  name: 'DropdownMenu',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    buttonText: {
      type: String,
      default: 'Menu'
    }
  },
  data() {
    return {
      isOpen: false
    };
  },
  template: '<div class="c-dropdown-menu" data-action="js:dropdownMenu" title="드롭다운 메뉴">' +
            '<button class="c-dropdown-menu__button" @click="toggle" :title="buttonText">{{ buttonText }}</button>' +
            '<div v-if="isOpen" class="c-dropdown-menu__list">' +
            '<div v-for="(item, index) in items" :key="index" class="c-dropdown-menu__item" @click="selectItem(item)" :title="item.label">{{ item.label }}</div>' +
            '</div>' +
            '</div>',
  
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
      console.log('[DropdownMenu] 토글:', this.isOpen);
    },
    
    selectItem(item) {
      console.log('[DropdownMenu] 선택:', item);
      this.$emit('select', item);
      this.isOpen = false;
    }
  },
  
  mounted() {
    document.addEventListener('click', this.handleOutsideClick);
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
  },
  
  methods: {
    handleOutsideClick(e) {
      if (!this.$el.contains(e.target)) {
        this.isOpen = false;
      }
    },
    
    toggle() {
      this.isOpen = !this.isOpen;
      console.log('[DropdownMenu] 토글:', this.isOpen);
    },
    
    selectItem(item) {
      console.log('[DropdownMenu] 선택:', item);
      this.$emit('select', item);
      this.isOpen = false;
    }
  }
};
