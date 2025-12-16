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
                    <span class="text-sm font-bold text-text-main flex items-center gap-2">
                        <i class="fa-solid fa-layer-group"></i> 레이어 관리
                    </span>
                    <span
                        v-if="vm.layerMainName"
                        id="panel-right-layer-mainname-badge"
                        class="text-xs text-ui-accent border border-ui-accent px-1 rounded"
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
            <div v-if="!isCollapsed" id="panel-right-layer-body" class="p-2">
                <div class="flex justify-between items-center mb-1">
                    <span
                        id="panel-right-layer-matrix-label"
                        class="text-sm text-text-sub"
                    >
                        매트릭스 (우클릭: 색상)
                    </span>
                    <button
                        id="panel-right-layer-addcol-btn"
                        class="text-sm hover:text-white bg-ui-selected px-2 rounded"
                        @click.stop="addColumn"
                        data-action="js:layerAddColumn"
                    >
                        + 컬럼
                    </button>
                </div>

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
                            class="w-14 text-center py-px rounded text-sm font-bold text-white cursor-context-menu hover:brightness-110 relative group"
                            :style="{ backgroundColor: col.color }"
                            @contextmenu.prevent="openContextMenu($event, col.id, i)"
                        >
                            <input
                                :id="'panel-right-layer-col-name-' + col.id"
                                type="text"
                                :value="col.name"
                                @input="updateColName(col.id, $event.target.value)"
                                class="bg-transparent text-center w-full outline-none text-sm font-bold"
                                @click.stop
                            />
                            <div
                                class="absolute top-0 right-0 text-[8px] opacity-0 group-hover:opacity-100 p-0.5 bg-black/50 rounded"
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
                            class="w-14 shrink-0 text-sm flex items-center justify-end pr-1 font-bold"
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
                            class="w-14 h-6 border rounded flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all"
                            :style="cellStyle(i, row.type, col.color)"
                            @click="handleCellClick(i, row.type, col.color)"
                            data-action="js:layerAddBox"
                        >
                            <span
                                class="text-sm font-bold text-white drop-shadow-md"
                                style="text-shadow: 0 0 3px black"
                            >
                                {{ getZIndexForCell(i, row.type) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 초기화 + 저장 버튼 -->
                <div class="mt-2 flex justify-end gap-2">
                    <button
                        id="panel-right-layer-reset-btn"
                        class="text-sm bg-ui-border text-text-sub hover:bg-ui-danger hover:text-white px-3 py-1 rounded transition-colors"
                        @click="resetAllLayers"
                        data-action="js:layerResetAll"
                        title="캔버스의 모든 레이어를 삭제합니다"
                    >
                        초기화
                    </button>
                    <button
                        id="panel-right-layer-save-template-btn"
                        class="text-sm bg-ui-accent text-white px-3 py-1 rounded hover:bg-blue-600"
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
            // 12셀 구성: 전체(full) / 상단(high) / 중단(mid) / 하단(low) × EFF/TXT/BG
            // 행 라벨 한글화: Effect→효과, Text→텍스트, BG→배경
            rows: [
                { type: 'EFF', label: '효과', color: '#ef4444', zOffset: 80 },
                { type: 'TXT', label: '텍스트', color: '#eab308', zOffset: 40 },
                { type: 'BG',  label: '배경', color: '#3b82f6', zOffset: 20 }
            ],
            COLORS: COLORS
        };
    },
    methods: {
        // colIdx + rowType 에 대한 slotKey 생성 (full_text, mid_bg, high_effect ...)
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
        isActive(colIdx, rowType) {
            const slotKey = this.cellSlotKey(colIdx, rowType);
            return this.vm.canvasBoxes.some(b => b.slotKey === slotKey);
        },
        cellStyle(colIdx, rowType, colColor) {
            const active = this.isActive(colIdx, rowType);
            return {
                // 사용중인 셀 → 배경 회색
                backgroundColor: active ? '#4b5563' : '#27272a',
                borderColor: active ? colColor : '#27272a'
            };
        },
        // 12셀 숫자(z-index) 계산 로직 (캔바스 내에서만 적용)
        getZIndexForCell(colIdx, rowType) {
            const row = this.rows.find(r => r.type === rowType);
            const offset = row ? row.zOffset : 0;
            const base = (colIdx * 100) + 100;
            return base + offset;
        },
        handleCellClick(colIdx, rowType, color) {
            // 상위(AppRoot)의 addLayerBox 사용
            if (this.$parent && typeof this.$parent.addLayerBox === 'function') {
                this.$parent.addLayerBox(colIdx, rowType, color);
            }
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

        /**
         * 초기화: 캔버스의 모든 레이어(박스)를 삭제
         * - ID: panel-right-layer-reset-btn
         * - data-action: js:layerResetAll
         * - 기능: vm.canvasBoxes 배열을 빈 배열로 초기화
         * - 확인 다이얼로그 표시 후 실행
         */
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
                // 모든 레이어 삭제
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

        // 레이어 매트릭스 JSON 스냅샷 생성
        buildLayerMatrixSnapshot(name) {
            const columns = this.vm.layerCols.map((col, colIdx) => {
                const colRole = this.getColRole(colIdx);
                const slots = this.rows.map(row => {
                    const slotKey = this.getSlotKey(colIdx, row.type);
                    const used = this.vm.canvasBoxes.some(b => b.slotKey === slotKey);
                    const zIndex = this.getZIndexForCell(colIdx, row.type);
                    return {
                        rowType: row.type,
                        rowLabel: row.label,
                        slotKey,
                        used,
                        zIndex
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
                columns
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
                // JSON 스냅샷 생성
                const snapshot = this.buildLayerMatrixSnapshot(name);
                const json = JSON.stringify(snapshot, null, 2);

                // AppRoot 에 템플릿 저장 (JSON 포함)
                this.vm.saveLayerTemplate(name, json);

                // 저장 버튼에 dev 데이터 기록
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
        }
    }
};
