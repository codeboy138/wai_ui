// Preview Canvas Component - 레이어 박스 오버레이
// 캔버스 위에 레이어 박스들을 표시하고 선택/드래그 기능 제공

const PreviewCanvas = {
    props: {
        canvasBoxes: { type: Array, default: () => [] },
        canvasSize: { type: Object, default: () => ({ w: 1920, h: 1080 }) },
        selectedBoxId: { type: String, default: null }
    },
    emits: ['select-box'],
    template: `
        <div id="preview-canvas-overlay" class="absolute inset-0 pointer-events-none" style="z-index: 10;">
            <!-- 레이어 박스들 -->
            <div 
                v-for="box in visibleBoxes" 
                :key="box.id"
                class="absolute pointer-events-auto cursor-move"
                :class="{ 'ring-2 ring-ui-accent': selectedBoxId === box.id }"
                :style="getBoxStyle(box)"
                @mousedown.stop="onBoxMouseDown($event, box)"
            >
                <!-- 레이어 라벨 -->
                <div class="absolute -top-4 left-0 bg-black/80 text-white rounded px-1 whitespace-nowrap pointer-events-none" style="font-size: 6px;">
                    {{ box.layerName || box.slotKey || 'Layer' }}
                </div>
                
                <!-- 레이어 내용 -->
                <div class="w-full h-full overflow-hidden" :style="{ backgroundColor: box.layerBgColor || 'rgba(255,255,255,0.05)' }">
                    <!-- 텍스트 레이어 -->
                    <div v-if="box.rowType === 'TXT' && box.textContent" class="w-full h-full flex items-center justify-center p-2" :style="getTextStyle(box)">
                        {{ box.textContent }}
                    </div>
                    <!-- 미디어 레이어 -->
                    <img v-else-if="box.mediaSrc && box.mediaType === 'image'" :src="box.mediaSrc" class="w-full h-full object-contain" draggable="false" />
                    <video v-else-if="box.mediaSrc && box.mediaType === 'video'" :src="box.mediaSrc" class="w-full h-full object-contain" muted></video>
                    <!-- 빈 레이어 표시 -->
                    <div v-else class="w-full h-full flex items-center justify-center opacity-30">
                        <i class="fa-solid fa-layer-group text-white/50"></i>
                    </div>
                </div>
                
                <!-- 선택 시 리사이즈 핸들 -->
                <template v-if="selectedBoxId === box.id && !box.isLocked">
                    <div class="absolute w-2 h-2 bg-ui-accent border border-white rounded-sm cursor-nwse-resize pointer-events-auto" style="top: -4px; left: -4px;" @mousedown.stop="startResize($event, box, 'tl')"></div>
                    <div class="absolute w-2 h-2 bg-ui-accent border border-white rounded-sm cursor-nesw-resize pointer-events-auto" style="top: -4px; right: -4px;" @mousedown.stop="startResize($event, box, 'tr')"></div>
                    <div class="absolute w-2 h-2 bg-ui-accent border border-white rounded-sm cursor-nesw-resize pointer-events-auto" style="bottom: -4px; left: -4px;" @mousedown.stop="startResize($event, box, 'bl')"></div>
                    <div class="absolute w-2 h-2 bg-ui-accent border border-white rounded-sm cursor-nwse-resize pointer-events-auto" style="bottom: -4px; right: -4px;" @mousedown.stop="startResize($event, box, 'br')"></div>
                </template>
            </div>
        </div>
    `,
    data() {
        return {
            isDragging: false,
            isResizing: false,
            dragBox: null,
            resizeHandle: null,
            startMouseX: 0,
            startMouseY: 0,
            startBoxX: 0,
            startBoxY: 0,
            startBoxW: 0,
            startBoxH: 0
        };
    },
    computed: {
        visibleBoxes() {
            return this.canvasBoxes.filter(box => !box.isHidden);
        }
    },
    mounted() {
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    },
    methods: {
        getBoxStyle(box) {
            return {
                left: (box.x || 0) + 'px',
                top: (box.y || 0) + 'px',
                width: (box.w || 100) + 'px',
                height: (box.h || 100) + 'px',
                zIndex: box.zIndex || 1,
                opacity: box.isHidden ? 0.3 : 1,
                border: this.selectedBoxId === box.id ? 'none' : '1px solid rgba(255,255,255,0.1)'
            };
        },
        
        getTextStyle(box) {
            const style = box.textStyle || {};
            return {
                fontFamily: style.fontFamily || 'Pretendard, sans-serif',
                fontSize: (style.fontSize || 24) + 'px',
                color: style.fillColor || '#ffffff',
                textAlign: 'center',
                textShadow: style.shadow ? 
                    `${style.shadow.offsetX || 0}px ${style.shadow.offsetY || 0}px ${style.shadow.blur || 0}px ${style.shadow.color || 'transparent'}` : 
                    'none',
                WebkitTextStroke: style.strokeWidth ? `${style.strokeWidth}px ${style.strokeColor || '#000'}` : 'none'
            };
        },
        
        onBoxMouseDown(e, box) {
            if (box.isLocked) return;
            
            this.$emit('select-box', box.id);
            
            this.isDragging = true;
            this.dragBox = box;
            this.startMouseX = e.clientX;
            this.startMouseY = e.clientY;
            this.startBoxX = box.x || 0;
            this.startBoxY = box.y || 0;
            
            // 부모에 드래그 중임을 알림
            if (window.vm) {
                window.vm.isBoxDragging = true;
            }
        },
        
        startResize(e, box, handle) {
            this.isResizing = true;
            this.dragBox = box;
            this.resizeHandle = handle;
            this.startMouseX = e.clientX;
            this.startMouseY = e.clientY;
            this.startBoxX = box.x || 0;
            this.startBoxY = box.y || 0;
            this.startBoxW = box.w || 100;
            this.startBoxH = box.h || 100;
            
            if (window.vm) {
                window.vm.isBoxDragging = true;
            }
        },
        
        onMouseMove(e) {
            if (!this.dragBox) return;
            
            const scale = window.vm?.canvasScale || 1;
            const dx = (e.clientX - this.startMouseX) / scale;
            const dy = (e.clientY - this.startMouseY) / scale;
            
            if (this.isDragging) {
                const newX = this.startBoxX + dx;
                const newY = this.startBoxY + dy;
                
                if (window.vm && typeof window.vm.updateBoxPosition === 'function') {
                    window.vm.updateBoxPosition(this.dragBox.id, newX, newY);
                }
            }
            
            if (this.isResizing) {
                let newX = this.startBoxX;
                let newY = this.startBoxY;
                let newW = this.startBoxW;
                let newH = this.startBoxH;
                
                const handle = this.resizeHandle;
                
                if (handle.includes('r')) {
                    newW = Math.max(20, this.startBoxW + dx);
                }
                if (handle.includes('l')) {
                    newW = Math.max(20, this.startBoxW - dx);
                    newX = this.startBoxX + (this.startBoxW - newW);
                }
                if (handle.includes('b')) {
                    newH = Math.max(20, this.startBoxH + dy);
                }
                if (handle.includes('t')) {
                    newH = Math.max(20, this.startBoxH - dy);
                    newY = this.startBoxY + (this.startBoxH - newH);
                }
                
                if (window.vm && typeof window.vm.updateBoxPosition === 'function') {
                    window.vm.updateBoxPosition(this.dragBox.id, newX, newY, newW, newH);
                }
            }
        },
        
        onMouseUp() {
            this.isDragging = false;
            this.isResizing = false;
            this.dragBox = null;
            this.resizeHandle = null;
            
            if (window.vm) {
                window.vm.isBoxDragging = false;
            }
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
