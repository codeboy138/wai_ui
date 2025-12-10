// Preview Canvas Component
const PreviewCanvas = {
    props: ['canvasBoxes', 'selectedBoxId'],
    template: `
        <div
            id="preview-canvas-overlay-root"
            ref="container"
            class="absolute inset-0 z-30 pointer-events-none"
            @click="contextMenu = null; $emit('select-box', null)"
        >
            <div
                v-for="box in canvasBoxes"
                :key="box.id"
                :id="'preview-canvas-box-' + box.id"
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
                data-action="js:selectCanvasBox"
            >
                <div
                    class="canvas-label"
                    :style="{ backgroundColor: box.color }"
                >
                    Z:{{ box.zIndex }}
                </div>
                <div class="box-handle bh-tl"></div>
                <div class="box-handle bh-tr"></div>
                <div class="box-handle bh-bl"></div>
                <div class="box-handle bh-br"></div>
            </div>

            <div
                v-if="contextMenu"
                id="preview-canvas-context-menu"
                class="context-menu pointer-events-auto"
                :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
            >
                <div
                    id="preview-canvas-context-top-btn"
                    class="ctx-item"
                    @click="handleContextAction('top')"
                    data-action="js:canvasContextBringToFront"
                >
                    맨 위로
                </div>
                <div
                    id="preview-canvas-context-delete-btn"
                    class="ctx-item"
                    @click="handleContextAction('delete')"
                    data-action="js:canvasContextDelete"
                >
                    삭제
                </div>
            </div>
        </div>
    `,
    data() { 
        return { contextMenu: null } 
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
            
            // 드래그
            interact('.canvas-box').draggable({
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                listeners: {
                    move(e) {
                        const target = e.target;
                        const scaler = document.getElementById('preview-canvas-scaler');
                        const scaleMatch = scaler && scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let x = (parseFloat(target.getAttribute('data-x')) || 0) + (e.dx / scale);
                        let y = (parseFloat(target.getAttribute('data-y')) || 0) + (e.dy / scale);
                        
                        const cx = x + (e.rect.width / 2); 
                        const centerX = 3840 / 2;
                        const guideV = document.getElementById('preview-guide-v');
                        if (guideV) {
                            guideV.style.display = Math.abs(cx - centerX) < 20 ? 'block' : 'none';
                        }

                        target.style.transform = `translate(${x}px, ${y}px)`; 
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end(e) {
                        const guideV = document.getElementById('preview-guide-v');
                        if (guideV) {
                            guideV.style.display = 'none';
                        }

                        const boxId = e.target.id.replace('preview-canvas-box-', '');
                        const dx = parseFloat(e.target.getAttribute('data-x')) || 0;
                        const dy = parseFloat(e.target.getAttribute('data-y')) || 0;
                        
                        self.$parent.updateBoxPosition(boxId, dx, dy, e.rect.width, e.rect.height);
                        
                        e.target.removeAttribute('data-x'); 
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = 'translate(0, 0)'; 
                    }
                }
            })
            // 리사이즈
            .resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [
                    interact.modifiers.restrictEdges({ outer: 'parent' })
                ],
                listeners: {
                    move(e) {
                        const scaler = document.getElementById('preview-canvas-scaler');
                        const scaleMatch = scaler && scaler.style.transform.match(/scale\(([^)]+)\)/);
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
                    end(e) {
                        const scaler = document.getElementById('preview-canvas-scaler');
                        const scaleMatch = scaler && scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        const boxId = e.target.id.replace('preview-canvas-box-', '');
                        const dx = parseFloat(e.target.dataset.x) || 0;
                        const dy = parseFloat(e.target.dataset.y) || 0;
                        
                        self.$parent.updateBoxPosition(
                            boxId,
                            dx,
                            dy,
                            e.rect.width / scale,
                            e.rect.height / scale,
                            true
                        ); 

                        e.target.removeAttribute('data-x'); 
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = 'translate(0, 0)'; 
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
            if (!this.contextMenu) return;

            if (action === 'delete') {
                // 상위(AppRoot)로 삭제 이벤트 전달
                this.$emit('remove-box', this.contextMenu.boxId);
            }
            // 'top' 액션은 추후 zIndex 조정 기능에 연결 예정
            this.contextMenu = null;
        }
    }
};
