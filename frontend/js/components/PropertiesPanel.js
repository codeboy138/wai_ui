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
        <div class="c-properties-panel" 
             data-js="properties-panel"
             data-dev="요소의 역할: 속성 패널 컴포넌트
요소의 고유ID: component-properties-panel-root
요소의 기능 목적 정의: 선택된 클립/박스 속성 표시 및 삭제
요소의 동작 로직 설명: selectedClip 또는 selectedBoxId에 따라 조건부 렌더링
요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: 속성 값 표시, 삭제 메서드 호출
요소의 경로정보: frontend/js/components/PropertiesPanel.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: deleteClip(id), vm.removeBox(id)">
            <div class="c-properties-panel__header" 
                 @click="isCollapsed = !isCollapsed"
                 data-js="properties-panel-header"
                 title="속성 패널 접기/펼치기"
                 data-dev="요소의 역할: 속성 패널 헤더
요소의 고유ID: component-properties-panel-header
요소의 기능 목적 정의: 패널 접기/펼치기 토글
요소의 동작 로직 설명: 클릭 시 isCollapsed 상태 토글
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isCollapsed 상태 변경
요소의 경로정보: frontend/js/components/PropertiesPanel.js#header
요소의 수행해야 할 백엔드/JS 명령: JS: isCollapsed = !isCollapsed">
                <span class="c-properties-panel__title">
                    <i class="fa-solid fa-sliders"></i> 속성
                </span>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']" 
                   class="c-properties-panel__toggle-icon"
                   :title="isCollapsed ? '펼치기' : '접기'"></i>
            </div>
            
            <div v-if="!isCollapsed" class="c-properties-panel__body"
                 data-js="properties-panel-body"
                 data-dev="요소의 역할: 속성 패널 본문
요소의 고유ID: component-properties-panel-body
요소의 기능 목적 정의: 선택된 요소의 속성 필드 표시
요소의 동작 로직 설명: selectedClip/selectedBox에 따라 조건부 렌더링
요소의 입출력 데이터 구조: 입력: vm.selectedClip, vm.selectedBoxId. 출력: 속성 UI
요소의 경로정보: frontend/js/components/PropertiesPanel.js#body
요소의 수행해야 할 백엔드/JS 명령: 없음">
                <div v-if="!vm.selectedClip && !vm.selectedBoxId" 
                     class="c-properties-panel__empty"
                     data-js="properties-empty-state"
                     title="선택된 요소 없음"
                     data-dev="요소의 역할: 빈 상태 메시지
요소의 고유ID: component-properties-empty-state
요소의 기능 목적 정의: 선택된 요소가 없을 때 안내 메시지 표시
요소의 동작 로직 설명: selectedClip과 selectedBoxId가 모두 null일 때 표시
요소의 입출력 데이터 구조: 입력: 없음. 출력: 텍스트 메시지
요소의 경로정보: frontend/js/components/PropertiesPanel.js#empty-state
요소의 수행해야 할 백엔드/JS 명령: 없음">
                    선택된 요소 없음
                </div>
                
                <div v-else-if="vm.selectedClip" 
                     class="c-properties-panel__content"
                     data-js="properties-clip-content"
                     title="클립 속성"
                     data-dev="요소의 역할: 클립 속성 표시 영역
요소의 고유ID: component-properties-clip-content
요소의 기능 목적 정의: 선택된 클립의 속성 값 표시 및 삭제 기능 제공
요소의 동작 로직 설명: 클립 이름, 시작 시간, 길이 표시, 삭제 버튼 제공
요소의 입출력 데이터 구조: 입력: vm.selectedClip. 출력: 속성 필드 + 삭제 버튼
요소의 경로정보: frontend/js/components/PropertiesPanel.js#clip-content
요소의 수행해야 할 백엔드/JS 명령: JS: deleteClip(id)">
                    <div class="c-properties-panel__info-box"
                         data-js="properties-clip-info"
                         title="클립 정보">
                        <div class="c-properties-panel__info-type">CLIP</div>
                        <div class="c-properties-panel__info-name">{{ vm.selectedClip.name }}</div>
                    </div>
                    <div class="c-properties-panel__fields">
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="시작 시간">Start</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="vm.selectedClip.start.toFixed(1)" 
                                   data-js="properties-clip-start"
                                   title="시작 시간 (읽기 전용)"
                                   readonly/>
                        </div>
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="길이">Dur</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="vm.selectedClip.duration.toFixed(1)"
                                   data-js="properties-clip-duration"
                                   title="길이 (읽기 전용)"
                                   readonly/>
                        </div>
                    </div>
                    <button class="c-properties-panel__btn-delete" 
                            @click="deleteClip(vm.selectedClip.id)"
                            data-js="properties-clip-delete-btn"
                            title="클립 삭제"
                            data-dev="요소의 역할: 클립 삭제 버튼
