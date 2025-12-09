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
             class="c-dropdown c-dropdown--compact" 
             :class="{ 'c-dropdown--open': isOpen }" 
             @click="toggleDropdown" 
             @click.stop
             data-js="dropdown-menu"
             title="옵션 선택"
             data-dev="요소의 역할: 드롭다운 메뉴 컨테이너
요소의 고유ID: component-dropdown-container
요소의 기능 목적 정의: 선택 가능한 항목 목록 표시
요소의 동작 로직 설명: 클릭 시 메뉴 토글, 항목 선택 시 이벤트 발생
요소의 입출력 데이터 구조: 입력: currentValue, items. 출력: @select 이벤트
요소의 경로정보: frontend/js/components/DropdownMenu.js#container
요소의 수행해야 할 백엔드/JS 명령: JS: toggleDropdown(), $emit('select')">
            <span :id="'dropdown-value-' + id" 
                  class="c-dropdown__value"
                  data-js="dropdown-value"
                  :title="currentValue">{{ currentValue }}</span>
            <i class="c-dropdown__icon fa-solid fa-caret-down"
               data-js="dropdown-icon"
               title="펼치기"></i>
            <div class="c-dropdown__menu"
                 data-js="dropdown-menu-list"
                 data-dev="요소의 역할: 드롭다운 메뉴 항목 리스트
요소의 고유ID: component-dropdown-menu-list
요소의 기능 목적 정의: 선택 가능한 항목들을 표시하는 메뉴
요소의 동작 로직 설명: 항목 클릭 시 @select 이벤트 발생 후 메뉴 닫힘
요소의 입출력 데이터 구조: 입력: items 배열. 출력: 선택된 item 값
요소의 경로정보: frontend/js/components/DropdownMenu.js#menu-list
요소의 수행해야 할 백엔드/JS 명령: JS: $emit('select', item), isOpen=false">
                <div class="c-dropdown__item" 
                     v-for="item in items" 
                     :key="item" 
                     :data-js="'dropdown-item-' + item"
                     :title="'선택: ' + item"
                     @click="$emit('select', item); isOpen = false"
                     data-dev="요소의 역할: 드롭다운 메뉴 개별 항목
요소의 고유ID: component-dropdown-item
요소의 기능 목적 정의: 선택 가능한 단일 항목
요소의 동작 로직 설명: 클릭 시 부모에게 select 이벤트 전달 후 메뉴 닫기
요소의 입출력 데이터 구조: 입력: item(문자열). 출력: @select(item)
요소의 경로정보: frontend/js/components/DropdownMenu.js#item
요소의 수행해야 할 백엔드/JS 명령: JS: $emit('select', item)">
                    {{ item }}
                </div>
            </div>
        </div>
    `
};
