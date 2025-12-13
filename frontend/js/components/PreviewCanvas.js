// Preview Canvas Component (pure JS drag/resize)
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

                <!-- 모서리 ㄱ자 핸들 (시각용) -->
                <div class="box-handle bh-tl"></div>
                <div class="box-handle bh-tr"></div>
                <div class="box-handle bh-bl"></div>
                <div class="box-handle bh-br"></div>

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
            dragStartBox:   { x: 0, y: 0, w: 0, h: 0 },
            dragEdges: { left: false, right: false, top: false, bottom: false },
            dragScale: 1.0,
            dragCanvasSize: { w: 1920, h: 1080 },
            _mouseMoveHandler: null,
            _mouseUpHandler: null
        };
    },
    methods: {
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

        // 레이어 박스 스타일: 점선 + 2px
        boxStyle(box) {
            return {
                display: box.isHidden ? 'none' : 'block',
                position: 'absolute',
                left: box.x + 'px',
                top: box.y + 'px',
                width: box.w + 'px',
                height: box.h + 'px',
                borderColor: box.color,
                borderStyle: 'dashed',
                borderWidth: '2px',
                boxSizing: 'border-box',
                zIndex: box.zIndex,
                backgroundColor: box.layerBgColor || '#000000'
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

                // CSS 의 top:50%, left:50%, transform:translate(-50%, -50%)
                // 을 덮어써서 레이어 전체 영역(0,0~w,h) 안에서만 정렬되도록 강제
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
            if (rowType === 'EFF') return '텍스트';
            if (rowType === 'TXT') return '텍스트';
            if (rowType === 'BG')  return '배경';
            return rowType || '';
        },
        // 1행 레이블 텍스트 (예: "중단 텍스트")
        labelText(box) {
            const col = this.getColLabel(box);
            const row = this.getRowLabel(box.rowType);
            return `${col || ''} ${row || ''}`.trim();
        },

        /**
         * 레이블 위치: 레이어 박스 기준 local 좌표
         *
         * - 항상 "하단 내부"에 위치
         * - rowType 별 가로 위치:
         *   - EFF : 좌측 하단
         *   - TXT 및 기타 : 중앙 하단
         *   - BG  : 우측 하단
         * - 레이블 박스 하단 = 레이어 박스 아랫변 (bottom: 0)
         *   → 레이블 전체가 박스 안에 100% 포함
         */
        labelWrapperStyle(box) {
            const marginX = 8;

            const style = {
                position: 'absolute',
                bottom: '0px',              // 레이블 박스 하단 = 레이어 하단
                pointerEvents: 'none',
                zIndex: box.zIndex + 1
            };

            if (box.rowType === 'EFF') {
                // 좌측 하단
                style.left = marginX + 'px';
            } else if (box.rowType === 'BG') {
                // 우측 하단
                style.right = marginX + 'px';
            } else {
                // TXT 및 기타: 중앙 하단
                style.left = '50%';
                style.transform = 'translateX(-50%)';
            }

            return style;
        },

        // 레이블 칩: 현재 크기 유지, 캔버스 스케일에 따라 같이 확대/축소
        labelChipStyle(box) {
            const base = box.color || '#22c55e';
            const rgb = this.parseColorToRgb(base);
            const bg = rgb
                ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)` // 50% 투명
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
                fontSize: '40px',       // 현재 사용 중인 크기 그대로
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

        // ---------- 공통: 엣지 상태 계산 & 커서 결정 ----------
        getEdgeState(e, rect) {
            const edgeMargin = 8; // 기존 5px → 1.5배 정도 확장
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            const nearLeft   = offsetX <= edgeMargin;
            const nearRight  = rect.width  - offsetX <= edgeMargin;
            const nearTop    = offsetY <= edgeMargin;
            const nearBottom = rect.height - offsetY <= edgeMargin;

            return { nearLeft, nearRight, nearTop, nearBottom };
        },
        getCursorForEdges({ nearLeft, nearRight, nearTop, nearBottom }) {
            // 모서리 우선
            if ((nearLeft && nearTop) || (nearRight && nearBottom)) {
                return 'nwse-resize';
            }
            if ((nearRight && nearTop) || (nearLeft && nearBottom)) {
                return 'nesw-resize';
            }
            if (nearLeft || nearRight) {
                return 'ew-resize';
            }
            if (nearTop || nearBottom) {
                return 'ns-resize';
            }
            // 그 외에는 이동 가능한 상태임을 보여주기 위해 move
            return 'move';
        },

        // ---------- 드래그 / 리사이즈 (순수 JS) ----------
        onBoxMouseDown(e, box) {
            e.preventDefault();
            this.$emit('select-box', box.id);

            const target = e.currentTarget;
            const rect = target.getBoundingClientRect();
            const edgeState = this.getEdgeState(e, rect);

            const scaler = document.getElementById('preview-canvas-scaler');
            let scale = 1.0;
            if (scaler && scaler.style.transform) {
                const m = scaler.style.transform.match(/scale\(([^)]+)\)/);
                if (m) scale = parseFloat(m[1]) || 1.0;
            }

            this.dragCanvasSize =
                (this.$parent && this.$parent.canvasSize) ||
                { w: 1920, h: 1080 };
            this.dragScale = scale;
            this.dragBoxId = box.id;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };
            this.dragStartBox = { x: box.x, y: box.y, w: box.w, h: box.h };

            const { nearLeft, nearRight, nearTop, nearBottom } = edgeState;

            if (nearLeft || nearRight || nearTop || nearBottom) {
                this.dragMode = 'resize';
                this.dragEdges = {
                    left: nearLeft,
                    right: nearRight,
                    top: nearTop,
                    bottom: nearBottom
                };
                target.style.cursor = this.getCursorForEdges(edgeState);
            } else {
                this.dragMode = 'move';
                this.dragEdges = { left: false, right: false, top: false, bottom: false };
                target.style.cursor = 'grabbing';
            }

            if (!this._mouseMoveHandler) {
                this._mouseMoveHandler = (ev) => this.handleMouseMove(ev);
                this._mouseUpHandler   = (ev) => this.handleMouseUp(ev);
            }
            window.addEventListener('mousemove', this._mouseMoveHandler);
            window.addEventListener('mouseup', this._mouseUpHandler);
        },

        onBoxMouseMove(e, box) {
            // 드래그 중에는 별도로 커서 처리하지 않고, mousedown 시 설정된 값 유지
            if (this.dragMode && this.dragBoxId === box.id) return;

            const target = e.currentTarget;
            const rect = target.getBoundingClientRect();
            const edgeState = this.getEdgeState(e, rect);
            const cursor = this.getCursorForEdges(edgeState);
            target.style.cursor = cursor;
        },

        onBoxMouseLeave(e) {
            const target = e.currentTarget;
            // 드래그 중이 아니면 기본 커서로 복원
            if (!this.dragMode) {
                target.style.cursor = 'default';
            }
        },

        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;

            const dxClient = e.clientX - this.dragStartMouse.x;
            const dyClient = e.clientY - this.dragStartMouse.y;
            const dx = dxClient / this.dragScale;
            const dy = dyClient / this.dragScale;

            const start = this.dragStartBox;
            const canvas = this.dragCanvasSize;
            let newX = start.x;
            let newY = start.y;
            let newW = start.w;
            let newH = start.h;

            if (this.dragMode === 'move') {
                newX = start.x + dx;
                newY = start.y + dy;

                newX = Math.max(0, Math.min(newX, canvas.w - newW));
                newY = Math.max(0, Math.min(newY, canvas.h - newH));
            } else if (this.dragMode === 'resize') {
                const edges = this.dragEdges;

                if (edges.left) {
                    newX = start.x + dx;
                    newW = start.w - dx;
                }
                if (edges.right) {
                    newW = start.w + dx;
                }
                if (edges.top) {
                    newY = start.y + dy;
                    newH = start.h - dy;
                }
                if (edges.bottom) {
                    newH = start.h + dy;
                }

                const minW = 20;
                const minH = 20;
                if (newW < minW) {
                    if (edges.left) newX -= (minW - newW);
                    newW = minW;
                }
                if (newH < minH) {
                    if (edges.top) newY -= (minH - newH);
                    newH = minH;
                }

                if (newX < 0) {
                    newW += newX;
                    newX = 0;
                }
                if (newY < 0) {
                    newH += newY;
                    newY = 0;
                }
                if (newX + newW > canvas.w) newW = canvas.w - newX;
                if (newY + newH > canvas.h) newH = canvas.h - newY;
            }

            // Vue 상태를 바로 업데이트 → 마우스와 박스가 최대한 동시에 움직이도록
            if (this.$parent && typeof this.$parent.updateBoxPosition === 'function') {
                this.$parent.updateBoxPosition(this.dragBoxId, newX, newY, newW, newH);
            }
        },

        handleMouseUp() {
            if (this.dragMode && this.dragBoxId) {
                const box = this.canvasBoxes.find(b => b.id === this.dragBoxId);
                if (box) {
                    const snapResult = this.checkSnap(box.id, box.x, box.y, box.w, box.h);
                    if (snapResult.snapped && this.$parent && typeof this.$parent.updateBoxPosition === 'function') {
                        this.$parent.updateBoxPosition(
                            box.id,
                            snapResult.x,
                            snapResult.y,
                            snapResult.w,
                            snapResult.h
                        );
                        const target = document.getElementById('preview-canvas-box-' + box.id);
                        if (target) this.triggerSnapFlash(target);
                    }
                }
            }

            window.removeEventListener('mousemove', this._mouseMoveHandler);
            window.removeEventListener('mouseup', this._mouseUpHandler);
            this.dragMode = null;
            this.dragBoxId = null;
        },

        // ---------- 스냅 & 플래시 ----------
        checkSnap(boxId, x, y, w, h) {
            const threshold = 8;
            let snapped = false;

            let left = x;
            let top = y;
            let right = x + w;
            let bottom = y + h;

            const canvasSize = this.dragCanvasSize || { w: 1920, h: 1080 };
            const canvasLeft = 0;
            const canvasTop = 0;
            const canvasRight = canvasSize.w;
            const canvasBottom = canvasSize.h;

            const snapTo = (value, target) =>
                Math.abs(value - target) <= threshold ? target : null;

            let s = snapTo(left, canvasLeft);
            if (s !== null) { left = s; right = left + w; snapped = true; }
            s = snapTo(right, canvasRight);
            if (s !== null) { right = s; left = right - w; snapped = true; }
            s = snapTo(top, canvasTop);
            if (s !== null) { top = s; bottom = top + h; snapped = true; }
            s = snapTo(bottom, canvasBottom);
            if (s !== null) { bottom = s; top = bottom - h; snapped = true; }

            const boxes = (this.canvasBoxes || []).filter(b => b.id !== boxId && !b.isHidden);
            for (const b of boxes) {
                const bLeft = b.x;
                const bRight = b.x + b.w;
                const bTop = b.y;
                const bBottom = b.y + b.h;

                let s2 = snapTo(left, bRight);
                if (s2 !== null) { left = s2; right = left + w; snapped = true; }
                s2 = snapTo(right, bLeft);
                if (s2 !== null) { right = s2; left = right - w; snapped = true; }
                s2 = snapTo(top, bBottom);
                if (s2 !== null) { top = s2; bottom = top + h; snapped = true; }
                s2 = snapTo(bottom, bTop);
                if (s2 !== null) { bottom = s2; top = bottom - h; snapped = true; }
            }

            return {
                x: left,
                y: top,
                w: right - left,
                h: bottom - top,
                snapped
            };
        },

        triggerSnapFlash(target) {
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.left = '-2px';
            flash.style.top = '-2px';
            flash.style.right = '-2px';
            flash.style.bottom = '-2px';
            flash.style.border = '2px solid #ffffff';
            flash.style.boxSizing = 'border-box';
            flash.style.pointerEvents = 'none';
            flash.style.opacity = '1';
            flash.style.transition = 'opacity 0.5s ease-out';

            target.appendChild(flash);
            requestAnimationFrame(() => { flash.style.opacity = '0'; });
            setTimeout(() => {
                if (flash.parentNode === target) target.removeChild(flash);
            }, 500);
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
