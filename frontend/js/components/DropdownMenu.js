// Dropdown Menu Component (Reusable)
const DropdownMenu = {
    props: ['currentValue', 'items', 'id'],
    template: `
        <div :id="id" class="c-dropdown w-20 h-6 border-none bg-transparent px-0" :class="{ 'open': isOpen }" @click="toggleDropdown" @click.stop>
            <span :id="'val-' + id" class="truncate max-w-[80%]">{{ currentValue }}</span> <i class="fa-solid fa-caret-down ml-auto text-[8px]"></i>
            <div class="c-dropdown-menu">
                <div class="c-dropdown-item" v-for="item in items" :key="item" @click="$emit('select', item); isOpen = false">
                    {{ item }}
                </div>
            </div>
        </div>
    `,
    data() { return { isOpen: false } },
    methods: {
        toggleDropdown() { this.isOpen = !this.isOpen; },
        closeOnOutsideClick(e) { if (!this.$el.contains(e.target)) this.isOpen = false; }
    },
    mounted() { document.addEventListener('click', this.closeOnOutsideClick); },
    beforeUnmount() { document.removeEventListener('click', this.closeOnOutsideClick); }
};
