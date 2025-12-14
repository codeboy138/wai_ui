// Preview Canvas Component (퍼센트(0~1) 좌표 기반 드래그/리사이즈)
// - 박스 내부 드래그: 이동(move)
// - 모서리 ㄱ자 핸들 드래그: 리사이즈(resize)
// - 퍼센트 좌표(nx,ny,nw,nh)를 기준으로 계산하고, AppRoot.updateBoxPositionNormalized 로 반영

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

                <!-- 모서리 ㄱ자 핸들 (시각용 + 리사이즈 입력) -->
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
            dragStartMouse: { x: 0, y: 0 },
            dragStartNorm: { nx: 0, ny: 0, nw: 0, nh: 0 }, // 0~1 기준
            dragEdges: { left: false, right: false, top: false, bottom: false },

            dragCanvasRect: null, // 프리뷰 실제 DOM 영역 (scaler)

            _mouseMoveHandler: null,
            _mouseUpHandler: null
        };
    },
    beforeUnmount() {
        // 컴포넌트가 사라질 때 혹시 남아있을지 모르는 전역 리스너 정리
        this.stopGlobalDragListeners();
    },
    methods: {
        // ---------- 공통: 전역 드래그 리스너 관리 ----------
        startGlobalDragListeners() {
            // 혹시 이전 드래그 리스너가 남아 있으면 정리
            this.stopGlobalDragListeners();

            this._mouseMoveHandler = (ev) => this.handleMouseMove(ev);
            this._mouseUpHandler = (ev) => this.handleMouseUp(ev);

            window.addEventListener('mousemove', this._mouseMoveHandler);
            window.addEventListener('mouseup', this._mouseUpHandler);

            console.log('[PreviewCanvas] startGlobalDragListeners: attached mousemove/mouseup');
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
            console.log('[PreviewCanvas] stopGlobalDragListeners: removed mousemove/mouseup');
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
                cursor: 'move'
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
        handleStyle(box, pos) {
            const size = 12;       // 핸들 전체 크기 (px)
            const thickness = 3;   // 선 두께
            const color = box.color || '#ffffff';

            const style = {
                position: 'absolute',
                width: size + 'px',
                height: size + 'px',
                boxSizing: 'border-box',
                borderColor: color,
                pointerEvents: 'auto',  // 핸들에서만 리사이즈
                zIndex: (box.zIndex || 0) + 3,
                cursor: 'nwse-resize'
            };

            if (pos === 'tl') {
                style.left = '-2px';
                style.top = '-2px';
                style.borderLeft = thickness + 'px solid ' + color;
                style.borderTop = thickness + 'px solid ' + color;
                style.cursor = 'nwse-resize';
            } else if (pos === 'tr') {
                style.right = '-2px';
                style.top = '-2px';
                style.borderRight = thickness + 'px solid ' + color;
                style.borderTop = thickness + 'px solid ' + color;
                style.cursor = 'nesw-resize';
            } else if (pos === 'bl') {
                style.left = '-2px';
                style.bottom = '-2px';
                style.borderLeft = thickness + 'px solid ' + color;
                style.borderBottom = thickness + 'px solid ' + color;
                style.cursor = 'nesw-resize';
            } else if (pos === 'br') {
                style.right = '-2px';
                style.bottom = '-2px';
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
            console.log('[PreviewCanvas] onBoxMouseDown', box.id);
            this.$emit('select-box', box.id);
            const parent = this.$parent;
            if (!parent) {
                console.warn('[PreviewCanvas] onBoxMouseDown: no parent');
                return;
            }

            parent.isBoxDragging = true;

            const scaler = document.getElementById('preview-canvas-scaler');
            if (!scaler) {
                console.warn('[PreviewCanvas] onBoxMouseDown: scaler not found');
                return;
            }
            const canvasRect = scaler.getBoundingClientRect();
            this.dragCanvasRect = canvasRect;

            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;

            const nx = (typeof box.nx === 'number') ? box.nx : (box.x || 0) / cw;
            const ny = (typeof box.ny === 'number') ? box.ny : (box.y || 0) / ch;
            const nw = (typeof box.nw === 'number') ? box.nw : (box.w || cw) / cw;
            const nh = (typeof box.nh === 'number') ? box.nh : (box.h || ch) / ch;

            this.dragBoxId = box.id;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };
            this.dragStartNorm = { nx, ny, nw, nh };

            this.dragMode = 'move';
            this.dragEdges = { left: false, right: false, top: false, bottom: false };

            // 전역 드래그 리스너 시작
            this.startGlobalDragListeners();
        },

        // ---------- ㄱ자 핸들 드래그: 리사이즈 ----------
        onHandleMouseDown(e, box, pos) {
            e.preventDefault();
            console.log('[PreviewCanvas] onHandleMouseDown', box.id, pos);
            this.$emit('select-box', box.id);
            const parent = this.$parent;
            if (!parent) {
                console.warn('[PreviewCanvas] onHandleMouseDown: no parent');
                return;
            }

            parent.isBoxDragging = true;

            const scaler = document.getElementById('preview-canvas-scaler');
            if (!scaler) {
                console.warn('[PreviewCanvas] onHandleMouseDown: scaler not found');
                return;
            }
            const canvasRect = scaler.getBoundingClientRect();
            this.dragCanvasRect = canvasRect;

            const cw = parent.canvasSize.w || 1;
            const ch = parent.canvasSize.h || 1;

            const nx = (typeof box.nx === 'number') ? box.nx : (box.x || 0) / cw;
            const ny = (typeof box.ny === 'number') ? box.ny : (box.y || 0) / ch;
            const nw = (typeof box.nw === 'number') ? box.nw : (box.w || cw) / cw;
            const nh = (typeof box.nh === 'number') ? box.nh : (box.h || ch) / ch;

            this.dragBoxId = box.id;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };
            this.dragStartNorm = { nx, ny, nw, nh };

            this.dragMode = 'resize';
            this.dragEdges = {
                left:   (pos === 'tl' || pos === 'bl'),
                right:  (pos === 'tr' || pos === 'br'),
                top:    (pos === 'tl' || pos === 'tr'),
                bottom: (pos === 'bl' || pos === 'br')
            };

            // 전역 드래그 리스너 시작
            this.startGlobalDragListeners();
        },

        onBoxMouseMove(e, box) {
            // 박스 안에서 커서는 move 유지 (추가 동작 없음)
        },

        onBoxMouseLeave(e) {
            // nothing
        },

        // ---------- 실제 드래그 처리 (퍼센트 좌표) ----------
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;
            if (!this.dragCanvasRect) return;
            const parent = this.$parent;
            if (!parent || typeof parent.updateBoxPositionNormalized !== 'function') {
                console.warn('[PreviewCanvas] handleMouseMove: no parent or updateBoxPositionNormalized not found');
                return;
            }

            const rect = this.dragCanvasRect;
            if (rect.width <= 0 || rect.height <= 0) return;

            const dxNorm = (e.clientX - this.dragStartMouse.x) / rect.width;
            const dyNorm = (e.clientY - this.dragStartMouse.y) / rect.height;

            let { nx, ny, nw, nh } = this.dragStartNorm;

            if (this.dragMode === 'move') {
                nx += dxNorm;
                ny += dyNorm;
            } else if (this.dragMode === 'resize') {
                const edges = this.dragEdges;

                if (edges.left) {
                    nx += dxNorm;
                    nw -= dxNorm;
                }
                if (edges.right) {
                    nw += dxNorm;
                }
                if (edges.top) {
                    ny += dyNorm;
                    nh -= dyNorm;
                }
                if (edges.bottom) {
                    nh += dyNorm;
                }
            }

            // 최소 크기: 프리뷰 상 10px 기준 → 정규화
            const minNw = 10 / rect.width;
            const minNh = 10 / rect.height;

            if (nw < minNw) nw = minNw;
            if (nh < minNh) nh = minNh;

            // 화면 밖으로 나가지 않게 클램프
            if (nx < 0) nx = 0;
            if (ny < 0) ny = 0;
            if (nx + nw > 1) nx = Math.max(0, 1 - nw);
            if (ny + nh > 1) ny = Math.max(0, 1 - nh);

            console.log(
                '[PreviewCanvas] handleMouseMove',
                'mode=', this.dragMode,
                'boxId=', this.dragBoxId,
                'nx=', nx.toFixed(3),
                'ny=', ny.toFixed(3),
                'nw=', nw.toFixed(3),
                'nh=', nh.toFixed(3)
            );

            parent.updateBoxPositionNormalized(this.dragBoxId, nx, ny, nw, nh);
        },

        handleMouseUp() {
            console.log('[PreviewCanvas] handleMouseUp', 'mode=', this.dragMode, 'boxId=', this.dragBoxId);

            // 전역 드래그 리스너 제거
            this.stopGlobalDragListeners();

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
