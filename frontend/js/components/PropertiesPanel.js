// Properties Panel Component
const PropertiesPanel = {
    props: ['vm'],
    template: `
        <div class="border-b border-ui-border bg-bg-panel" data-dev="ID: props-panel\nComp: RightPanel/Properties\nNote: 클립/박스 속성 표시">
            <div class="h-8 bg-bg-hover flex items-center justify-between px-2 cursor-pointer select-none border-b border-ui-border" @click="isCollapsed = !isCollapsed" data-dev="ID: props-header">
                <span class="text-xs font-bold text-text-main"><i class="fa-solid fa-sliders mr-2"></i>속성</span>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']" class="text-text-sub text-xs"></i>
            </div>
            <div v-if="!isCollapsed" class="p-3 space-y-3">
                <div v-if="!vm.selectedClip && !vm.selectedBoxId" class="text-text-sub text-center text-[10px] py-4 opacity-50">선택된 요소 없음</div>
                
                <div v-else-if="vm.selectedClip" class="animate-fade-in space-y-2">
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">CLIP</div>
                        <div class="text-sm font-bold text-text-main truncate">{{ vm.selectedClip.name }}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] text-text-sub">Start</label>
                            <input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="vm.selectedClip.start.toFixed(1)" readonly/>
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">Dur</label>
                            <input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="vm.selectedClip.duration.toFixed(1)" readonly/>
                        </div>
                    </div>
                    <button class="w-full bg-ui-border hover:bg-ui-danger hover:text-white border border-ui-border text-text-sub py-1 rounded text-[10px] transition-colors" @click="deleteClip(vm.selectedClip.id)">
                        <i class="fa-solid fa-trash mr-1"></i> 삭제
                    </button>
                </div>
                
                <div v-else-if="selectedBox" class="animate-fade-in space-y-2">
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">BOX (Z:{{ selectedBox.zIndex }})</div>
                        <div class="text-sm font-bold text-text-main truncate">({{ selectedBox.type }})</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div><label class="text-[10px] text-text-sub">X</label><input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="Math.round(selectedBox.x)" readonly/></div>
                        <div><label class="text-[10px] text-text-sub">Y</label><input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="Math.round(selectedBox.y)" readonly/></div>
                        <div><label class="text-[10px] text-text-sub">W</label><input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="Math.round(selectedBox.w)" readonly/></div>
                        <div><label class="text-[10px] text-text-sub">H</label><input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="Math.round(selectedBox.h)" readonly/></div>
                    </div>
                    <button class="w-full bg-ui-border hover:bg-ui-danger hover:text-white border border-ui-border text-text-sub py-1 rounded text-[10px] transition-colors" @click="vm.removeBox(vm.selectedBoxId)">
                        <i class="fa-solid fa-trash mr-1"></i> 삭제
                    </button>
                </div>
            </div>
        </div>
    `,
    data() { return { isCollapsed: false } },
    computed: {
        selectedBox() {
            return this.vm.canvasBoxes.find(b => b.id === this.vm.selectedBoxId);
        }
    },
    methods: {
        deleteClip(id) {
            this.vm.removeClip(id);
            this.vm.selectedClip = null;
        }
    }
};
