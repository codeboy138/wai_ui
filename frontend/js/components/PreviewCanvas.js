// Preview Canvas Component
// - 단일 Composition 좌표계(px, #preview-canvas-scaler 기준)를 사용
// - move: 시작 px + (현재마우스px - 시작마우스px)
// - resize: "잡은 모서리"는 항상 마우스 위치를 따라가도록 설계
// - minSize에 막혀도 body 전체 커서를 강제로 유지하지 않음
//   → 커서는 요소의 CSS(cursor)에 맡김 (핸들 위에서만 양방향 화살표)

console.log('[PreviewCanvas] script loaded (composition-px v4 no-body-cursor)');

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
                <!-- 텍스트 박스 내용 -->
                <div
                    v-if="box.rowType === 'TXT'"
                    class="canvas-text-content"
                    :style="textStyle(box)"
                >
                    {{ effectiveText(box) }}
                </div>

                <!-- 리사이즈 모서리 핸들 -->
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
            dragMode: null,             // 'move' | 'resize' | null
            dragBoxId: null,            // 드래그 중인 박스 id
            dragHandle: null,           // 'tl' | 'tr' | 'bl' | 'br' | null

            // mousedown 시점 마우스 위치 (캔버스 px 좌표)
            dragStartMouseCanvas: { x: 0, y: 0 },

            // mousedown 시점 박스 상태 (px 좌표)
            dragStartBox: { x: 0, y: 0, w: 0, h: 0 },

            _mouseMoveHandler: null,
            _mouseUpHandler: null
        };
    },
    beforeUnmount() {
        this.stopGlobalDragListeners();
        // body.cursor 강제 사용 안 함
    },
    methods: {
        // ===================== 전역 드래그 리스너 =====================
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

        // ===================== 텍스트 =====================
        defaultTextMessage() {
            return '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';
        },
        effectiveText(box) {
            if (box.textContent && box.textContent.trim().length > 0) {
                return box.textContent;
            }
            return this.defaultTextMessage();
        },

        // ===================== 스타일: 박스 / 텍스트 =====================
        boxStyle(box) {
            return {
                display: box.isHidden ? 'none' : 'block',
                position: 'absolute',
                left: (box.x || 0) + 'px',
                top: (box.y || 0) + 'px',
                width: (box.w || 0) + 'px',
                height: (box.h || 0) + 'px',
                borderColor: box.color || '#22c55e',
                borderStyle: 'dashed',
                borderWidth: '2px',
                boxSizing: 'border-box',
                zIndex: box.zIndex,
                backgroundColor: box.layerBgColor || '#000000',
                cursor: 'move'   // 박스 본체 위에서는 move 커서
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

        // ===================== 리사이즈 핸들 스타일 =====================
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
            } else { // 'br'
                style.right = '-4px';
                style.bottom = '-4px';
                style.borderRight = thickness + 'px solid ' + color;
                style.borderBottom = thickness + 'px solid ' + color;
                style.cursor = 'nwse-resize';
            }

            return style;
        },

        // ===================== 레이블 =====================
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

            const fontSize = Math.max(10, 14 * scale);

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

        // ===================== 화면좌표 → 캔버스(px) =====================
        clientToCanvas(e) {
            const scaler = document.getElementById('preview-canvas-scaler');
            const parent = this.$parent;
            if (!scaler || !parent || !parent.canvasSize) {
                return { x: 0, y: 0 };
            }

            const rect = scaler.getBoundingClientRect();
            const cw = parent.canvasSize.w || rect.width || 1;
            const ch = parent.canvasSize.h || rect.height || 1;

            const scaleX = rect.width  / cw;
            const scale = (!Number.isFinite(scaleX) || scaleX <= 0) ? 1 : scaleX;

            const x = (e.clientX - rect.left) / scale;
            const y = (e.clientY - rect.top)  / scale;
            return { x, y };
        },

        // ===================== 드래그 시작 (move) =====================
        onBoxMouseDown(e, box) {
            e.preventDefault();
            this.$emit('select-box', box.id);

            const parent = this.$parent;
            if (!parent) return;

            parent.isBoxDragging = true;

            const mouseCanvas = this.clientToCanvas(e);

            this.dragStartMouseCanvas = {
                x: mouseCanvas.x,
                y: mouseCanvas.y
            };

            this.dragStartBox = {
                x: box.x || 0,
                y: box.y || 0,
                w: box.w || 0,
                h: box.h || 0
            };

            this.dragBoxId = box.id;
            this.dragMode = 'move';
            this.dragHandle = null;

            // body.cursor 강제 변경 제거
            this.startGlobalDragListeners();
        },

        // ===================== 드래그 시작 (resize) =====================
        onHandleMouseDown(e, box, pos) {
            e.preventDefault();
            this.$emit('select-box', box.id);

            const parent = this.$parent;
            if (!parent) return;

            parent.isBoxDragging = true;

            const mouseCanvas = this.clientToCanvas(e);

            this.dragStartMouseCanvas = {
                x: mouseCanvas.x,
                y: mouseCanvas.y
            };

            this.dragStartBox = {
                x: box.x || 0,
                y: box.y || 0,
                w: box.w || 0,
                h: box.h || 0
            };

            this.dragBoxId = box.id;
            this.dragMode = 'resize';
            this.dragHandle = pos;

            // body.cursor 강제 변경 제거
            this.startGlobalDragListeners();
        },

        onBoxMouseMove(e, box) {
            // hover 시 별도 커서 처리 없음 (CSS cursor에 맡김)
        },
        onBoxMouseLeave(e) {
            // nothing
        },

        // ===================== 실제 이동/리사이즈 처리 =====================
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;

            const parent = this.$parent;
            if (!parent || !parent.canvasSize || typeof parent.updateBoxPosition !== 'function') {
                return;
            }

            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;

            const mouseCanvas = this.clientToCanvas(e);
            let mx = mouseCanvas.x;
            let my = mouseCanvas.y;

            const start = this.dragStartBox;
            const x0 = start.x;
            const y0 = start.y;
            const w0 = start.w;
            const h0 = start.h;
            const right0 = x0 + w0;
            const bottom0 = y0 + h0;

            const minW = 20;
            const minH = 20;

            let x, y, w, h;

            if (this.dragMode === 'move') {
                const dx = mx - this.dragStartMouseCanvas.x;
                const dy = my - this.dragStartMouseCanvas.y;

                x = x0 + dx;
                y = y0 + dy;
                w = w0;
                h = h0;

                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x + w > cw) x = cw - w;
                if (y + h > ch) y = ch - h;
            } else if (this.dragMode === 'resize') {
                const handle = this.dragHandle;

                mx = Math.max(0, Math.min(cw, mx));
                my = Math.max(0, Math.min(ch, my));

                if (handle === 'br') {
                    const rawW = mx - x0;
                    const rawH = my - y0;

                    w = Math.max(minW, rawW);
                    h = Math.max(minH, rawH);

                    x = mx - w;
                    y = my - h;
                } else if (handle === 'tl') {
                    const rawW = right0 - mx;
                    const rawH = bottom0 - my;

                    w = Math.max(minW, rawW);
                    h = Math.max(minH, rawH);

                    x = mx;
                    y = my;
                } else if (handle === 'tr') {
                    const rawW = mx - x0;
                    const rawH = bottom0 - my;

                    w = Math.max(minW, rawW);
                    h = Math.max(minH, rawH);

                    x = mx - w;
                    y = my;
                } else if (handle === 'bl') {
                    const rawW = right0 - mx;
                    const rawH = my - y0;

                    w = Math.max(minW, rawW);
                    h = Math.max(minH, rawH);

                    x = mx;
                    y = my - h;
                } else {
                    const dx = mx - this.dragStartMouseCanvas.x;
                    const dy = my - this.dragStartMouseCanvas.y;
                    x = x0 + dx;
                    y = y0 + dy;
                    w = w0;
                    h = h0;
                }

                if (!Number.isFinite(w) || w < minW) w = Math.max(minW, w0);
                if (!Number.isFinite(h) || h < minH) h = Math.max(minH, h0);
                if (!Number.isFinite(x)) x = x0;
                if (!Number.isFinite(y)) y = y0;

                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x + w > cw) x = cw - w;
                if (y + h > ch) y = ch - h;
            } else {
                return;
            }

            parent.updateBoxPosition(this.dragBoxId, x, y, w, h);
        },

        handleMouseUp() {
            this.stopGlobalDragListeners();

            if (this.$parent) {
                this.$parent.isBoxDragging = false;
            }

            this.dragMode = null;
            this.dragBoxId = null;
            this.dragHandle = null;
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
