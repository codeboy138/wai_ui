const { defineComponent } = Vue;

// ==========================================
// [Smart Dropdown Component]
// ==========================================
export const DropdownMenu = defineComponent({
    props: ['label', 'currentValue', 'items', 'id', 'itemTextKey'], 
    template: `
        <div :id="id" 
             class="c-dropdown" 
             :class="{ 'c-dropdown--open': isOpen }" 
             @click.stop="toggleDropdown"
             @mouseenter="isHovered = true"
             @mouseleave="isHovered = false"
             :data-dev="'Role: Dropdown | ID: c-dropdown-' + id + ' | Func: 드롭다운 메뉴 | Goal: 항목 선택 UI 제공 | State: isOpen=' + isOpen + ', currentValue=' + currentValue + ' | Path: App/Common/Dropdown | Py: None | JS: toggleDropdown()'">
            
            <div class="c-dropdown__trigger flex items-center gap-2 min-w-[60px] justify-between px-3 h-full border-r border-ui-border last:border-r-0"
                 :data-js-trigger="id"
                 :data-dev="'Role: Button | ID: c-dropdown-trigger-' + id + ' | Func: 드롭다운 트리거 | Goal: 메뉴 열기/닫기 토글 | State: isHovered=' + isHovered + ' | Path: App/Common/Dropdown/Trigger | Py: None | JS: @click=toggleDropdown()'">
                
                <span class="c-dropdown__label text-[10px] font-bold" 
                      :class="isHovered ? 'text-ui-accent' : 'text-text-sub'"
                      :data-dev="'Role: Label | ID: c-dropdown-label-' + id + ' | Func: 라벨 텍스트 | Goal: 현재 선택값 또는 라벨 표시 | State: displayText=' + displayText + ' | Path: App/Common/Dropdown/Label | Py: None | JS: None'">
                    {{ displayText }}
                </span>
                
                <i class="c-dropdown__icon fa-solid fa-caret-down text-[8px] text-text-sub transition-transform" 
                   :class="{'c-dropdown__icon--rotated': isOpen}"
                   :data-dev="'Role: Icon | ID: c-dropdown-icon-' + id + ' | Func: 화살표 아이콘 | Goal: 열림/닫힘 상태 시각화 | State: isOpen=' + isOpen + ' | Path: App/Common/Dropdown/Icon | Py: None | JS: None'"></i>
            </div>
            
            <div class="c-dropdown__menu"
                 :data-dev="'Role: Menu | ID: c-dropdown-menu-' + id + ' | Func: 드롭다운 메뉴 컨테이너 | Goal: 선택 가능한 항목 목록 표시 | State: items.length=' + items.length + ', visible=' + isOpen + ' | Path: App/Common/Dropdown/Menu | Py: None | JS: None'">
                
                <div v-if="$slots.header" 
                     class="c-dropdown__header p-2 border-b border-ui-border bg-bg-panel text-[10px] text-text-main font-bold text-center"
                     :data-dev="'Role: Header | ID: c-dropdown-header-' + id + ' | Func: 메뉴 헤더 | Goal: 카테고리 또는 설명 표시 | State: None | Path: App/Common/Dropdown/Menu/Header | Py: None | JS: None'">
                    <slot name="header"></slot>
                </div>

                <div class="c-dropdown__item c-menu-item" 
                     v-for="(item, idx) in items" 
                     :key="idx" 
                     @click.stop="selectItem(item)"
                     :data-js-item="'dropdown-' + id + '-item-' + idx"
                     :data-dev="'Role: MenuItem | ID: c-dropdown-item-' + id + '-' + idx + ' | Func: 메뉴 항목 | Goal: 항목 선택 시 부모에 emit | State: item=' + (typeof item === \\'object\\' ? item.value : item) + ' | Path: App/Common/Dropdown/Menu/Item | Py: None | JS: selectItem(item), emit(\\'select\\', value)'">
                    
                    <span v-if="typeof item === 'object'">
                        {{ item.label }} 
                        <span class="c-menu-item__desc text-text-sub text-[9px] ml-1" v-if="item.desc">({{ item.desc }})</span>
                    </span>
                    <span v-else>{{ item }}</span>
                </div>
            </div>
        </div>
    `,
    data() { 
        return { 
            isOpen: false, 
            isHovered: false 
        } 
    },
    computed: {
        displayText() {
            if (this.isHovered || this.isOpen) {
                return this.currentValue;
            }
            return this.label;
        }
    },
    methods: {
        toggleDropdown() { 
            this.isOpen = !this.isOpen; 
        },
        selectItem(item) {
            const val = (typeof item === 'object') ? item.value : item;
            this.$emit('select', val);
            this.isOpen = false;
        },
        closeOnOutsideClick(e) { 
            if (!this.$el.contains(e.target)) this.isOpen = false; 
        }
    },
    mounted() { 
        document.addEventListener('click', this.closeOnOutsideClick); 
    },
    beforeUnmount() { 
        document.removeEventListener('click', this.closeOnOutsideClick); 
    }
});

// ==========================================
// [Ruler Component]
// ==========================================
export const RulerLine = defineComponent({
    props: ['orientation', 'maxSize', 'scale'],
    template: `
        <div class="c-ruler absolute inset-0 overflow-hidden pointer-events-none"
             :data-dev="'Role: Ruler | ID: c-ruler-' + orientation + ' | Func: 눈금자 | Goal: 캔버스 좌표 가이드 제공 | State: orientation=' + orientation + ', maxSize=' + maxSize + ', scale=' + scale + ' | Path: App/Common/Ruler | Py: None | JS: None'">
            
            <template v-if="orientation === 'h'">
                <div v-for="i in majorTicks" 
                     :key="'h-' + i" 
                     :style="{left: i + 'px'}" 
                     class="c-ruler__tick c-ruler__tick--horizontal absolute top-0 text-xxs text-text-sub font-mono pl-1 border-l border-ui-border h-full"
                     :data-dev="'Role: Tick | ID: c-ruler-tick-h-' + i + ' | Func: 가로 눈금 | Goal: X축 위치 표시 | State: position=' + i + 'px | Path: App/Common/Ruler/Tick | Py: None | JS: None'">
                    {{ i }}
                </div>
            </template>
            
            <template v-else>
                <div v-for="i in majorTicks" 
                     :key="'v-' + i" 
                     :style="{top: i + 'px'}" 
                     class="c-ruler__tick c-ruler__tick--vertical absolute left-0 text-xxs text-text-sub font-mono pt-px border-t border-ui-border w-full"
                     :data-dev="'Role: Tick | ID: c-ruler-tick-v-' + i + ' | Func: 세로 눈금 | Goal: Y축 위치 표시 | State: position=' + i + 'px | Path: App/Common/Ruler/Tick | Py: None | JS: None'">
                    {{ i }}
                </div>
            </template>
        </div>
    `,
    computed: {
        majorTicks() {
            const step = 100; 
            const ticks = [];
            for (let i = step; i < this.maxSize; i += step) {
                if (i * this.scale < (this.orientation === 'h' ? 3840 : 2160)) {
                    ticks.push(i);
                }
            }
            return ticks;
        }
    }
});
