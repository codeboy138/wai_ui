// Layer Panel Component (Matrix UI 구현)
// 레이블 스타일: 미디어 자산 섹션 기준 통일
// Z-Index: 전체 100, 상단 200, 중단 300, 하단 400
// 컬럼 호버 시 레이블 ↔ Z-Index 교체 표시
// 셀 클릭 기능 복구 버전
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
                class="flex items-center justify-between p-2 cursor-pointer hover:bg-bg-hover"
                @click="isCollapsed = !isCollapsed"
                data-action="js:toggleLayerPanelCollapse"
            >
                <div class="flex items-center gap-2">
                    <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'" class="text-xs w-3 text-text-sub"></i>
                    <i class="fa-solid fa-layer-group text-ui-accent"></i>
                    <span class="text-xs font-medium">레이어 관리</span>
                    <span
                        v-if="vm.layerMainName"
                        id="panel-right-layer-mainname-badge"
                        class="text-xxs text-text-sub"
                    >
                        ({{ vm.layerMainName }})
                    </span>
                </div>
            </div>

            <!-- 본문: 매트릭스 / 템플릿 저장 -->
            <div v-if="!isCollapsed" id="panel-right-layer-body" class="px-2 pb-2">
                <!-- 컬럼 헤더 행 -->
                <div
                    id="panel-right-layer-matrix-container"
                    class="overflow-x-auto"
                >
                    <div class="flex gap-px mb-px min-w-max">
                        <div class="w-12 shrink-0"></div>
                        <div
                            v-for="(col, i) in vm.layerCols"
                            :key="col.id"
                            :id="'panel-right-layer-col-' + col.id"
                            class="w-12 h-5 text-center rounded text-xxs font-bold text-white cursor-context-menu hover:brightness-110 relative flex items-center justify-center"
                            :style="{ backgroundColor: col.color }"
                            @contextmenu.prevent="openColContextMenu($event, col.id, i)"
                            @mouseenter="hoverColIndex = i"
                            @mouseleave="hoverColIndex = null"
                        >
                            <!-- 기본: 컬럼 레이블 / 호버: Z-Index -->
                            <span v-if="hoverColIndex !== i" class="truncate px-0.5">{{ col.name }}</span>
                            <span v-else class="font-mono">{{ getColZIndex(i) }}</span>
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
                            class="w-12 shrink-0 text-xxs flex items-center justify-end pr-1 font-bold h-5"
                            :style="{ color: row.color }"
                        >
                            {{ row.label }}
                        </div>
                        <div
                            v-for="(col, i) in vm.layerCols"
                            :key="col.id + row.type"
                            :id="'panel-right-layer-cell-' + col.id + '-' + row.type"
                            :class="getCellClass(i, row.type)"
                            class="w-12 h-5 border rounded flex items-center justify-center cursor-pointer hover:border-white transition-all relative"
                            :style="cellStyle(i, row.type, col.color)"
                            @click.stop="handleCellClick(i, row.type, col)"
                            @contextmenu.prevent="openCellContextMenu($event, i, row.type, col)"
                            data-action="js:layerCellAction"
                        >
                            <!-- 숨김 상태 아이콘 -->
                            <i 
                                v-if="isCellHidden(i, row.type)" 
                                class="fa-solid fa-eye-slash text-[8px] absolute top-0 left-0 text-text-sub"
                            ></i>
                            <span
                                class="text-xxs font-bold text-white drop-shadow-md"
                                style="text-shadow: 0 0 2px black"
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
                        class="text-xxs bg-ui-border text-text-sub hover:bg-ui-selected hover:text-white px-2 py-0.5 rounded transition-colors"
                        @click="openLayerTemplateModal"
                        data-action="js:openLayerTemplateModal"
                        title="저장된 레이어 템플릿 관리"
                    >
                        레이어관리
                    </button>
                    <div class="flex gap-1">
                        <button
                            id="panel-right-layer-reset-btn"
                            class="text-xxs bg-ui-border text-text-sub hover:bg-ui-danger hover:text-white px-2 py-0.5 rounded transition-colors"
                            @click="resetAllLayers"
                            data-action="js:layerResetAll"
                            title="캔버스의 모든 레이어를 삭제합니다"
                        >
                            초기화
                        </button>
                        <button
                            id="panel-right-layer-save-template-btn"
                            class="text-xxs bg-ui-accent text-white px-2 py-0.5 rounded hover:bg-blue-600"
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
                    <span class="text-xxs">{{ cellContextMenu.isHidden ? '표시' : '숨김' }}</span>
                    <i :class="cellContextMenu.isHidden ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                </div>
                <div 
                    class="ctx-item text-red-400 hover:!bg-ui-danger"
                    @click="deleteCellLayer"
                >
                    <span class="text-xxs">삭제</span>
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
            hoverColIndex: null,
            rows: [
                { type: 'EFF', label: 'Effect', color: '#ef4444', zOffset: 80 },
                { type: 'TXT', label: 'Text', color: '#eab308', zOffset: 40 },
                { type: 'BG',  label: 'BG', color: '#3b82f6', zOffset: 20 }
            ],
            // 컬럼별 기본 Z-Index: 전체 100, 상단 200, 중단 300, 하단 400
            colZIndexBase: [100, 200, 300, 400],
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

        // 컬럼 Z-Index 반환 (호버 시 표시용)
        getColZIndex(colIdx) {
            return this.colZIndexBase[colIdx] || (colIdx + 1) * 100;
        },

        getColRole(colIdx) {
            const roles = ['full', 'high', 'mid', 'low'];
            return roles[colIdx] || 'col' + colIdx;
        },
        
        getRowName(rowType) {
            if (rowType === 'EFF') return 'effect';
            if (rowType === 'TXT') return 'text';
            if (rowType === 'BG')  return 'bg';
            return (rowType || '').toLowerCase();
        },
        
        getSlotKey(colIdx, rowType) {
            return this.getColRole(colIdx) + '_' + this.getRowName(rowType);
        },
        
        cellSlotKey(colIdx, rowType) {
            return this.getSlotKey(colIdx, rowType);
        },

        findBoxByCell(colIdx, rowType) {
            const slotKey = this.cellSlotKey(colIdx, rowType);
            return this.vm.canvasBoxes.find(function(b) { return b.slotKey === slotKey; }) || null;
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

        // Z-Index 계산: 컬럼 기본값 + 행 오프셋
        getZIndexForCell(colIdx, rowType) {
            const row = this.rows.find(function(r) { return r.type === rowType; });
            const offset = row ? row.zOffset : 0;
            const base = this.colZIndexBase[colIdx] || (colIdx + 1) * 100;
            return base + offset;
        },

        // 셀 클릭 핸들러 - 레이어 박스 추가/토글
        handleCellClick(colIdx, rowType, col) {
            const existingBox = this.findBoxByCell(colIdx, rowType);
            
            if (existingBox) {
                // 이미 존재하면 선택하거나 설정 모달 열기
                if (this.vm && typeof this.vm.setSelectedBoxId === 'function') {
                    this.vm.setSelectedBoxId(existingBox.id);
                }
                if (this.vm && typeof this.vm.openLayerConfig === 'function') {
                    this.vm.openLayerConfig(existingBox.id);
                }
            } else {
                // 새 레이어 박스 생성
                this.addLayerBoxDirect(colIdx, rowType, col);
            }
        },

        // 직접 레이어 박스 추가 (app-root.js의 addLayerBox 대신 사용)
        addLayerBoxDirect(colIdx, rowType, col) {
            const zIndex = this.getZIndexForCell(colIdx, rowType);
            const slotKey = this.getSlotKey(colIdx, rowType);
            const colRole = this.getColRole(colIdx);
            
            // 캔버스 크기 가져오기
            const canvasW = (this.vm && this.vm.canvasSize) ? this.vm.canvasSize.w : 1920;
            const canvasH = (this.vm && this.vm.canvasSize) ? this.vm.canvasSize.h : 1080;
            
            // 컬럼 역할에 따른 영역 계산
            let x = 0, y = 0, w = canvasW, h = canvasH;
            const third = canvasH / 3;
            
            if (colRole === 'high') {
                y = 0;
                h = third;
            } else if (colRole === 'mid') {
                y = third;
                h = third;
            } else if (colRole === 'low') {
                y = third * 2;
                h = third;
            }
            // 'full'은 전체 영역 그대로 사용
            
            const newBox = {
                id: 'box_' + slotKey + '_' + Date.now(),
                slotKey: slotKey,
                colIdx: colIdx,
                colId: col.id,
                colRole: colRole,
                rowType: rowType,
                type: rowType,
                zIndex: zIndex,
                color: col.color,
                layerBgColor: 'transparent',
                x: x,
                y: y,
                w: w,
                h: h,
                nx: x / canvasW,
                ny: y / canvasH,
                nw: w / canvasW,
                nh: h / canvasH,
                isHidden: false,
                layerName: col.name + ' ' + this.getRowLabel(rowType),
                textContent: '',
                textStyle: {
                    fontSize: 48,
                    fillColor: '#ffffff',
                    strokeColor: '#000000',
                    strokeWidth: 0,
                    textAlign: 'center',
                    vAlign: 'middle',
                    backgroundColor: 'transparent',
                    letterSpacing: 0,
                    lineHeight: 1.4,
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        blur: 4,
                        color: '#000000'
                    }
                },
                mediaType: 'none',
                mediaSrc: '',
                mediaFit: 'cover'
            };
            
            // vm.canvasBoxes에 직접 추가
            if (this.vm && this.vm.canvasBoxes) {
                this.vm.canvasBoxes.push(newBox);
                
                // 선택 상태로 설정
                if (typeof this.vm.setSelectedBoxId === 'function') {
                    this.vm.setSelectedBoxId(newBox.id);
                }
            }
        },

        getRowLabel(rowType) {
            if (rowType === 'EFF') return '이펙트';
            if (rowType === 'TXT') return '텍스트';
            if (rowType === 'BG') return '배경';
            return rowType;
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
                colIdx: colIdx,
                rowType: rowType,
                col: col,
                boxId: box.id,
                isHidden: box.isHidden || false
            };
        },

        toggleCellVisibility() {
            if (!this.cellContextMenu) return;
            
            var boxId = this.cellContextMenu.boxId;
            var boxIndex = -1;
            for (var i = 0; i < this.vm.canvasBoxes.length; i++) {
                if (this.vm.canvasBoxes[i].id === boxId) {
                    boxIndex = i;
                    break;
                }
            }
            
            if (boxIndex !== -1) {
                var box = this.vm.canvasBoxes[boxIndex];
                var newBoxes = this.vm.canvasBoxes.slice();
                newBoxes[boxIndex] = Object.assign({}, box, { isHidden: !box.isHidden });
                this.vm.canvasBoxes = newBoxes;
            }
            
            this.cellContextMenu = null;
        },

        deleteCellLayer() {
            if (!this.cellContextMenu) return;
            
            var boxId = this.cellContextMenu.boxId;
            this.vm.canvasBoxes = this.vm.canvasBoxes.filter(function(b) { return b.id !== boxId; });
            
            if (this.vm.selectedBoxId === boxId) {
                this.vm.selectedBoxId = null;
            }
            
            this.cellContextMenu = null;
        },

        updateColName(id, name) {
            var col = null;
            for (var i = 0; i < this.vm.layerCols.length; i++) {
                if (this.vm.layerCols[i].id === id) {
                    col = this.vm.layerCols[i];
                    break;
                }
            }
            if (col) col.name = name;
            
            this.vm.canvasBoxes = this.vm.canvasBoxes.map(function(box) {
                if (box.colId === id) {
                    return Object.assign({}, box, { layerName: name });
                }
                return box;
            });
        },

        openColContextMenu(e, id, index) {
            this.cellContextMenu = null;
            this.colContextMenu = { x: e.clientX, y: e.clientY, colId: id, colIndex: index };
        },

        handleColColor(color) {
            var colId = this.colContextMenu.colId;
            this.vm.layerCols = this.vm.layerCols.map(function(col) {
                if (col.id === colId) {
                    return Object.assign({}, col, { color: color });
                }
                return col;
            });
            this.vm.canvasBoxes = this.vm.canvasBoxes.map(function(box) {
                if (box.colId === colId) {
                    return Object.assign({}, box, { color: color });
                }
                return box;
            });
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

            var result = await Swal.fire({
                title: '레이어 초기화',
                text: '캔버스의 모든 레이어(' + this.vm.canvasBoxes.length + '개)를 삭제하시겠습니까?',
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
            var self = this;
            var columns = this.vm.layerCols.map(function(col, colIdx) {
                var colRole = self.getColRole(colIdx);
                var slots = self.rows.map(function(row) {
                    var slotKey = self.getSlotKey(colIdx, row.type);
                    var box = self.vm.canvasBoxes.find(function(b) { return b.slotKey === slotKey; });
                    var used = !!box;
                    var zIndex = self.getZIndexForCell(colIdx, row.type);
                    
                    var boxData = null;
                    if (box) {
                        boxData = Object.assign({}, box);
                    }
                    
                    return {
                        rowType: row.type,
                        rowLabel: row.label,
                        slotKey: slotKey,
                        used: used,
                        isHidden: box ? box.isHidden : false,
                        zIndex: zIndex,
                        boxData: boxData
                    };
                });
                return {
                    id: col.id,
                    name: col.name,
                    color: col.color,
                    colRole: colRole,
                    slots: slots
                };
            });

            return {
                templateName: name,
                savedAt: new Date().toISOString(),
                columns: columns,
                canvasBoxes: this.vm.canvasBoxes.map(function(b) { return Object.assign({}, b); })
            };
        },

        async saveLayerTemplate() {
            var self = this;
            var result = await Swal.fire({ 
                title: '레이어 템플릿 저장', 
                input: 'text', 
                inputLabel: '메인 레이어 이름', 
                inputPlaceholder: '예: News_Layout', 
                showCancelButton: true, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6' 
            });
            
            var name = result.value;
            if (name) {
                var snapshot = this.buildLayerMatrixSnapshot(name);
                var json = JSON.stringify(snapshot, null, 2);

                this.vm.saveLayerTemplate(name, json);

                var btn = document.getElementById('panel-right-layer-save-template-btn');
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

window.LayerPanel = LayerPanel;
