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
            const newCol = { id: \`lc_\${Date.now()}\`, name: 'New', color: '#333' };
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
                    icon: 'success', 
                    title: '저장됨', 
                    background: '#1e1e1e', 
                    color: '#fff', 
                    confirmButtonColor: '#3b82f6',
                    timer: 1500
                });
            }
        }
    },
    
    template: `
        <div class="c-layer-panel" 
             data-js="layer-panel"
             data-dev="요소의 역할: 레이어 매트릭스 패널
요소의 고유ID: component-layer-panel-root
요소의 기능 목적 정의: 레이어 매트릭스 UI 및 관리 기능 제공
요소의 동작 로직 설명: 셀 클릭으로 박스 추가, 우클릭으로 색상 변경, 저장 버튼으로 템플릿 저장
요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: store.addLayerBox(), store.saveLayerTemplate()
요소의 경로정보: frontend/js/components/LayerPanel.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: addColumn(), saveLayerTemplate()">
            <div class="c-layer-panel__header" 
                 @click="isCollapsed = !isCollapsed"
                 data-js="layer-panel-header"
                 title="레이어 패널 접기/펼치기"
                 data-dev="요소의 역할: 레이어 패널 헤더
요소의 고유ID: component-layer-panel-header
요소의 기능 목적 정의: 패널 접기/펼치기 토글
요소의 동작 로직 설명: 클릭 시 isCollapsed 상태 토글
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isCollapsed 상태 변경
요소의 경로정보: frontend/js/components/LayerPanel.js#header
요소의 수행해야 할 백엔드/JS 명령: JS: isCollapsed = !isCollapsed">
                <div class="c-layer-panel__header-left">
                    <span class="c-layer-panel__title">
                        <i class="fa-solid fa-layer-group"></i> 레이어 관리
                    </span>
                    <span v-if="vm.layerMainName" 
                          class="c-layer-panel__badge"
                          :title="'현재 템플릿: ' + vm.layerMainName">
                        {{ vm.layerMainName }}
                    </span>
                </div>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']" 
                   class="c-layer-panel__toggle-icon"
                   :title="isCollapsed ? '펼치기' : '접기'"></i>
            </div>
            
            <div v-if="!isCollapsed" class="c-layer-panel__body"
                 data-js="layer-panel-body"
                 data-dev="요소의 역할: 레이어 패널 본문
요소의 고유ID: component-layer-panel-body
요소의 기능 목적 정의: 레이어 매트릭스 및 관리 버튼 표시
요소의 동작 로직 설명: 매트릭스 셀 렌더링, 컬럼 추가/저장 버튼 제공
요소의 입출력 데이터 구조: 입력: vm.layerCols, vm.canvasBoxes. 출력: 매트릭스 UI
요소의 경로정보: frontend/js/components/LayerPanel.js#body
요소의 수행해야 할 백엔드/JS 명령: JS: addColumn(), saveLayerTemplate()">
                <div class="c-layer-panel__controls">
                    <span class="c-layer-panel__label" title="레이어 매트릭스">매트릭스 (우클릭: 색상)</span>
                    <button class="c-layer-panel__btn-add" 
                            @click="addColumn"
                            data-js="layer-add-column-btn"
                            title="컬럼 추가"
                            data-dev="요소의 역할: 컬럼 추가 버튼
요소의 고유ID: component-layer-add-column-btn
요소의 기능 목적 정의: 새로운 레이어 컬럼 추가
요소의 동작 로직 설명: 클릭 시 addColumn() 호출하여 layerCols에 새 컬럼 추가
요소의 입출력 데이터 구조: 입력: 클릭. 출력: layerCols 배열에 새 항목 추가
요소의 경로정보: frontend/js/components/LayerPanel.js#btn-add-column
요소의 수행해야 할 백엔드/JS 명령: JS: addColumn()">
                        + 컬럼
                    </button>
                </div>
                
                <div class="c-layer-panel__matrix"
                     data-js="layer-matrix"
                     title="레이어 매트릭스"
                     data-dev="요소의 역할: 레이어 매트릭스 컨테이너
요소의 고유ID: component-layer-matrix
요소의 기능 목적 정의: 레이어 컬럼 헤더 및 셀 그리드 렌더링
요소의 동작 로직 설명: 컬럼 헤더와 3행(EFF, TXT, BG) 셀 그리드 표시
요소의 입출력 데이터 구조: 입력: layerCols, rows. 출력: 매트릭스 그리드 UI
요소의 경로정보: frontend/js/components/LayerPanel.js#matrix
요소의 수행해야 할 백엔드/JS 명령: 없음">
                    <div class="c-layer-panel__matrix-header">
                        <div class="c-layer-panel__matrix-spacer"></div>
                        <div v-for="(col, i) in vm.layerCols" 
                             :key="col.id" 
                             class="c-layer-panel__matrix-col" 
                             :style="{ backgroundColor: col.color }" 
                             @contextmenu.prevent="openContextMenu($event, col.id, i)"
                             :data-js="'layer-col-' + col.id"
                             :title="'컬럼: ' + col.name + ' (우클릭: 색상 변경)'"
                             :data-dev="'요소의 역할: 레이어 컬럼 헤더\\n요소의 고유ID: component-layer-col-' + col.id + '\\n요소의 기능 목적 정의: 컬럼 이름 편집 및 색상 변경\\n요소의 동작 로직 설명: 텍스트 클릭으로 이름 편집, 우클릭으로 색상 변경\\n요소의 입출력 데이터 구조: 입력: 텍스트, 우클릭. 출력: col.name, col.color 변경\\n요소의 경로정보: frontend/js/components/LayerPanel.js#layer-col\\n요소의 수행해야 할 백엔드/JS 명령: JS: updateColName(), openContextMenu()'">
                            <input type="text" 
                                   :value="col.name" 
                                   @input="updateColName(col.id, $event.target.value)" 
                                   class="c-layer-panel__matrix-col-input"
                                   :data-js="'layer-col-input-' + col.id"
                                   :title="'컬럼 이름 편집: ' + col.name"
                                   @click.stop />
                            <div class="c-layer-panel__matrix-col-zindex"
                                 :title="'Z-Index: ' + getZIndex(i, 'VID')">
                                Z:{{ getZIndex(i, 'VID') }}
                            </div>
                        </div>
                    </div>
                    
                    <div v-for="row in rows" 
                         :key="row.type" 
                         class="c-layer-panel__matrix-row"
                         :data-js="'layer-row-' + row.type"
                         :title="'레이어 타입: ' + row.label"
                         data-dev="요소의 역할: 레이어 매트릭스 행
요소의 고유ID: component-layer-matrix-row
요소의 기능 목적 정의: 특정 타입(EFF/TXT/BG)의 레이어 셀들을 표시
요소의 동작 로직 설명: 각 컬럼에 대해 해당 타입의 셀 렌더링
요소의 입출력 데이터 구조: 입력: row(객체). 출력: 셀 그리드
요소의 경로정보: frontend/js/components/LayerPanel.js#matrix-row
요소의 수행해야 할 백엔드/JS 명령: 없음">
                        <div class="c-layer-panel__matrix-label" 
                             :style="{ color: row.color }"
                             :title="row.label">
                            {{ row.label }}
                        </div>
                        <div v-for="(col, i) in vm.layerCols" 
                             :key="col.id + row.type"
                             :class="{ 
                                 'c-layer-panel__matrix-cell': true,
                                 'c-layer-panel__matrix-cell--active': isActive(i, row.type),
                                 'c-layer-panel__matrix-cell--inactive': !isActive(i, row.type)
                             }"
                             @click="vm.addLayerBox(i, row.type, col.color)"
                             :data-js="'layer-cell-' + i + '-' + row.type"
                             :title="'클릭: ' + row.label + ' 박스 추가 (Z:' + getZIndex(i, row.type) + ')'"
                             :data-dev="'요소의 역할: 레이어 매트릭스 셀\\n요소의 고유ID: component-layer-cell-' + i + '-' + row.type + '\\n요소의 기능 목적 정의: 클릭 시 해당 레이어에 박스 생성\\n요소의 동작 로직 설명: 클릭 시 vm.addLayerBox() 호출하여 캔버스에 박스 추가\\n요소의 입출력 데이터 구조: 입력: 클릭. 출력: canvasBoxes 배열에 새 박스 추가\\n요소의 경로정보: frontend/js/components/LayerPanel.js#cell\\n요소의 수행해야 할 백엔드/JS 명령: JS: vm.addLayerBox(colIdx, type, color)'">
                            <span class="c-layer-panel__matrix-cell-zindex">
                                {{ getZIndex(i, row.type) }}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="c-layer-panel__footer"
                     data-js="layer-panel-footer">
                    <button class="c-layer-panel__btn-save" 
                            @click="saveLayerTemplate"
                            data-js="layer-save-template-btn"
                            title="템플릿 저장"
                            data-dev="요소의 역할: 레이어 템플릿 저장 버튼
