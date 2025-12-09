/**
 * ==========================================
 * DropdownMenu.js - 드롭다운 메뉴 컴포넌트
 * 
 * 역할: 재사용 가능한 드롭다운 UI
 * 경로: frontend/js/components/DropdownMenu.js
 * ==========================================
 */

export default {
    name: 'DropdownMenu',
    
    props: {
        currentValue: {
            type: String,
            required: true
        },
        items: {
            type: Array,
            required: true
        },
        id: {
            type: String,
            required: true
        }
    },
    
    data() {
        return {
            isOpen: false
        };
    },
    
    methods: {
        toggleDropdown() {
            this.isOpen = !this.isOpen;
        },
        
        closeOnOutsideClick(e) {
            if (!this.$el.contains(e.target)) {
                this.isOpen = false;
            }
        }
    },
    
    mounted() {
        document.addEventListener('click', this.closeOnOutsideClick);
    },
    
    beforeUnmount() {
        document.removeEventListener('click', this.closeOnOutsideClick);
    },
    
    template: \`
        <div :id="id" 
             class="c-dropdown c-dropdown--compact" 
             :class="{ 'c-dropdown--open': isOpen }" 
             @click="toggleDropdown" 
             @click.stop
             :title="'선택: ' + currentValue">
            <span class="c-dropdown__value">{{ currentValue }}</span>
            <i class="c-dropdown__icon fa-solid fa-caret-down"></i>
            <div class="c-dropdown__menu">
                <div class="c-dropdown__item" 
                     v-for="item in items" 
                     :key="item" 
                     :title="'선택: ' + item"
                     @click="$emit('select', item); isOpen = false">
                    {{ item }}
                </div>
            </div>
        </div>
    \`
};
