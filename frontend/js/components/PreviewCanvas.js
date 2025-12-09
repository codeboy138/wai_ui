/**
 * ==========================================
 * PreviewCanvas.js - 프리뷰 캔버스 컴포넌트
 * 
 * 역할: 캔버스 박스 렌더링 및 Interact.js 드래그/리사이즈
 * 경로: frontend/js/components/PreviewCanvas.js
 * 
 * DATA-DEV:
 * 요소의 역할: 프리뷰 캔버스 박스 관리 및 상호작용
 * 요소의 고유ID: component-preview-canvas
 * 요소의 기능 목적 정의: 캔버스 박스 렌더링, Interact.js를 이용한 드래그/리사이즈, 컨텍스트 메뉴
 * 요소의 동작 로직 설명: mounted/updated 시 initInteract() 호출하여 Interact.js 초기화, 드래그/리사이즈 종료 시 updateBoxPosition() 호출
 * 요소의 입출력 데이터 구조: 입력: canvasBoxes(배열), selectedBoxId(문자열). 출력: @select-box, @remove-box 이벤트
 * 요소의 경로정보: frontend/js/components/PreviewCanvas.js
 * 요소의 수행해야 할 백엔드/JS 명령: JS: initInteract(), $emit('select-box'), $emit('remove-box')
 * ==========================================
 */