요소의 고유ID: component-layer-save-template-btn
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
                 class="c-context-menu" 
                 :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}"
                 data-js="layer-context-menu"
                 title="색상 선택"
                 data-dev="요소의 역할: 컬럼 색상 선택 컨텍스트 메뉴
요소의 고유ID: component-layer-context-menu
요소의 기능 목적 정의: 컬럼 색상 변경을 위한 색상 팔레트 표시
요소의 동작 로직 설명: 색상 클릭 시 해당 컬럼의 색상 변경 후 메뉴 닫기
요소의 입출력 데이터 구조: 입력: COLORS 배열. 출력: col.color 변경
요소의 경로정보: frontend/js/components/LayerPanel.js#context-menu
요소의 수행해야 할 백엔드/JS 명령: JS: handleColColor(color)">
                <div class="c-context-menu__color-grid">
                    <div v-for="c in COLORS" 
                         :key="c" 
                         class="c-context-menu__color-swatch" 
                         :style="{ backgroundColor: c }" 
                         @click="handleColColor(c)"
                         :data-js="'color-swatch-' + c"
                         :title="'색상: ' + c"
                         data-dev="요소의 역할: 색상 견본
요소의 고유ID: component-color-swatch
요소의 기능 목적 정의: 클릭 가능한 색상 견본
요소의 동작 로직 설명: 클릭 시 해당 색상을 컬럼에 적용
요소의 입출력 데이터 구조: 입력: c(색상 HEX). 출력: handleColColor(c)
요소의 경로정보: frontend/js/components/LayerPanel.js#color-swatch
요소의 수행해야 할 백엔드/JS 명령: JS: handleColColor(c)"></div>
                </div>
            </div>
        </div>
    `
};
