// Preview Canvas Component - 절대좌표 기반 완전 리라이트 버전
//
// 핵심 아이디어:
// - 마우스 위치를 "프리뷰 캔버스 내부 좌표계(px)"로 직접 환산해서, 거기서 바로 박스 좌표를 계산한다.
//   * rect = #preview-canvas-scaler.getBoundingClientRect()
//   * canvasX = (clientX - rect.left) / rect.width  * vm.canvasSize.w
//   * canvasY = (clientY - rect.top)  / rect.height * vm.canvasSize.h
// - 이동(move):
//   * offsetX = canvasX - box.x, offsetY = canvasY - box.y (mousedown 시점에 저장)
//   * 드래그 중 x = canvasX - offsetX, y = canvasY - offsetY
// - 리사이즈(resize):
//   * 코너마다 "고정(anchor) 코너"를 설정
//   * 드래그 중: 새 코너 = 현재 마우스 canvasX/Y, 나머지 한쪽은 anchor 코너
//     → x = min(anchorX, mouseX), w = |anchorX - mouseX| (y/h도 동일)
//
// 좌표/클램프/정규화는 AppRoot.updateBoxPosition 에 맡긴다.

console.log('[PreviewCanvas] script loaded (absolute-coord rewrite)');

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

            // 마우스 시작 지점 (client 좌표)
            dragStartMouse: { x: 0, y: 0 },

            // mousedown 시점 박스 논리(px)
            dragStartBoxPx: { x: 0, y: 0, w: 0, h: 0 },

            // 이동 모드용: 박스 좌상단 기준 마우스 오프셋
            dragOffset: { x: 0, y: 0 },

            // 리사이즈 모드용: 고정(anchor) 코너 (논리 px)
            resizeAnchorPx: { x: 0, y: 0 },

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
                cursor: 'inherit'  // 실제 커서 제어는 body에서
            };
        },

        textStyle(box) {
            const ts = box.textStyle || {};
            const fontSize = ts.fontSize || 48;

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
                padding: '8px',
                boxSizing: 'border-box',

                display: 'flex',
                alignItems,
                justifyContent,
                textAlign: hAlign,

                transform: 'none',

                color: ts.fillColor || '#ffffff',
                fontFamily: ts.fontFamily || 'Pretendard, system-ui, sans-serif',
                fontSize: fontSize + 'px',
                lineHeight: ts.lineHeight || 1.2,
                backgroundColor: ts.backgroundColor || 'transparent',
                WebkitTextStrokeColor: ts.strokeColor || 'transparent',
                WebkitTextStrokeWidth: (ts.strokeWidth || 0) + 'px',
                whiteSpace: 'pre-wrap'
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
            const marginX = 8;

            const style = {
                position: 'absolute',
                bottom: '0px',
                pointerEvents: 'none',
                zIndex: box.zIndex + 1
            };

            if (box.rowType === 'EFF') {
                style.left = marginX + 'px';
            } else if (box.rowType === 'BG') {
                style.right = marginX + 'px';
            } else {
                style.left = '50%';
                style.transform = 'translateX(-50%)';
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

            return {
                display: 'inline-block',
                minWidth: 'auto',
                maxWidth: '240px',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '2px solid ' + base,
                backgroundColor: bg,
                color: textColor,
                fontSize: '40px',
                lineHeight: '1.0',
                textAlign: 'center',
                boxSizing: 'border-box',
                textShadow: '0 0 4px rgba(0,0,0,0.7)'
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

        // ---------- 좌표 변환 헬퍼 ----------
        // 화면 마우스(clientX/Y) → 논리 캔버스(px) 좌표
        clientToCanvas(e) {
            const scaler = document.getElementById('preview-canvas-scaler');
            const parent = this.$parent;
            if (!scaler || !parent) return { x: 0, y: 0 };

            const rect = scaler.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) {
                return { x: 0, y: 0 };
            }

            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;

            const relX = (e.clientX - rect.left) / rect.width;
            const relY = (e.clientY - rect.top) / rect.height;

            return {
                x: relX * cw,
                y: relY * ch
            };
        },

        // ---------- 드래그 시작 (박스 내부: move) ----------
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

            // 마우스와 박스 좌상단 사이의 오프셋
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

        // ---------- 드래그 시작 (모서리 핸들: resize) ----------
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

            // 각 핸들에 대응하는 "고정(anchor) 코너"
            if (pos === 'tl') {
                // 고정: 우하단
                this.resizeAnchorPx = {
                    x: this.dragStartBoxPx.x + this.dragStartBoxPx.w,
                    y: this.dragStartBoxPx.y + this.dragStartBoxPx.h
                };
            } else if (pos === 'tr') {
                // 고정: 좌하단
                this.resizeAnchorPx = {
                    x: this.dragStartBoxPx.x,
                    y: this.dragStartBoxPx.y + this.dragStartBoxPx.h
                };
            } else if (pos === 'bl') {
                // 고정: 우상단
                this.resizeAnchorPx = {
                    x: this.dragStartBoxPx.x + this.dragStartBoxPx.w,
                    y: this.dragStartBoxPx.y
                };
            } else { // 'br'
                // 고정: 좌상단
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
            // hover 시 커서는 기본(arrow) 유지
        },

        onBoxMouseLeave(e) {
            // nothing
        },

        // ---------- 실제 이동/리사이즈 처리 ----------
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;

            const parent = this.$parent;
            if (!parent || typeof parent.updateBoxPosition !== 'function') return;

            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;

            const mouseCanvas = this.clientToCanvas(e); // 항상 캔버스 좌표로 계산

            let x, y, w, h;

            if (this.dragMode === 'move') {
                // 마우스 위치 - 오프셋 = 박스 좌상단
                x = mouseCanvas.x - this.dragOffset.x;
                y = mouseCanvas.y - this.dragOffset.y;

                // 최소/경계는 updateBoxPosition에서 처리하지만, NaN만 방지
                if (!Number.isFinite(x)) x = this.dragStartBoxPx.x;
                if (!Number.isFinite(y)) y = this.dragStartBoxPx.y;
                w = this.dragStartBoxPx.w;
                h = this.dragStartBoxPx.h;

            } else { // resize
                const ax = this.resizeAnchorPx.x;
                const ay = this.resizeAnchorPx.y;

                // 마우스 위치가 실제로 움직이는 코너
                const mx = mouseCanvas.x;
                const my = mouseCanvas.y;

                // 새 박스는 anchor 코너와 mouse 코너를 양 끝으로 하는 사각형
                x = Math.min(ax, mx);
                y = Math.min(ay, my);
                w = Math.abs(ax - mx);
                h = Math.abs(ay - my);

                // 극단값 방지
                if (!Number.isFinite(x)) x = this.dragStartBoxPx.x;
                if (!Number.isFinite(y)) y = this.dragStartBoxPx.y;
                if (!Number.isFinite(w) || w <= 0) w = this.dragStartBoxPx.w;
                if (!Number.isFinite(h) || h <= 0) h = this.dragStartBoxPx.h;
            }

            // 나머지(최소 크기, 캔버스 경계, 정규화)는 AppRoot.updateBoxPosition 에 맡김
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
