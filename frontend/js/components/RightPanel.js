import { store } from '../store.js';

const LayerPart = {
    template: `
        <div class="flex flex-col h-full select-none" 
             data-dev="ID: layer-panel | Role: Panel | Func: 레이어 관리 | Goal: 레이어 생성 및 제어 | Path: App/RightPanel/Layer | Py: None">
            <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center justify-between px-3 cursor-pointer" 
                 @click="isCollapsed = !isCollapsed">
                <span class="font-bold text-text-main text-xs"><i class="fa-solid fa-layer-group mr-2"></i>레이어 관리</span>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']"></i>
            </div>
            
            <div v-show="!isCollapsed" class="flex flex-col flex-1 overflow-hidden">
                 <div class="p-3 border-b border-ui-border bg-bg-panel/50">
                     <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] text-text-sub font-bold">MATRIX GRID</span>
                        <button class="text-[10px] hover:text-white bg-ui-selected px-2 rounded transition-colors" 
                                @click="addCol" 
                                title="컬럼 추가"
                                data-dev="ID: btn-add-col | Role: Button | Func: 컬럼 추가 | Goal: 매트릭스 확장 | Path: RightPanel/Matrix/Add | Py: layer.add_column()">
                            <i class="fa-solid fa-plus mr-1"></i>Col
                        </button>
                     </div>
                     
                     <div class="overflow-x-auto pb-1">
                        <div class="flex gap-1 mb-1 min-w-max">
                            <div class="w-10 shrink-0"></div>
                            <div v-for="(col, i) in store.layerCols" :key="col.id" 
                                 class="w-[50px] text-center py-1 rounded text-[10px] font-bold text-white relative group"
                                 :style="{ backgroundColor: col.color }"
                                 data-dev="ID: col-header | Role: Label | Func: 컬럼 헤더 | Goal: 그룹 식별 | Path: RightPanel/Matrix/Header | Py: None">
                                {{ col.name || 'C'+(i+1) }}
                            </div>
                        </div>
                        
                        <div v-for="row in rows" :key="row.type" class="flex gap-1 mb-1 min-w-max">
                            <div class="w-10 shrink-0 text-[9px] flex items-center justify-end pr-2 font-bold" 
                                 :style="{ color: row.color }">{{ row.label }}</div>
                            <div v-for="(col, i) in store.layerCols" :key="col.id + row.type"
                                 class="layer-cell group"
                                 @click="createBox(i, row.type, col.color)"
                                 title="박스 생성"
                                 :data-dev="'ID: cell-' + i + '-' + row.type + ' | Role: Trigger | Func: 박스 생성 | Goal: 캔버스에 객체 추가 | Path: RightPanel/Matrix/Cell | Py: layer.create(' + i + ', ' + row.type + ')'">
                                 <span class="z-10">{{ getBoxCount(i, row.type) || '' }}</span>
                            </div>
                        </div>
                     </div>
                 </div>

                 <div class="flex-1 overflow-y-auto bg-bg-dark p-2 space-y-1">
                    <div v-for="box in reversedBoxes" :key="box.id" 
                         class="flex items-center gap-2 p-2 rounded border border-transparent cursor-pointer group hover:bg-bg-hover"
                         :class="{'bg-ui-selected border-ui-accent': store.selection.boxId === box.id}"
                         @click="store.selectBox(box.id)"
                         title="레이어 선택"
                         :data-dev="'ID: item-' + box.id + ' | Role: Item | Func: 레이어 항목 | Goal: 속성 보기 | Path: RightPanel/List/Item | Py: layer.select(' + box.id + ')'">
                        <div class="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold text-black" :style="{ backgroundColor: box.color }">
                            {{ box.type[0] }}
                        </div>
                        <div class="flex-1 min-w-0 flex flex-col">
                            <span class="text-xs font-bold text-text-main truncate">{{ box.type }} Layer</span>
                            <span class="text-[9px] text-text-sub">Z: {{ box.zIndex }}</span>
                        </div>
                        <button class="w-5 h-5 flex items-center justify-center hover:text-white text-text-sub opacity-0 group-hover:opacity-100" 
                                @click.stop="deleteBox(box.id)"
                                title="삭제"
                                data-dev="ID: btn-del | Role: Button | Func: 삭제 | Goal: 레이어 제거 | Path: RightPanel/List/Action | Py: layer.delete(' + box.id + ')'">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    `,
    data() { return { store, isCollapsed: false, rows: [ { type: 'EFF', label: 'EFF', color: '#ef4444', offset: 80 }, { type: 'TXT', label: 'TXT', color: '#eab308', offset: 40 }, { type: 'BG', label: 'BG', color: '#3b82f6', offset: 20 } ] }; },
    computed: { reversedBoxes() { return [...store.canvasBoxes].reverse(); } },
    methods: {
        addCol() { store.layerCols.push({ id: `lc_${Date.now()}`, name: 'New', color: '#333' }); },
        getBoxCount(colIdx, type) { return store.canvasBoxes.filter(b => b.colIdx === colIdx && b.type === type).length; },
        createBox(colIdx, type, color) { const z = (colIdx * 100) + 100 + this.rows.find(r => r.type === type).offset; store.addLayerBox(colIdx, type, z, color); },
        deleteBox(id) { store.removeBox(id); }
    }
};

const PropPart = {
    template: `
        <div class="border-t border-ui-border bg-bg-panel h-1/3 flex flex-col" 
             data-dev="ID: panel-prop | Role: Panel | Func: 속성창 | Goal: 값 수정 | Path: App/RightPanel/Props | Py: None">
            <div class="h-8 bg-bg-hover flex items-center justify-between px-3 border-b border-ui-border">
                <span class="font-bold text-text-main text-xs"><i class="fa-solid fa-sliders mr-2"></i>속성</span>
            </div>
            <div class="p-4 flex-1 overflow-y-auto">
                <div v-if="selectedBox" class="space-y-3">
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">SELECTED</div>
                        <div class="text-sm font-bold text-text-main">{{ selectedBox.type }} (Z:{{ selectedBox.zIndex }})</div>
                    </div>
                    <button class="w-full bg-ui-border hover:bg-ui-danger hover:text-white text-text-sub py-2 rounded text-xs font-bold" 
                            @click="deleteBox"
                            data-dev="ID: btn-del-prop | Role: Button | Func: 삭제 | Goal: 선택 객체 제거 | Path: App/RightPanel/Props | Py: layer.delete_selected()">삭제</button>
                </div>
                <div v-else class="h-full flex flex-col items-center justify-center text-text-sub opacity-40">
                    <span class="text-[10px]">선택된 항목 없음</span>
                </div>
            </div>
        </div>
    `,
    computed: { selectedBox() { return store.canvasBoxes.find(b => b.id === store.selection.boxId); } },
    methods: { deleteBox() { if(this.selectedBox) store.removeBox(this.selectedBox.id); } }
};

export default {
    props: ['width'],
    components: { 'layer-matrix': LayerPart, 'prop-part': PropPart },
    template: `
        <aside class="bg-bg-panel flex flex-col relative border-l border-ui-border" :style="{ width: width + 'px', minWidth: '250px' }" data-dev="ID: right-panel | Role: Layout | Func: 우측 패널 | Goal: 레이어 관리 | Path: App/RightPanel | Py: None">
            <div class="panel-resizer-v left-0" @mousedown="$emit('resize-start', $event)"></div>
            <layer-matrix class="flex-1 overflow-hidden border-b border-ui-border"></layer-matrix>
            <prop-part></prop-part>
        </aside>
    `
}