/**
 * ==========================================
 * PropertiesPanel.js - 속성 패널
 * 
 * 역할: 우측 패널의 선택된 클립/박스 속성 표시
 * 경로: frontend/js/components/PropertiesPanel.js
 * ==========================================
 */

export default {
    name: 'PropertiesPanel',
    
    props: ['vm'],
    
    data() {
        return {
            isCollapsed: false
        };
    },
    
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
    },
    
    template: \`
        <div class="c-properties-panel">
            <div class="c-properties-panel__header" 
                 @click="isCollapsed = !isCollapsed"
                 title="속성 패널 접기/펼치기">
                <span class="c-properties-panel__title">
                    <i class="fa-solid fa-sliders"></i> 속성
                </span>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']" 
                   class="c-properties-panel__toggle-icon"
                   :title="isCollapsed ? '펼치기' : '접기'"></i>
            </div>
            
            <div v-if="!isCollapsed" class="c-properties-panel__body">
                <div v-if="!vm.selectedClip && !vm.selectedBoxId" 
                     class="c-properties-panel__empty"
                     title="선택된 요소 없음">
                    선택된 요소 없음
                </div>
                
                <div v-else-if="vm.selectedClip" 
                     class="c-properties-panel__content"
                     title="클립 속성">
                    <div class="c-properties-panel__info-box">
                        <div class="c-properties-panel__info-type">CLIP</div>
                        <div class="c-properties-panel__info-name">{{ vm.selectedClip.name }}</div>
                    </div>
                    <div class="c-properties-panel__fields">
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="시작 시간">Start</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="vm.selectedClip.start.toFixed(1)" 
                                   title="시작 시간 (읽기 전용)"
                                   readonly/>
                        </div>
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="길이">Dur</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="vm.selectedClip.duration.toFixed(1)"
                                   title="길이 (읽기 전용)"
                                   readonly/>
                        </div>
                    </div>
                    <button id="properties-clip-delete-btn"
                            class="c-properties-panel__btn-delete" 
                            data-action="js:deleteClip"
                            @click="deleteClip(vm.selectedClip.id)"
                            title="클립 삭제">
                        <i class="fa-solid fa-trash"></i> 삭제
                    </button>
                </div>
                
                <div v-else-if="selectedBox" 
                     class="c-properties-panel__content"
                     title="박스 속성">
                    <div class="c-properties-panel__info-box">
                        <div class="c-properties-panel__info-type">BOX (Z:{{ selectedBox.zIndex }})</div>
                        <div class="c-properties-panel__info-name">({{ selectedBox.type }})</div>
                    </div>
                    <div class="c-properties-panel__fields">
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="X 좌표">X</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="Math.round(selectedBox.x)"
                                   title="X 좌표 (읽기 전용)"
                                   readonly/>
                        </div>
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="Y 좌표">Y</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="Math.round(selectedBox.y)"
                                   title="Y 좌표 (읽기 전용)"
                                   readonly/>
                        </div>
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="너비">W</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="Math.round(selectedBox.w)"
                                   title="너비 (읽기 전용)"
                                   readonly/>
                        </div>
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="높이">H</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="Math.round(selectedBox.h)"
                                   title="높이 (읽기 전용)"
                                   readonly/>
                        </div>
                    </div>
                    <button id="properties-box-delete-btn"
                            class="c-properties-panel__btn-delete" 
                            data-action="js:removeBox"
                            @click="vm.removeBox(vm.selectedBoxId)"
                            title="박스 삭제">
                        <i class="fa-solid fa-trash"></i> 삭제
                    </button>
                </div>
            </div>
        </div>
    \`
};
