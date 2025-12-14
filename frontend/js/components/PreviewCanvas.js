// Preview Canvas Component - 완전 리셋 버전
//
// 설계 방향 (이 컴포넌트 하나에 집중):
// 1) 좌표계 단순화
//    - 드래그/리사이즈 계산은 **논리 캔버스 px (box.x, box.y, box.w, box.h)** 기준만 사용
//    - 화면상의 마우스 이동(px) → 논리 px = (화면이동 / vm.canvasScale)
//    - 정규화(0~1) / 경계 / 최소 크기 처리는 AppRoot.updateBoxPosition 에 맡김
// 2) 모드 고정
//    - 박스 내부에서 시작 => dragMode='move'
//    - 모서리 핸들에서 시작 => dragMode='resize'
//    - 드래그 중에는 dragMode가 절대 바뀌지 않음
// 3) 커서 고정
//    - 드래그 시작: document.body.style.cursor 를 move / nwse-resize / nesw-resize 로 설정
//    - 드래그 끝: document.body.style.cursor = '' 로 원복
//    - 박스/핸들 자체 cursor 는 단순 참고용(hover)일 뿐, 모드 전환에 영향 없음

console.log('[PreviewCanvas] script loaded (reset)');

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
            dragStartMouse: { x: 0, y: 0 },          // 화면(client) 좌표
            dragStartBoxPx: { x: 0, y: 0, w: 0, h: 0 }, // 논리 캔버스(px)
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

        // ---------- 박스 스타일 ----------
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
                cursor: 'inherit'  // 실제 커서는 body 에서 mode 기반으로 제어
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
            const size = 16;
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
                backgroundColor: 'rgba(0,0,0,0.35)'
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

        // ---------- 드래그 시작 (박스 내부: move) ----------
        onBoxMouseDown(e, box) {
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
            // hover 시 커서 변경은 body 커스에 맡김 (여기선 아무 것도 안 함)
        },

        onBoxMouseLeave(e) {
            // nothing
        },

        // ---------- 실제 이동/리사이즈 처리 (px 기반) ----------
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;

            const parent = this.$parent;
            if (!parent || typeof parent.updateBoxPosition !== 'function') return;

            const scale = parent.canvasScale || 1.0;
            const dx = (e.clientX - this.dragStartMouse.x) / (scale || 1.0);
            const dy = (e.clientY - this.dragStartMouse.y) / (scale || 1.0);

            let { x, y, w, h } = this.dragStartBoxPx;

            if (this.dragMode === 'move') {
                x = this.dragStartBoxPx.x + dx;
                y = this.dragStartBoxPx.y + dy;
            } else if (this.dragMode === 'resize') {
                const edges = this.dragEdges;

                if (edges.left) {
                    x = this.dragStartBoxPx.x + dx;
                    w = this.dragStartBoxPx.w - dx;
                }
                if (edges.right) {
                    w = this.dragStartBoxPx.w + dx;
                }
                if (edges.top) {
                    y = this.dragStartBoxPx.y + dy;
                    h = this.dragStartBoxPx.h - dy;
                }
                if (edges.bottom) {
                    h = this.dragStartBoxPx.h + dy;
                }
            }

            // NaN/Infinity 방지, 나머지(최소 크기/경계)는 AppRoot.updateBoxPosition 에 맡김
            if (!Number.isFinite(x)) x = this.dragStartBoxPx.x;
            if (!Number.isFinite(y)) y = this.dragStartBoxPx.y;
            if (!Number.isFinite(w) || w <= 0) w = this.dragStartBoxPx.w;
            if (!Number.isFinite(h) || h <= 0) h = this.dragStartBoxPx.h;

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
