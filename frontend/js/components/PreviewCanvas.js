// Preview Canvas Component - 단일 Composition(px) 좌표계 기반 최종본
// - 기준 좌표: #preview-canvas-scaler 내부 DOM 픽셀 (Composition Space)
// - 이동(move): 시작 박스(x0,y0) + 마우스 델타(dx,dy)
// - 리사이즈(resize):
//     - 시작 박스(x0,y0,w0,h0) + dx,dy 직접 적용 (핸들별로 좌우/상하 엣지 이동)
//     - 최소 크기 보정은 w,h 에만 적용 (x,y는 건드리지 않음)
//       → 모서리를 레이어 박스 안쪽(센터 방향)으로 끌어갈 수 있음
// - AppRoot.updateBoxPosition(id, x, y, w, h)에 px 기준으로만 전달
//   → AppRoot 가 캔버스 경계 clamp + 0~1 ratio(nx,ny,nw,nh) 갱신

console.log('[PreviewCanvas] script loaded (composition-px final)');

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

                <!-- 레이어 레이블 (index.html 의 .canvas-label 사용) -->
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

            // mousedown 시점 마우스(composition px) 좌표
            dragStartMouseCanvas: { x: 0, y: 0 },

            // mousedown 시점 박스(px, composition 좌표)
            dragStartBox: { x: 0, y: 0, w: 0, h: 0 },

            // 어느 코너를 잡았는지
            resizeHandlePos: null, // 'tl' | 'tr' | 'bl' | 'br'

            _mouseMoveHandler: null,
            _mouseUpHandler: null
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

        // ---------- 공통: client → composition(px) ----------
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
            return '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';
        },
        effectiveText(box) {
            if (box.textContent && box.textContent.trim().length > 0) {
                return box.textContent;
            }
            return this.defaultTextMessage();
        },

        // ---------- 박스 / 텍스트 스타일 ----------
        boxStyle(box) {
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
            // index.html 의 .canvas-label 기본 스타일을 활용하되,
            // 텍스트 잘림을 줄이기 위해 padding/overflow 는 CSS에 맡김
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

        getContrastingTextColor(bgColor) {
            const rgb = this.parseColorToRgb(bgColor);
            if (!rgb) return '#000000';
            const luminance =
                (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
            return luminance > 0.5 ? '#000000' : '#ffffff';
        },
        parseColorToRgb(color) {
            if (!color || typeof color !== 'string') return null;
            color = color.trim().toLowerCase();

            if (color[0] === '#') {
                let hex = color.slice(1);
                if (hex.length === 3) {
                    hex = hex.split('').map(c => c + c).join('');
                }
                if (hex.length !== 6) return null;
                const num = parseInt(hex, 16);
                if (isNaN(num)) return null;
                return {
                    r: (num >> 16) & 255,
                    g: (num >> 8) & 255,
                    b: num & 255
                };
            }

            const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
            if (rgbMatch) {
                const parts = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
                if (parts.length >= 3) {
                    return { r: parts[0], g: parts[1], b: parts[2] };
                }
            }
            return null;
        },

        // ---------- 드래그 시작 (move) ----------
        onBoxMouseDown(e, box) {
            e.preventDefault();
            this.$emit('select-box', box.id);

            const parent = this.$parent;
            if (!parent) return;

            parent.isBoxDragging = true;

            const { x: mCanvasX, y: mCanvasY } = this.clientToCanvas(e);

            const x0 = box.x || 0;
            const y0 = box.y || 0;
            const w0 = box.w || 0;
            const h0 = box.h || 0;

            this.dragStartBox = { x: x0, y: y0, w: w0, h: h0 };
            this.dragStartMouseClient = { x: e.clientX, y: e.clientY };
            this.dragStartMouseCanvas = { x: mCanvasX, y: mCanvasY };

            this.dragBoxId = box.id;
            this.dragMode = 'move';
            this.resizeHandlePos = null;

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

            const { x: mCanvasX, y: mCanvasY } = this.clientToCanvas(e);

            const x0 = box.x || 0;
            const y0 = box.y || 0;
            const w0 = box.w || 0;
            const h0 = box.h || 0;

            this.dragStartBox = { x: x0, y: y0, w: w0, h: h0 };
            this.dragStartMouseClient = { x: e.clientX, y: e.clientY };
            this.dragStartMouseCanvas = { x: mCanvasX, y: mCanvasY };

            this.dragBoxId = box.id;
            this.dragMode = 'resize';
            this.resizeHandlePos = pos;

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

        // ---------- 실제 이동/리사이즈 처리 (델타 방식, 내부 진입 허용) ----------
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;

            const parent = this.$parent;
            if (!parent || typeof parent.updateBoxPosition !== 'function') return;

            const { x: mCanvasX, y: mCanvasY } = this.clientToCanvas(e);

            // 마우스 이동량 (composition px)
            const dx = mCanvasX - this.dragStartMouseCanvas.x;
            const dy = mCanvasY - this.dragStartMouseCanvas.y;

            const x0 = this.dragStartBox.x;
            const y0 = this.dragStartBox.y;
            const w0 = this.dragStartBox.w;
            const h0 = this.dragStartBox.h;

            let x = x0;
            let y = y0;
            let w = w0;
            let h = h0;

            if (this.dragMode === 'move') {
                // 단순 이동: 시작 박스 + 마우스 델타
                x = x0 + dx;
                y = y0 + dy;
            } else if (this.dragMode === 'resize') {
                switch (this.resizeHandlePos) {
                    case 'tl':
                        x = x0 + dx;
                        y = y0 + dy;
                        w = w0 - dx;
                        h = h0 - dy;
                        break;
                    case 'tr':
                        x = x0;
                        y = y0 + dy;
                        w = w0 + dx;
                        h = h0 - dy;
                        break;
                    case 'bl':
                        x = x0 + dx;
                        y = y0;
                        w = w0 - dx;
                        h = h0 + dy;
                        break;
                    case 'br':
                        x = x0;
                        y = y0;
                        w = w0 + dx;
                        h = h0 + dy;
                        break;
                }

                // 최소 크기: w,h 값만 clamp (x,y는 건드리지 않음 → 모서리가 안쪽까지 따라올 수 있음)
                const minW = 10;
                const minH = 10;
                if (w < minW) w = minW;
                if (h < minH) h = minH;
            }

            if (!Number.isFinite(x) || !Number.isFinite(y) ||
                !Number.isFinite(w) || !Number.isFinite(h)) {
                return;
            }

            // 캔버스 경계 및 0~1 정규화는 AppRoot.updateBoxPosition 에서 처리
            parent.updateBoxPosition(this.dragBoxId, x, y, w, h);
        },

        handleMouseUp() {
            this.stopGlobalDragListeners();
            document.body.style.cursor = '';

            if (this.$parent) {
                this.$parent.isBoxDragging = false;
            }

            this.dragMode = null;
            this.dragBoxId = null;
            this.resizeHandlePos = null;
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
