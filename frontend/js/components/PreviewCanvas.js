/**
 * PreviewCanvas.js
 * - 캔버스 위 레이어 박스 오버레이 전용 컴포넌트
 * - 박스 선택, 드래그, 리사이즈 처리
 * - 실제 캔버스 렌더링은 PreviewRenderer가 담당
 */

const PreviewCanvas = {
    name: 'PreviewCanvas',
    
    props: {
        vm: { type: Object, default: null },
        canvasBoxes: { type: Array, default: () => [] },
        canvasSize: { type: Object, default: () => ({ w: 1920, h: 1080 }) },
        selectedBoxId: { type: [String, Number, null], default: null }
    },
    
    emits: ['select-box'],
    
    data() {
        return {
            // 드래그 상태
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0,
            dragBoxStartX: 0,
            dragBoxStartY: 0,
            dragBoxId: null,
            
            // 리사이즈 상태
            isResizing: false,
            resizeHandle: null,
            resizeStartX: 0,
            resizeStartY: 0,
            resizeBoxStart: { x: 0, y: 0, w: 0, h: 0 },
            resizeBoxId: null
        };
    },
    
    computed: {
        // 현재 스케일 계산
        currentScale() {
            if (!this.$el || !this.$el.parentElement) return 1;
            const parent = this.$el.parentElement;
            const rect = parent.getBoundingClientRect();
            return rect.width / (this.canvasSize.w || 1920);
        }
    },
    
    methods: {
        /**
         * 박스 스타일 계산
         */
        getBoxStyle(box) {
            const isSelected = this.selectedBoxId === box.id;
            
            return {
                position: 'absolute',
                left: box.x + 'px',
                top: box.y + 'px',
                width: box.w + 'px',
                height: box.h + 'px',
                border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.3)',
                backgroundColor: box.type === 'text' ? 'transparent' : 'rgba(0,0,0,0.1)',
                cursor: 'move',
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            };
        },
        
        /**
         * 박스 라벨 스타일
         */
        getLabelStyle() {
            return {
                position: 'absolute',
                top: '2px',
                left: '2px',
                fontSize: '6px',
                padding: '1px 3px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                borderRadius: '2px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 1
            };
        },
        
        /**
         * 텍스트 박스 내용 스타일
         */
        getTextContentStyle(box) {
            const style = box.style || {};
            return {
                fontSize: (style.fontSize || 24) + 'px',
                fontWeight: style.fontWeight || 'normal',
                fontStyle: style.fontStyle || 'normal',
                textDecoration: style.textDecoration || 'none',
                color: style.color || '#ffffff',
                textAlign: style.textAlign || 'center',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: style.textAlign === 'left' ? 'flex-start' : 
                               style.textAlign === 'right' ? 'flex-end' : 'center',
                padding: '4px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                wordBreak: 'break-word'
            };
        },
        
        /**
         * 이미지 박스 스타일
         */
        getImageStyle() {
            return {
                width: '100%',
                height: '100%',
                objectFit: 'contain'
            };
        },
        
        /**
         * 박스 클릭 - 선택
         */
        handleBoxMouseDown(e, box) {
            e.stopPropagation();
            this.$emit('select-box', box.id);
            
            // 드래그 시작
            this.isDragging = true;
            this.dragBoxId = box.id;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragBoxStartX = box.x;
            this.dragBoxStartY = box.y;
            
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        },
        
        /**
         * 리사이즈 핸들 마우스다운
         */
        handleResizeMouseDown(e, box, handle) {
            e.stopPropagation();
            e.preventDefault();
            
            this.$emit('select-box', box.id);
            
            this.isResizing = true;
            this.resizeHandle = handle;
            this.resizeBoxId = box.id;
            this.resizeStartX = e.clientX;
            this.resizeStartY = e.clientY;
            this.resizeBoxStart = { x: box.x, y: box.y, w: box.w, h: box.h };
            
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        },
        
        /**
         * 마우스 이동 처리
         */
        handleMouseMove(e) {
            const scale = this.currentScale || 1;
            const dx = (e.clientX - (this.isDragging ? this.dragStartX : this.resizeStartX)) / scale;
            const dy = (e.clientY - (this.isDragging ? this.dragStartY : this.resizeStartY)) / scale;
            
            if (this.isDragging && this.dragBoxId !== null) {
                // 드래그 처리
                const box = this.canvasBoxes.find(b => b.id === this.dragBoxId);
                if (box) {
                    box.x = Math.round(this.dragBoxStartX + dx);
                    box.y = Math.round(this.dragBoxStartY + dy);
                }
            } else if (this.isResizing && this.resizeBoxId !== null) {
                // 리사이즈 처리
                const box = this.canvasBoxes.find(b => b.id === this.resizeBoxId);
                if (box) {
                    this.applyResize(box, dx, dy);
                }
            }
        },
        
        /**
         * 리사이즈 적용
         */
        applyResize(box, dx, dy) {
            const start = this.resizeBoxStart;
            const handle = this.resizeHandle;
            const minSize = 20;
            
            let newX = start.x;
            let newY = start.y;
            let newW = start.w;
            let newH = start.h;
            
            // 핸들별 리사이즈 로직
            if (handle.includes('l')) {
                newX = start.x + dx;
                newW = start.w - dx;
            }
            if (handle.includes('r')) {
                newW = start.w + dx;
            }
            if (handle.includes('t')) {
                newY = start.y + dy;
                newH = start.h - dy;
            }
            if (handle.includes('b')) {
                newH = start.h + dy;
            }
            
            // 최소 크기 제한
            if (newW < minSize) {
                if (handle.includes('l')) {
                    newX = start.x + start.w - minSize;
                }
                newW = minSize;
            }
            if (newH < minSize) {
                if (handle.includes('t')) {
                    newY = start.y + start.h - minSize;
                }
                newH = minSize;
            }
            
            box.x = Math.round(newX);
            box.y = Math.round(newY);
            box.w = Math.round(newW);
            box.h = Math.round(newH);
        },
        
        /**
         * 마우스 업 처리
         */
        handleMouseUp() {
            this.isDragging = false;
            this.isResizing = false;
            this.dragBoxId = null;
            this.resizeBoxId = null;
            this.resizeHandle = null;
            
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        },
        
        /**
         * 배경 클릭 - 선택 해제
         */
        handleBackgroundClick() {
            this.$emit('select-box', null);
        },
        
        /**
         * 리사이즈 핸들 위치 스타일
         */
        getHandleStyle(position) {
            const size = 8;
            const offset = -4;
            const base = {
                position: 'absolute',
                width: size + 'px',
                height: size + 'px',
                backgroundColor: '#3b82f6',
                border: '1px solid #fff',
                borderRadius: '2px',
                zIndex: 10
            };
            
            const positions = {
                'tl': { top: offset + 'px', left: offset + 'px', cursor: 'nwse-resize' },
                'tr': { top: offset + 'px', right: offset + 'px', cursor: 'nesw-resize' },
                'bl': { bottom: offset + 'px', left: offset + 'px', cursor: 'nesw-resize' },
                'br': { bottom: offset + 'px', right: offset + 'px', cursor: 'nwse-resize' },
                'tm': { top: offset + 'px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
                'bm': { bottom: offset + 'px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
                'ml': { top: '50%', left: offset + 'px', transform: 'translateY(-50%)', cursor: 'ew-resize' },
                'mr': { top: '50%', right: offset + 'px', transform: 'translateY(-50%)', cursor: 'ew-resize' }
            };
            
            return { ...base, ...positions[position] };
        }
    },
    
    beforeUnmount() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    },
    
    template: `
        <div 
            class="preview-canvas-overlay"
            style="position: absolute; inset: 0; pointer-events: auto;"
            @mousedown.self="handleBackgroundClick"
        >
            <!-- Layer Boxes -->
            <div
                v-for="box in canvasBoxes"
                :key="box.id"
                :data-box-id="box.id"
                :style="getBoxStyle(box)"
                @mousedown="handleBoxMouseDown($event, box)"
            >
                <!-- Label -->
                <div :style="getLabelStyle()">{{ box.label || box.type }}</div>
                
                <!-- Text Content -->
                <div v-if="box.type === 'text'" :style="getTextContentStyle(box)">
                    {{ box.text || 'Text' }}
                </div>
                
                <!-- Image Content -->
                <img 
                    v-else-if="box.type === 'image' && box.src" 
                    :src="box.src" 
                    :style="getImageStyle()"
                    draggable="false"
                />
                
                <!-- Video Placeholder -->
                <div 
                    v-else-if="box.type === 'video'" 
                    style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1a1a1a;"
                >
                    <i class="fa-solid fa-film" style="color: #666; font-size: 24px;"></i>
                </div>
                
                <!-- Resize Handles (Selected Only) -->
                <template v-if="selectedBoxId === box.id">
                    <div 
                        v-for="handle in ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'ml', 'mr']"
                        :key="handle"
                        :style="getHandleStyle(handle)"
                        @mousedown.stop="handleResizeMouseDown($event, box, handle)"
                    ></div>
                </template>
            </div>
        </div>
    `
};

// Vue 앱에 컴포넌트 등록
if (typeof window !== 'undefined') {
    window.PreviewCanvas = PreviewCanvas;
}
