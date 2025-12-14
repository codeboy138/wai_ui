// Preview Canvas Component (퍼센트(0~1) 좌표 기반 드래그/리사이즈)
//
// 지금 버전의 목표
// 1) 마우스 이동과 박스 이동/리사이즈가 항상 같은 좌표계에서 계산되도록 정리
//    - 화면에서 움직인 픽셀 / canvasScale → 논리 캔버스(px) 이동량
//    - 논리(px)를 0~1 정규화로 바꿔서 AppRoot.updateBoxPositionNormalized 로 전달
// 2) 드래그 vs 리사이즈 모드가 중간에 바뀌지 않도록 고정
// 3) 드래그 동안 마우스 커서 모양이 안정적으로 유지되도록
//    - 박스 스타일에는 cursor를 'inherit'로 두고
//    - 드래그 시작 시 document.body.style.cursor 에서 모드별 커서 지정
//    - 드래그 종료 시 body 커서 원복

console.log('[PreviewCanvas] script loaded');

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
                <!-- 텍스트 박스 내용: 레이어 전체 영역 사용 -->
                <div
                    v-if="box.rowType === 'TXT'"
                    class="canvas-text-content"
                    :style="textStyle(box)"
                >
                    {{ effectiveText(box) }}
                </div>

                <!-- 모서리 ㄱ자 핸들 (리사이즈용) -->
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

                <!-- 레이어 레이블: 레이어 박스 하단 내부 (행별 좌/중/우 배치) -->
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
            // 드래그/리사이즈 상태
            dragMode: null,       // 'move' | 'resize' | null
            dragBoxId: null,
            dragStartMouse: { x: 0, y: 0 },          // 화면 좌표(px)
            dragStartNorm: { nx: 0, ny: 0, nw: 0, nh: 0 }, // 0~1 기준(로그용)
            dragStartBoxPx: { x: 0, y: 0, w: 0, h: 0 },    // 논리 캔버스(px) 기준 시작 박스
            dragEdges: { left: false, right: false, top: false, bottom: false },

            dragCanvasRect: null, // 필요시 참조용 (현재는 직접 사용 X)

            _mouseMoveHandler: null,
            _mouseUpHandler: null
        };
    },
    beforeUnmount() {
        // 컴포넌트가 사라질 때 혹시 남아있을지 모르는 전역 리스너 정리 + 커서 복구
        this.stopGlobalDragListeners();
        document.body.style.cursor = '';
    },
    methods: {
        // ---------- 공통: 전역 드래그 리스너 관리 ----------
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

        // ---------- 텍스트 표시 ----------
        defaultTextMessage() {
            return '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';
        },
        effectiveText(box) {
            if (box.textContent && box.textContent.trim().length > 0) {
                return box.textContent;
            }
            return this.defaultTextMessage();
        },

        // 레이어 박스 스타일: 점선 + 2px (px 좌표는 AppRoot에서 계산)
        // cursor 는 'inherit' 로 두고, 실제 드래그/리사이즈 중 커서는 body 에서 강제로 제어
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

        // 텍스트 영역: 레이어 전체, 좌/중/우 + 상/중/하 정렬
        textStyle(box) {
            const ts = box.textStyle || {};
            const fontSize = ts.fontSize || 48;

            const hAlign = ts.textAlign || 'center';   // left / center / right
            const vAlign = ts.vAlign   || 'middle';    // top / middle / bottom

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

        // ---------- 모서리 ㄱ자 핸들 스타일 ----------
        // → 항상 보이게 + 큰 사이즈 + hover 시 리사이즈 커서
        handleStyle(box, pos) {
            const size = 16;       // 핸들 전체 크기 (px)
            const thickness = 3;   // 선 두께
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

        // ---------- 레이블 텍스트 ----------
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

        // ---------- 박스 내부 드래그: 이동 ----------
        onBoxMouseDown(e, box) {
            e.preventDefault();
            this.$emit('select-box', box.id);
            const parent = this.$parent;
            if (!parent) return;

            parent.isBoxDragging = true;

            // 시작 시점 박스(px 기준) 저장
            this.dragStartBoxPx = {
                x: box.x || 0,
                y: box.y || 0,
                w: box.w || 0,
                h: box.h || 0
            };

            // 정규화 값 기록(디버그용)
            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;
            const nx = (typeof box.nx === 'number') ? box.nx : (box.x || 0) / cw;
            const ny = (typeof box.ny === 'number') ? box.ny : (box.y || 0) / ch;
            const nw = (typeof box.nw === 'number') ? box.nw : (box.w || cw) / cw;
            const nh = (typeof box.nh === 'number') ? box.nh : (box.h || ch) / ch;
            this.dragStartNorm = { nx, ny, nw, nh };

            this.dragBoxId = box.id;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };

            this.dragMode = 'move';
            this.dragEdges = { left: false, right: false, top: false, bottom: false };

            // 드래그 동안 커서 고정
            document.body.style.cursor = 'move';

            // 전역 드래그 리스너 시작
            this.startGlobalDragListeners();
        },

        // ---------- ㄱ자 핸들 드래그: 리사이즈 ----------
        onHandleMouseDown(e, box, pos) {
            e.preventDefault();
            this.$emit('select-box', box.id);
            const parent = this.$parent;
            if (!parent) return;

            parent.isBoxDragging = true;

            // 시작 시점 박스(px 기준) 저장
            this.dragStartBoxPx = {
                x: box.x || 0,
                y: box.y || 0,
                w: box.w || 0,
                h: box.h || 0
            };

            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;
            const nx = (typeof box.nx === 'number') ? box.nx : (box.x || 0) / cw;
            const ny = (typeof box.ny === 'number') ? box.ny : (box.y || 0) / ch;
            const nw = (typeof box.nw === 'number') ? box.nw : (box.w || cw) / cw;
            const nh = (typeof box.nh === 'number') ? box.nh : (box.h || ch) / ch;
            this.dragStartNorm = { nx, ny, nw, nh };

            this.dragBoxId = box.id;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };

            this.dragMode = 'resize';
            this.dragEdges = {
                left:   (pos === 'tl' || pos === 'bl'),
                right:  (pos === 'tr' || pos === 'br'),
                top:    (pos === 'tl' || pos === 'tr'),
                bottom: (pos === 'bl' || pos === 'br')
            };

            // 드래그 동안 커서 고정 (코너별로 적절한 리사이즈 커서 선택)
            if (pos === 'tl' || pos === 'br') {
                document.body.style.cursor = 'nwse-resize';
            } else {
                document.body.style.cursor = 'nesw-resize';
            }

            // 전역 드래그 리스너 시작
            this.startGlobalDragListeners();
        },

        onBoxMouseMove(e, box) {
            // 박스 안에서 커서는 기본 커서(arrow) 유지
        },

        onBoxMouseLeave(e) {
            // nothing
        },

        // ---------- 실제 드래그 처리 (논리 px → 퍼센트 좌표) ----------
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;
            const parent = this.$parent;
            if (!parent || typeof parent.updateBoxPositionNormalized !== 'function') return;

            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;
            const scale = parent.canvasScale || 1.0;

            // 화면(px) 이동량 → 논리 캔버스(px) 이동량
            const dxLogical = (e.clientX - this.dragStartMouse.x) / (scale || 1.0);
            const dyLogical = (e.clientY - this.dragStartMouse.y) / (scale || 1.0);

            let { x, y, w, h } = this.dragStartBoxPx;

            if (this.dragMode === 'move') {
                x = this.dragStartBoxPx.x + dxLogical;
                y = this.dragStartBoxPx.y + dyLogical;
            } else if (this.dragMode === 'resize') {
                const edges = this.dragEdges;

                if (edges.left) {
                    x = this.dragStartBoxPx.x + dxLogical;
                    w = this.dragStartBoxPx.w - dxLogical;
                }
                if (edges.right) {
                    w = this.dragStartBoxPx.w + dxLogical;
                }
                if (edges.top) {
                    y = this.dragStartBoxPx.y + dyLogical;
                    h = this.dragStartBoxPx.h - dyLogical;
                }
                if (edges.bottom) {
                    h = this.dragStartBoxPx.h + dyLogical;
                }
            }

            // 최소 크기(px)
            const minW = 10;
            const minH = 10;
            if (w < minW) w = minW;
            if (h < minH) h = minH;

            // 캔버스 경계 내로 제한
            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x + w > cw) x = Math.max(0, cw - w);
            if (y + h > ch) y = Math.max(0, ch - h);

            // 퍼센트(정규화)로 변환
            const nx = x / cw;
            const ny = y / ch;
            const nw = w / cw;
            const nh = h / ch;

            parent.updateBoxPositionNormalized(this.dragBoxId, nx, ny, nw, nh);
        },

        handleMouseUp() {
            this.stopGlobalDragListeners();
            document.body.style.cursor = '';

            if (this.$parent) {
                this.$parent.isBoxDragging = false;
            }

            this.dragMode = null;
            this.dragBoxId = null;
            this.dragCanvasRect = null;
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
