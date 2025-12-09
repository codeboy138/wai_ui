const { defineComponent } = Vue;

// [New] Smart Dropdown
export const DropdownMenu = defineComponent({
    props: ['label', 'currentValue', 'items', 'id', 'itemTextKey'], 
    // itemTextKey: 객체 배열일 경우 표시할 텍스트 키 (없으면 그냥 item 표시)
    template: `
        <div :id="id" class="c-dropdown px-3 h-full border-r border-ui-border last:border-r-0" 
             :class="{ 'open': isOpen }" 
             @click.stop="toggleDropdown"
             @mouseenter="isHovered = true"
             @mouseleave="isHovered = false">
            
            <div class="flex items-center gap-2 min-w-[60px] justify-between">
                <span class="text-[10px] font-bold" 
                      :class="isHovered ? 'text-ui-accent' : 'text-text-sub'">
                    {{ displayText }}
                </span>
                <i class="fa-solid fa-caret-down text-[8px] text-text-sub transition-transform" 
                   :class="{'rotate-180': isOpen}"></i>
            </div>
            
            <div class="c-dropdown-menu">
                <div v-if="$slots.header" class="p-2 border-b border-ui-border bg-bg-panel text-[10px] text-text-main font-bold text-center">
                    <slot name="header"></slot>
                </div>

                <div class="c-dropdown-item c-menu-item" 
                     v-for="(item, idx) in items" 
                     :key="idx" 
                     @click.stop="selectItem(item)">
                    
                    <span v-if="typeof item === 'object'">
                        {{ item.label }} <span class="text-text-sub text-[9px] ml-1" v-if="item.desc">({{ item.desc }})</span>
                    </span>
                    <span v-else>{{ item }}</span>
                </div>
            </div>
        </div>
    `,
    data() { return { isOpen: false, isHovered: false } },
    computed: {
        displayText() {
            // 호버 중이거나 메뉴가 열려있으면 -> 현재 선택된 값 표시
            // 평상시 -> 라벨(Label) 표시
            if (this.isHovered || this.isOpen) {
                return this.currentValue;
            }
            return this.label;
        }
    },
    methods: {
        toggleDropdown() { this.isOpen = !this.isOpen; },
        selectItem(item) {
            // 객체면 value값, 아니면 item 자체 반환
            const val = (typeof item === 'object') ? item.value : item;
            this.$emit('select', val);
            this.isOpen = false;
        },
        closeOnOutsideClick(e) { 
            if (!this.$el.contains(e.target)) this.isOpen = false; 
        }
    },
    mounted() { document.addEventListener('click', this.closeOnOutsideClick); },
    beforeUnmount() { document.removeEventListener('click', this.closeOnOutsideClick); }
});

// Ruler (변경 없음, 유지)
export const RulerLine = defineComponent({
    props: ['orientation', 'maxSize', 'scale'],
    template: `
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <template v-if="orientation === 'h'">
                <div v-for="i in majorTicks" :key="i" :style="{left: i + 'px'}" class="absolute top-0 text-xxs text-text-sub font-mono pl-1 border-l border-ui-border h-full">{{ i }}</div>
            </template>
            <template v-else>
                <div v-for="i in majorTicks" :key="i" :style="{top: i + 'px'}" class="absolute left-0 text-xxs text-text-sub font-mono pt-px border-t border-ui-border w-full">{{ i }}</div>
            </template>
        </div>
    `,
    computed: {
        majorTicks() {
            const step = 100; const ticks = [];
            for (let i = step; i < this.maxSize; i += step) if (i * this.scale < (this.orientation === 'h' ? 3840 : 2160)) ticks.push(i);
            return ticks;
        }
    }
});