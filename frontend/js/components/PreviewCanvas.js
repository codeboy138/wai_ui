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
            interact('.canvas-box').unset();
            
            interact('.canvas-box').draggable({
                modifiers: [interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true })],
                listeners: {
                    move(e) {
                        const target = e.target;
                        const scaler = document.getElementById('canvas-scaler');
                        const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let x = (parseFloat(target.getAttribute('data-x')) || 0) + (e.dx / scale);
                        let y = (parseFloat(target.getAttribute('data-y')) || 0) + (e.dy / scale);
                        
                        const cx = x + (e.rect.width / 2);
                        const centerX = 3840 / 2;
                        document.getElementById('guide-v').style.display = Math.abs(cx - centerX) < 20 ? 'block' : 'none';
                        
                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end(e) {
                        document.getElementById('guide-v').style.display = 'none';
                        
                        const boxId = e.target.id.replace('box-', '');
                        const dx = parseFloat(e.target.getAttribute('data-x')) || 0;
                        const dy = parseFloat(e.target.getAttribute('data-y')) || 0;
                        
                        self.$parent.updateBoxPosition(boxId, dx, dy, e.rect.width, e.rect.height);
                        
                        e.target.removeAttribute('data-x');
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = `translate(0, 0)`;
                    }
                }
            }).resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })],
                listeners: {
                    move: function (e) {
                        const scaler = document.getElementById('canvas-scaler');
                        const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let { x, y } = e.target.dataset;
                        x = (parseFloat(x) || 0) + (e.deltaRect.left / scale);
                        y = (parseFloat(y) || 0) + (e.deltaRect.top / scale);
                        Object.assign(e.target.style, {
                            width: `${e.rect.width / scale}px`,
                            height: `${e.rect.height / scale}px`,
                            transform: `translate(${x}px, ${y}px)`
                        });
                        Object.assign(e.target.dataset, { x, y });
                    },
                    end: function (e) {
                        const scaler = document.getElementById('canvas-scaler');
                        const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        const boxId = e.target.id.replace('box-', '');
                        const dx = parseFloat(e.target.dataset.x) || 0;
                        const dy = parseFloat(e.target.dataset.y) || 0;
                        
                        self.$parent.updateBoxPosition(boxId, dx, dy, e.rect.width / scale, e.rect.height / scale, true);
                        e.target.removeAttribute('data-x');
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = `translate(0, 0)`;
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
             class="absolute inset-0 z-30 pointer-events-none" 
             @click="contextMenu = null; $emit('select-box', null)"
             data-dev="요소의 역할: 캔버스 박스 컨테이너
요소의 고유ID: preview-canvas-root
요소의 기능 목적 정의: 캔버스 박스 렌더링 및 상호작용 관리
요소의 동작 로직 설명: 박스 클릭으로 선택, 드래그로 이동, 리사이즈 핸들로 크기 조절, 우클릭으로 컨텍스트 메뉴
요소의 입출력 데이터 구조: 입력: canvasBoxes(배열), selectedBoxId(문자열). 출력: @select-box, @remove-box 이벤트
요소의 경로정보: frontend/js/components/PreviewCanvas.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: initInteract(), $emit('select-box'), $emit('remove-box')">
            <div v-for="box in canvasBoxes" 
                 :key="box.id" 
                 :id="'box-' + box.id"
                 class="canvas-box pointer-events-auto"
                 :class="{ 'selected': selectedBoxId === box.id }"
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
                 :data-dev="'요소의 역할: 캔버스 박스\\n요소의 고유ID: box-' + box.id + '\\n요소의 기능 목적 정의: 캔버스 상에 렌더링되는 개별 박스\\n요소의 동작 로직 설명: 클릭으로 선택, 드래그로 이동, 리사이즈 핸들로 크기 조절\\n요소의 입출력 데이터 구조: 입력: box (객체). 출력: 위치/크기 변경 이벤트\\n요소의 경로정보: frontend/js/components/PreviewCanvas.js#box\\n요소의 수행해야 할 백엔드/JS 명령: JS: $emit(\\'select-box\\', id), Interact.js 드래그/리사이즈'">
                <div class="canvas-label" :style="{ backgroundColor: box.color }">
                    Z:{{ box.zIndex }}
                </div>
                <div class="box-handle bh-tl"></div>
                <div class="box-handle bh-tr"></div>
                <div class="box-handle bh-bl"></div>
                <div class="box-handle bh-br"></div>
            </div>
            
            <div v-if="contextMenu" 
                 class="context-menu pointer-events-auto" 
                 :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}">
                <div class="ctx-item" @click="handleContextAction('top')">맨 위로</div>
                <div class="ctx-item" @click="handleContextAction('delete')">삭제</div>
            </div>
        </div>
    `
};
