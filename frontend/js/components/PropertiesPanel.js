/**
 * ==========================================
 * PropertiesPanel.js - 속성 패널
 * 
 * 역할: 우측 패널의 선택된 클립/박스 속성 표시
 * 경로: frontend/js/components/PropertiesPanel.js
 * 
 * DATA-DEV:
 * 요소의 역할: 선택된 요소(클립/박스) 속성 표시 및 삭제
 * 요소의 고유ID: component-properties-panel
 * 요소의 기능 목적 정의: 선택된 클립 또는 캔버스 박스의 속성 값 표시 및 삭제 기능 제공
 * 요소의 동작 로직 설명: vm.selectedClip 또는 vm.selectedBoxId에 따라 조건부 렌더링, 삭제 버튼 클릭 시 해당 요소 제거
 * 요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: store.removeClip(), store.removeBox()
 * 요소의 경로정보: frontend/js/components/PropertiesPanel.js
 * 요소의 수행해야 할 백엔드/JS 명령: JS: deleteClip(id), vm.removeBox(id)
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
    
    template: `
        <div class="border-b border-ui-border bg-bg-panel" 
             data-dev="요소의 역할: 속성 패널 컴포넌트
요소의 고유ID: properties-panel-root
요소의 기능 목적 정의: 선택된 클립/박스 속성 표시 및 삭제
요소의 동작 로직 설명: selectedClip 또는 selectedBoxId에 따라 조건부 렌더링
요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: 속성 값 표시, 삭제 메서드 호출
요소의 경로정보: frontend/js/components/PropertiesPanel.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: deleteClip(id), vm.removeBox(id)">
            <div class="h-8 bg-bg-hover flex items-center justify-between px-2 cursor-pointer select-none border-b border-ui-border" 
                 @click="isCollapsed = !isCollapsed" 
                 data-dev="요소의 역할: 속성 패널 헤더
요소의 고유ID: properties-panel-header
요소의 기능 목적 정의: 패널 접기/펼치기 토글
요소의 동작 로직 설명: 클릭 시 isCollapsed 상태 토글
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isCollapsed 상태 변경
요소의 경로정보: frontend/js/components/PropertiesPanel.js#header
요소의 수행해야 할 백엔드/JS 명령: JS: isCollapsed = !isCollapsed">
                <span class="text-xs font-bold text-text-main">
                    <i class="fa-solid fa-sliders mr-2"></i>속성
                </span>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']" class="text-text-sub text-xs"></i>
            </div>
            
            <div v-if="!isCollapsed" class="p-3 space-y-3">
                <div v-if="!vm.selectedClip && !vm.selectedBoxId" 
                     class="text-text-sub text-center text-[10px] py-4 opacity-50">
                    선택된 요소 없음
                </div>
                
                <div v-else-if="vm.selectedClip" class="animate-fade-in space-y-2">
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">CLIP</div>
                        <div class="text-sm font-bold text-text-main truncate">{{ vm.selectedClip.name }}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] text-text-sub">Start</label>
                            <input type="text" 
                                   class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" 
                                   :value="vm.selectedClip.start.toFixed(1)" 
                                   readonly/>
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">Dur</label>
                            <input type="text" 
                                   class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" 
                                   :value="vm.selectedClip.duration.toFixed(1)" 
                                   readonly/>
                        </div>
                    </div>
                    <button class="w-full bg-ui-border hover:bg-ui-danger hover:text-white border border-ui-border text-text-sub py-1 rounded text-[10px] transition-colors" 
                            @click="deleteClip(vm.selectedClip.id)"
                            data-dev="요소의 역할: 클립 삭제 버튼
요소의 고유ID: btn-delete-clip
요소의 기능 목적 정의: 선택된 클립 삭제
요소의 동작 로직 설명: 클릭 시 deleteClip() 호출하여 clips 배열에서 제거
요소의 입출력 데이터 구조: 입력: 클릭. 출력: clips 배열에서 항목 제거
요소의 경로정보: frontend/js/components/PropertiesPanel.js#btn-delete-clip
요소의 수행해야 할 백엔드/JS 명령: JS: deleteClip(id)">
                        <i class="fa-solid fa-trash mr-1"></i> 삭제
                    </button>
                </div>
                
                <div v-else-if="selectedBox" class="animate-fade-in space-y-2">
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">BOX (Z:{{ selectedBox.zIndex }})</div>
                        <div class="text-sm font-bold text-text-main truncate">({{ selectedBox.type }})</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] text-text-sub">X</label>
                            <input type="text" 
                                   class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" 
                                   :value="Math.round(selectedBox.x)" 
                                   readonly/>
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">Y</label>
                            <input type="text" 
                                   class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" 
                                   :value="Math.round(selectedBox.y)" 
                                   readonly/>
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">W</label>
                            <input type="text" 
                                   class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" 
                                   :value="Math.round(selectedBox.w)" 
                                   readonly/>
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">H</label>
                            <input type="text" 
                                   class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" 
                                   :value="Math.round(selectedBox.h)" 
                                   readonly/>
                        </div>
                    </div>
                    <button class="w-full bg-ui-border hover:bg-ui-danger hover:text-white border border-ui-border text-text-sub py-1 rounded text-[10px] transition-colors" 
                            @click="vm.removeBox(vm.selectedBoxId)"
                            data-dev="요소의 역할: 박스 삭제 버튼
요소의 고유ID: btn-delete-box
요소의 기능 목적 정의: 선택된 캔버스 박스 삭제
요소의 동작 로직 설명: 클릭 시 vm.removeBox() 호출하여 canvasBoxes 배열에서 제거
요소의 입출력 데이터 구조: 입력: 클릭. 출력: canvasBoxes 배열에서 항목 제거
요소의 경로정보: frontend/js/components/PropertiesPanel.js#btn-delete-box
요소의 수행해야 할 백엔드/JS 명령: JS: vm.removeBox(id)">
                        <i class="fa-solid fa-trash mr-1"></i> 삭제
                    </button>
                </div>
            </div>
        </div>
    `
};
