// Preview Canvas Component - 절대 좌표 기반 구현
// - 마우스 위치를 프리뷰 캔버스 내부 좌표(px)로 변환해서 그대로 사용
// - 이동(move): 마우스 위치 - 시작 오프셋
// - 리사이즈(resize): 고정(anchor) 코너 + 드래그 코너(핸들)로 사각형 생성
// - 마지막에 AppRoot.updateBoxPosition(id, x, y, w, h) 호출
//   → AppRoot에서 nx,ny,nw,nh(0~1)까지 동시에 갱신

console.log('[PreviewCanvas] script loaded (absolute-coord)');

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

                <!-- 레이블 -->
                <div
                    class="canvas-label-right"
                    :style="labelWrapperStyle(box)"
                >
                    <div
                        class="canvas-label-chip"
                        :style="labelChipStyle(box)"
                    >
                        <div class="canvas-label-line">
                            {{ labelText(box) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            dragMode: null,       // 'move' | 'resize' | null
            dragBoxId: null,

            // mousedown 시점 마우스(client) 좌표
            dragStartMouse: { x: 0, y: 0 },

            // mousedown 시점 박스(px, 캔버스 좌표)
            dragStartBoxPx: { x: 0, y: 0, w: 0, h: 0 },

            // move 모드: 마우스와 박스 좌상단 사이의 오프셋
            dragOffset: { x: 0, y: 0 },

            // resize 모드: 고정(anchor) 코너 (논리 px)
            resizeAnchorPx: { x: 0, y: 0 },

            // 어떤 엣지를 움직이는지 (좌/우, 상/하)
            dragEdges: { left: false, right: false, top: false, bottom: false },

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

        // 캔버스 크기에 비례해서 텍스트 크기 스케일링
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

        labelWrapperStyle(box) {
            const marginX = 4;

            const style = {
                position: 'absolute',
                bottom: '0px',
                pointerEvents: 'none',
                zIndex: box.zIndex + 1,
                width: '100%',
                textAlign: 'center'
            };

            if (box.rowType === 'EFF') {
                style.textAlign = 'left';
                style.left = marginX + 'px';
            } else if (box.rowType === 'BG') {
                style.textAlign = 'right';
                style.right = marginX + 'px';
            } else {
                style.left = '0px';
            }

            return style;
        },

        // 레이블: 캔버스 크기에 비례해서 살짝만 스케일 + 박스 폭 안에서 최대한 넓게
        labelChipStyle(box) {
            const base = box.color || '#22c55e';
            const rgb = this.parseColorToRgb(base);
            const bg = rgb
                ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`
                : 'rgba(34, 197, 94, 0.5)';

            const textColor = this.getContrastingTextColor(base);

            const parent = this.$parent;
            const baseH = 1080;
            let scale = 1;
            if (parent && parent.canvasSize && parent.canvasSize.h) {
                scale = parent.canvasSize.h / baseH;
                if (!Number.isFinite(scale) || scale <= 0) scale = 1;
            }

            // 너무 크지도, 너무 작지도 않게
            const fontSize = Math.max(10, 14 * scale);

            // 박스 폭을 최대한 활용하되, 양쪽 여백 조금만 남김
            const boxWidth = (typeof box.w === 'number' ? box.w : 9999);
            const maxWidthPx = Math.max(40, boxWidth - 8);

            return {
                display: 'inline-block',
                minWidth: 'auto',
                maxWidth: maxWidthPx + 'px',
                padding: '2px 4px',
                borderRadius: '4px',
                border: '1px solid ' + base,
                backgroundColor: bg,
                color: textColor,
                fontSize: fontSize + 'px',
                lineHeight: '1.0',
                textAlign: 'center',
                boxSizing: 'border-box',
                textShadow: '0 0 4px rgba(0,0,0,0.7)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                margin: '0 auto 2px auto'
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

        // ---------- 화면좌표 → 캔버스(px) ----------
        clientToCanvas(e) {
            const scaler = document.getElementById('preview-canvas-scaler');
            const parent = this.$parent;
            if (!scaler || !parent) return { x: 0, y: 0 };

            const rect = scaler.getBoundingClientRect();
            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;

            let scale = parent.canvasScale || 0;
            if (!scale || !isFinite(scale) || scale <= 0) {
                if (rect.width > 0) scale = rect.width / cw;
                else if (rect.height > 0) scale = rect.height / ch;
                else scale = 1;
            }

            const x = (e.clientX - rect.left) / scale;
            const y = (e.clientY - rect.top)  / scale;

            return { x, y };
        },

        // ---------- 드래그 시작 (move) ----------
        onBoxMouseDown(e, box) {
            e.preventDefault();
            this.$emit('select-box', box.id);

            const parent = this.$parent;
            if (!parent) return;

            parent.isBoxDragging = true;

            const mouseCanvas = this.clientToCanvas(e);

            this.dragStartBoxPx = {
                x: box.x || 0,
                y: box.y || 0,
                w: box.w || 0,
                h: box.h || 0
            };

            this.dragOffset = {
                x: mouseCanvas.x - this.dragStartBoxPx.x,
                y: mouseCanvas.y - this.dragStartBoxPx.y
            };

            this.dragBoxId = box.id;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };
            this.dragMode = 'move';
            this.dragEdges = { left: false, right: false, top: false, bottom: false };

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

            this.dragStartBoxPx = {
                x: box.x || 0,
                y: box.y || 0,
                w: box.w || 0,
                h: box.h || 0
            };

            // pos 에 따라 고정(anchor) 코너 지정
            if (pos === 'tl') {
                this.resizeAnchorPx = {
                    x: this.dragStartBoxPx.x + this.dragStartBoxPx.w,
                    y: this.dragStartBoxPx.y + this.dragStartBoxPx.h
                };
            } else if (pos === 'tr') {
                this.resizeAnchorPx = {
                    x: this.dragStartBoxPx.x,
                    y: this.dragStartBoxPx.y + this.dragStartBoxPx.h
                };
            } else if (pos === 'bl') {
                this.resizeAnchorPx = {
                    x: this.dragStartBoxPx.x + this.dragStartBoxPx.w,
                    y: this.dragStartBoxPx.y
                };
            } else { // br
                this.resizeAnchorPx = {
                    x: this.dragStartBoxPx.x,
                    y: this.dragStartBoxPx.y
                };
            }

            this.dragBoxId = box.id;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };

            this.dragMode = 'resize';
            this.dragEdges = {
                left:   (pos === 'tl' || pos === 'bl'),
                right:  (pos === 'tr' || pos === 'br'),
                top:    (pos === 'tl' || pos === 'tr'),
                bottom: (pos === 'bl' || pos === 'br')
            };

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

        // ---------- 실제 이동/리사이즈 처리 ----------
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;

            const parent = this.$parent;
            if (!parent || typeof parent.updateBoxPosition !== 'function') return;

            const mouseCanvas = this.clientToCanvas(e);
            const cw = (parent.canvasSize && parent.canvasSize.w) ? parent.canvasSize.w : 1;
            const ch = (parent.canvasSize && parent.canvasSize.h) ? parent.canvasSize.h : 1;

            let x, y, w, h;

            if (this.dragMode === 'move') {
                x = mouseCanvas.x - this.dragOffset.x;
                y = mouseCanvas.y - this.dragOffset.y;

                if (!Number.isFinite(x)) x = this.dragStartBoxPx.x;
                if (!Number.isFinite(y)) y = this.dragStartBoxPx.y;
                w = this.dragStartBoxPx.w;
                h = this.dragStartBoxPx.h;

            } else if (this.dragMode === 'resize') {
                const minW = 10;
                const minH = 10;

                // 마우스를 캔버스 영역 안으로 클램프
                let mx = mouseCanvas.x;
                let my = mouseCanvas.y;
                if (!Number.isFinite(mx) || !Number.isFinite(my)) {
                    mx = this.dragStartBoxPx.x;
                    my = this.dragStartBoxPx.y;
                }
                mx = Math.max(0, Math.min(cw, mx));
                my = Math.max(0, Math.min(ch, my));

                const ax = this.resizeAnchorPx.x;
                const ay = this.resizeAnchorPx.y;

                const edges = this.dragEdges || {};

                let left, right, top, bottom;

                if (edges.left && edges.top) {          // TL 핸들: left, top 이동. right/bottom 고정
                    right = ax;
                    bottom = ay;
                    let newLeft = mx;
                    let newTop  = my;
                    if (newLeft > right - minW) newLeft = right - minW;
                    if (newTop  > bottom - minH) newTop = bottom - minH;
                    left = newLeft;
                    top  = newTop;

                } else if (edges.right && edges.top) {  // TR 핸들: right, top 이동. left/bottom 고정
                    left = ax;
                    bottom = ay;
                    let newRight = mx;
                    let newTop   = my;
                    if (newRight < left + minW)  newRight = left + minW;
                    if (newTop   > bottom - minH) newTop  = bottom - minH;
                    right = newRight;
                    top   = newTop;

                } else if (edges.left && edges.bottom) { // BL 핸들: left, bottom 이동. right/top 고정
                    right = ax;
                    top   = ay;
                    let newLeft   = mx;
                    let newBottom = my;
                    if (newLeft   > right - minW) newLeft   = right - minW;
                    if (newBottom < top + minH)  newBottom = top + minH;
                    left   = newLeft;
                    bottom = newBottom;

                } else if (edges.right && edges.bottom) { // BR 핸들: right, bottom 이동. left/top 고정
                    left = ax;
                    top  = ay;
                    let newRight  = mx;
                    let newBottom = my;
                    if (newRight  < left + minW)  newRight  = left + minW;
                    if (newBottom < top + minH)   newBottom = top + minH;
                    right  = newRight;
                    bottom = newBottom;

                } else {
                    // 혹시라도 엣지가 안 잡힌 경우: 이전 방식으로 fallback
                    left   = Math.min(ax, mx);
                    top    = Math.min(ay, my);
                    right  = Math.max(ax, mx);
                    bottom = Math.max(ay, my);
                }

                x = left;
                y = top;
                w = right - left;
                h = bottom - top;

                if (!Number.isFinite(x)) x = this.dragStartBoxPx.x;
                if (!Number.isFinite(y)) y = this.dragStartBoxPx.y;
                if (!Number.isFinite(w) || w <= 0) w = this.dragStartBoxPx.w;
                if (!Number.isFinite(h) || h <= 0) h = this.dragStartBoxPx.h;
            }

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
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