export default {
    name: 'PreviewCanvas',
    
    props: {
        canvasBoxes: {
            type: Array,
            required: true
        },
        selectedBoxId: {
            type: String,
            default: null
        }
    },
    
    data() {
        return {
            contextMenu: null
        };
    },
    
    mounted() {
        this.initInteract();
    },
    
    updated() {
        this.initInteract();
    },
    
    methods: {
        initInteract() {
            const self = this;
            interact('.c-canvas-box').unset();
            
            interact('.c-canvas-box').draggable({
                modifiers: [interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true })],
                listeners: {
                    move(e) {
                        const target = e.target;
                        const scaler = document.getElementById('canvas-scaler-transform');
                        const scaleMatch = scaler.style.transform.match(/scale\\(([^)]+)\\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let x = (parseFloat(target.getAttribute('data-x')) || 0) + (e.dx / scale);
                        let y = (parseFloat(target.getAttribute('data-y')) || 0) + (e.dy / scale);
                        
                        const cx = x + (e.rect.width / 2);
                        const centerX = 3840 / 2;
                        const guideV = document.getElementById('canvas-guide-vertical');
                        if (guideV) {
                            guideV.style.display = Math.abs(cx - centerX) < 20 ? 'block' : 'none';
                        }
                        
                        target.style.transform = \`translate(\${x}px, \${y}px)\`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end(e) {
                        const guideV = document.getElementById('canvas-guide-vertical');
                        if (guideV) guideV.style.display = 'none';
                        
                        const boxId = e.target.id.replace('canvas-box-', '');
                        const dx = parseFloat(e.target.getAttribute('data-x')) || 0;
                        const dy = parseFloat(e.target.getAttribute('data-y')) || 0;
                        
                        self.$parent.updateBoxPosition(boxId, dx, dy, e.rect.width, e.rect.height);
                        
                        e.target.removeAttribute('data-x');
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = \`translate(0, 0)\`;
                    }
                }
            }).resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })],
                listeners: {
                    move: function (e) {
                        const scaler = document.getElementById('canvas-scaler-transform');
                        const scaleMatch = scaler.style.transform.match(/scale\\(([^)]+)\\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let { x, y } = e.target.dataset;
                        x = (parseFloat(x) || 0) + (e.deltaRect.left / scale);
                        y = (parseFloat(y) || 0) + (e.deltaRect.top / scale);
                        Object.assign(e.target.style, {
                            width: \`\${e.rect.width / scale}px\`,
                            height: \`\${e.rect.height / scale}px\`,
                            transform: \`translate(\${x}px, \${y}px)\`
                        });
                        Object.assign(e.target.dataset, { x, y });
                    },
                    end: function (e) {
                        const scaler = document.getElementById('canvas-scaler-transform');
                        const scaleMatch = scaler.style.transform.match(/scale\\(([^)]+)\\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        const boxId = e.target.id.replace('canvas-box-', '');
                        const dx = parseFloat(e.target.dataset.x) || 0;
                        const dy = parseFloat(e.target.dataset.y) || 0;
                        
                        self.$parent.updateBoxPosition(boxId, dx, dy, e.rect.width / scale, e.rect.height / scale, true);
                        e.target.removeAttribute('data-x');
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = \`translate(0, 0)\`;
                        e.target.style.width = null;
                        e.target.style.height = null;
                    }
                }
            });
        },
        
        handleContext(e, boxId) {
            this.contextMenu = { x: e.clientX, y: e.clientY, boxId };
        },
        
        handleContextAction(action) {
            if (action === 'delete') this.$emit('remove-box', this.contextMenu.boxId);
            this.contextMenu = null;
        }
    },
    
    template: `
        <div ref="container" 
             class="c-canvas" 
             @click="contextMenu = null; $emit('select-box', null)"
             data-js="canvas-container"
             title="캔버스 영역"
             data-dev="요소의 역할: 캔버스 박스 컨테이너
요소의 고유ID: component-canvas-root
요소의 기능 목적 정의: 캔버스 박스 렌더링 및 상호작용 관리
요소의 동작 로직 설명: 박스 클릭으로 선택, 드래그로 이동, 리사이즈 핸들로 크기 조절, 우클릭으로 컨텍스트 메뉴
요소의 입출력 데이터 구조: 입력: canvasBoxes(배열), selectedBoxId(문자열). 출력: @select-box, @remove-box 이벤트
요소의 경로정보: frontend/js/components/PreviewCanvas.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: initInteract(), $emit('select-box'), $emit('remove-box')">
            <div v-for="box in canvasBoxes" 
                 :key="box.id" 
                 :id="'canvas-box-' + box.id"
                 class="c-canvas-box"
                 :class="{ 'c-canvas-box--selected': selectedBoxId === box.id }"
                 :style="{ 
                     left: box.x + 'px', 
                     top: box.y + 'px', 
                     width: box.w + 'px', 
                     height: box.h + 'px', 
                     borderColor: box.color, 
                     zIndex: box.zIndex 
                 }"
                 @mousedown.stop="$emit('select-box', box.id)"
                 @contextmenu.prevent="handleContext($event, box.id)"
                 data-x="0" 
                 data-y="0"
                 :data-js="'canvas-box-' + box.id"
                 :title="'박스 (Z:' + box.zIndex + ')'"
                 :data-dev="'요소의 역할: 캔버스 박스\\n요소의 고유ID: component-canvas-box-' + box.id + '\\n요소의 기능 목적 정의: 캔버스 상에 렌더링되는 개별 박스\\n요소의 동작 로직 설명: 클릭으로 선택, 드래그로 이동, 리사이즈 핸들로 크기 조절\\n요소의 입출력 데이터 구조: 입력: box (객체). 출력: 위치/크기 변경 이벤트\\n요소의 경로정보: frontend/js/components/PreviewCanvas.js#box\\n요소의 수행해야 할 백엔드/JS 명령: JS: $emit(\\'select-box\\', id), Interact.js 드래그/리사이즈'">
                <div class="c-canvas-box__label" 
                     :style="{ backgroundColor: box.color }"
                     :data-js="'canvas-box-label-' + box.id"
                     :title="'Z-Index: ' + box.zIndex">
                    Z:{{ box.zIndex }}
                </div>
                <div class="c-canvas-box__handle c-canvas-box__handle--tl"
                     :data-js="'canvas-handle-tl-' + box.id"
                     title="좌상단 핸들"></div>
                <div class="c-canvas-box__handle c-canvas-box__handle--tr"
                     :data-js="'canvas-handle-tr-' + box.id"
                     title="우상단 핸들"></div>
                <div class="c-canvas-box__handle c-canvas-box__handle--bl"
                     :data-js="'canvas-handle-bl-' + box.id"
                     title="좌하단 핸들"></div>
                <div class="c-canvas-box__handle c-canvas-box__handle--br"
                     :data-js="'canvas-handle-br-' + box.id"
                     title="우하단 핸들"></div>
            </div>
            
            <div v-if="contextMenu" 
                 class="c-context-menu" 
                 :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}"
                 data-js="canvas-context-menu"
                 title="컨텍스트 메뉴"
                 data-dev="요소의 역할: 캔버스 박스 컨텍스트 메뉴
요소의 고유ID: component-canvas-context-menu
요소의 기능 목적 정의: 박스 관련 작업 메뉴 표시
요소의 동작 로직 설명: 우클릭 시 표시, 메뉴 항목 클릭 시 해당 액션 수행
요소의 입출력 데이터 구조: 입력: contextMenu(좌표, boxId). 출력: handleContextAction()
요소의 경로정보: frontend/js/components/PreviewCanvas.js#context-menu
요소의 수행해야 할 백엔드/JS 명령: JS: handleContextAction(action)">
                <div class="c-context-menu__item" 
                     @click="handleContextAction('top')"
                     data-js="canvas-context-top"
                     title="맨 위로"
                     data-dev="요소의 역할: 맨 위로 메뉴 항목
요소의 고유ID: component-canvas-context-top
요소의 기능 목적 정의: 박스를 최상단 레이어로 이동
요소의 동작 로직 설명: 클릭 시 박스 Z-Index 최대값으로 변경
요소의 입출력 데이터 구조: 입력: 클릭. 출력: handleContextAction('top')
요소의 경로정보: frontend/js/components/PreviewCanvas.js#context-top
요소의 수행해야 할 백엔드/JS 명령: JS: handleContextAction('top')">맨 위로</div>
                <div class="c-context-menu__item" 
                     @click="handleContextAction('delete')"
                     data-js="canvas-context-delete"
                     title="삭제"
                     data-dev="요소의 역할: 삭제 메뉴 항목
요소의 고유ID: component-canvas-context-delete
요소의 기능 목적 정의: 선택된 박스 삭제
요소의 동작 로직 설명: 클릭 시 $emit('remove-box') 호출
요소의 입출력 데이터 구조: 입력: 클릭. 출력: @remove-box 이벤트
요소의 경로정보: frontend/js/components/PreviewCanvas.js#context-delete
요소의 수행해야 할 백엔드/JS 명령: JS: $emit('remove-box', boxId)">삭제</div>
            </div>
        </div>
    `
};
