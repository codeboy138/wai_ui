// Preview Canvas Component - DOM 직접 제어 + 단일 Composition(px) 좌표계 최종본
// - 상호작용 기준: #preview-canvas-scaler 내부 DOM 픽셀 (Composition Space)
// - 드래그/리사이즈 동안에는 Vue state(AppRoot.canvasBoxes)를 건드리지 않고,
//   박스 DOM(style.left/top/width/height)만 직접 수정
// - 마우스 업(mouseup) 시점에만 px 값을 AppRoot.updateBoxPosition(id, x, y, w, h)에 커밋
//   → AppRoot가 내부에서 캔버스 경계 clamp + 0~1 ratio(nx,ny,nw,nh) 갱신
//
// 이 방식이면 AppRoot의 보정 로직이 드래그 중간에 개입하지 못하므로,
// "모서리를 안쪽으로 끌면 커서만 움직이고 모서리는 제자리" 같은 현상은
// PreviewCanvas 내부 로직 외에는 발생할 수 없다.

console.log('[PreviewCanvas] script loaded (dom-direct final)');

const PreviewCanvas = {
    props: ['canvasBoxes', 'selectedBoxId'],
    template: `
        <div
            id="preview-canvas-overlay-root"
            ref="container"
            class="absolute inset-0 z-30 pointer-events-none"
            @click="$emit('select-box', null)"
        >
            <div
                v-for="box in canvasBoxes"
                :key="box.id"
                :id="'preview-canvas-box-' + box.id"
                class="canvas-box pointer-events-auto"
                :class="{ 'selected': selectedBoxId === box.id }"
                :style="boxStyle(box)"
                @mousedown.stop="onBoxMouseDown($event, box)"
                @mousemove.stop="onBoxMouseMove($event, box)"
                @mouseleave="onBoxMouseLeave($event)"
                @contextmenu.prevent="openLayerConfig(box.id)"
                data-action="js:selectCanvasBox"
            >
                <!-- 텍스트 박스 -->
                <div
                    v-if="box.rowType === 'TXT'"
                    class="canvas-text-content"
                    :style="textStyle(box)"
                >
                    {{ effectiveText(box) }}
                </div>

                <!-- 모서리 ㄱ자 핸들 (리사이즈) -->
                <div
                    class="box-handle bh-tl"
                    :style="handleStyle(box, 'tl')"
                    @mousedown.stop="onHandleMouseDown($event, box, 'tl')"
                ></div>
                <div
                    class="box-handle bh-tr"
                    :style="handleStyle(box, 'tr')"
                    @mousedown.stop="onHandleMouseDown($event, box, 'tr')"
                ></div>
                <div
                    class="box-handle bh-bl"
                    :style="handleStyle(box, 'bl')"
                    @mousedown.stop="onHandleMouseDown($event, box, 'bl')"
                ></div>
                <div
                    class="box-handle bh-br"
                    :style="handleStyle(box, 'br')"
                    @mousedown.stop="onHandleMouseDown($event, box, 'br')"
                ></div>

                <!-- 레이어 레이블: index.html 의 .canvas-label 기본 스타일 사용 -->
                <div
                    class="canvas-label"
                    :style="labelStyle(box)"
                >
                    {{ labelText(box) }}
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            dragMode: null,       // 'move' | 'resize' | null
            dragBoxId: null,

            // mousedown 시점 마우스(client) 좌표
            dragStartMouseClient: { x: 0, y: 0 },

            // mousedown 시점 박스 DOM 좌표 (scaler 기준 px)
            dragStartDom: { left: 0, top: 0, width: 0, height: 0 },

            // 어느 코너를 잡았는지
            resizeHandlePos: null, // 'tl' | 'tr' | 'bl' | 'br'

            // 드래그 중 실제로 조작하는 DOM 요소
            activeBoxEl: null
        };
    },
    beforeUnmount() {
        this.stopGlobalDragListeners();
        document.body.style.cursor = '';
    },
    methods: {
        // ---------- 전역 드래그 리스너 ----------
        startGlobalDragListeners() {
            this.stopGlobalDragListeners();
            this._mouseMoveHandler = (ev) => this.handleMouseMove(ev);
            this._mouseUpHandler = (ev) => this.handleMouseUp(ev);
            window.addEventListener('mousemove', this._mouseMoveHandler);
            window.addEventListener('mouseup', this._mouseUpHandler);
        },
        stopGlobalDragListeners() {
            if (this._mouseMoveHandler) {
                window.removeEventListener('mousemove', this._mouseMoveHandler);
                this._mouseMoveHandler = null;
            }
            if (this._mouseUpHandler) {
                window.removeEventListener('mouseup', this._mouseUpHandler);
                this._mouseUpHandler = null;
            }
        },

        // ---------- 공통: client → scaler 내부 좌표(px) ----------
        clientToCanvas(e) {
            const scaler = document.getElementById('preview-canvas-scaler');
            if (!scaler) return { x: 0, y: 0, rect: null };
            const rect = scaler.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            return { x, y, rect };
        },

        // ---------- 텍스트 ----------
        defaultTextMessage() {
            return '현재의 레이어에 적용할\\n텍스트 스타일을 설정하세요';
        },
        effectiveText(box) {
            if (box.textContent && box.textContent.trim().length > 0) {
                return box.textContent;
            }
            return this.defaultTextMessage();
        },

        // ---------- 박스 / 텍스트 스타일 ----------
        boxStyle(box) {
            // 초기 렌더용 스타일 (드래그 중에는 DOM 직접 제어)
            return {
                display: box.isHidden ? 'none' : 'block',
                position: 'absolute',
                left: (box.x || 0) + 'px',
                top: (box.y || 0) + 'px',
                width: (box.w || 0) + 'px',
                height: (box.h || 0) + 'px',
                borderColor: box.color,
                borderStyle: 'dashed',
                borderWidth: '2px',
                boxSizing: 'border-box',
                zIndex: box.zIndex,
                backgroundColor: box.layerBgColor || '#000000',
                cursor: 'inherit'
            };
        },

        textStyle(box) {
            const ts = box.textStyle || {};
            const parent = this.$parent;
            const baseH = 1080;
            let scale = 1;
            if (parent && parent.canvasSize && parent.canvasSize.h) {
                scale = parent.canvasSize.h / baseH;
                if (!Number.isFinite(scale) || scale <= 0) scale = 1;
            }

            const baseFont = ts.fontSize || 48;
            const fontSize = baseFont * scale;

            const hAlign = ts.textAlign || 'center';
            const vAlign = ts.vAlign   || 'middle';

            let justifyContent = 'center';
            if (hAlign === 'left')  justifyContent = 'flex-start';
            if (hAlign === 'right') justifyContent = 'flex-end';

            let alignItems = 'center';
            if (vAlign === 'top')    alignItems = 'flex-start';
            if (vAlign === 'bottom') alignItems = 'flex-end';

            return {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                padding: '4px',
                boxSizing: 'border-box',

                display: 'flex',
                alignItems,
                justifyContent,
                textAlign: hAlign,

                transform: 'none',

                color: ts.fillColor || '#ffffff',
                fontFamily: ts.fontFamily || 'Pretendard, system-ui, sans-serif',
                fontSize: fontSize + 'px',
                lineHeight: (ts.lineHeight || 1.2),
                backgroundColor: ts.backgroundColor || 'transparent',
                WebkitTextStrokeColor: ts.strokeColor || 'transparent',
                WebkitTextStrokeWidth: ((ts.strokeWidth || 0) * scale) + 'px',
                whiteSpace: 'pre-wrap',
                overflow: 'hidden'
            };
        },

        // ---------- 리사이즈 핸들 ----------
        handleStyle(box, pos) {
            const size = 14;
            const thickness = 3;
            const color = box.color || '#ffffff';

            const style = {
                position: 'absolute',
                width: size + 'px',
                height: size + 'px',
                boxSizing: 'border-box',
                borderColor: color,
                pointerEvents: 'auto',
                zIndex: (box.zIndex || 0) + 3,
                backgroundColor: 'rgba(0,0,0,0.45)'
            };

            if (pos === 'tl') {
                style.left = '-4px';
                style.top = '-4px';
                style.borderLeft = thickness + 'px solid ' + color;
                style.borderTop = thickness + 'px solid ' + color;
                style.cursor = 'nwse-resize';
            } else if (pos === 'tr') {
                style.right = '-4px';
                style.top = '-4px';
                style.borderRight = thickness + 'px solid ' + color;
                style.borderTop = thickness + 'px solid ' + color;
                style.cursor = 'nesw-resize';
            } else if (pos === 'bl') {
                style.left = '-4px';
                style.bottom = '-4px';
                style.borderLeft = thickness + 'px solid ' + color;
                style.borderBottom = thickness + 'px solid ' + color;
                style.cursor = 'nesw-resize';
            } else if (pos === 'br') {
                style.right = '-4px';
                style.bottom = '-4px';
                style.borderRight = thickness + 'px solid ' + color;
                style.borderBottom = thickness + 'px solid ' + color;
                style.cursor = 'nwse-resize';
            }

            return style;
        },

        // ---------- 레이블 ----------
        getColLabel(box) {
            const role = box.colRole || '';
            if (role === 'full') return '전체';
            if (role === 'high') return '상단';
            if (role === 'mid')  return '중단';
            if (role === 'low')  return '하단';
            return role || '';
        },
        getRowLabel(rowType) {
            if (rowType === 'EFF') return '이펙트';
            if (rowType === 'TXT') return '텍스트';
            if (rowType === 'BG')  return '배경';
            return rowType || '';
        },
        labelText(box) {
            const col = this.getColLabel(box);
            const row = this.getRowLabel(box.rowType);
            return `${col || ''} ${row || ''}`.trim();
        },
        labelStyle(box) {
            return {
                backgroundColor: box.color || '#22c55e',
                color: '#ffffff',
                left: '0',
                right: '0',
                textAlign: 'center'
            };
        },

        openLayerConfig(boxId) {
            if (this.$parent && typeof this.$parent.openLayerConfig === 'function') {
                this.$parent.openLayerConfig(boxId);
            }
        },

        // ---------- 드래그 시작 (move) ----------
        onBoxMouseDown(e, box) {
            e.preventDefault();
            this.$emit('select-box', box.id);

            const parent = this.$parent;
            if (!parent) return;

            parent.isBoxDragging = true;

            const scaler = document.getElementById('preview-canvas-scaler');
            const boxEl = e.currentTarget;
            if (!scaler || !boxEl) return;

            const scalerRect = scaler.getBoundingClientRect();
            const boxRect = boxEl.getBoundingClientRect();

            this.dragStartDom = {
                left: boxRect.left - scalerRect.left,
                top: boxRect.top - scalerRect.top,
                width: boxRect.width,
                height: boxRect.height
            };

            this.dragStartMouseClient = { x: e.clientX, y: e.clientY };
            this.dragBoxId = box.id;
            this.dragMode = 'move';
            this.resizeHandlePos = null;
            this.activeBoxEl = boxEl;

            document.body.style.cursor = 'move';
            this.startGlobalDragListeners();
        },

        // ---------- 드래그 시작 (resize) ----------
        onHandleMouseDown(e, box, pos) {
            e.preventDefault();
            this.$emit('select-box', box.id);

            const parent = this.$parent;
            if (!parent) return;

            parent.isBoxDragging = true;

            const scaler = document.getElementById('preview-canvas-scaler');
            const boxEl = e.currentTarget.parentElement;
            if (!scaler || !boxEl) return;

            const scalerRect = scaler.getBoundingClientRect();
            const boxRect = boxEl.getBoundingClientRect();

            this.dragStartDom = {
                left: boxRect.left - scalerRect.left,
                top: boxRect.top - scalerRect.top,
                width: boxRect.width,
                height: boxRect.height
            };

            this.dragStartMouseClient = { x: e.clientX, y: e.clientY };
            this.dragBoxId = box.id;
            this.dragMode = 'resize';
            this.resizeHandlePos = pos;
            this.activeBoxEl = boxEl;

            if (pos === 'tl' || pos === 'br') {
                document.body.style.cursor = 'nwse-resize';
            } else {
                document.body.style.cursor = 'nesw-resize';
            }

            this.startGlobalDragListeners();
        },

        onBoxMouseMove(e, box) {
            // hover 시 별도 커서 변경 없음
        },

        onBoxMouseLeave(e) {
            // nothing
        },

        // ---------- 실제 이동/리사이즈 처리 (DOM 직접 제어) ----------
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId || !this.activeBoxEl) return;

            const scaler = document.getElementById('preview-canvas-scaler');
            if (!scaler) return;

            const dx = e.clientX - this.dragStartMouseClient.x;
            const dy = e.clientY - this.dragStartMouseClient.y;

            const s = this.dragStartDom;
            let left  = s.left;
            let top   = s.top;
            let width = s.width;
            let height = s.height;

            if (this.dragMode === 'move') {
                left = s.left + dx;
                top  = s.top  + dy;
            } else if (this.dragMode === 'resize') {
                switch (this.resizeHandlePos) {
                    case 'tl':
                        left   = s.left + dx;
                        top    = s.top  + dy;
                        width  = s.width  - dx;
                        height = s.height - dy;
                        break;
                    case 'tr':
                        left   = s.left;
                        top    = s.top  + dy;
                        width  = s.width  + dx;
                        height = s.height - dy;
                        break;
                    case 'bl':
                        left   = s.left + dx;
                        top    = s.top;
                        width  = s.width  - dx;
                        height = s.height + dy;
                        break;
                    case 'br':
                        left   = s.left;
                        top    = s.top;
                        width  = s.width  + dx;
                        height = s.height + dy;
                        break;
                }

                // 최소 크기(px) 보정 (핸들 기준이 아니라 그냥 숫자만 보호)
                const minW = 4;
                const minH = 4;
                if (width < minW)  width = minW;
                if (height < minH) height = minH;
            }

            // DOM 스타일 즉시 반영 -> PreviewCanvas 내 상호작용은 이 값만 믿음
            const el = this.activeBoxEl;
            el.style.left   = left + 'px';
            el.style.top    = top  + 'px';
            el.style.width  = width  + 'px';
            el.style.height = height + 'px';
        },

        // ---------- 드래그 종료: AppRoot 에 px 커밋 ----------
        handleMouseUp() {
            this.stopGlobalDragListeners();
            document.body.style.cursor = '';

            const parent = this.$parent;
            if (parent) {
                parent.isBoxDragging = false;
            }

            if (this.dragBoxId && this.activeBoxEl) {
                const scaler = document.getElementById('preview-canvas-scaler');
                if (scaler) {
                    const scalerRect = scaler.getBoundingClientRect();
                    const boxRect = this.activeBoxEl.getBoundingClientRect();

                    const x = boxRect.left - scalerRect.left;
                    const y = boxRect.top  - scalerRect.top;
                    const w = boxRect.width;
                    const h = boxRect.height;

                    if (typeof parent.updateBoxPosition === 'function') {
                        parent.updateBoxPosition(this.dragBoxId, x, y, w, h);
                    }
                }
            }

            this.dragMode = null;
            this.dragBoxId = null;
            this.resizeHandlePos = null;
            this.activeBoxEl = null;
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
