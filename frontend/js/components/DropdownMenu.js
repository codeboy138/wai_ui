// Dropdown Menu Component (Reusable)
// 드롭다운 규칙 (WAI-UI):
// - 레이블과 표시필드 분리 없음 → 표시필드 자체가 레이블.
// - 접힘(Closed) 상태 기본: 표시필드에는 레이블만.
// - 접힘 상태에서 표시필드 Hover 시: 레이블 대신 현재 선택된 옵션값만 표시(교체).
// - 펼침(Opened) 상태: 표시필드에는 항상 레이블만 유지, 옵션 리스트에는 옵션 텍스트만.
// - 선택된 옵션은 테두리(zinc 계열)로 강조 (CSS: .c-dropdown-item-selected 등에서 처리).

const DropdownMenu = {
    props: {
        id: {
            type: String,
            required: false
        },
        // 표시필드에 항상 나오는 레이블 (예: "비율", "해상도")
        label: {
            type: String,
            required: true
        },
        // 실제 선택된 값 (예: "16:9", "4K")
        currentValue: {
            type: [String, Number],
            required: false,
            default: ''
        },
        // 옵션 리스트 (값 배열)
        items: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            isOpen: false,
            isHovered: false
        };
    },
    computed: {
        /**
         * 표시필드 텍스트 규칙:
         * - 드롭다운이 열린 상태(isOpen === true): 항상 레이블만 표시
         * - 드롭다운이 닫힌 상태(isOpen === false):
         *   - Hover + currentValue 존재: 현재 선택된 값만 표시 (레이블 → 값으로 교체)
         *   - 그 외: 레이블만 표시
         */
        displayText() {
            if (this.isOpen) {
                return this.label;
            }
            if (this.isHovered && this.currentValue) {
                return String(this.currentValue);
            }
            return this.label;
        }
    },
    methods: {
        toggleDropdown() {
            this.isOpen = !this.isOpen;
        },
        closeOnOutsideClick(e) {
            if (!this.$el.contains(e.target)) {
                this.isOpen = false;
            }
        },
        handleMouseEnter() {
            this.isHovered = true;
        },
        handleMouseLeave() {
            this.isHovered = false;
        },
        selectItem(item) {
            this.$emit('select', item);
            this.isOpen = false;
        }
    },
    mounted() {
        document.addEventListener('click', this.closeOnOutsideClick);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.closeOnOutsideClick);
    },
    template: `
        <div
            :id="id"
            class="wai-dropdown c-dropdown h-6 border-none bg-transparent px-0"
            :class="{ 'wai-dropdown--open': isOpen }"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
        >
            <!-- 표시필드(트리거): 레이블/값을 보여주는 버튼 -->
            <button
                type="button"
                class="wai-dropdown-trigger flex items-center w-full h-full"
                @click.stop="toggleDropdown"
            >
                <span
                    :id="id ? ('val-' + id) : null"
                    class="whitespace-nowrap"
                >
                    {{ displayText }}
                </span>
                <i class="fa-solid fa-caret-down ml-1 text-[8px]"></i>
            </button>

            <!-- 옵션 리스트: 드롭다운이 열렸을 때만 렌더링 -->
            <div
                v-if="isOpen"
                class="wai-dropdown-menu c-dropdown-menu"
            >
                <div
                    v-for="item in items"
                    :key="item"
                    class="c-dropdown-item"
                    :class="{ 'c-dropdown-item-selected': item === currentValue }"
                    @click.stop="selectItem(item)"
                >
                    {{ item }}
                </div>
            </div>
        </div>
    `
};
