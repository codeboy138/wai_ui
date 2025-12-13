// Properties Panel Component
const PropertiesPanel = {
    props: ['vm'],
    template: `
        <div
            id="panel-right-props-root"
            class="border-b border-ui-border bg-bg-panel"
        >
            <!-- 헤더: 속성 -->
            <div
                id="panel-right-props-header"
                class="h-8 bg-bg-hover flex items-center justify-between px-2 cursor-pointer select-none border-b border-ui-border"
                @click="isCollapsed = !isCollapsed"
                data-action="js:togglePropsPanelCollapse"
            >
                <span class="text-xs font-bold text-text-main">
                    <i class="fa-solid fa-sliders mr-2"></i>속성
                </span>
                <i
                    :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']"
                    class="text-text-sub text-xs"
                ></i>
            </div>

            <!-- 본문 -->
            <div v-if="!isCollapsed" id="panel-right-props-body" class="p-3 space-y-3">
                <!-- 선택 없음 -->
                <div
                    v-if="!vm.selectedClip && !vm.selectedBoxId"
                    id="panel-right-props-empty-label"
                    class="text-text-sub text-center text-[10px] py-4 opacity-50"
                >
                    선택된 요소 없음
                </div>
                
                <!-- 클립 선택 -->
                <div
                    v-else-if="vm.selectedClip"
                    id="panel-right-props-clip-section"
                    class="animate-fade-in space-y-2"
                >
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">CLIP</div>
                        <div class="text-sm font-bold text-text-main truncate">
                            {{ vm.selectedClip.name }}
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] text-text-sub">Start</label>
                            <input
                                id="panel-right-props-clip-start"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="vm.selectedClip.start.toFixed(1)"
                                readonly
                            />
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">Dur</label>
                            <input
                                id="panel-right-props-clip-duration"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="vm.selectedClip.duration.toFixed(1)"
                                readonly
                            />
                        </div>
                    </div>
                    <button
                        id="panel-right-props-clip-delete-btn"
                        class="w-full bg-ui-border hover:bg-ui-danger hover:text-white border border-ui-border text-text-sub py-1 rounded text-[10px] transition-colors"
                        @click="deleteClip(vm.selectedClip.id)"
                        data-action="js:propsDeleteClip"
                    >
                        <i class="fa-solid fa-trash mr-1"></i> 삭제
                    </button>
                </div>
                
                <!-- 박스 선택 -->
                <div
                    v-else-if="selectedBox"
                    id="panel-right-props-box-section"
                    class="animate-fade-in space-y-2"
                >
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">
                            BOX (Z:{{ selectedBox.zIndex }})
                        </div>
                        <div class="text-sm font-bold text-text-main truncate">
                            ({{ selectedBox.type }})
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] text-text-sub">X (%)</label>
                            <input
                                id="panel-right-props-box-x"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="formatPercent('x')"
                                readonly
                            />
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">Y (%)</label>
                            <input
                                id="panel-right-props-box-y"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="formatPercent('y')"
                                readonly
                            />
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">W (%)</label>
                            <input
                                id="panel-right-props-box-w"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="formatPercent('w')"
                                readonly
                            />
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">H (%)</label>
                            <input
                                id="panel-right-props-box-h"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="formatPercent('h')"
                                readonly
                            />
                        </div>
                    </div>
                    <button
                        id="panel-right-props-box-delete-btn"
                        class="w-full bg-ui-border hover:bg-ui-danger hover:text-white border border-ui-border text-text-sub py-1 rounded text-[10px] transition-colors"
                        @click="vm.removeBox(vm.selectedBoxId)"
                        data-action="js:propsDeleteBox"
                    >
                        <i class="fa-solid fa-trash mr-1"></i> 삭제
                    </button>
                </div>
            </div>
        </div>
    `,
    data() { return { isCollapsed: false }; },
    computed: {
        selectedBox() {
            return this.vm.canvasBoxes.find(b => b.id === this.vm.selectedBoxId);
        }
    },
    methods: {
        deleteClip(id) {
            this.vm.removeClip(id);
            this.vm.selectedClip = null;
        },
        formatPercent(prop) {
            const box = this.selectedBox;
            if (!box) return '';
            const canvas = this.vm && this.vm.canvasSize
                ? this.vm.canvasSize
                : { w: 1, h: 1 };
            const cw = canvas.w || 1;
            const ch = canvas.h || 1;

            let valueRatio = 0;
            if (prop === 'x') {
                const nx = typeof box.nx === 'number' ? box.nx : (box.x || 0) / cw;
                valueRatio = nx;
            } else if (prop === 'y') {
                const ny = typeof box.ny === 'number' ? box.ny : (box.y || 0) / ch;
                valueRatio = ny;
            } else if (prop === 'w') {
                const nw = typeof box.nw === 'number' ? box.nw : (box.w || cw) / cw;
                valueRatio = nw;
            } else if (prop === 'h') {
                const nh = typeof box.nh === 'number' ? box.nh : (box.h || ch) / ch;
                valueRatio = nh;
            }
            return (valueRatio * 100).toFixed(2) + '%';
        }
    }
};
