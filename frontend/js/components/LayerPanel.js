// Layer Panel Component (Matrix UI 구현)
const LayerPanel = {
    props: ['vm'],
    template: `
        <div
            id="panel-right-layer-root"
            class="border-b border-ui-border bg-bg-panel select-none"
        >
            <!-- 헤더: 레이어 관리 -->
            <div
                id="panel-right-layer-header"
                class="h-8 bg-bg-hover flex items-center justify-between px-3 cursor-pointer border-b border-ui-border"
                @click="isCollapsed = !isCollapsed"
                data-action="js:toggleLayerPanelCollapse"
            >
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-text-main flex items-center gap-2">
                        <i class="fa-solid fa-layer-group"></i> 레이어 관리
                    </span>
                    <span
                        v-if="vm.layerMainName"
                        id="panel-right-layer-mainname-badge"
                        class="text-[10px] text-ui-accent border border-ui-accent px-1 rounded"
                    >
                        {{ vm.layerMainName }}
                    </span>
                </div>
                <i
                    :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']"
                    class="text-text-sub text-xs"
                ></i>
            </div>

            <!-- 본문: 매트릭스 / 컬럼 / 템플릿 저장 -->
            <div v-if="!isCollapsed" id="panel-right-layer-body" class="p-3">
                <div class="flex justify-between items-center mb-2">
                    <span
                        id="panel-right-layer-matrix-label"
                        class="text-[10px] text-text-sub"
                    >
                        매트릭스 (우클릭: 색상)
                    </span>
                    <button
                        id="panel-right-layer-addcol-btn"
                        class="text-[10px] hover:text-white bg-ui-selected px-2 rounded"
                        @click.stop="addColumn"
                        data-action="js:layerAddColumn"
                    >
                        + 컬럼
                    </button>
                </div>

                <!-- 컬럼 헤더 + 셀 매트릭스 -->
                <div
                    id="panel-right-layer-matrix-container"
                    class="overflow-x-auto pb-2"
                >
                    <!-- 컬럼 헤더 행 -->
                    <div class="flex gap-1 mb-1 min-w-max">
                        <div class="w-10 shrink-0"></div>
                        <div
                            v-for="(col, i) in vm.layerCols"
                            :key="col.id"
                            :id="'panel-right-layer-col-' + col.id"
                            class="w-[50px] text-center py-1 rounded text-[10px] font-bold text-white cursor-context-menu hover:brightness-110 relative group"
                            :style="{ backgroundColor: col.color }"
                            @contextmenu.prevent="openContextMenu($event, col.id, i)"
                        >
                            <input
                                :id="'panel-right-layer-col-name-' + col.id"
                                type="text"
                                :value="col.name"
                                @input="updateColName(col.id, $event.target.value)"
                                class="bg-transparent text-center w-full outline-none"
                                @click.stop
                            />
                            <div
                                class="absolute top-0 right-0 text-[8px] opacity-0 group-hover:opacity-100 p-0.5 bg-black/50 rounded"
                            >
                                Z:{{ getZIndex(i, 'VID') }}
                            </div>
                        </div>
                    </div>

                    <!-- 행(EFF / TXT / BG) + 셀 -->
                    <div
                        v-for="row in rows"
                        :key="row.type"
                        :id="'panel-right-layer-row-' + row.type"
                        class="flex gap-1 mb-1 min-w-max"
                    >
                        <div
                            :id="'panel-right-layer-rowlabel-' + row.type"
                            class="w-10 shrink-0 text-[9px] flex items-center justify-end pr-2 font-bold"
                            :style="{ color: row.color }"
                        >
                            {{ row.label }}
                        </div>
                        <div
                            v-for="(col, i) in vm.layerCols"
                            :key="col.id + row.type"
                            :id="'panel-right-layer-cell-' + i + '-' + row.type"
                            :class="{
                                'opacity-100 ring-1 ring-white': isActive(i, row.type),
                                'opacity-30 grayscale': !isActive(i, row.type)
                            }"
                            class="w-[50px] h-6 border border-ui-border rounded flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all"
                            :style="{ backgroundColor: '#27272a' }"
                            @click="vm.addLayerBox(i, row.type, col.color)"
                            data-action="js:layerAddBox"
                        >
                            <span
                                class="text-[10px] font-bold text-white drop-shadow-md"
                                style="text-shadow: 0 0 3px black"
                            >
                                {{ getZIndex(i, row.type) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 템플릿 저장 버튼 -->
                <div class="mt-2 flex justify-end">
                    <button
                        id="panel-right-layer-save-template-btn"
                        class="text-xs bg-ui-accent text-white px-3 py-1 rounded hover:bg-blue-600"
                        @click="saveLayerTemplate"
                        data-action="js:layerSaveTemplate"
                    >
                        저장
                    </button>
                </div>
            </div>

            <!-- 컬럼 색상 선택 컨텍스트 메뉴 -->
            <div
                v-if="contextMenu"
                id="panel-right-layer-color-menu"
                class="context-menu"
                :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}"
            >
                <div class="color-grid">
                    <div
                        v-for="c in COLORS"
                        :key="c"
                        :id="'panel-right-layer-color-swatch-' + c"
                        class="color-swatch"
                        :style="{ backgroundColor: c }"
                        @click="handleColColor(c)"
                    ></div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            isCollapsed: false,
            contextMenu: null,
            rows: [
                { type: 'EFF', label: 'Effect', color: '#ef4444', offset: 80 }, 
                { type: 'TXT', label: 'Text',  color: '#eab308', offset: 40 }, 
                { type: 'BG',  label: 'BG',    color: '#3b82f6', offset: 20 }
            ],
            COLORS: COLORS
        }
    },
    methods: {
        getZIndex(colIdx, type) {
            const base = (colIdx * 100) + 100;
            const row = this.rows.find(r => r.type === type);
            const offset = row ? row.offset : 0;
            return base + offset;
        },
        isActive(colIdx, type) {
            return this.vm.canvasBoxes.some(b => b.colIdx === colIdx && b.type === type);
        },
        addColumn() {
            const newCol = { id: `lc_${Date.now()}`, name: 'New', color: '#333' };
            this.vm.layerCols.push(newCol);
        },
        updateColName(id, name) {
            const col = this.vm.layerCols.find(c => c.id === id);
            if (col) col.name = name;
        },
        openContextMenu(e, id, index) {
            this.contextMenu = { x: e.clientX, y: e.clientY, colId: id, colIndex: index };
        },
        handleColColor(color) {
            const colId = this.contextMenu.colId;
            this.vm.layerCols = this.vm.layerCols.map(col =>
                col.id === colId ? { ...col, color: color } : col
            );
            this.contextMenu = null;
        },
        async saveLayerTemplate() {
            const { value: name } = await Swal.fire({ 
                title: '레이어 템플릿 저장', 
                input: 'text', 
                inputLabel: '메인 레이어 이름', 
                inputPlaceholder: '예: News_Layout', 
                showCancelButton: true, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6' 
            });
            if (name) { 
                this.vm.saveLayerTemplate(name); 
                Swal.fire({
                    icon:'success',
                    title:'저장됨',
                    background:'#1e1e1e',
                    color:'#fff',
                    confirmButtonColor:'#3b82f6'
                }); 
            }
        }
    }
};

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
                            <label class="text-[10px] text-text-sub">X</label>
                            <input
                                id="panel-right-props-box-x"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="Math.round(selectedBox.x)"
                                readonly
                            />
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">Y</label>
                            <input
                                id="panel-right-props-box-y"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="Math.round(selectedBox.y)"
                                readonly
                            />
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">W</label>
                            <input
                                id="panel-right-props-box-w"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="Math.round(selectedBox.w)"
                                readonly
                            />
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">H</label>
                            <input
                                id="panel-right-props-box-h"
                                type="text"
                                class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main"
                                :value="Math.round(selectedBox.h)"
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