요소의 고유ID: component-properties-clip-delete-btn
요소의 기능 목적 정의: 선택된 클립 삭제
요소의 동작 로직 설명: 클릭 시 deleteClip() 호출하여 clips 배열에서 제거
요소의 입출력 데이터 구조: 입력: 클릭. 출력: clips 배열에서 항목 제거
요소의 경로정보: frontend/js/components/PropertiesPanel.js#btn-delete-clip
요소의 수행해야 할 백엔드/JS 명령: JS: deleteClip(id)">
                        <i class="fa-solid fa-trash"></i> 삭제
                    </button>
                </div>
                
                <div v-else-if="selectedBox" 
                     class="c-properties-panel__content"
                     data-js="properties-box-content"
                     title="박스 속성"
                     data-dev="요소의 역할: 박스 속성 표시 영역
요소의 고유ID: component-properties-box-content
요소의 기능 목적 정의: 선택된 캔버스 박스의 속성 값 표시 및 삭제 기능 제공
요소의 동작 로직 설명: 박스 타입, Z-Index, 좌표(X,Y), 크기(W,H) 표시, 삭제 버튼 제공
요소의 입출력 데이터 구조: 입력: selectedBox. 출력: 속성 필드 + 삭제 버튼
요소의 경로정보: frontend/js/components/PropertiesPanel.js#box-content
요소의 수행해야 할 백엔드/JS 명령: JS: vm.removeBox(id)">
                    <div class="c-properties-panel__info-box"
                         data-js="properties-box-info"
                         title="박스 정보">
                        <div class="c-properties-panel__info-type">BOX (Z:{{ selectedBox.zIndex }})</div>
                        <div class="c-properties-panel__info-name">({{ selectedBox.type }})</div>
                    </div>
                    <div class="c-properties-panel__fields">
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="X 좌표">X</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="Math.round(selectedBox.x)"
                                   data-js="properties-box-x"
                                   title="X 좌표 (읽기 전용)"
                                   readonly/>
                        </div>
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="Y 좌표">Y</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="Math.round(selectedBox.y)"
                                   data-js="properties-box-y"
                                   title="Y 좌표 (읽기 전용)"
                                   readonly/>
                        </div>
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="너비">W</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="Math.round(selectedBox.w)"
                                   data-js="properties-box-w"
                                   title="너비 (읽기 전용)"
                                   readonly/>
                        </div>
                        <div class="c-properties-panel__field">
                            <label class="c-properties-panel__field-label" title="높이">H</label>
                            <input type="text" 
                                   class="c-properties-panel__field-input" 
                                   :value="Math.round(selectedBox.h)"
                                   data-js="properties-box-h"
                                   title="높이 (읽기 전용)"
                                   readonly/>
                        </div>
                    </div>
                    <button class="c-properties-panel__btn-delete" 
                            @click="vm.removeBox(vm.selectedBoxId)"
                            data-js="properties-box-delete-btn"
                            title="박스 삭제"
                            data-dev="요소의 역할: 박스 삭제 버튼
요소의 고유ID: component-properties-box-delete-btn
요소의 기능 목적 정의: 선택된 캔버스 박스 삭제
요소의 동작 로직 설명: 클릭 시 vm.removeBox() 호출하여 canvasBoxes 배열에서 제거
요소의 입출력 데이터 구조: 입력: 클릭. 출력: canvasBoxes 배열에서 항목 제거
요소의 경로정보: frontend/js/components/PropertiesPanel.js#btn-delete-box
요소의 수행해야 할 백엔드/JS 명령: JS: vm.removeBox(id)">
                        <i class="fa-solid fa-trash"></i> 삭제
                    </button>
                </div>
            </div>
        </div>
    `
};
