/**
 * ==========================================
 * DropdownMenu.js - 드롭다운 메뉴 컴포넌트
 * 
 * 역할: 재사용 가능한 드롭다운 UI
 * 경로: frontend/js/components/DropdownMenu.js
 * 
 * DATA-DEV:
 * 요소의 역할: 선택 가능한 항목 목록을 표시하는 범용 드롭다운
 * 요소의 고유ID: component-dropdown-menu
 * 요소의 기능 목적 정의: currentValue, items props를 받아 선택 가능한 드롭다운 메뉴 제공
 * 요소의 동작 로직 설명: 클릭 시 isOpen 토글, 항목 선택 시 @select 이벤트 발생 후 메뉴 닫힘
 * 요소의 입출력 데이터 구조: 입력: currentValue(현재값), items(배열). 출력: @select(선택된 항목)
 * 요소의 경로정보: frontend/js/components/DropdownMenu.js
 * 요소의 수행해야 할 백엔드/JS 명령: JS: toggleDropdown(), $emit('select', item)
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
    
    template: `
        <div :id="id" 
             class="c-dropdown w-20 h-6 border-none bg-transparent px-0" 
             :class="{ 'open': isOpen }" 
             @click="toggleDropdown" 
             @click.stop
             data-dev="요소의 역할: 드롭다운 메뉴 컨테이너
요소의 고유ID: dropdown-menu-container
요소의 기능 목적 정의: 선택 가능한 항목 목록 표시
요소의 동작 로직 설명: 클릭 시 메뉴 토글, 항목 선택 시 이벤트 발생
요소의 입출력 데이터 구조: 입력: currentValue, items. 출력: @select 이벤트
요소의 경로정보: frontend/js/components/DropdownMenu.js#container
요소의 수행해야 할 백엔드/JS 명령: JS: toggleDropdown(), $emit('select')">
            <span :id="'val-' + id" class="truncate max-w-[80%]">{{ currentValue }}</span>
            <i class="fa-solid fa-caret-down ml-auto text-[8px]"></i>
            <div class="c-dropdown-menu">
                <div class="c-dropdown-item" 
                     v-for="item in items" 
                     :key="item" 
                     @click="$emit('select', item); isOpen = false">
                    {{ item }}
                </div>
            </div>
        </div>
    `
};
