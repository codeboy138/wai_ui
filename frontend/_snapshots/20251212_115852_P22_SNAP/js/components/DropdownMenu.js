### [WAI:UPDATE:js/components/DropdownMenu.js]
// Dropdown Menu Component (Reusable)
// 드롭다운 규칙:
// - 레이블과 표시필드 분리 없음 → 표시필드 자체가 레이블.
// - 접힘 상태: 표시필드에는 항상 레이블만.
// - 펼침 상태: 목록에는 옵션만 (값만).
// - 선택 옵션은 테두리(zinc 계열)로 강조.
// - 표시필드 hover 시, "레이블 (선택: 값)" 형태로 현재 선택값을 보여줌.

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
        // 표시필드 텍스트:
        // - 기본: 레이블만
        // - Hover + 값 존재: "레이블 (선택: 값)"
        displayText() {
            if (this.isHovered && this.currentValue) {
                return `${this.label} (선택: ${this.currentValue})`;
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
            class="c-dropdown w-24"
            :class="{ 'open': isOpen }"
            @click.stop="toggleDropdown"
            @mouseenter="isHovered = true"
            @mouseleave="handleMouseLeave"
        >
            <span :id="'val-' + id" class="truncate max-w-[90%]">
                {{ displayText }}
            </span>
            <i class="fa-solid fa-caret-down ml-auto text-[8px]"></i>

            <div class="c-dropdown-menu">
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
