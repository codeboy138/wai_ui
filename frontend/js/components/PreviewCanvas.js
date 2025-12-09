/**
 * ==========================================
 * PreviewCanvas.js - 프리뷰 캔버스 컴포넌트
 * 
 * 역할: 캔버스 박스 렌더링 및 Interact.js 드래그/리사이즈
 * 경로: frontend/js/components/PreviewCanvas.js
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
                        
                        const guideV = document.getElementById('canvas-guide-vertical');
                        if (guideV) {
                            const cx = x + (e.rect.width / 2);
                            const centerX = 3840 / 2;
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
    
    template: \`
        <div class="c-canvas" 
             @click="contextMenu = null; $emit('select-box', null)"
             title="캔버스 영역">
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
                 :title="'박스 (Z:' + box.zIndex + ')'">
                <div class="c-canvas-box__label" 
                     :style="{ backgroundColor: box.color }"
                     :title="'Z-Index: ' + box.zIndex">
                    Z:{{ box.zIndex }}
                </div>
                <div class="c-canvas-box__handle c-canvas-box__handle--tl" title="좌상단 핸들"></div>
                <div class="c-canvas-box__handle c-canvas-box__handle--tr" title="우상단 핸들"></div>
                <div class="c-canvas-box__handle c-canvas-box__handle--bl" title="좌하단 핸들"></div>
                <div class="c-canvas-box__handle c-canvas-box__handle--br" title="우하단 핸들"></div>
            </div>
            
            <div v-if="contextMenu" 
                 class="c-context-menu" 
                 :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}"
                 title="컨텍스트 메뉴">
                <div class="c-context-menu__item" 
                     @click="handleContextAction('top')"
                     title="맨 위로">맨 위로</div>
                <div class="c-context-menu__item" 
                     @click="handleContextAction('delete')"
                     title="삭제">삭제</div>
            </div>
        </div>
    \`
};
