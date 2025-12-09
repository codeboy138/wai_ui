/**
 * ==========================================
 * LayerPanel.js - 레이어 매트릭스 패널
 * 
 * 역할: 우측 패널의 레이어 관리 UI
 * 경로: frontend/js/components/LayerPanel.js
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
    
    template: \`
        <div class="c-layer-panel">
            <div class="c-layer-panel__header" 
                 @click="isCollapsed = !isCollapsed"
                 title="레이어 패널 접기/펼치기">
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
            
            <div v-if="!isCollapsed" class="c-layer-panel__body">
                <div class="c-layer-panel__controls">
                    <span class="c-layer-panel__label" title="레이어 매트릭스">매트릭스 (우클릭: 색상)</span>
                    <button id="layer-add-column-btn"
                            class="c-layer-panel__btn-add" 
                            data-action="js:addColumn"
                            @click="addColumn"
                            title="컬럼 추가">
                        + 컬럼
                    </button>
                </div>
                
                <div class="c-layer-panel__matrix">
                    <div class="c-layer-panel__matrix-header">
                        <div class="c-layer-panel__matrix-spacer"></div>
                        <div v-for="(col, i) in vm.layerCols" 
                             :key="col.id" 
                             class="c-layer-panel__matrix-col" 
                             :style="{ backgroundColor: col.color }" 
                             @contextmenu.prevent="openContextMenu($event, col.id, i)"
                             :title="'컬럼: ' + col.name + ' (우클릭: 색상 변경)'">
                            <input type="text" 
                                   :value="col.name" 
                                   @input="updateColName(col.id, $event.target.value)" 
                                   class="c-layer-panel__matrix-col-input"
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
                         :title="'레이어 타입: ' + row.label">
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
                             data-action="js:addLayerBox"
                             @click="vm.addLayerBox(i, row.type, col.color)"
                             :title="'클릭: ' + row.label + ' 박스 추가 (Z:' + getZIndex(i, row.type) + ')'">
                            <span class="c-layer-panel__matrix-cell-zindex">
                                {{ getZIndex(i, row.type) }}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="c-layer-panel__footer">
                    <button id="layer-save-template-btn"
                            class="c-layer-panel__btn-save" 
                            data-action="js:saveTemplate"
                            @click="saveLayerTemplate"
                            title="템플릿 저장">
                        저장
                    </button>
                </div>
            </div>
            
            <div v-if="contextMenu" 
                 class="c-context-menu" 
                 :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}">
                <div class="c-context-menu__color-grid">
                    <div v-for="c in COLORS" 
                         :key="c" 
                         class="c-context-menu__color-swatch" 
                         :style="{ backgroundColor: c }" 
                         @click="handleColColor(c)"
                         :title="'색상: ' + c"></div>
                </div>
            </div>
        </div>
    \`
};
