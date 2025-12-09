// Preview Canvas Component
const PreviewCanvas = {
    props: ['canvasBoxes', 'selectedBoxId'],
    template: `
        <div ref="container" class="absolute inset-0 z-30 pointer-events-none" @click="contextMenu = null; $emit('select-box', null)">
            <div v-for="box in canvasBoxes" :key="box.id" 
                 :id="'box-' + box.id"
                 class="canvas-box pointer-events-auto"
                 :class="{ 'selected': selectedBoxId === box.id }"
                 :style="{ left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px', borderColor: box.color, zIndex: box.zIndex }"
                 @mousedown.stop="$emit('select-box', box.id)"
                 @contextmenu.prevent="handleContext($event, box.id)"
                 data-x="0" data-y="0"
                 :data-dev="'ID: box-' + box.id + '\\nComp: CanvasBox\\nZ: ' + box.zIndex"
            >
                <div class="canvas-label" :style="{ backgroundColor: box.color }">Z:{{ box.zIndex }}</div>
                <div class="box-handle bh-tl"></div><div class="box-handle bh-tr"></div><div class="box-handle bh-bl"></div><div class="box-handle bh-br"></div>
            </div>
            <div v-if="contextMenu" class="context-menu pointer-events-auto" :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}">
                <div class="ctx-item" @click="handleContextAction('top')">맨 위로</div>
                <div class="ctx-item" @click="handleContextAction('delete')">삭제</div>
            </div>
        </div>
    `,
    data() { return { contextMenu: null } },
    mounted() { this.initInteract(); },
    updated() { this.initInteract(); }, 
    methods: {
        initInteract() {
            const self = this;
            interact('.canvas-box').unset(); 
            
            interact('.canvas-box').draggable({
                modifiers: [ interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true }) ],
                listeners: {
                    move(e) {
                        const target = e.target;
                        const scaler = document.getElementById('canvas-scaler');
                        const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let x = (parseFloat(target.getAttribute('data-x')) || 0) + (e.dx / scale);
                        let y = (parseFloat(target.getAttribute('data-y')) || 0) + (e.dy / scale);
                        
                        const cx = x + (e.rect.width/2); 
                        const centerX = 3840/2;
                        document.getElementById('guide-v').style.display = Math.abs(cx - centerX) < 20 ? 'block' : 'none';

                        target.style.transform = `translate(${x}px, ${y}px)`; 
                        target.setAttribute('data-x', x); target.setAttribute('data-y', y);
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
                modifiers: [ interact.modifiers.restrictEdges({ outer: 'parent' }) ],
                listeners: {
                    move: function (e) {
                        const scaler = document.getElementById('canvas-scaler');
                        const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let { x, y } = e.target.dataset;
                        x = (parseFloat(x) || 0) + (e.deltaRect.left / scale);
                        y = (parseFloat(y) || 0) + (e.deltaRect.top / scale);
                        Object.assign(e.target.style, { width: `${e.rect.width/scale}px`, height: `${e.rect.height/scale}px`, transform: `translate(${x}px, ${y}px)` });
                        Object.assign(e.target.dataset, { x, y });
                    },
                    end: function(e) {
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
    }
};
