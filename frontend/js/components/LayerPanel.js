// Layer Panel Component (Matrix UI 구현)
// 레이블 스타일: AssetManagerModal 기준 통일 (text-[14px] 헤더, text-[11px] 버튼/레이블)
// 기능 로직 변경 없음
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
                    <span class="text-[14px] font-bold text-text-main flex items-center gap-2">
                        <i class="fa-solid fa-layer-group text-ui-accent"></i> 레이어 관리
                    </span>
                    <span
                        v-if="vm.layerMainName"
                        id="panel-right-layer-mainname-badge"
                        class="text-[11px] text-ui-accent border border-ui-accent px-1 rounded"
                    >
                        {{ vm.layerMainName }}
                    </span>
                </div>
                <i
                    :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']"
                    class="text-text-sub text-[11px]"
                ></i>
            </div>

            <!-- 본문: 매트릭스 / 템플릿 저장 -->
            <div v-if="!isCollapsed" id="panel-right-layer-body" class="p-2">
                <!-- 컬럼 헤더 행 -->
                <div
                    id="panel-right-layer-matrix-container"
                    class="overflow-x-auto pb-1"
                >
                    <div class="flex gap-px mb-px min-w-max">
                        <div class="w-14 shrink-0"></div>
                        <div
                            v-for="(col, i) in vm.layerCols"
                            :key="col.id"
                            :id="'panel-right-layer-col-' + col.id"
                            class="w-14 text-center py-px rounded text-[11px] font-bold text-white cursor-context-menu hover:brightness-110 relative group"
                            :style="{ backgroundColor: col.color }"
                            @contextmenu.prevent="openColContextMenu($event, col.id, i)"
                        >
                            <input
                                :id="'panel-right-layer-col-name-' + col.id"
                                type="text"
                                :value="col.name"
                                @input="updateColName(col.id, $event.target.value)"
                                class="bg-transparent text-center w-full outline-none text-[11px] font-bold"
                                @click.stop
                            />
                            <div
                                class="absolute top-0 right-0 text-[9px] opacity-0 group-hover:opacity-100 p-0.5 bg-black/50 rounded"
                            >
                                Z:{{ getZIndexForCell(i, 'TXT') }}
                            </div>
                        </div>
                    </div>

                    <!-- 행(EFF / TXT / BG) + 셀 -->
                    <div
                        v-for="row in rows"
                        :key="row.type"
                        :id="'panel-right-layer-row-' + row.type"
                        class="flex gap-px mb-px min-w-max"
                    >
                        <div
                            :id="'panel-right-layer-rowlabel-' + row.type"
                            class="w-14 shrink-0 text-[11px] flex items-center justify-end pr-1 font-bold"
                            :style="{ color: row.color }"
                        >
                            {{ row.label }}
                        </div>
                        <div
                            v-for="(col, i) in vm.layerCols"
                            :key="col.id + row.type"
                            :id="'panel-right-layer-cell-' + col.id + '-' + row.type"
                            :class="getCellClass(i, row.type)"
                            class="w-14 h-6 border rounded flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all relative"
                            :style="cellStyle(i, row.type, col.color)"
                            @click="handleCellClick(i, row.type, col.color)"
                            @contextmenu.prevent="openCellContextMenu($event, i, row.type, col)"
                            data-action="js:layerCellAction"
                        >
                            <!-- 숨김 상태 아이콘 -->
                            <i 
                                v-if="isCellHidden(i, row.type)" 
                                class="fa-solid fa-eye-slash text-[9px] absolute top-0 left-0 text-text-sub"
                            ></i>
                            <span
                                class="text-[11px] font-bold text-white drop-shadow-md"
                                style="text-shadow: 0 0 3px black"
                            >
                                {{ getZIndexForCell(i, row.type) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 하단: 레이어관리 버튼(좌측) + 초기화/저장 버튼(우측) -->
                <div class="mt-2 flex justify-between items-center">
                    <button
                        id="panel-right-layer-template-manage-btn"
                        class="text-[11px] bg-ui-border text-text-sub hover:bg-ui-selected hover:text-white px-3 py-1 rounded transition-colors"
                        @click="openLayerTemplateModal"
                        data-action="js:openLayerTemplateModal"
                        title="저장된 레이어 템플릿 관리"
                    >
                        레이어관리
                    </button>
                    <div class="flex gap-2">
                        <button
                            id="panel-right-layer-reset-btn"
                            class="text-[11px] bg-ui-border text-text-sub hover:bg-ui-danger hover:text-white px-3 py-1 rounded transition-colors"
                            @click="resetAllLayers"
                            data-action="js:layerResetAll"
                            title="캔버스의 모든 레이어를 삭제합니다"
                        >
                            초기화
                        </button>
                        <button
                            id="panel-right-layer-save-template-btn"
                            class="text-[11px] bg-ui-accent text-white px-3 py-1 rounded hover:bg-blue-600"
                            @click="saveLayerTemplate"
                            data-action="js:layerSaveTemplate"
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>

            <!-- 컬럼 색상 선택 컨텍스트 메뉴 -->
            <div
                v-if="colContextMenu"
                id="panel-right-layer-color-menu"
                class="context-menu"
                :style="{top: colContextMenu.y + 'px', left: colContextMenu.x + 'px'}"
                @click.stop
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

            <!-- 셀 우클릭 컨텍스트 메뉴 (눈 표시, 삭제) -->
            <div
                v-if="cellContextMenu"
                id="panel-right-layer-cell-menu"
                class="context-menu"
                :style="{top: cellContextMenu.y + 'px', left: cellContextMenu.x + 'px'}"
                @click.stop
            >
                <div 
                    class="ctx-item"
                    @click="toggleCellVisibility"
                >
                    <span class="text-[11px]">{{ cellContextMenu.isHidden ? '표시' : '숨김' }}</span>
                    <i :class="cellContextMenu.isHidden ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                </div>
                <div 
                    class="ctx-item text-red-400 hover:!bg-ui-danger"
                    @click="deleteCellLayer"
                >
                    <span class="text-[11px]">삭제</span>
                    <i class="fa-solid fa-trash"></i>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            isCollapsed: false,
            colContextMenu: null,
            cellContextMenu: null,
            rows: [
                { type: 'EFF', label: 'Effect', color: '#ef4444', zOffset: 80 },
                { type: 'TXT', label: 'Text', color: '#eab308', zOffset: 40 },
                { type: 'BG',  label: 'BG', color: '#3b82f6', zOffset: 20 }
            ],
            COLORS: COLORS
        };
    },
    mounted() {
        document.addEventListener('click', this.closeAllMenus);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.closeAllMenus);
    },
    methods: {
        closeAllMenus() {
            this.colContextMenu = null;
            this.cellContextMenu = null;
        },

        getColRole(colIdx) {
            const roles = ['full', 'high', 'mid', 'low'];
            return roles[colIdx] || `col${colIdx}`;
        },
        getRowName(rowType) {
            if (rowType === 'EFF') return 'effect';
            if (rowType === 'TXT') return 'text';
            if (rowType === 'BG')  return 'bg';
            return (rowType || '').toLowerCase();
        },
        getSlotKey(colIdx, rowType) {
            return `${this.getColRole(colIdx)}_${this.getRowName(rowType)}`;
        },
        cellSlotKey(colIdx, rowType) {
            return this.getSlotKey(colIdx, rowType);
        },

        findBoxByCell(colIdx, rowType) {
            const slotKey = this.cellSlotKey(colIdx, rowType);
            return this.vm.canvasBoxes.find(b => b.slotKey === slotKey) || null;
        },

        isActive(colIdx, rowType) {
            return !!this.findBoxByCell(colIdx, rowType);
        },

        isCellHidden(colIdx, rowType) {
            const box = this.findBoxByCell(colIdx, rowType);
            return box ? box.isHidden : false;
        },

        getCellClass(colIdx, rowType) {
            const active = this.isActive(colIdx, rowType);
            const hidden = this.isCellHidden(colIdx, rowType);
            return {
                'opacity-100': active && !hidden,
                'opacity-60': active && hidden,
                'opacity-40 grayscale': !active
            };
        },

        cellStyle(colIdx, rowType, colColor) {
            const active = this.isActive(colIdx, rowType);
            return {
                backgroundColor: active ? '#4b5563' : '#27272a',
                borderColor: active ? colColor : '#27272a'
            };
        },

        getZIndexForCell(colIdx, rowType) {
            const row = this.rows.find(r => r.type === rowType);
            const offset = row ? row.zOffset : 0;
            const base = (colIdx * 100) + 100;
            return base + offset;
        },

        handleCellClick(colIdx, rowType, color) {
            if (this.$parent && typeof this.$parent.addLayerBox === 'function') {
                this.$parent.addLayerBox(colIdx, rowType, color);
            }
        },

        openCellContextMenu(e, colIdx, rowType, col) {
            const box = this.findBoxByCell(colIdx, rowType);
            if (!box) {
                this.cellContextMenu = null;
                return;
            }

            this.colContextMenu = null;
            this.cellContextMenu = {
                x: e.clientX,
                y: e.clientY,
                colIdx,
                rowType,
                col,
                boxId: box.id,
                isHidden: box.isHidden || false
            };
        },

        toggleCellVisibility() {
            if (!this.cellContextMenu) return;
            
            const { boxId } = this.cellContextMenu;
            const boxIndex = this.vm.canvasBoxes.findIndex(b => b.id === boxId);
            
            if (boxIndex !== -1) {
                const box = this.vm.canvasBoxes[boxIndex];
                const newBoxes = [...this.vm.canvasBoxes];
                newBoxes[boxIndex] = { ...box, isHidden: !box.isHidden };
                this.vm.canvasBoxes = newBoxes;
            }
            
            this.cellContextMenu = null;
        },

        deleteCellLayer() {
            if (!this.cellContextMenu) return;
            
            const { boxId } = this.cellContextMenu;
            this.vm.canvasBoxes = this.vm.canvasBoxes.filter(b => b.id !== boxId);
            
            if (this.vm.selectedBoxId === boxId) {
                this.vm.selectedBoxId = null;
            }
            
            this.cellContextMenu = null;
        },

        updateColName(id, name) {
            const col = this.vm.layerCols.find(c => c.id === id);
            if (col) col.name = name;
            this.vm.canvasBoxes = this.vm.canvasBoxes.map(box =>
                box.colId === id ? { ...box, layerName: name } : box
            );
        },

        openColContextMenu(e, id, index) {
            this.cellContextMenu = null;
            this.colContextMenu = { x: e.clientX, y: e.clientY, colId: id, colIndex: index };
        },

        handleColColor(color) {
            const colId = this.colContextMenu.colId;
            this.vm.layerCols = this.vm.layerCols.map(col =>
                col.id === colId ? { ...col, color: color } : col
            );
            this.vm.canvasBoxes = this.vm.canvasBoxes.map(box =>
                box.colId === colId ? { ...box, color: color } : box
            );
            this.colContextMenu = null;
        },

        async resetAllLayers() {
            if (this.vm.canvasBoxes.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: '삭제할 레이어가 없습니다',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }

            const result = await Swal.fire({
                title: '레이어 초기화',
                text: `캔버스의 모든 레이어(${this.vm.canvasBoxes.length}개)를 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '초기화',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#3b82f6'
            });

            if (result.isConfirmed) {
                this.vm.canvasBoxes = [];
                this.vm.selectedBoxId = null;

                Swal.fire({
                    icon: 'success',
                    title: '초기화 완료',
                    text: '모든 레이어가 삭제되었습니다',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        },

        buildLayerMatrixSnapshot(name) {
            const columns = this.vm.layerCols.map((col, colIdx) => {
                const colRole = this.getColRole(colIdx);
                const slots = this.rows.map(row => {
                    const slotKey = this.getSlotKey(colIdx, row.type);
                    const box = this.vm.canvasBoxes.find(b => b.slotKey === slotKey);
                    const used = !!box;
                    const zIndex = this.getZIndexForCell(colIdx, row.type);
                    
                    let boxData = null;
                    if (box) {
                        boxData = { ...box };
                    }
                    
                    return {
                        rowType: row.type,
                        rowLabel: row.label,
                        slotKey,
                        used,
                        isHidden: box ? box.isHidden : false,
                        zIndex,
                        boxData
                    };
                });
                return {
                    id: col.id,
                    name: col.name,
                    color: col.color,
                    colRole,
                    slots
                };
            });

            return {
                templateName: name,
                savedAt: new Date().toISOString(),
                columns,
                canvasBoxes: this.vm.canvasBoxes.map(b => ({ ...b }))
            };
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
                const snapshot = this.buildLayerMatrixSnapshot(name);
                const json = JSON.stringify(snapshot, null, 2);

                this.vm.saveLayerTemplate(name, json);

                const btn = document.getElementById('panel-right-layer-save-template-btn');
                if (btn) {
                    btn.setAttribute('data-dev', json);
                }

                Swal.fire({
                    icon: 'success',
                    title: '저장됨',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6'
                });
            }
        },

        openLayerTemplateModal() {
            if (this.$parent && typeof this.$parent.openLayerTemplateModal === 'function') {
                this.$parent.openLayerTemplateModal();
            }
        }
    }
};
