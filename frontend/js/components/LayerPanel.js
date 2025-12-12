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
                                Z:{{ vm.getZIndexForCell(i, 'TXT') }}
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
                            :id="'panel-right-layer-cell-' + col.id + '-' + row.type"
                            :class="{
                                'opacity-100': isActive(i, row.type),
                                'opacity-40 grayscale': !isActive(i, row.type)
                            }"
                            class="w-[50px] h-6 border rounded flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all"
                            :style="cellStyle(i, row.type, col.color)"
                            @click="vm.addLayerBox(i, row.type, col.color)"
                            data-action="js:layerAddBox"
                        >
                            <span
                                class="text-[10px] font-bold text-white drop-shadow-md"
                                style="text-shadow: 0 0 3px black"
                            >
                                {{ vm.getZIndexForCell(i, row.type) }}
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
                { type: 'EFF', label: 'Effect', color: '#ef4444' }, 
                { type: 'TXT', label: 'Text',  color: '#eab308' }, 
                { type: 'BG',  label: 'BG',    color: '#3b82f6' }
            ],
            COLORS: COLORS
        }
    },
    methods: {
        cellSlotKey(colIdx, rowType) {
            if (this.vm && typeof this.vm.getSlotKey === 'function') {
                return this.vm.getSlotKey(colIdx, rowType);
            }
            return `${colIdx}_${rowType}`;
        },
        isActive(colIdx, rowType) {
            const slotKey = this.cellSlotKey(colIdx, rowType);
            return this.vm.canvasBoxes.some(b => b.slotKey === slotKey);
        },
        cellStyle(colIdx, rowType, colColor) {
            const active = this.isActive(colIdx, rowType);
            return {
                backgroundColor: '#27272a',
                borderColor: active ? colColor : '#27272a'
            };
        },
        addColumn() {
            const newCol = { id: `lc_${Date.now()}`, name: 'New', color: '#333' };
            this.vm.layerCols.push(newCol);
        },
        updateColName(id, name) {
            const col = this.vm.layerCols.find(c => c.id === id);
            if (col) col.name = name;
            // 컬럼 이름 변경 → 해당 컬럼의 박스 레이어 이름도 갱신
            this.vm.canvasBoxes = this.vm.canvasBoxes.map(box =>
                box.colId === id ? { ...box, layerName: name } : box
            );
        },
        openContextMenu(e, id, index) {
            this.contextMenu = { x: e.clientX, y: e.clientY, colId: id, colIndex: index };
        },
        handleColColor(color) {
            const colId = this.contextMenu.colId;
            // 컬럼 색 변경
            this.vm.layerCols = this.vm.layerCols.map(col =>
                col.id === colId ? { ...col, color: color } : col
            );
            // 해당 컬럼에 속한 박스들의 점선 색도 함께 변경
            this.vm.canvasBoxes = this.vm.canvasBoxes.map(box =>
                box.colId === colId ? { ...box, color: color } : box
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
