/**
 * ==========================================
 * LayerPanel.js - 레이어 매트릭스 패널
 * 
 * 역할: 우측 패널의 레이어 관리 UI (4x3 매트릭스)
 * 경로: frontend/js/components/LayerPanel.js
 * 
 * DATA-DEV:
 * 요소의 역할: 레이어 매트릭스 및 관리 컴포넌트
 * 요소의 고유ID: component-layer-panel
 * 요소의 기능 목적 정의: 4x3 레이어 매트릭스 UI, 컬럼 추가, 색상 변경, 템플릿 저장
 * 요소의 동작 로직 설명: 셀 클릭 시 캔버스에 박스 추가, 우클릭으로 컬럼 색상 변경, 저장 버튼으로 템플릿 저장
 * 요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: store.addLayerBox(), store.saveLayerTemplate()
 * 요소의 경로정보: frontend/js/components/LayerPanel.js
 * 요소의 수행해야 할 백엔드/JS 명령: JS: addColumn(), updateColName(), openContextMenu(), saveLayerTemplate()
 * ==========================================
 */

export default {
    name: 'LayerPanel',
    
    props: ['vm'],
    
    data() {
        return {
            isCollapsed: false,
            contextMenu: null,
            rows: [
                { type: 'EFF', label: 'Effect', color: '#ef4444', offset: 80 },
                { type: 'TXT', label: 'Text', color: '#eab308', offset: 40 },
                { type: 'BG', label: 'BG', color: '#3b82f6', offset: 20 }
            ],
            COLORS: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#ffffff', '#9ca3af', '#4b5563', '#000000']
        };
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
                Swal.fire({ icon: 'success', title: '저장됨', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' });
            }
        }
    },
    
    template: `
        <div class="border-b border-ui-border bg-bg-panel select-none" 
             data-dev="요소의 역할: 레이어 매트릭스 패널
요소의 고유ID: layer-panel-root
요소의 기능 목적 정의: 레이어 매트릭스 UI 및 관리 기능 제공
요소의 동작 로직 설명: 셀 클릭으로 박스 추가, 우클릭으로 색상 변경, 저장 버튼으로 템플릿 저장
요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: store.addLayerBox(), store.saveLayerTemplate()
요소의 경로정보: frontend/js/components/LayerPanel.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: addColumn(), saveLayerTemplate()">
            <div class="h-8 bg-bg-hover flex items-center justify-between px-3 cursor-pointer border-b border-ui-border" 
                 @click="isCollapsed = !isCollapsed" 
                 data-dev="요소의 역할: 레이어 패널 헤더
요소의 고유ID: layer-panel-header
요소의 기능 목적 정의: 패널 접기/펼치기 토글
요소의 동작 로직 설명: 클릭 시 isCollapsed 상태 토글
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isCollapsed 상태 변경
요소의 경로정보: frontend/js/components/LayerPanel.js#header
요소의 수행해야 할 백엔드/JS 명령: JS: isCollapsed = !isCollapsed">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-text-main flex items-center gap-2">
                        <i class="fa-solid fa-layer-group"></i> 레이어 관리
                    </span>
                    <span v-if="vm.layerMainName" class="text-[10px] text-ui-accent border border-ui-accent px-1 rounded">
                        {{ vm.layerMainName }}
                    </span>
                </div>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']" class="text-text-sub text-xs"></i>
            </div>
            
            <div v-if="!isCollapsed" class="p-3">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] text-text-sub">매트릭스 (우클릭: 색상)</span>
                    <button class="text-[10px] hover:text-white bg-ui-selected px-2 rounded" 
                            @click="addColumn"
                            data-dev="요소의 역할: 컬럼 추가 버튼
요소의 고유ID: btn-add-column
요소의 기능 목적 정의: 새로운 레이어 컬럼 추가
요소의 동작 로직 설명: 클릭 시 addColumn() 호출하여 layerCols에 새 컬럼 추가
요소의 입출력 데이터 구조: 입력: 클릭. 출력: layerCols 배열에 새 항목 추가
요소의 경로정보: frontend/js/components/LayerPanel.js#btn-add-column
요소의 수행해야 할 백엔드/JS 명령: JS: addColumn()">
                        + 컬럼
                    </button>
                </div>
                
                <div class="overflow-x-auto pb-2">
                    <div class="flex gap-1 mb-1 min-w-max">
                        <div class="w-10 shrink-0"></div>
                        <div v-for="(col, i) in vm.layerCols" 
                             :key="col.id" 
                             class="w-[50px] text-center py-1 rounded text-[10px] font-bold text-white cursor-context-menu hover:brightness-110 relative group" 
                             :style="{ backgroundColor: col.color }" 
                             @contextmenu.prevent="openContextMenu($event, col.id, i)"
                             :data-dev="'요소의 역할: 레이어 컬럼 헤더\\n요소의 고유ID: layer-col-' + col.id + '\\n요소의 기능 목적 정의: 컬럼 이름 편집 및 색상 변경\\n요소의 동작 로직 설명: 텍스트 클릭으로 이름 편집, 우클릭으로 색상 변경\\n요소의 입출력 데이터 구조: 입력: 텍스트, 우클릭. 출력: col.name, col.color 변경\\n요소의 경로정보: frontend/js/components/LayerPanel.js#layer-col\\n요소의 수행해야 할 백엔드/JS 명령: JS: updateColName(), openContextMenu()'">
                            <input type="text" 
                                   :value="col.name" 
                                   @input="updateColName(col.id, $event.target.value)" 
                                   class="bg-transparent text-center w-full outline-none" 
                                   @click.stop />
                            <div class="absolute top-0 right-0 text-[8px] opacity-0 group-hover:opacity-100 p-0.5 bg-black/50 rounded">
                                Z:{{ getZIndex(i, 'VID') }}
                            </div>
                        </div>
                    </div>
                    
                    <div v-for="row in rows" :key="row.type" class="flex gap-1 mb-1 min-w-max">
                        <div class="w-10 shrink-0 text-[9px] flex items-center justify-end pr-2 font-bold" :style="{ color: row.color }">
                            {{ row.label }}
                        </div>
                        <div v-for="(col, i) in vm.layerCols" 
                             :key="col.id + row.type"
                             :class="{ 'opacity-100 ring-1 ring-white': isActive(i, row.type), 'opacity-30 grayscale': !isActive(i, row.type) }"
                             class="w-[50px] h-6 border border-ui-border rounded flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all" 
                             :style="{ backgroundColor: '#27272a' }" 
                             @click="vm.addLayerBox(i, row.type, col.color)" 
                             :data-dev="'요소의 역할: 레이어 매트릭스 셀\\n요소의 고유ID: cell-' + i + '-' + row.type + '\\n요소의 기능 목적 정의: 클릭 시 해당 레이어에 박스 생성\\n요소의 동작 로직 설명: 클릭 시 vm.addLayerBox() 호출하여 캔버스에 박스 추가\\n요소의 입출력 데이터 구조: 입력: 클릭. 출력: canvasBoxes 배열에 새 박스 추가\\n요소의 경로정보: frontend/js/components/LayerPanel.js#cell\\n요소의 수행해야 할 백엔드/JS 명령: JS: vm.addLayerBox(colIdx, type, color)'">
                            <span class="text-[10px] font-bold text-white drop-shadow-md" style="text-shadow: 0 0 3px black">
                                {{ getZIndex(i, row.type) }}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="mt-2 flex justify-end">
                    <button class="text-xs bg-ui-accent text-white px-3 py-1 rounded hover:bg-blue-600" 
                            @click="saveLayerTemplate"
                            data-dev="요소의 역할: 레이어 템플릿 저장 버튼
요소의 고유ID: btn-save-layer-template
요소의 기능 목적 정의: 현재 레이어 구성을 템플릿으로 저장
요소의 동작 로직 설명: 클릭 시 SweetAlert2로 이름 입력 받아 템플릿 저장
요소의 입출력 데이터 구조: 입력: 클릭. 출력: layerTemplates 배열에 새 항목 추가
요소의 경로정보: frontend/js/components/LayerPanel.js#btn-save
요소의 수행해야 할 백엔드/JS 명령: JS: saveLayerTemplate()">
                        저장
                    </button>
                </div>
            </div>
            
            <div v-if="contextMenu" 
                 class="context-menu" 
                 :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}">
                <div class="color-grid">
                    <div v-for="c in COLORS" 
                         :key="c" 
                         class="color-swatch" 
                         :style="{ backgroundColor: c }" 
                         @click="handleColColor(c)"></div>
                </div>
            </div>
        </div>
    `
};
